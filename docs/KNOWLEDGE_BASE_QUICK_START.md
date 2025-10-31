# 🚀 Szybki Start: Edycja Bazy Wiedzy

## 📋 Wymagania

Aby móc edytować artykuły w Bazie Wiedzy, musisz:

1. ✅ **Być zalogowanym** jako użytkownik
2. ✅ **Mieć rolę ADMIN** w bazie danych
3. ✅ **Feature flag `ENABLE_KNOWLEDGE_BASE` włączony** (na produkcji i lokalnie)

---

## 🔐 Jak sprawdzić czy mam uprawnienia admina?

### Metoda 1: Sprawdź w konsoli przeglądarki

1. Otwórz aplikację
2. Naciśnij `F12` (DevTools)
3. Przejdź do zakładki **Console**
4. Wpisz:

```javascript
sessionManager.isAdmin()
```

**Wynik:**
- `true` ✅ - Masz uprawnienia admina
- `false` ❌ - Nie masz uprawnień admina

### Metoda 2: Sprawdź w UI

Jeśli masz uprawnienia admina, zobaczysz:

1. **W liście artykułów:**
   - Przycisk **➕ Nowy artykuł** w prawym górnym rogu
   - Przyciski **✏️ Edytuj** i **🗑️** na każdej karcie artykułu

2. **W widoku artykułu:**
   - Przyciski **✏️ Edytuj** i **🗑️ Usuń** w prawym górnym rogu

Jeśli **NIE widzisz** tych przycisków → **nie masz uprawnień admina**.

---

## 🛠️ Jak nadać sobie uprawnienia admina?

### Opcja 1: Przez Supabase Dashboard (Zalecane)

