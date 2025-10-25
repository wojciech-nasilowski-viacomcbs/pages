# 🎧 Nowa funkcja: Text-to-Speech i Pytania Słuchowe

## Co zostało dodane?

### 1. **Moduł TTS w `audio.js`**
- ✅ Funkcja `speakText(text, lang, rate)` - odtwarza tekst w wybranym języku
- ✅ Funkcja `stopSpeaking()` - zatrzymuje odtwarzanie
- ✅ Obsługa wielu języków (en-US, es-ES, pl-PL, etc.)
- ✅ Regulowana prędkość mowy (domyślnie 0.85 dla nauki)

### 2. **Nowy typ pytania: "listening"**
Użytkownik słucha tekstu i wpisuje, co usłyszał.

**Przykład:**
```json
{
  "type": "listening",
  "questionText": "🎧 Posłuchaj i wpisz, co usłyszałeś:",
  "audioText": "A table for two, please",
  "audioLang": "en-US",
  "correctAnswer": "A table for two, please",
  "acceptableAnswers": ["A table for two please", "A table for 2 please"],
  "explanation": "To zdanie oznacza: 'Stolik dla dwóch osób, proszę'",
  "autoPlay": true
}
```

**Funkcje:**
- 🔊 Przycisk "Odtwórz" - normalna prędkość
- 🐌 Przycisk "Wolniej" - 70% prędkości (dla trudniejszych zdań)
- ✅ Automatyczne odtworzenie przy wyświetleniu pytania
- ✅ Możliwość wielokrotnego słuchania
- ✅ Inteligentne sprawdzanie odpowiedzi (ignoruje wielkość liter, akcenty, interpunkcję)

### 3. **Opcjonalne audio dla wszystkich typów pytań**
Każde pytanie może mieć przycisk 🔊 do odczytania słowa/frazy.

**Przykład:**
```json
{
  "type": "multiple-choice",
  "questionText": "Co oznacza 'menu'?",
  "audioText": "menu",
  "audioLang": "en-US",
  "options": [...]
}
```

### 4. **Zaktualizowana dokumentacja**
- ✅ `DATA_FORMAT.md` - pełna dokumentacja nowego typu pytania
- ✅ Przykłady użycia w różnych językach

### 5. **Przykładowe quizy**

**`english-a1-restaurant.json`** - Dodano **6 pytań słuchowych**:
1. "A table for two, please"
2. "Could I have the menu, please?"
3. "Are you ready to order?"
4. "I'd like the chicken, please"
5. "Can I pay by card?"
6. "The bill, please"

Plus **3 pytania z opcjonalnym audio** (przycisk 🔊).

**`english-advanced-vocabulary.json`** - NOWY QUIZ! 🎉
- **52 pytania** - kompleksowy test zaawansowanego słownictwa!
- Poziom C1-C2 (Advanced)
- **30 pytań słuchowych** (listening) - serendipity, ubiquitous, ephemeral, meticulous, idiosyncrasy, juxtaposition, facetious, ostentatious, recalcitrant, etc.
- **10 pytań wielokrotnego wyboru** - definicje i znaczenia słów
- **7 pytań uzupełniających** - użycie w kontekście
- **4 pytania dopasowywania** - synonimy, przeciwieństwa, definicje
- **5 pytań prawda/fałsz** - sprawdzenie rozumienia
- Idiomy: "beat around the bush", "once in a blue moon", "the elephant in the room", "hit the nail on the head", etc.
- Wiele pytań ma opcjonalne audio (przycisk 🔊)

---

## Jak używać?

### Dla użytkowników:
1. Otwórz quiz "English A1: Restaurant & Dining"
2. Pytania słuchowe mają ikonę 🎧
3. Audio odtworzy się automatycznie
4. Możesz kliknąć "🔊 Odtwórz" lub "🐌 Wolniej" w dowolnym momencie
5. Wpisz, co usłyszałeś i kliknij "Sprawdź odpowiedź"

### Dla twórców quizów:
Dodaj nowe pytania słuchowe zgodnie z formatem w `DATA_FORMAT.md`:

```json
{
  "type": "listening",
  "questionText": "Instrukcja dla użytkownika",
  "audioText": "Tekst do odczytania",
  "audioLang": "en-US",
  "correctAnswer": "Poprawna odpowiedź",
  "acceptableAnswers": ["Alternatywna 1", "Alternatywna 2"],
  "explanation": "Wyjaśnienie"
}
```

**Dostępne języki:**
- `en-US` - angielski (amerykański)
- `en-GB` - angielski (brytyjski)
- `es-ES` - hiszpański (Hiszpania)
- `es-MX` - hiszpański (Meksyk)
- `pl-PL` - polski
- `fr-FR` - francuski
- `de-DE` - niemiecki
- `it-IT` - włoski
- i wiele innych...

---

## Wsparcie przeglądarek

✅ **Chrome/Edge** - pełne wsparcie, najlepsza jakość głosów
✅ **Safari** - pełne wsparcie
✅ **Firefox** - podstawowe wsparcie
⚠️ **Starsze przeglądarki** - funkcja może nie działać

---

## Techniczne szczegóły

- **API:** Web Speech API (wbudowane w przeglądarkę)
- **Koszty:** 0 zł (całkowicie darmowe)
- **Limity:** Brak limitów
- **Offline:** Działa offline po pierwszym użyciu
- **Jakość:** Zależy od systemu operacyjnego (iOS/macOS mają najlepsze głosy)

### ✅ Potwierdzenie poprawności implementacji

**Język jest prawidłowo obsługiwany!** 

Każde pytanie może mieć własny język określony przez pole `audioLang`:
- `renderListening()` używa `questionData.audioLang` (linia 312 w quiz-engine.js)
- `addAudioButton()` używa `questionData.audioLang` (linia 233 w quiz-engine.js)
- `attachAudioListeners()` przekazuje `lang` do `speakText()` (linia 264 w quiz-engine.js)
- `speakText()` ustawia `utterance.lang` na przekazany język (linia 194 w audio.js)

**Przykład:**
- Pytanie po angielsku: `"audioLang": "en-US"` → mówi po angielsku
- Pytanie po hiszpańsku: `"audioLang": "es-ES"` → mówi po hiszpańsku
- Pytanie po polsku: `"audioLang": "pl-PL"` → mówi po polsku

Możesz mieszać języki w jednym quizie - każde pytanie będzie czytane w swoim języku!

---

## Następne kroki

Możesz teraz:
1. ✅ Przetestować nowe pytania słuchowe w quizie
2. ✅ Dodać pytania słuchowe do innych quizów (spanish-a1.json, etc.)
3. ✅ Dodać opcjonalne audio do istniejących pytań (pole `audioText`)
4. ✅ Eksperymentować z różnymi prędkościami (`audioRate`)

---

**Miłej nauki! 🎉**

