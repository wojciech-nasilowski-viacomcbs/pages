# Baza Wiedzy (Knowledge Base) - Dokumentacja i Plan Implementacji

## Przegląd

**Baza Wiedzy** to zbiór artykułów edukacyjnych dostępny dla wszystkich użytkowników aplikacji eTrener. Zawiera poradniki, wyjaśnienia pojęć, instrukcje itp.

### Uprawnienia:
- **👤 Użytkownicy (user):** Mogą przeglądać i czytać wszystkie artykuły
- **👑 Administratorzy (admin):** Mogą tworzyć, edytować i usuwać artykuły

---

## Schemat Bazy Danych

### Tabela: `knowledge_base_articles`

**Uwaga:** Treść artykułu jest przechowywana jako **HTML** (nie Markdown), generowany przez edytor WYSIWYG (Quill.js).

```sql
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

-- Indeksy dla wydajności
CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_kb_articles_is_published ON knowledge_base_articles(is_published);
CREATE INDEX idx_kb_articles_featured ON knowledge_base_articles(featured);
CREATE INDEX idx_kb_articles_author_id ON knowledge_base_articles(author_id);
CREATE INDEX idx_kb_articles_created_at ON knowledge_base_articles(created_at DESC);

-- Full-text search index (opcjonalnie)
CREATE INDEX idx_kb_articles_search ON knowledge_base_articles USING gin(search_vector);
```

### Row Level Security (RLS)

```sql
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
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Policy 3: Admin może tworzyć artykuły
CREATE POLICY "Admin can create articles"
ON knowledge_base_articles
FOR INSERT
WITH CHECK (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Policy 4: Admin może edytować artykuły
CREATE POLICY "Admin can update articles"
ON knowledge_base_articles
FOR UPDATE
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Policy 5: Admin może usuwać artykuły
CREATE POLICY "Admin can delete articles"
ON knowledge_base_articles
FOR DELETE
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
```

### Funkcja: Auto-update `updated_at`

```sql
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
```

### Funkcja: Auto-update search_vector (opcjonalnie)

```sql
-- Funkcja do automatycznej aktualizacji search_vector
CREATE OR REPLACE FUNCTION wiki_articles_search_update()
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
```

### Supabase Storage - Bucket dla obrazków

```sql
-- Utworzenie publicznego bucketa dla obrazków Bazy Wiedzy
-- (Wykonać w panelu Supabase: Storage → Create bucket)
-- Nazwa: knowledge-base-images
-- Public: TRUE
```

**Storage Policies:**

```sql
-- Policy 1: Wszyscy mogą pobierać obrazki (publiczny dostęp)
CREATE POLICY "Public read access for KB images"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base-images');

-- Policy 2: Tylko admin może uploadować obrazki
CREATE POLICY "Admin can upload KB images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base-images' AND
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Policy 3: Tylko admin może usuwać obrazki
CREATE POLICY "Admin can delete KB images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base-images' AND
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
```

**Struktura URL obrazka:**
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/knowledge-base-images/[filename]
```

---

## Format Danych

### Struktura Artykułu (JSON)

```javascript
/**
 * @typedef {Object} WikiArticle
 * @property {string} id - UUID artykułu
 * @property {string} title - Tytuł artykułu
 * @property {string} slug - URL-friendly identifier
 * @property {string} [description] - Krótki opis
 * @property {string} content - Treść artykułu (Markdown/HTML)
 * @property {string} [category] - Kategoria
 * @property {string[]} [tags] - Tagi
 * @property {string} [icon] - Emoji lub ikona
 * @property {boolean} is_published - Czy opublikowany
 * @property {boolean} featured - Czy wyróżniony
 * @property {string} [author_id] - ID autora
 * @property {string} created_at - Data utworzenia
 * @property {string} updated_at - Data ostatniej edycji
 * @property {number} view_count - Liczba wyświetleń
 */
