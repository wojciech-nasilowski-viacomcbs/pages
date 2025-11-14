# Instrukcja Importu Zestawu do Słuchania: GUSTAR, SOLER, Zaimki Dzierżawcze

## 📦 Plik do Zaimportowania

**Lokalizacja**: `/listening-set-gustar-soler-possessives.json`

## 🎯 Zawartość Zestawu

Zestaw zawiera **ponad 100 par zdań** obejmujących:

### 1. Czasownik GUSTAR
- ✅ Konstrukcja podstawowa (me gusta, te gusta, le gusta...)
- ✅ Liczba pojedyncza i mnoga (gusta vs gustan)
- ✅ Z bezokolicznikiem (me gusta leer, te gusta bailar...)
- ✅ Negacja (no me gusta, no te gusta...)
- ✅ Wzmocnienie z "A" (a mí me gusta, a ti te gusta...)

### 2. Czasownik SOLER
- ✅ Pełna odmiana (suelo, sueles, suele, solemos, soléis, suelen)
- ✅ Przykłady użycia z różnymi czasownikami
- ✅ Negacja (no suelo, no sueles...)

### 3. Zaimki Dzierżawcze
- ✅ mi/mis (mój, moja, moi, moje)
- ✅ tu/tus (twój, twoja, twoi, twoje)
- ✅ su/sus (jego, jej, ich, Pana, Pani, Państwa)
- ✅ nuestro/nuestra/nuestros/nuestras (nasz, nasza, nasi, nasze)
- ✅ vuestro/vuestra/vuestros/vuestras (wasz, wasza, wasi, wasze)

### 4. Liczebniki
- ✅ 21-29 (jednym słowem: veintiuno, veintidós...)
- ✅ 30-40 (osobno: treinta y uno, treinta y cinco...)

### 5. Zdania Złożone
- ✅ Kombinacje wszystkich powyższych elementów
- ✅ Praktyczne przykłady z życia codziennego

## 📋 Instrukcja Importu do Supabase

### Metoda 1: Przez Interfejs Aplikacji (ZALECANE)

1. **Zaloguj się do aplikacji** jako administrator
2. Przejdź do zakładki **"Nauka ze Słuchu"**
3. Kliknij przycisk **"➕ Importuj Zestaw"**
4. Wybierz plik: `/listening-set-gustar-soler-possessives.json`
5. Kliknij **"Importuj"**
6. System automatycznie:
   - Zwaliduje format
   - Zapisze do bazy danych Supabase
   - Wyświetli potwierdzenie

### Metoda 2: Bezpośrednio przez Supabase Dashboard

1. **Otwórz Supabase Dashboard**
   - Przejdź do: https://supabase.com/dashboard
   - Wybierz swój projekt

2. **Przejdź do Table Editor**
   - Kliknij na tabelę `listening_sets`

3. **Dodaj nowy wiersz**
   - Kliknij **"Insert row"**
   - Wypełnij pola:

```sql
-- Przykładowe dane do wstawienia:
INSERT INTO listening_sets (
  title,
  description,
  lang1_code,
  lang2_code,
  content,
  is_public,
  created_by
) VALUES (
  'Hiszpański A1: GUSTAR, SOLER, Zaimki Dzierżawcze',
  'Nauka czasowników gustar, soler, zaimków dzierżawczych i liczebników przez słuchanie. Ponad 100 par zdań z odmianami i przykładami użycia.',
  'pl-PL',
  'es-ES',
  '[WKLEJ TUTAJ ZAWARTOŚĆ POLA "content" Z PLIKU JSON]'::jsonb,
  true,
  '[TWOJE USER_ID]'
);
```

### Metoda 3: Przez SQL Editor

1. **Otwórz SQL Editor w Supabase**
2. **Skopiuj zawartość pliku JSON**
3. **Wykonaj zapytanie SQL**:

```sql
INSERT INTO listening_sets (
  title,
  description,
  lang1_code,
  lang2_code,
  content,
  is_public
) VALUES (
  'Hiszpański A1: GUSTAR, SOLER, Zaimki Dzierżawcze',
  'Nauka czasowników gustar, soler, zaimków dzierżawczych i liczebników przez słuchanie. Ponad 100 par zdań z odmianami i przykładami użycia.',
  'pl-PL',
  'es-ES',
  '[
    {
      "pl": "--- CZASOWNIK GUSTAR: Konstrukcja podstawowa ---",
      "es": "--- VERBO GUSTAR: Construcción básica ---"
    },
    ... [RESZTA ZAWARTOŚCI]
  ]'::jsonb,
  true
);
```

