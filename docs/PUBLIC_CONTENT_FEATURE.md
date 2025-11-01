# Public Content Feature - Treści Publiczne dla Adminów 🌍

**Data:** 2025-11-01  
**Wersja:** 2.2.0

---

## 🎯 Przegląd

Admini mogą teraz tworzyć **treści publiczne** widoczne dla wszystkich użytkowników. Funkcja działa dla:
- ✅ Quizów
- ✅ Treningów
- ✅ Zestawów Listening

---

## 📋 Funkcjonalności

### 1. **Tworzenie Publicznych Treści**

Admini widzą checkbox **"🌍 Udostępnij publicznie"** w:
- AI Generator
- Import JSON

**Zwykli użytkownicy** - checkbox jest ukryty, mogą tworzyć tylko prywatne treści.

### 2. **Badge "Publiczny"**

Treści publiczne mają zielony badge:
- 🟢 **"Publiczny"** - treści publiczne admina
- 🔵 **"Przykład"** - sample content (wbudowane przykłady)
- (brak badge) - treści prywatne

### 3. **Przycisk Toggle Public/Private**

Admini widzą dodatkowy przycisk na kartach treści:
- **🌍** - Opublikuj dla wszystkich (gdy prywatny)
- **🔒** - Zmień na prywatny (gdy publiczny)

### 4. **Zarządzanie Publicznymi Treściami**

**Usuwanie:**
- ✅ Właściciel może usunąć swoją publiczną treść
- ✅ **Wszyscy admini** mogą usuwać publiczne treści (nawet innych adminów)
- ❌ Zwykli użytkownicy NIE mogą usuwać publicznych treści

**Zmiana statusu:**
- ✅ Admin może zmienić publiczny na prywatny i odwrotnie
- ❌ Zwykli użytkownicy nie widzą tego przycisku

---

## 🗄️ Baza Danych

### Nowe Pole: `is_public`

```sql
ALTER TABLE quizzes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE workouts ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE listening_sets ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
```

### Indeksy

```sql
CREATE INDEX idx_quizzes_is_public ON quizzes(is_public);
CREATE INDEX idx_workouts_is_public ON workouts(is_public);
CREATE INDEX idx_listening_sets_is_public ON listening_sets(is_public);
```

---

## 🔒 Row Level Security (RLS)

### Polityki READ

**Przed:**
```sql
-- Dostęp tylko do sample LUB własnych
USING (is_sample = TRUE OR user_id = auth.uid())
```

**Po:**
```sql
-- Dostęp do sample LUB publicznych LUB własnych
USING (is_sample = TRUE OR is_public = TRUE OR user_id = auth.uid())
```

### Polityki DELETE

**Przed:**
```sql
-- Tylko właściciel może usunąć (sample chronione)
USING (user_id = auth.uid() AND is_sample = FALSE)
```

**Po:**
```sql
-- Właściciel LUB admin może usunąć publiczne (sample chronione)
USING (
    is_sample = FALSE AND (
        user_id = auth.uid() OR 
        (is_public = TRUE AND public.is_admin(auth.uid()))
    )
)
```

### Polityki UPDATE

```sql
-- Admin może zmieniać is_public dla własnych lub publicznych treści
CREATE POLICY "Admins can update public status"
    ON quizzes FOR UPDATE
    USING (
        is_sample = FALSE AND 
        public.is_admin(auth.uid()) AND
        (user_id = auth.uid() OR is_public = TRUE)
    );
```

---

## 💻 Implementacja

### 1. Data Service (`js/data-service.js`)

**Zaktualizowane funkcje:**

```javascript
// Dodano parametr isPublic (domyślnie false)
async saveQuiz(quizData, isPublic = false) {
    const { data: quiz, error } = await supabaseClient
        .from('quizzes')
        .insert({
            user_id: user.id,
            title: quizData.title,
            description: quizData.description || '',
            is_sample: false,
            is_public: isPublic || false  // NOWE
        })
        .select()
        .single();
    
    return quiz;
}

// Analogicznie dla saveWorkout() i createListeningSet()
```