```

### Przykładowy Artykuł

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Jak zacząć trening siłowy?",
  "slug": "jak-zaczac-trening-silowy",
  "description": "Kompletny przewodnik dla początkujących - od rozgrzewki po plan treningowy",
  "content": "<h1>Wprowadzenie</h1><p>Trening siłowy to...</p><h2>Krok 1: Rozgrzewka</h2><p>...</p><img src=\"https://xxx.supabase.co/storage/v1/object/public/knowledge-base-images/trening.jpg\" />",
  "category": "Fitness",
  "tags": ["trening", "siła", "początkujący", "poradnik"],
  "icon": "💪",
  "is_published": true,
  "featured": true,
  "author_id": "user-uuid-here",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T10:00:00Z",
  "view_count": 42
}
```

---

## Interfejs Użytkownika

### 1. **Zakładka "Baza Wiedzy" w Menu Głównym**

Dodać nową zakładkę obok "Quizzes", "Workouts", "Listening":

```
[📝 Quizy] [💪 Treningi] [🎧 Słuchanie] [📚 Wiedza] [⚙️ Więcej]
```

### 2. **Ekran Listy Artykułów** (`knowledge-base-list`)

**Dla wszystkich użytkowników:**
- Lista artykułów (kafelki lub lista)
- Wyszukiwarka (po tytule, tagach)
- Filtrowanie po kategorii
- Sortowanie (najnowsze, najpopularniejsze, alfabetycznie)

**Dla admina dodatkowo:**
- Przycisk "➕ Nowy artykuł"
- Ikony edycji/usuwania przy każdym artykule
- Możliwość zobaczenia nieopublikowanych artykułów

**Mockup:**
```
┌─────────────────────────────────────────────┐
│  📚 Baza Wiedzy                             │
│  [🔍 Szukaj...]          [Admin: ➕ Nowy]  │
├─────────────────────────────────────────────┤
│  Kategoria: [Wszystkie ▼]  Sort: [Najnowsze ▼] │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │ 💪 Jak zacząć trening siłowy?       │   │
│  │ Kompletny przewodnik dla począt...  │   │
│  │ 📅 30.10.2025  👁️ 42  [Admin: ✏️ 🗑️] │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 🇪🇸 Jak uczyć się hiszpańskiego?    │   │
│  │ Najlepsze metody nauki języka...    │   │
│  │ 📅 29.10.2025  👁️ 28  [Admin: ✏️ 🗑️] │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3. **Ekran Artykułu** (`knowledge-base-article`)

**Dla wszystkich użytkowników:**
- Tytuł i ikona
- Treść artykułu (renderowany Markdown)
- Data utworzenia/aktualizacji
- Kategoria i tagi
- Przycisk "← Powrót do listy"

**Dla admina dodatkowo:**
- Przycisk "✏️ Edytuj"
- Przycisk "🗑️ Usuń"

**Mockup:**
```
┌─────────────────────────────────────────────┐
│  [← Powrót]              [Admin: ✏️ Edytuj] │
├─────────────────────────────────────────────┤
│  💪 Jak zacząć trening siłowy?              │
│  📅 30.10.2025  |  Kategoria: Fitness       │
│  🏷️ trening, siła, początkujący            │
├─────────────────────────────────────────────┤
│                                             │
│  # Wprowadzenie                             │
│                                             │
│  Trening siłowy to świetny sposób na...    │
│                                             │
│  ## Krok 1: Rozgrzewka                     │
│  ...                                        │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. **Ekran Edycji/Tworzenia** (`knowledge-base-editor`) - **TYLKO ADMIN**

Formularz z polami:
- Tytuł (input text)
- Slug (auto-generowany z tytułu, edytowalny)
- Opis (textarea)
- Kategoria (select lub input)
- Tagi (input z przecinkami)
- Ikona (emoji picker lub input)
- **Treść (Edytor WYSIWYG - Quill.js)**
  - Toolbar z opcjami formatowania
  - Przycisk upload obrazka
  - Przycisk embed video (YouTube/Vimeo)
