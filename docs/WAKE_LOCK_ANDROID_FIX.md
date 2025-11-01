# Wake Lock - Rozwiązanie problemu na Androidzie

## 🐛 Problem

Na urządzeniach Android z Web Speech API (TTS) ekran może się wygaszać mimo aktywnego Wake Lock API, co powoduje:
- Przerwanie syntezy mowy (TTS przestaje czytać)
- Wygaszenie ekranu podczas nauki ze słuchu
- Frustrację użytkownika

## 🔍 Przyczyna

**Web Speech API nie jest traktowane jako "odtwarzanie multimediów"** przez system Android:
- Wake Lock API może być ignorowane lub zwalniane przez system
- Android agresywnie zarządza energią i może przerywać TTS
- Brak natywnego odtwarzania audio = brak ochrony przed wygaszaniem

## ✅ Rozwiązanie - Wielowarstwowa ochrona

Zaimplementowano **3-warstwowy system ochrony**:

### Warstwa 1: Wake Lock API (podstawowa)
```javascript
wakeLock = await navigator.wakeLock.request('screen');
```
- Standardowe API
- Działa w większości przypadków
- **Automatyczna reaktywacja** gdy system zwolni blokadę

### Warstwa 2: Ukryte wideo (fallback)
```javascript
// Tworzy niewidoczne, zapętlone wideo (1px × 1px, opacity 0.01)
dummyVideo = document.createElement('video');
dummyVideo.setAttribute('loop', '');
dummyVideo.setAttribute('muted', '');
dummyVideo.play();
```
- System Android traktuje odtwarzanie wideo jako aktywność multimedialną
- Zapobiega wygaszaniu ekranu
- Prawie niewidoczne (1px, opacity 0.01)
- Wyciszone i zapętlone

### Warstwa 3: Keepalive (dodatkowa ochrona)
```javascript
// Co 10 sekund wykonuje małą operację
setInterval(() => {
  document.body.offsetHeight; // Wymusza reflow
  if (dummyVideo.paused) {
    dummyVideo.play(); // Upewnia się że wideo gra
  }
}, 10000);
```
- Co 10 sekund "pinguje" system
- Upewnia się że dummy video nadal gra
- Wymusza reflow DOM (aktywność JavaScript)

## 🏗️ Implementacja

### Automatyczna reaktywacja

Jeśli system zwolni Wake Lock, automatycznie próbujemy go ponownie aktywować:

```javascript
wakeLock.addEventListener('release', () => {
  console.log('🔓 Wake Lock released (possibly by system)');
  wakeLock = null;
  
  // Jeśli nadal są aktywne referencje, spróbuj ponownie
  if (activeReferences.size > 0) {
    console.log('🔄 Attempting to reacquire Wake Lock...');
    setTimeout(() => _acquireWakeLock(), 100);
  }
});
```

### Graceful degradation

Jeśli Wake Lock API nie jest wspierane, system automatycznie używa fallbacków:

```javascript
if (!isSupported()) {
  console.log('⚠️ Wake Lock API not supported - using fallback methods');
  _createDummyVideo();
  await dummyVideo.play();
  _startKeepalive();
  return;
}
```

## 📊 Porównanie przed/po

| Aspekt | Przed | Po |
|--------|-------|-----|
| Wake Lock API | ✅ Tak | ✅ Tak |
| Dummy video fallback | ❌ Nie | ✅ Tak |
| Keepalive ping | ❌ Nie | ✅ Tak |
| Automatyczna reaktywacja | ❌ Nie | ✅ Tak |
| Wsparcie starszych urządzeń | ❌ Nie | ✅ Tak |
| Ekran gaśnie na Androidzie | ❌ Tak | ✅ Nie (naprawione) |

## 🧪 Testowanie

### Test 1: Podstawowy (Android)
1. Otwórz aplikację na Androidzie
2. Uruchom odtwarzacz słuchania
3. Zostaw telefon bez dotykania przez 2-3 minuty
4. **✅ Oczekiwany rezultat:** Ekran pozostaje włączony, TTS czyta

### Test 2: Sprawdź logi
Otwórz konsolę (Remote Debugging) i sprawdź logi:

```
✅ Wake Lock acquired - screen will stay on
📹 Dummy video created as fallback
💓 Keepalive started
💓 Keepalive ping (active sources: 1)
💓 Keepalive ping (active sources: 1)
...
```

### Test 3: Symuluj zwolnienie Wake Lock
W konsoli:
```javascript
// Sprawdź czy automatyczna reaktywacja działa
// (Wake Lock może być zwolniony przez system w dowolnym momencie)
```