**Nowe funkcje:**

```javascript
// Zmiana statusu publiczny/prywatny
async updateQuizPublicStatus(quizId, isPublic) {
    const { data, error } = await supabaseClient
        .from('quizzes')
        .update({ is_public: isPublic })
        .eq('id', quizId)
        .select()
        .single();
    
    return data;
}

// Analogicznie dla workouts i listening_sets
```

### 2. Content Manager (`js/content-manager.js`)

**AI Generator - pokazuj checkbox dla adminów:**

```javascript
openAIGeneratorModal(state, elements) {
    // ...
    
    // Pokaż/ukryj opcję "Udostępnij publicznie"
    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    if (isAdmin && elements.aiPublicOption) {
        elements.aiPublicOption.classList.remove('hidden');
        elements.aiMakePublic.checked = false;
    } else if (elements.aiPublicOption) {
        elements.aiPublicOption.classList.add('hidden');
    }
    
    // ...
}
```

**Użyj wartości checkbox przy zapisie:**

```javascript
async handleAIGenerate(state, elements, uiManager) {
    // ...
    
    // Pobierz wartość checkboxa
    const isPublic = elements.aiMakePublic && elements.aiMakePublic.checked;
    
    // Zapisz z flagą is_public
    if (contentType === 'quiz') {
        savedItem = await dataService.saveQuiz(generatedData, isPublic);
    }
    // ...
}
```

**Renderowanie kart z badge:**

```javascript
renderCards(state, elements, uiManager, sessionManager) {
    // ...
    
    // Badge: Przykład (sample) lub Publiczny (is_public)
    let badge = '';
    if (item.isSample) {
        badge = '<span class="text-xs bg-blue-600 px-2 py-1 rounded">Przykład</span>';
    } else if (item.isPublic) {
        badge = '<span class="text-xs bg-green-600 px-2 py-1 rounded">Publiczny</span>';
    }
    
    // ...
}
```

**Przycisk toggle public/private (tylko dla adminów):**

```javascript
const isAdmin = state.currentUser && state.currentUser.role === 'admin';

const togglePublicBtn = isAdmin ? `
    <button class="toggle-public-btn ..."
            data-id="${item.id}"
            data-is-public="${item.isPublic || false}"
            title="${item.isPublic ? 'Zmień na prywatny' : 'Opublikuj dla wszystkich'}">
        ${item.isPublic ? '🔒' : '🌍'}
    </button>
` : '';
```

**Funkcja toggle:**

```javascript
async togglePublicStatus(id, newIsPublic, title, state, elements, uiManager, sessionManager) {
    try {
        const type = state.currentTab === 'quizzes' ? 'quiz' : 'workout';
        
        if (type === 'quiz') {
            await dataService.updateQuizPublicStatus(id, newIsPublic);
        } else {
            await dataService.updateWorkoutPublicStatus(id, newIsPublic);
        }
        
        // Pokaż powiadomienie
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span>${newIsPublic ? '🌍' : '🔒'}</span>
                <span>${newIsPublic ? 'Opublikowano dla wszystkich!' : 'Zmieniono na prywatny'}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Odśwież listę
        await this.loadData(state, elements, uiManager);
        this.renderCards(state, elements, uiManager, sessionManager);
        
    } catch (error) {
        console.error('Błąd zmiany statusu publicznego:', error);
        alert('Nie udało się zmienić statusu. Tylko admini mogą zmieniać status publiczny.');
    }
}
```

### 3. HTML (`index.html`)

**AI Generator - checkbox:**

```html
<!-- Opcje publikacji (tylko dla adminów) -->
<div id="ai-public-option" class="hidden mb-3 sm:mb-4">
    <label class="flex items-center gap-2 sm:gap-3 cursor-pointer bg-gray-700/50 p-3 sm:p-4 rounded-lg hover:bg-gray-700/70 transition">
        <input type="checkbox" id="ai-make-public" class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2">
        <div class="flex-1">
            <div class="text-white font-medium text-sm sm:text-base">🌍 Udostępnij publicznie</div>
            <div class="text-gray-400 text-xs sm:text-sm mt-1">Treść będzie widoczna dla wszystkich użytkowników</div>
        </div>
    </label>
</div>
```