- Opublikowany (checkbox)
- Wyróżniony (checkbox)
- Przyciski: [💾 Zapisz] [👁️ Podgląd] [❌ Anuluj]

**Edytor Quill.js - Toolbar:**
```
[Bold] [Italic] [Underline] | [H1] [H2] [H3] | [• Lista] [1. Lista] | [🖼️ Obrazek] [🎬 Video] | [🔗 Link]
```

**Mockup:**
```
┌─────────────────────────────────────────────┐
│  ✏️ Edycja artykułu                         │
├─────────────────────────────────────────────┤
│  Tytuł: [Jak zacząć trening siłowy?]       │
│  Slug:  [jak-zaczac-trening-silowy]        │
│  Opis:  [Kompletny przewodnik...]          │
│  Kategoria: [Fitness ▼]                    │
│  Tagi:  [trening, siła, początkujący]      │
│  Ikona: [💪]                                │
│                                             │
│  Treść (WYSIWYG Editor):                    │
│  ┌───────────────────────────────────────┐ │
│  │ [B][I][U] [H1▼] [•][1.] [🖼️][🎬][🔗] │ │
│  ├───────────────────────────────────────┤ │
│  │ Wprowadzenie                          │ │
│  │                                       │ │
│  │ Trening siłowy to świetny sposób...  │ │
│  │                                       │ │
│  │ [Obrazek: trening.jpg]                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ☑️ Opublikowany  ☐ Wyróżniony             │
│                                             │
│  [💾 Zapisz]  [👁️ Podgląd]  [❌ Anuluj]    │
└─────────────────────────────────────────────┘
```

---

## Komponenty Techniczne

### 1. **Data Service** (`data-service.js`)

Dodać funkcje do obsługi Bazy Wiedzy:

```javascript
// Pobierz wszystkie opublikowane artykuły
async getKnowledgeBaseArticles(filters = {})

// Pobierz pojedynczy artykuł po slug
async getKnowledgeBaseArticle(slug)

// [ADMIN] Utwórz nowy artykuł
async createKnowledgeBaseArticle(article)

// [ADMIN] Zaktualizuj artykuł
async updateKnowledgeBaseArticle(id, updates)

// [ADMIN] Usuń artykuł
async deleteKnowledgeBaseArticle(id)

// Zwiększ licznik wyświetleń
async incrementKnowledgeBaseArticleViews(id)

// Wyszukaj artykuły
async searchKnowledgeBaseArticles(query)
```

### 2. **Knowledge Base Engine** (`knowledge-base-engine.js`) - NOWY MODUŁ

Logika biznesowa dla Bazy Wiedzy:
- Inicjalizacja edytora Quill.js
- Upload obrazków do Supabase Storage
- Osadzanie video (YouTube/Vimeo)
- Generowanie slug z tytułu
- Walidacja danych artykułu
- Sanityzacja HTML
- Formatowanie dat
- Obsługa tagów

```javascript
const knowledgeBaseEngine = {
  // Inicjalizuj edytor Quill.js
  initEditor(container, options),
  
  // Upload obrazka do Supabase Storage
  async uploadImage(file),
  
  // Wstaw obrazek do edytora
  insertImage(url, alt),
  
  // Osadź video (YouTube/Vimeo)
  embedVideo(url),
  
  // Generuj slug z tytułu
  generateSlug(title),
  
  // Waliduj dane artykułu
  validateArticle(article),
  
  // Sanityzuj HTML (bezpieczeństwo)
  sanitizeHTML(html),
  
  // Formatuj datę
  formatDate(date),
  
  // Parse tagi (string → array)
  parseTags(tagsString),
  
  // Format tagi (array → string)
  formatTags(tagsArray)
};
```

### 3. **UI Manager** (`ui-manager.js`)