1. **Otwórz Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   → Wybierz projekt
   → Table Editor
   → Tabela: profiles
   ```

2. **Znajdź swój profil:**
   - Szukaj po swoim adresie email
   - Lub po `user_id` (UUID)

3. **Edytuj kolumnę `role`:**
   - Kliknij w komórkę `role`
   - Zmień wartość na: `admin`
   - Zapisz (Enter lub kliknij poza komórkę)

4. **Wyloguj się i zaloguj ponownie** w aplikacji

### Opcja 2: Przez SQL Editor

1. **Otwórz SQL Editor w Supabase:**
   ```
   https://supabase.com/dashboard
   → Wybierz projekt
   → SQL Editor
   ```

2. **Wykonaj zapytanie:**

```sql
-- Zamień 'twoj-email@example.com' na swój email
UPDATE profiles
SET role = 'admin'
WHERE email = 'twoj-email@example.com';
```

3. **Kliknij "Run"**

4. **Wyloguj się i zaloguj ponownie** w aplikacji

### Opcja 3: Użyj gotowego skryptu SQL

W projekcie jest gotowy skrypt:

```bash
supabase/add_admin_role.sql
```

1. Otwórz plik
2. Zamień `your-email@example.com` na swój email
3. Skopiuj zawartość
4. Wklej w SQL Editor w Supabase
5. Kliknij "Run"

---

## ✏️ Jak edytować artykuł?

### Krok 1: Przejdź do Bazy Wiedzy

1. Otwórz aplikację
2. Kliknij zakładkę **📚 Wiedza** (w dolnym menu)

### Krok 2: Otwórz edytor

**Opcja A: Edycja istniejącego artykułu**

1. Na liście artykułów kliknij przycisk **✏️ Edytuj** na karcie artykułu
2. Lub otwórz artykuł i kliknij **✏️ Edytuj** w prawym górnym rogu

**Opcja B: Tworzenie nowego artykułu**

1. Kliknij przycisk **➕ Nowy artykuł** w prawym górnym rogu listy

### Krok 3: Wypełnij formularz

Edytor zawiera następujące pola:

#### 📝 Pola wymagane:

1. **Tytuł*** - Tytuł artykułu (np. "Jak zacząć trening siłowy?")
2. **Slug*** - URL-friendly wersja tytułu (generuje się automatycznie)
3. **Treść*** - Główna treść artykułu (edytor WYSIWYG)

#### 📋 Pola opcjonalne:

4. **Opis** - Krótki opis (wyświetlany na karcie artykułu)
5. **Kategoria** - Kategoria artykułu (np. "Trening", "Dieta", "Nauka")
6. **Ikona** - Emoji ikona (np. 💪, 🍎, 📚)
7. **Tagi** - Tagi oddzielone przecinkami (np. "trening, siłownia, początkujący")
8. **Opublikowany** - Checkbox (zaznacz aby artykuł był widoczny)
9. **Wyróżniony** - Checkbox (zaznacz aby artykuł był na górze listy)

### Krok 4: Edytuj treść w edytorze Quill

Edytor WYSIWYG (Quill.js) pozwala na:

#### Formatowanie tekstu:
- **Pogrubienie** (Ctrl+B)
- *Kursywa* (Ctrl+I)
- <u>Podkreślenie</u> (Ctrl+U)

#### Nagłówki:
- H1, H2, H3 (dropdown w toolbarze)

#### Listy:
- Lista numerowana
- Lista punktowana

#### Media:
- **Link** - Wstaw link do strony
- **Obrazek** - Upload obrazka (max 5MB, JPG/PNG/GIF/WEBP)
- **Video** - Embed YouTube/Vimeo (wklej URL)

#### Czyszczenie:
- **Clean** - Usuń formatowanie

### Krok 5: Zapisz artykuł

1. Kliknij przycisk **💾 Zapisz artykuł** na dole formularza
2. Poczekaj na komunikat sukcesu
3. Zostaniesz przekierowany do listy artykułów

---

## 🖼️ Jak dodać obrazek?

### Metoda 1: Upload z dysku

1. W edytorze kliknij ikonę **obrazka** 🖼️ w toolbarze
2. Wybierz plik z dysku (max 5MB)
3. Poczekaj na upload
4. Obrazek zostanie wstawiony w miejscu kursora

### Metoda 2: Drag & Drop (jeśli wspierane)

1. Przeciągnij plik obrazka do edytora
2. Upuść w miejscu gdzie chcesz wstawić
3. Poczekaj na upload

**Dozwolone formaty:** JPG, PNG, GIF, WEBP  
**Maksymalny rozmiar:** 5MB

---

## 🎥 Jak dodać video (YouTube/Vimeo)?

1. Skopiuj URL video z YouTube lub Vimeo:
   - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Vimeo: `https://vimeo.com/VIDEO_ID`

2. W edytorze kliknij ikonę **video** 🎬 w toolbarze

3. Wklej URL w oknie dialogowym

4. Kliknij OK

5. Video zostanie wstawione jako embed

---

## 🗑️ Jak usunąć artykuł?

### Opcja 1: Z listy artykułów

1. Kliknij przycisk **🗑️** na karcie artykułu
2. Potwierdź usunięcie w oknie dialogowym

### Opcja 2: Z widoku artykułu

1. Otwórz artykuł
2. Kliknij przycisk **🗑️ Usuń** w prawym górnym rogu
3. Potwierdź usunięcie

**⚠️ UWAGA:** Usunięcie jest **nieodwracalne**!

---

## 🔍 Wyszukiwanie i filtrowanie

### Wyszukiwarka

W polu **🔍 Szukaj artykułów...** możesz wpisać:
- Tytuł artykułu
- Fragment opisu
- Tag

Wyszukiwanie działa **w czasie rzeczywistym**.

### Filtry kategorii

Pod wyszukiwarką są przyciski filtrów:
- **Wszystkie** - Pokaż wszystkie artykuły
- **[Nazwa kategorii]** - Pokaż tylko artykuły z tej kategorii

---

## ❓ FAQ

### Nie widzę przycisków edycji. Co robić?

**Sprawdź:**