**Import JSON - checkbox (identyczny):**

```html
<!-- Opcje publikacji (tylko dla adminów) -->
<div id="import-public-option" class="hidden mt-3 sm:mt-4">
    <!-- ... identyczna struktura ... -->
</div>
```

---

## 🎨 UI/UX

### Badge Colors

| Status | Badge | Kolor | Opis |
|--------|-------|-------|------|
| Sample | 🔵 Przykład | `bg-blue-600` | Wbudowane przykłady |
| Public | 🟢 Publiczny | `bg-green-600` | Treści publiczne admina |
| Private | (brak) | - | Treści prywatne |

### Przyciski Toggle

| Stan | Ikona | Tooltip | Akcja |
|------|-------|---------|-------|
| Prywatny | 🌍 | "Opublikuj dla wszystkich" | Zmienia na publiczny |
| Publiczny | 🔒 | "Zmień na prywatny" | Zmienia na prywatny |

### Powiadomienia

**Po zmianie statusu:**
- Fioletowe tło (`bg-purple-600`)
- Ikona: 🌍 (opublikowano) lub 🔒 (prywatny)
- Tekst: "Opublikowano dla wszystkich!" / "Zmieniono na prywatny"
- Czas: 3 sekundy

---

## 🧪 Scenariusze Testowe

### TC1: Admin tworzy publiczny quiz przez AI Generator
1. Zaloguj się jako admin
2. Otwórz AI Generator
3. Zaznacz "🌍 Udostępnij publicznie"
4. Wygeneruj quiz
5. **Oczekiwany rezultat:**
   - Quiz ma badge "Publiczny"
   - Widoczny dla wszystkich zalogowanych użytkowników

### TC2: Zwykły użytkownik nie widzi checkbox
1. Zaloguj się jako zwykły użytkownik
2. Otwórz AI Generator
3. **Oczekiwany rezultat:**
   - Checkbox "Udostępnij publicznie" jest ukryty
   - Można tworzyć tylko prywatne treści

### TC3: Admin zmienia publiczny na prywatny
1. Zaloguj się jako admin
2. Kliknij 🔒 na publicznej treści
3. **Oczekiwany rezultat:**
   - Powiadomienie "Zmieniono na prywatny"
   - Badge "Publiczny" znika
   - Treść widoczna tylko dla właściciela

### TC4: Admin usuwa publiczną treść innego admina
1. Admin A tworzy publiczny quiz
2. Zaloguj się jako Admin B
3. Kliknij "Usuń" na publicznym quizie Admin A
4. **Oczekiwany rezultat:**
   - Quiz zostaje usunięty
   - Wszyscy admini mogą usuwać publiczne treści

### TC5: Zwykły użytkownik próbuje usunąć publiczną treść
1. Admin tworzy publiczny quiz
2. Zaloguj się jako zwykły użytkownik
3. Spróbuj usunąć publiczny quiz
4. **Oczekiwany rezultat:**
   - Przycisk "Usuń" jest niewidoczny (tylko dla własnych treści)
   - RLS blokuje próbę usunięcia przez API

### TC6: Zwykły użytkownik widzi publiczne treści
1. Admin tworzy publiczny quiz
2. Zaloguj się jako zwykły użytkownik
3. Przejdź do zakładki Quizy
4. **Oczekiwany rezultat:**
   - Publiczny quiz jest widoczny
   - Ma badge "Publiczny"
   - Można go uruchomić

### TC7: Import JSON z flagą publiczną
1. Zaloguj się jako admin
2. Otwórz Import JSON
3. Zaznacz "🌍 Udostępnij publicznie"
4. Zaimportuj quiz
5. **Oczekiwany rezultat:**
   - Quiz ma badge "Publiczny"
   - Widoczny dla wszystkich