Dodać obsługę nowych ekranów:
- `showKnowledgeBaseList()` - Lista artykułów
- `showKnowledgeBaseArticle(slug)` - Pojedynczy artykuł
- `showKnowledgeBaseEditor(articleId?)` - Edytor (tylko admin)

### 4. **Content Manager** (`content-manager.js`)

Dodać ładowanie artykułów Bazy Wiedzy:
```javascript
async loadKnowledgeBaseArticles() {
  const articles = await dataService.getKnowledgeBaseArticles();
  state.knowledgeBaseArticles = articles;
}
```

### 5. **Types** (`types.js`)

Dodać typy dla Bazy Wiedzy:
```javascript
/**
 * @typedef {Object} KnowledgeBaseArticle
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * // ... (pełna definicja)
 */
```

---

## Plan Implementacji

### **Faza 1: Backend (Baza Danych)** ⏱️ ~30 min
1. ✅ Utworzyć plik migracji `/supabase/migration_knowledge_base.sql`
2. ✅ Zdefiniować tabelę `knowledge_base_articles`
3. ✅ Dodać indeksy
4. ✅ Skonfigurować RLS policies
5. ✅ Dodać triggery (updated_at, search_vector)
6. ✅ Wykonać migrację w panelu Supabase

### **Faza 2: Typy i Data Service** ⏱️ ~45 min
1. ✅ Dodać typy do `types.js`
2. ✅ Zaimplementować funkcje w `data-service.js`
3. ✅ Przetestować połączenie z bazą

### **Faza 3: Knowledge Base Engine** ⏱️ ~1.5h
1. ✅ Utworzyć `js/knowledge-base-engine.js`
2. ✅ Zintegrować Quill.js (CDN)
3. ✅ Zaimplementować upload obrazków (Supabase Storage)
4. ✅ Dodać osadzanie video (YouTube/Vimeo)
5. ✅ Dodać generowanie slug
6. ✅ Dodać walidację i sanityzację HTML
7. ✅ Dodać testy

### **Faza 4: UI - Lista Artykułów** ⏱️ ~1.5h
1. ✅ Dodać zakładkę "Baza Wiedzy" do menu
2. ✅ Utworzyć HTML dla ekranu listy
3. ✅ Zaimplementować wyświetlanie listy artykułów
4. ✅ Dodać wyszukiwarkę i filtry
5. ✅ Dodać przyciski admina (warunkowe)

### **Faza 5: UI - Widok Artykułu** ⏱️ ~1h
1. ✅ Utworzyć HTML dla ekranu artykułu
2. ✅ Zaimplementować renderowanie treści
3. ✅ Dodać nawigację
4. ✅ Dodać licznik wyświetleń
5. ✅ Dodać przyciski admina (warunkowe)

### **Faza 6: UI - Edytor (Admin)** ⏱️ ~2.5h
1. ✅ Utworzyć HTML dla edytora
2. ✅ Zintegrować Quill.js w formularzu
3. ✅ Dodać custom handler dla upload obrazka
4. ✅ Dodać dialog osadzania video
5. ✅ Zaimplementować formularz (tytuł, slug, kategoria, tagi)
6. ✅ Dodać walidację formularza
7. ✅ Dodać podgląd HTML
8. ✅ Zaimplementować zapisywanie
9. ✅ Dodać obsługę błędów

### **Faza 7: Integracja** ⏱️ ~1h
1. ✅ Połączyć wszystkie moduły
2. ✅ Dodać routing/nawigację
3. ✅ Przetestować flow użytkownika
4. ✅ Przetestować flow admina

### **Faza 8: Testowanie i Poprawki** ⏱️ ~1h
1. ✅ Testy manualne
2. ✅ Poprawki błędów
3. ✅ Optymalizacja wydajności
4. ✅ Responsywność (mobile)

### **Faza 9: Dokumentacja** ⏱️ ~30 min
1. ✅ Aktualizacja README
2. ✅ Komentarze JSDoc
3. ✅ Przykładowe artykuły (seed data)

**Szacowany czas: ~10 godzin**

