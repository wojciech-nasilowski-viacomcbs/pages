# 🤖 Konfiguracja Kontekstu AI dla Projektu

Ten dokument opisuje, jak skonfigurowano projekt, aby AI asystenci (Cursor, GitHub Copilot, itp.) automatycznie rozumieli strukturę i konwencje projektu.

## 📋 Co zostało zrobione?

### 1. Reorganizacja dokumentacji
- ✅ Wszystkie pliki `.md` (oprócz `README.md` i `LICENSE`) przeniesione do `/docs/`
- ✅ Utworzono katalog `/docs/` jako centralną lokalizację dokumentacji
- ✅ Zaktualizowano wszystkie linki w `README.md`

### 2. Plik `.cursorrules`
Utworzono plik **`.cursorrules`** w głównym katalogu projektu. Jest to specjalny plik, który Cursor AI automatycznie wczytuje przy każdej nowej konwersacji.

**Lokalizacja**: `/.cursorrules`

**Co zawiera**:
- 📁 Zasady organizacji plików (gdzie umieszczać dokumentację)
- 🏗️ Struktura projektu
- 💻 Standardy kodowania (ES6+, JSDoc, DOM helpers)
- 🎯 Best practices dla state management
- 🚫 Lista rzeczy, których NIE robić
- ✅ Lista rzeczy, które NALEŻY robić
- 🔍 Szybkie odnośniki do kluczowych dokumentów

### 3. Plik `.cursorignore`
Utworzono plik **`.cursorignore`** aby AI nie indeksował niepotrzebnych plików.

**Lokalizacja**: `/.cursorignore`

**Co ignoruje**:
- `node_modules/`
- `coverage/`
- Pliki tymczasowe i logi
- Pliki IDE

### 4. Indeks dokumentacji
Utworzono **`docs/INDEX.md`** - centralny spis wszystkich dokumentów z opisami i szybkimi linkami.

## 🎯 Jak to działa?

### Dla Cursor AI
1. **Automatyczne wczytywanie**: Przy każdej nowej konwersacji Cursor automatycznie wczytuje `.cursorrules`
2. **Kontekst zawsze dostępny**: AI wie gdzie umieszczać pliki, jakich konwencji używać
3. **Konsystencja**: Każda sesja AI ma te same zasady i wytyczne

### Dla innych AI (ChatGPT, Claude, itp.)
Jeśli używasz innych AI do pomocy w projekcie:
1. Przekaż im plik `.cursorrules`
2. Lub przekaż link do `docs/INDEX.md`
3. AI będzie znało strukturę i konwencje projektu

## 📚 Kluczowe zasady dla AI

### Tworzenie dokumentacji
```bash
# ✅ DOBRZE - dokumenty w /docs/
touch docs/NEW_FEATURE.md

# ❌ ŹLE - dokumenty w root (oprócz README.md)
touch NEW_FEATURE.md
```

### Używanie DOM helpers
```javascript
// ✅ DOBRZE - użyj helpers
const el = $('#my-element');
show(el);

// ❌ ŹLE - raw DOM
const el = document.getElementById('my-element');
el.style.display = 'block';
```

### Zarządzanie stanem
```javascript
// ✅ DOBRZE - użyj state manager
uiState.navigateToScreen('quiz');

// ❌ ŹLE - bezpośrednia manipulacja
currentScreen = 'quiz';
```

## 🔄 Aktualizacja kontekstu AI

Jeśli dodajesz nowe konwencje lub zasady:

1. **Edytuj `.cursorrules`** - dodaj nowe zasady
2. **Zaktualizuj `docs/INDEX.md`** - jeśli dodajesz nowe dokumenty
3. **Zaktualizuj `README.md`** - jeśli zmienia się struktura projektu

## 📖 Przykładowe prompty dla AI

### Tworzenie nowej funkcji
```
Przeczytaj .cursorrules i stwórz nową funkcję do [opis funkcji].
Użyj DOM helpers i state managera zgodnie z konwencjami projektu.
```

### Dodawanie dokumentacji
```
Stwórz dokumentację dla [funkcja/moduł] i umieść ją w odpowiednim
miejscu zgodnie z zasadami projektu.
```

### Refaktoryzacja kodu
```
Zrefaktoryzuj [plik/moduł] zgodnie z konwencjami projektu opisanymi
w .cursorrules. Użyj DOM helpers zamiast raw DOM.
```

## 🎓 Dla nowych deweloperów

Jeśli jesteś nowym deweloperem w projekcie:

1. **Przeczytaj `.cursorrules`** - poznasz wszystkie konwencje
2. **Zobacz `docs/INDEX.md`** - znajdziesz wszystkie dokumenty
3. **Przeczytaj `docs/QUICK_START_DOM_HELPERS.md`** - szybki start z narzędziami
4. **Zobacz `docs/STATE_MANAGEMENT.md`** - zrozumiesz architekturę

## ✨ Korzyści

### Dla deweloperów
- 🎯 Konsystentny kod we wszystkich sesjach AI
- 📚 Łatwy dostęp do dokumentacji
- 🚀 Szybsze onboardowanie nowych członków zespołu
- 🔄 Automatyczna propagacja best practices

### Dla AI
- 🧠 Pełny kontekst projektu od początku
- 📋 Jasne zasady i konwencje
- 🎨 Spójny styl kodu
- 🔍 Łatwe odnajdywanie odpowiedniej dokumentacji

## 🔧 Rozwiązywanie problemów

### AI nie przestrzega zasad
1. Sprawdź czy `.cursorrules` istnieje w głównym katalogu
2. Upewnij się, że plik nie jest w `.gitignore`
3. Zrestartuj Cursor/IDE
4. Jawnie wspomnij w promptcie: "Zgodnie z .cursorrules..."

### AI tworzy pliki w złych miejscach
1. Przypomniej AI: "Umieść dokumentację w /docs/ zgodnie z zasadami projektu"
2. Sprawdź czy `.cursorrules` zawiera aktualne zasady
3. Zaktualizuj `.cursorrules` jeśli zasady się zmieniły

## 📝 Changelog

### 2025-10-30
- ✅ Utworzono `.cursorrules` z pełnymi zasadami projektu
- ✅ Utworzono `.cursorignore` dla optymalizacji
- ✅ Przeniesiono wszystkie `.md` do `/docs/`
- ✅ Utworzono `docs/INDEX.md`
- ✅ Zaktualizowano `README.md` z nowymi linkami
- ✅ Utworzono ten dokument (`AI_CONTEXT_SETUP.md`)

---

**Więcej informacji**: Zobacz [INDEX.md](INDEX.md) dla pełnej listy dokumentacji.

