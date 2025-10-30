-- ============================================
-- MIGRACJA: BAZA WIEDZY (Knowledge Base)
-- Data: 2025-10-30
-- ============================================

-- Enable UUID extension (jeśli nie jest już włączone)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: knowledge_base_articles
-- ============================================

CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metadane
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier (np. "jak-zaczac-trening")
    description TEXT,            -- Krótki opis (meta description)
    
    -- Treść
    content TEXT NOT NULL,       -- Główna treść artykułu (HTML z edytora WYSIWYG)
    
    -- Kategoryzacja
    category TEXT,               -- Kategoria (np. "Fitness", "Języki", "Quizy")
    tags TEXT[],                 -- Tagi (array) dla lepszego wyszukiwania
    
    -- Wyświetlanie
    icon TEXT,                   -- Emoji lub ikona
    is_published BOOLEAN DEFAULT TRUE,  -- Czy artykuł jest opublikowany
    featured BOOLEAN DEFAULT FALSE,     -- Czy wyróżniony (pokazywany na górze)
    
    -- Autor i historia
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- SEO i statystyki
    view_count INTEGER DEFAULT 0,
    search_vector tsvector        -- Full-text search (opcjonalnie)
);

-- ============================================
-- INDEKSY DLA WYDAJNOŚCI
-- ============================================

CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_kb_articles_is_published ON knowledge_base_articles(is_published);
CREATE INDEX idx_kb_articles_featured ON knowledge_base_articles(featured);
CREATE INDEX idx_kb_articles_author_id ON knowledge_base_articles(author_id);
CREATE INDEX idx_kb_articles_created_at ON knowledge_base_articles(created_at DESC);

-- Full-text search index (opcjonalnie)
CREATE INDEX idx_kb_articles_search ON knowledge_base_articles USING gin(search_vector);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Wszyscy mogą czytać opublikowane artykuły
CREATE POLICY "Anyone can read published articles"
ON knowledge_base_articles
FOR SELECT
USING (is_published = TRUE);

-- Policy 2: Admin może czytać wszystkie artykuły (w tym nieopublikowane)
CREATE POLICY "Admin can read all articles"
ON knowledge_base_articles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- Policy 3: Admin może tworzyć artykuły
CREATE POLICY "Admin can create articles"
ON knowledge_base_articles
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- Policy 4: Admin może edytować artykuły
CREATE POLICY "Admin can update articles"
ON knowledge_base_articles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- Policy 5: Admin może usuwać artykuły
CREATE POLICY "Admin can delete articles"
ON knowledge_base_articles
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- ============================================
-- TRIGGERY
-- ============================================

-- Funkcja do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla knowledge_base_articles
CREATE TRIGGER update_kb_articles_updated_at
    BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funkcja do automatycznej aktualizacji search_vector (full-text search)