---

## Przykładowe Kategorie

Sugerowane kategorie dla artykułów:
- **Fitness** - treningi, ćwiczenia, porady
- **Języki** - nauka języków obcych, gramatyka, słownictwo
- **Quizy** - jak tworzyć quizy, najlepsze praktyki
- **Motywacja** - porady motywacyjne, psychologia
- **Technologia** - jak korzystać z aplikacji
- **Zdrowie** - dieta, regeneracja, sen

---

## Edytor WYSIWYG - Quill.js

### Wspierane formatowanie:

**Tekst:**
- **Pogrubienie** (Bold)
- *Kursywa* (Italic)
- <u>Podkreślenie</u> (Underline)

**Nagłówki:**
- H1 (Nagłówek 1)
- H2 (Nagłówek 2)
- H3 (Nagłówek 3)

**Listy:**
- Lista punktowana (bullet list)
- Lista numerowana (numbered list)

**Media:**
- 🖼️ **Obrazki:**
  - Upload z dysku → Supabase Storage
  - Wklejanie z linku (URL)
- 🎬 **Video:**
  - Osadzanie YouTube (embed)
  - Osadzanie Vimeo (embed)

**Inne:**
- 🔗 Linki (hyperlinks)
- Wyrównanie tekstu (opcjonalnie)

### Integracja Quill.js

**CDN:**
```html
<!-- Quill CSS -->
<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">

<!-- Quill JS -->
<script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
```

**Inicjalizacja:**
```javascript
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }
});
```

**Custom handlers (upload obrazka):**
```javascript
quill.getModule('toolbar').addHandler('image', async () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  
  input.onchange = async () => {
    const file = input.files[0];
    const url = await knowledgeBaseEngine.uploadImage(file);
    const range = quill.getSelection();
    quill.insertEmbed(range.index, 'image', url);
  };
});
```

---

## Bezpieczeństwo

### Frontend
- ✅ Warunkowe wyświetlanie przycisków admina (`sessionManager.isAdmin()`)
- ✅ Walidacja danych przed wysłaniem do API
- ✅ Sanityzacja HTML po renderowaniu Markdown

### Backend (RLS)
- ✅ Tylko admin może tworzyć/edytować/usuwać artykuły
- ✅ Wszyscy mogą czytać opublikowane artykuły
- ✅ Tylko admin widzi nieopublikowane artykuły
- ✅ Polityki RLS wymuszane na poziomie bazy danych
- ✅ Tylko admin może uploadować obrazki do Supabase Storage
- ✅ Wszyscy mogą pobierać obrazki (publiczny bucket)

---

## Przyszłe Rozszerzenia (v2)

- **Wersjonowanie artykułów** - historia zmian
- **Komentarze** - użytkownicy mogą komentować
- **Oceny** - like/dislike, gwiazdki
- **Załączniki** - obrazy, pliki PDF
- **Współpraca** - wielu autorów
- **Tłumaczenia** - artykuły w wielu językach
- **Rich Text Editor** - WYSIWYG zamiast Markdown
- **AI Assistant** - generowanie artykułów przez AI

---

## Powiązane Pliki

- `/supabase/migration_knowledge_base.sql` - Migracja bazy danych
- `/js/types.js` - Typy TypeScript/JSDoc
- `/js/data-service.js` - Operacje na bazie danych
- `/js/knowledge-base-engine.js` - Logika biznesowa Bazy Wiedzy
- `/js/ui-manager.js` - Zarządzanie interfejsem
- `/js/content-manager.js` - Ładowanie danych
- `/js/feature-flags.js` - Feature flag `ENABLE_KNOWLEDGE_BASE`
- `/index.html` - Struktura HTML
- `/docs/KNOWLEDGE_BASE_FEATURE.md` - Ten dokument

---

**Status:** 📝 Planowanie zakończone  
**Następny krok:** Implementacja Faza 1 (Backend)  
**Data utworzenia:** 30 października 2025