---

## 🔐 Bezpieczeństwo

### Walidacja po stronie klienta
- Checkbox widoczny tylko dla adminów
- Przycisk toggle widoczny tylko dla adminów

### Walidacja po stronie serwera (RLS)
- **INSERT:** Każdy zalogowany może tworzyć treści, ale `is_public` jest zapisywane
- **UPDATE:** Tylko admini mogą zmieniać `is_public`
- **DELETE:** Właściciel LUB admin (dla publicznych) może usunąć
- **SELECT:** Sample LUB publiczne LUB własne

### Funkcja `is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Różnice: Sample vs Public

| Cecha | Sample Content | Public Content |
|-------|----------------|----------------|
| **Twórca** | System/Admin | Admin |
| **Badge** | 🔵 Przykład | 🟢 Publiczny |
| **Pole DB** | `is_sample = TRUE` | `is_public = TRUE` |
| **Usuwanie** | ❌ Chronione | ✅ Admin może usunąć |
| **Edycja** | ❌ Chronione | ✅ Admin może zmienić status |
| **Widoczność** | Wszyscy | Wszyscy zalogowani |

---

## 🚀 Migracja

### Krok 1: Uruchom migrację SQL

```bash
# W Supabase SQL Editor
supabase/migration_add_is_public.sql
```

### Krok 2: Sprawdź funkcję is_admin()

```sql
-- Sprawdź czy funkcja istnieje
SELECT * FROM pg_proc WHERE proname = 'is_admin';

-- Jeśli nie istnieje, uruchom:
supabase/functions_user_role.sql
```

### Krok 3: Przetestuj RLS

```sql
-- Test 1: Czy publiczne treści są widoczne?
SELECT * FROM quizzes WHERE is_public = TRUE;

-- Test 2: Czy admin może zmienić status?
UPDATE quizzes SET is_public = TRUE WHERE id = 'xxx';
-- Powinno się udać dla admina

-- Test 3: Czy zwykły użytkownik może zmienić status?
-- (Zaloguj się jako zwykły użytkownik)
UPDATE quizzes SET is_public = TRUE WHERE id = 'xxx';
-- Powinno się NIE udać (RLS blokuje)
```

---

## 📝 Pliki Zmodyfikowane

### Backend (SQL)
- `supabase/migration_add_is_public.sql` - **NOWY**

### Frontend (JavaScript)
- `js/data-service.js` - dodano `isPublic` do save functions, nowe funkcje update
- `js/content-manager.js` - checkbox w AI/Import, badge, przycisk toggle
- `js/app.js` - nowe elementy DOM

### Frontend (HTML)
- `index.html` - checkbox w AI Generator i Import JSON

---

## 🎯 Podsumowanie

### ✅ Zaimplementowano

1. ✅ Pole `is_public` w bazie danych
2. ✅ RLS policies dla dostępu i zarządzania
3. ✅ Checkbox w AI Generator (tylko admini)
4. ✅ Checkbox w Import JSON (tylko admini)
5. ✅ Badge "Publiczny" na kartach
6. ✅ Przycisk toggle public/private (tylko admini)
7. ✅ Wszyscy admini mogą usuwać publiczne treści
8. ✅ Admin może zmienić publiczny na prywatny
9. ✅ Powiadomienia o zmianie statusu
10. ✅ Pełna walidacja bezpieczeństwa (RLS)

### 🔮 Przyszłe Rozszerzenia

- Panel admina z listą wszystkich publicznych treści
- Statystyki: ile razy otwarto publiczną treść
- Moderacja: zatwierdzanie publicznych treści przez super-admina
- Kategorie publicznych treści
- Wyszukiwanie w publicznych treściach
- Komentarze/oceny publicznych treści

---

**Gotowe do użycia! 🎉**

Admini mogą teraz tworzyć treści publiczne widoczne dla wszystkich użytkowników platformy.