1. ✅ Czy jesteś zalogowany?
   - Jeśli nie → Zaloguj się

2. ✅ Czy masz rolę `admin` w bazie danych?
   - Sprawdź w konsoli: `sessionManager.isAdmin()`
   - Jeśli `false` → Nadaj sobie uprawnienia (patrz wyżej)

3. ✅ Czy feature flag `ENABLE_KNOWLEDGE_BASE` jest włączony?
   - Lokalnie: sprawdź `js/config.js`
   - Produkcja: sprawdź zmienne środowiskowe w Vercel

4. ✅ Czy wylogowałeś się i zalogowałeś ponownie po nadaniu uprawnień?
   - Jeśli nie → Wyloguj się i zaloguj ponownie

### Slug generuje się automatycznie?

**Tak!** Gdy wpisujesz tytuł, slug generuje się automatycznie:

- **Tytuł:** "Jak zacząć trening siłowy?"
- **Slug:** `jak-zaczac-trening-silowy`

Możesz go edytować ręcznie, ale musi być:
- Małymi literami
- Bez polskich znaków
- Tylko litery, cyfry i myślniki

### Czy mogę użyć HTML w treści?

**Nie bezpośrednio.** Edytor Quill używa własnego formatu (Delta).

Użyj narzędzi formatowania w toolbarze zamiast HTML.

### Jak dodać kod źródłowy?

Obecnie edytor **nie wspiera** bloków kodu.

**Workaround:** Użyj formatowania `preformatted` lub dodaj kod jako obrazek.

### Obrazki są uploadowane gdzie?

Obrazki są uploadowane do **Supabase Storage**:
- Bucket: `knowledge-base-images`
- Publiczny dostęp
- URL: `https://[projekt].supabase.co/storage/v1/object/public/knowledge-base-images/[nazwa-pliku]`

### Czy mogę cofnąć zmiany?

**Nie ma automatycznego undo.**

**Zalecenie:** Przed dużymi zmianami:
1. Skopiuj treść artykułu (Ctrl+A, Ctrl+C w edytorze)
2. Wklej do notatnika jako backup
3. Edytuj
4. Jeśli coś pójdzie nie tak → przywróć z backupu

---

## 🎯 Checklist: Tworzenie nowego artykułu

- [ ] Zaloguj się jako admin
- [ ] Przejdź do zakładki **📚 Wiedza**
- [ ] Kliknij **➕ Nowy artykuł**
- [ ] Wypełnij **Tytuł**
- [ ] Sprawdź wygenerowany **Slug** (edytuj jeśli potrzeba)
- [ ] Dodaj **Opis** (opcjonalnie)
- [ ] Wybierz **Kategorię** (opcjonalnie)
- [ ] Dodaj **Ikonę** emoji (opcjonalnie)
- [ ] Dodaj **Tagi** (opcjonalnie)
- [ ] Napisz **Treść** w edytorze
- [ ] Dodaj obrazki/video (opcjonalnie)
- [ ] Zaznacz **Opublikowany** (aby artykuł był widoczny)
- [ ] Zaznacz **Wyróżniony** (opcjonalnie - artykuł będzie na górze)
- [ ] Kliknij **💾 Zapisz artykuł**
- [ ] Sprawdź czy artykuł wyświetla się poprawnie

---

## 🔗 Przydatne linki

- [KNOWLEDGE_BASE_FEATURE.md](KNOWLEDGE_BASE_FEATURE.md) - Pełna dokumentacja funkcji
- [KNOWLEDGE_BASE_EDITOR.md](KNOWLEDGE_BASE_EDITOR.md) - Dokumentacja edytora Quill
- [USER_ROLES.md](USER_ROLES.md) - Dokumentacja ról użytkowników
- [DB_SCHEMA.md](DB_SCHEMA.md) - Schemat bazy danych

---

**Potrzebujesz pomocy?** Sprawdź logi w konsoli przeglądarki (F12) lub dokumentację techniczną.