## ✅ Weryfikacja Importu

Po zaimportowaniu sprawdź:

1. **W aplikacji**:
   - Przejdź do zakładki "Nauka ze Słuchu"
   - Sprawdź czy nowy zestaw jest widoczny na liście
   - Kliknij na zestaw i sprawdź czy odtwarzanie działa

2. **W Supabase Dashboard**:
   - Otwórz tabelę `listening_sets`
   - Znajdź nowy wiersz
   - Sprawdź czy wszystkie pola są wypełnione poprawnie

## 🎮 Jak Używać Zestawu

1. **Uruchom odtwarzacz**:
   - Kliknij na zestaw "GUSTAR, SOLER, Zaimki Dzierżawcze"
   - Naciśnij ▶️ Play

2. **Opcje odtwarzania**:
   - 🔁 **Zapętlanie**: Włącz aby powtarzać zestaw w nieskończoność
   - 🔄 **Zmiana kolejności**: Przełącz PL→ES na ES→PL
   - ⏮️/⏭️ **Nawigacja**: Przeskocz do poprzedniej/następnej pary
   - 🔄 **Restart**: Rozpocznij od początku

3. **Logika odtwarzania**:
   - Język 1 (polski) → pauza 1s → Język 2 (hiszpański) → pauza 3s → następna para
   - Separatory (nagłówki sekcji) → pauza 4s

## 📊 Statystyki Zestawu

- **Liczba par**: ~100
- **Separatory (sekcje)**: 11
- **Języki**: Polski (pl-PL) ↔ Hiszpański (es-ES)
- **Poziom**: A1
- **Czas odtwarzania**: ~15-20 minut (bez zapętlania)

## 🔧 Rozwiązywanie Problemów

### Problem: Zestaw nie pojawia się na liście

**Rozwiązanie**:
1. Sprawdź czy pole `is_public` jest ustawione na `true`
2. Odśwież stronę (Ctrl+F5 / Cmd+Shift+R)
3. Sprawdź czy jesteś zalogowany

### Problem: Audio się nie odtwarza

**Rozwiązanie**:
1. Sprawdź czy przeglądarka wspiera Web Speech API (Chrome, Edge zalecane)
2. Sprawdź czy kody języków są poprawne: `pl-PL`, `es-ES`
3. Sprawdź uprawnienia przeglądarki do audio

### Problem: Błąd podczas importu

**Rozwiązanie**:
1. Sprawdź czy JSON jest poprawny (użyj jsonlint.com)
2. Sprawdź czy pola `lang1_code` i `lang2_code` są w formacie BCP 47
3. Sprawdź czy klucze w `content` pasują do kodów języków (pl, es)

## 📚 Powiązane Materiały

- **Quiz**: `/data/quizzes/spanish-a1-gustar-soler-possessives-lesson-11.json` (70 pytań)
- **Dokumentacja formatu**: `/docs/DATA_FORMAT.md` (sekcja "Nauka ze Słuchu")

## 🎓 Wskazówki Dydaktyczne

### Jak Najlepiej Wykorzystać Ten Zestaw:

1. **Pierwszy przesłuch**: Słuchaj z tekstem (patrz na ekran)
2. **Drugi przesłuch**: Słuchaj bez tekstu (zamknij oczy)
3. **Powtarzanie**: Powtarzaj na głos za lektorem
4. **Shadowing**: Mów równocześnie z lektorem
5. **Aktywne słuchanie**: Zatrzymuj i tłumacz w myślach

### Sugerowana Kolejność Nauki:

1. **Dzień 1-2**: GUSTAR - konstrukcja podstawowa
2. **Dzień 3-4**: GUSTAR - liczba mnoga i bezokolicznik
3. **Dzień 5-6**: SOLER - odmiana i przykłady
4. **Dzień 7-8**: Zaimki dzierżawcze mi/tu/su
5. **Dzień 9-10**: Zaimki dzierżawcze nuestro/vuestro
6. **Dzień 11-12**: Liczebniki
7. **Dzień 13-14**: Zdania złożone (wszystko razem)

### Po Zakończeniu:

- ✅ Rozwiąż quiz (70 pytań) aby sprawdzić wiedzę
- ✅ Stwórz własne zdania używając poznanych struktur
- ✅ Porozmawiaj z kimś po hiszpańsku używając GUSTAR i SOLER

---

**Powodzenia w nauce! ¡Buena suerte!** 🎉



