# Wake Lock - Zapobieganie wygaszaniu ekranu

## 🎯 Cel

Zapobieganie wygaszaniu ekranu podczas:
- Treningów (workout)
- Nauki ze słuchu (listening)

## 🔧 Implementacja

### Podstawowe Wake Lock API

Aplikacja używa **Screen Wake Lock API** do zapobiegania wygaszaniu ekranu:

```javascript
// Dodaj referencję (aktywuj blokadę)
await window.wakeLockManager.addReference('workout');

// Usuń referencję (zwolnij blokadę)
await window.wakeLockManager.removeReference('workout');
```

### System referencji

Blokada jest aktywna dopóki **przynajmniej jedna aktywność** jej potrzebuje:
- `'workout'` - trening aktywny
- `'listening'` - odtwarzacz słuchania aktywny

### Pliki

- **`js/wake-lock.js`** - Centralny moduł Wake Lock Manager
- **`js/ui-state.js`** - Integracja dla listening (linie 75-85)
- **`js/workout-engine.js`** - Integracja dla treningów (linie 438-452)

## ⚠️ Ograniczenia

**Wake Lock API nie zawsze działa na urządzeniach mobilnych**, szczególnie:
- Android z Web Speech API (TTS)
- Podczas pauz między tekstami
- W trybie oszczędzania baterii

## ✅ Rozwiązanie dla użytkownika

**Najlepsze rozwiązanie: Zmień ustawienia telefonu**

### 📱 Android
```
Ustawienia → Wyświetlacz → Wygaszanie ekranu → 10 minut
```

### 🍎 iOS
```
Ustawienia → Ekran i jasność → Autoblokada → Nigdy
```

## 💡 Wskazówka w aplikacji

Aplikacja wyświetla pomocny komunikat w odtwarzaczu słuchania (`index.html`, linie 549-578):
- Instrukcje dla Android
- Instrukcje dla iOS
- Możliwość ukrycia komunikatu ("nie pokazuj więcej")

## 🐛 Debugowanie

### Sprawdź czy Wake Lock jest aktywny

```javascript
// W konsoli przeglądarki
window.wakeLockManager.getActiveSources()
// ['workout'] lub ['listening']

window.wakeLockManager.getReferenceCount()
// 1 lub więcej

window.wakeLockManager.isSupported()
// true lub false
```

### Typowe problemy

**Problem:** Ekran gaśnie mimo Wake Lock  
**Rozwiązanie:** Zmień ustawienia telefonu (patrz wyżej)

**Problem:** Wake Lock API not supported  
**Rozwiązanie:** Starsza przeglądarka - zmień ustawienia telefonu

## 📚 Dokumentacja

- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock)

## 🎯 Podsumowanie

1. ✅ Wake Lock API jest zaimplementowane
2. ⚠️ Nie zawsze działa na mobile (szczególnie Android + TTS)
3. ✅ Aplikacja pokazuje użytkownikowi jak zmienić ustawienia telefonu
4. ✅ To najprostsze i najbardziej niezawodne rozwiązanie

---

**Ostatnia aktualizacja:** 2025-11-01  
**Wersja:** 3.0 (Uproszczone - bez hacków)