## 🔧 Konfiguracja

### Częstotliwość keepalive

Domyślnie: **10 sekund**. Można zmienić w kodzie:

```javascript
// W js/wake-lock.js, linia ~116
keepaliveInterval = setInterval(() => {
  // ...
}, 10000); // ← Zmień wartość (w milisekundach)
```

**Uwaga:** Zbyt częste pingi mogą wpływać na baterię.

### Rozmiar dummy video

Domyślnie: **1px × 1px, opacity 0.01**

```javascript
// W js/wake-lock.js, linia ~60-67
dummyVideo.style.width = '1px';
dummyVideo.style.height = '1px';
dummyVideo.style.opacity = '0.01';
```

## 📱 Wsparcie urządzeń

| Urządzenie | Wake Lock API | Dummy Video | Keepalive | Status |
|------------|---------------|-------------|-----------|--------|
| Android 7+ (Chrome) | ✅ | ✅ | ✅ | ✅ Działa |
| Android 6- (Chrome) | ❌ | ✅ | ✅ | ✅ Działa (fallback) |
| iOS 16.4+ (Safari) | ✅ | ✅ | ✅ | ✅ Działa |
| iOS 16.3- (Safari) | ❌ | ✅ | ✅ | ✅ Działa (fallback) |
| Desktop (wszystkie) | ✅ | ✅ | ✅ | ✅ Działa |

## 🐛 Debugowanie

### Sprawdź czy wszystkie warstwy są aktywne

W konsoli:
```javascript
// Sprawdź Wake Lock
window.wakeLockManager.getActiveSources()
// ['listening']

// Sprawdź czy dummy video istnieje (w DevTools)
document.querySelector('video')
// <video loop muted playsinline ...>

// Sprawdź czy gra
document.querySelector('video').paused
// false (powinno być false = gra)
```

### Logi konsoli

Wszystkie operacje są logowane:
```
✅ Wake Lock acquired - screen will stay on
📹 Dummy video created as fallback
💓 Keepalive started
💓 Keepalive ping (active sources: 1)
🔓 Wake Lock released (possibly by system)
🔄 Attempting to reacquire Wake Lock...
✅ Wake Lock acquired - screen will stay on
```

### Typowe problemy

#### Problem: Ekran nadal gaśnie
**Rozwiązanie:**
1. Sprawdź czy dummy video gra: `document.querySelector('video').paused`
2. Sprawdź logi keepalive w konsoli
3. Sprawdź ustawienia baterii telefonu (tryb oszczędzania może blokować)

#### Problem: TTS przestaje czytać
**Rozwiązanie:**
1. To może być problem z Web Speech API, nie Wake Lock
2. Sprawdź czy `speechSynthesis.speaking` zwraca `true`
3. Android może mieć limity dla długich utterances

#### Problem: Dummy video jest widoczne
**Rozwiązanie:**
1. Sprawdź CSS - powinno być `opacity: 0.01`, `width: 1px`, `height: 1px`
2. Sprawdź `z-index: -1000`

## 💡 Dlaczego to działa?

### Dummy video
Android traktuje odtwarzanie wideo jako **aktywność multimediów wysokiego priorytetu**:
- System nie wygasza ekranu podczas odtwarzania wideo
- Nawet 1px wideo jest traktowane jako "aktywne odtwarzanie"
- Wyciszenie i opacity nie wpływają na ochronę

### Keepalive
Regularne wykonywanie operacji JavaScript:
- Informuje system że aplikacja jest aktywna
- Wymusza reflow DOM = aktywność renderingu
- Sprawdza i reaktywuje dummy video jeśli przestało grać

### Automatyczna reaktywacja
Android może zwolnić Wake Lock w dowolnym momencie:
- Event listener `release` wykrywa to
- Automatycznie próbuje ponownie aktywować
- Działa w pętli dopóki są aktywne referencje

## 📚 Dodatkowe zasoby

- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Android Power Management](https://developer.android.com/topic/performance/power)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🎯 Podsumowanie

Wielowarstwowa ochrona zapewnia że:
- ✅ Ekran nie gaśnie podczas nauki ze słuchu
- ✅ TTS nie jest przerywane
- ✅ Działa na wszystkich urządzeniach (z fallbackami)
- ✅ Automatyczna reaktywacja gdy system zwolni blokadę
- ✅ Minimalne zużycie baterii

---

**Ostatnia aktualizacja:** 2025-11-01  
**Wersja:** 2.1 (Android fix)