CREATE OR REPLACE FUNCTION kb_articles_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('polish', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('polish', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('polish', coalesce(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla search_vector
CREATE TRIGGER kb_articles_search_vector_update
    BEFORE INSERT OR UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION kb_articles_search_update();

-- ============================================
-- SUPABASE STORAGE - POLICIES DLA OBRAZKÓW
-- ============================================

-- UWAGA: Bucket 'knowledge-base-images' musi być utworzony ręcznie w panelu Supabase:
-- Storage → Create bucket → Nazwa: knowledge-base-images, Public: TRUE

-- Policy 1: Wszyscy mogą pobierać obrazki (publiczny dostęp)
CREATE POLICY "Public read access for KB images"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base-images');

-- Policy 2: Tylko admin może uploadować obrazki
CREATE POLICY "Admin can upload KB images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base-images' AND
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- Policy 3: Tylko admin może usuwać obrazki
CREATE POLICY "Admin can delete KB images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base-images' AND
  auth.uid() IN (
    SELECT id FROM auth.users WHERE is_super_admin = TRUE
  )
);

-- ============================================
-- PRZYKŁADOWE DANE (SEED)
-- ============================================

-- Przykładowy artykuł 1: Jak zacząć z eTrenerem
INSERT INTO knowledge_base_articles (
    title,
    slug,
    description,
    content,
    category,
    tags,
    icon,
    is_published,
    featured
) VALUES (
    'Jak zacząć z eTrenerem?',
    'jak-zaczac-z-etrenerem',
    'Przewodnik dla nowych użytkowników - dowiedz się jak korzystać z aplikacji',
    '<h1>Witaj w eTrenerze!</h1><p>eTrener to interaktywna platforma edukacyjna, która pomoże Ci w nauce języków, treningach fitness i sprawdzaniu wiedzy przez quizy.</p><h2>Główne funkcje</h2><ul><li><strong>Quizy</strong> - Testuj swoją wiedzę w różnych dziedzinach</li><li><strong>Treningi</strong> - Ćwicz z gotowymi planami treningowymi</li><li><strong>Słuchanie</strong> - Ucz się języków przez słuchanie</li><li><strong>Baza Wiedzy</strong> - Czytaj artykuły edukacyjne</li></ul><h2>Jak zacząć?</h2><ol><li>Zarejestruj się lub zaloguj</li><li>Wybierz interesującą Cię kategorię</li><li>Rozpocznij naukę!</li></ol><p>Powodzenia! 💪</p>',
    'Technologia',
    ARRAY['start', 'przewodnik', 'podstawy'],
    '🚀',
    TRUE,
    TRUE
);

-- Przykładowy artykuł 2: Jak skutecznie uczyć się języków
INSERT INTO knowledge_base_articles (
    title,
    slug,
    description,
    content,
    category,
    tags,
    icon,
    is_published,
    featured
) VALUES (
    'Jak skutecznie uczyć się języków obcych?',
    'jak-skutecznie-uczyc-sie-jezykow',
    'Sprawdzone metody nauki języków obcych - od podstaw do zaawansowanych technik',
    '<h1>Skuteczna nauka języków</h1><p>Nauka języka obcego nie musi być trudna! Oto sprawdzone metody, które pomogą Ci osiągnąć sukces.</p><h2>1. Regularne powtórki</h2><p>Najważniejsza zasada - <strong>regularność</strong>. Lepiej uczyć się 15 minut dziennie niż 2 godziny raz w tygodniu.</p><h2>2. Słuchanie aktywne</h2><p>Używaj funkcji <em>Słuchanie</em> w eTrenerze, aby trenować rozumienie ze słuchu. Słuchaj zdań w języku docelowym i powtarzaj je.</p><h2>3. Praktyka czyni mistrza</h2><p>Rozwiązuj quizy, aby sprawdzić swoją wiedzę. Błędy to najlepsza lekcja!</p><h2>4. Immersja językowa</h2><ul><li>Oglądaj filmy z napisami</li><li>Słuchaj muzyki w języku docelowym</li><li>Czytaj proste teksty</li></ul><p>Pamiętaj: <strong>konsekwencja jest kluczem do sukcesu!</strong> 🎯</p>',
    'Języki',
    ARRAY['nauka', 'języki', 'metody', 'porady'],
    '🇪🇸',
    TRUE,
    TRUE
);

-- Przykładowy artykuł 3: Podstawy treningu siłowego
INSERT INTO knowledge_base_articles (
    title,
    slug,
    description,
    content,
    category,
    tags,
    icon,
    is_published,
    featured
) VALUES (
    'Podstawy treningu siłowego dla początkujących',
    'podstawy-treningu-silowego',
    'Kompletny przewodnik dla osób zaczynających przygodę z treningiem siłowym',
    '<h1>Trening siłowy - od czego zacząć?</h1><p>Trening siłowy to świetny sposób na poprawę kondycji, budowanie mięśni i spalanie tłuszczu. Oto co musisz wiedzieć na początek.</p><h2>Rozgrzewka</h2><p><strong>Nigdy nie zapomnij o rozgrzewce!</strong> 5-10 minut lekkiego cardio i rozciągania przygotuje Twoje ciało do wysiłku.</p><h2>Podstawowe ćwiczenia</h2><ol><li><strong>Przysiady</strong> - król ćwiczeń na nogi</li><li><strong>Pompki</strong> - klasyk dla klatki piersiowej</li><li><strong>Martwy ciąg</strong> - kompleksowe ćwiczenie na całe ciało</li><li><strong>Wiosłowanie</strong> - dla mocnych pleców</li></ol><h2>Jak często trenować?</h2><p>Dla początkujących: <strong>3 razy w tygodniu</strong> to optymalna częstotliwość. Pamiętaj o dniach odpoczynku!</p><h2>Regeneracja</h2><ul><li>Sen: 7-9 godzin</li><li>Odżywianie: białko, węglowodany, tłuszcze</li><li>Nawodnienie: 2-3 litry wody dziennie</li></ul><p>Wykorzystaj gotowe treningi w eTrenerze, aby zacząć swoją przygodę! 💪</p>',
    'Fitness',
    ARRAY['trening', 'siła', 'początkujący', 'fitness'],
    '💪',
    TRUE,
    FALSE
);

-- Przykładowy artykuł 4: Jak tworzyć skuteczne quizy
INSERT INTO knowledge_base_articles (
    title,
    slug,
    description,
    content,
    category,
    tags,
    icon,
    is_published,
    featured
) VALUES (
    'Jak tworzyć skuteczne quizy edukacyjne?',
    'jak-tworzyc-skuteczne-quizy',
    'Poradnik dla nauczycieli i twórców treści - jak przygotować angażujące quizy',
    '<h1>Tworzenie skutecznych quizów</h1><p>Quiz to potężne narzędzie edukacyjne. Oto jak stworzyć quiz, który będzie zarówno edukacyjny, jak i angażujący.</p><h2>Rodzaje pytań</h2><p>eTrener wspiera różne typy pytań:</p><ul><li><strong>Wielokrotnego wyboru</strong> - najpopularniejsze</li><li><strong>Prawda/Fałsz</strong> - szybkie sprawdzenie wiedzy</li><li><strong>Uzupełnij lukę</strong> - dla zaawansowanych</li><li><strong>Dopasowywanie</strong> - świetne do słownictwa</li><li><strong>Słuchanie</strong> - dla języków obcych</li></ul><h2>Zasady dobrego quizu</h2><ol><li><strong>Jasne pytania</strong> - unikaj dwuznaczności</li><li><strong>Odpowiednia trudność</strong> - dostosuj do poziomu uczniów</li><li><strong>Wyjaśnienia</strong> - dodaj wyjaśnienie do każdej odpowiedzi</li><li><strong>Różnorodność</strong> - mieszaj typy pytań</li></ol><h2>Generator AI</h2><p>Użyj funkcji <em>Generator AI</em> w eTrenerze, aby automatycznie wygenerować quiz na dowolny temat!</p><p>Pamiętaj: dobry quiz to taki, który uczy, a nie tylko testuje! 📝</p>',
    'Quizy',
    ARRAY['quizy', 'edukacja', 'tworzenie', 'porady'],
    '📝',
    TRUE,
    FALSE
);

-- ============================================
-- PODSUMOWANIE
-- ============================================

-- Po wykonaniu tej migracji:
-- 1. Tabela knowledge_base_articles jest gotowa
-- 2. RLS policies zabezpieczają dane (admin może edytować, wszyscy czytać)
-- 3. Triggery automatycznie aktualizują updated_at i search_vector
-- 4. Storage policies zabezpieczają obrazki
-- 5. Przykładowe artykuły są dodane do bazy

-- NASTĘPNE KROKI:
-- 1. Wykonaj tę migrację w panelu Supabase (SQL Editor)
-- 2. Utwórz bucket 'knowledge-base-images' w Storage (jeśli jeszcze nie istnieje)
-- 3. Przejdź do implementacji frontendu (Faza 2)

-- ============================================
-- KONIEC MIGRACJI
-- ============================================

