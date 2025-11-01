# Android Settings Shortcut - Skrót do Ustawień Androida

## 📱 Przegląd

Funkcjonalność pozwalająca użytkownikom urządzeń Android na bezpośrednie otwarcie ustawień systemowych (Wyświetlacz/Wygaszanie ekranu) z poziomu aplikacji **eTrener**.

## 🎯 Problem

Wake Lock API nie zawsze działa poprawnie na urządzeniach mobilnych, szczególnie podczas używania Web Speech API (TTS). Użytkownicy musieli ręcznie nawigować do ustawień systemowych, aby zmienić czas wygaszania ekranu.

## ✅ Rozwiązanie

Dodano przycisk **"Otwórz ustawienia"** w wskazówkach o wygaszaniu ekranu, który:
- Wykrywa czy użytkownik używa urządzenia Android
- Otwiera bezpośrednio ustawienia wyświetlacza Androida za pomocą Intent URL
- Wyświetla komunikat jeśli urządzenie nie jest Androidem

## 📍 Lokalizacja

### 1. **Ekran Listening (Słuchanie)**
Wskazówka pojawia się w odtwarzaczu zestawów językowych:
- Lokalizacja: `index.html` → `#listening-player` → `#screen-timeout-tip`
- Przycisk: `#open-android-settings-listening`

### 2. **Ekran Workout (Trening)**
Wskazówka pojawia się podczas aktywnego treningu:
- Lokalizacja: `index.html` → `#workout-screen` → `#workout-screen-timeout-tip`
- Przycisk: `#open-android-settings-workout`

## 🔧 Implementacja

### Wake Lock Manager (`js/wake-lock.js`)

Dodano nową metodę `openAndroidDisplaySettings()`:

```javascript
/**
 * Otwiera ustawienia systemowe Androida (wyświetlacz/wygaszanie ekranu)
 * @returns {boolean} - true jeśli udało się otworzyć, false w przeciwnym razie
 */
function openAndroidDisplaySettings() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (!isAndroid) {
    console.log('⚠️ Not an Android device');
    return false;
  }

  try {
    const intentUrl = 'intent://settings/display#Intent;scheme=android.settings;end';
    window.location.href = intentUrl;
    console.log('✅ Opening Android display settings');
    return true;
  } catch (err) {
    console.error('❌ Failed to open Android settings:', err);
    return false;
  }
}
```

### Event Listeners

#### Listening Engine (`js/listening-engine.js`)

```javascript
function setupScreenTipListeners() {
  // ... existing code ...
  
  const openSettingsBtn = document.getElementById('open-android-settings-listening');
  openSettingsBtn?.addEventListener('click', () => {
    if (window.wakeLockManager && window.wakeLockManager.openAndroidDisplaySettings) {
      const success = window.wakeLockManager.openAndroidDisplaySettings();
      if (!success) {
        alert('Ta funkcja działa tylko na urządzeniach Android.');
      }
    }
  });
}
```

#### Workout Engine (`js/workout-engine.js`)

```javascript
function setupWorkoutScreenTipListeners() {
  // ... existing code ...
  
  const openSettingsBtn = document.getElementById('open-android-settings-workout');
  openSettingsBtn?.addEventListener('click', () => {
    if (window.wakeLockManager && window.wakeLockManager.openAndroidDisplaySettings) {
      const success = window.wakeLockManager.openAndroidDisplaySettings();
      if (!success) {
        alert('Ta funkcja działa tylko na urządzeniach Android.');
      }
    }
  });
}
```

## 🎨 UI/UX

### Wygląd Przycisku

Przycisk jest stylizowany w kolorze pomarańczowym (pasującym do wskazówki):
- Kolor tła: `bg-orange-600` → `hover:bg-orange-700`
- Ikona: SVG koło zębate (settings icon)
- Tekst: "Otwórz ustawienia"
- Pełna szerokość kontenera
- Responsywny design

### Przykład HTML (Listening)

```html
<button id="open-android-settings-listening" 
        class="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 rounded transition flex items-center justify-center gap-2">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- Settings icon -->
  </svg>
  <span>Otwórz ustawienia</span>
</button>
```

## 📱 Jak Działa Intent URL

### Format Intent URL

```
intent://settings/display#Intent;scheme=android.settings;end
```

### Komponenty:
- `intent://` - protokół Intent
- `settings/display` - ścieżka do ustawień wyświetlacza
- `#Intent;scheme=android.settings;end` - parametry Intent

### Alternatywne Opcje:

```javascript
// Ustawienia wyświetlacza (używane)
'intent://settings/display#Intent;scheme=android.settings;end'

// Główne ustawienia
'intent://settings#Intent;scheme=android.settings;end'

// Ustawienia aplikacji
'intent://settings/application_details#Intent;scheme=android.settings;end'
```

## 🔒 Bezpieczeństwo

- **Wykrywanie platformy**: Funkcja sprawdza User Agent przed próbą otwarcia
- **Obsługa błędów**: Try-catch zapobiega crashom aplikacji
- **Feedback użytkownika**: Alert informuje o braku wsparcia na innych platformach
- **Brak dostępu do danych**: Intent URL nie ma dostępu do danych aplikacji

## 💾 LocalStorage

Każdy ekran ma osobny klucz w localStorage dla ukrywania wskazówki:

### Listening
- Klucz: `screenTipDismissed`
- Wartość: `'true'` gdy użytkownik kliknie "Rozumiem, nie pokazuj więcej"

### Workout
- Klucz: `workoutScreenTipDismissed`
- Wartość: `'true'` gdy użytkownik kliknie "Rozumiem, nie pokazuj więcej"

## 🧪 Testowanie

### Test na Androidzie:
1. Otwórz aplikację na urządzeniu Android
2. Przejdź do ekranu Listening lub Workout
3. Kliknij przycisk "Otwórz ustawienia"
4. Sprawdź czy otwierają się ustawienia wyświetlacza

### Test na iOS/Desktop:
1. Otwórz aplikację na urządzeniu iOS lub komputerze
2. Przejdź do ekranu Listening lub Workout
3. Kliknij przycisk "Otwórz ustawienia"
4. Sprawdź czy pojawia się alert: "Ta funkcja działa tylko na urządzeniach Android."

### Test Konsoli:
```javascript
// W konsoli przeglądarki:
wakeLockManager.openAndroidDisplaySettings();
// Powinno zwrócić true na Androidzie, false na innych platformach
```

## 📊 Kompatybilność

### ✅ Wspierane:
- Android 4.4+ (wszystkie przeglądarki obsługujące Intent URLs)
- Chrome Mobile
- Firefox Mobile
- Samsung Internet
- Edge Mobile

### ❌ Niewspierane:
- iOS (brak wsparcia dla Intent URLs)
- Desktop (nie dotyczy)
- Starsze wersje Android WebView

## 🔄 Przepływ Użytkownika

```
1. Użytkownik rozpoczyna Listening/Workout
   ↓
2. Pojawia się wskazówka o wygaszaniu ekranu
   ↓
3. Użytkownik widzi przycisk "Otwórz ustawienia" (tylko Android)
   ↓
4. Kliknięcie przycisku
   ↓
5a. Android: Otwierają się ustawienia wyświetlacza
5b. iOS/Desktop: Alert "Ta funkcja działa tylko na urządzeniach Android"
   ↓
6. Użytkownik zmienia czas wygaszania ekranu
   ↓
7. Powrót do aplikacji (przycisk wstecz w systemie)
```

## 📝 Notatki Deweloperskie

### Dlaczego Intent URL?
- **Natywna integracja**: Wykorzystuje mechanizm systemowy Androida
- **Brak uprawnień**: Nie wymaga dodatkowych uprawnień aplikacji
- **Uniwersalność**: Działa we wszystkich przeglądarkach mobilnych na Androidzie
- **Prostota**: Nie wymaga natywnego kodu (Cordova/Capacitor)

### Ograniczenia:
- Nie działa na iOS (brak odpowiednika Intent URL)
- Wymaga przeglądarki obsługującej Intent URLs
- Użytkownik musi ręcznie wrócić do aplikacji

### Przyszłe Ulepszenia:
- [ ] Deep linking do konkretnej opcji "Wygaszanie ekranu"
- [ ] Wykrywanie czy użytkownik zmienił ustawienia
- [ ] Wsparcie dla iOS (link do instrukcji wideo?)
- [ ] Analityka: tracking ile użytkowników korzysta z przycisku

## 🔗 Powiązane Pliki

- `/js/wake-lock.js` - Główna logika
- `/js/listening-engine.js` - Integracja dla Listening
- `/js/workout-engine.js` - Integracja dla Workout
- `/index.html` - UI przycisków
- `/docs/WAKE_LOCK.md` - Dokumentacja Wake Lock API

## 📚 Referencje

- [Android Intent URLs](https://developer.chrome.com/docs/multidevice/android/intents/)
- [Android Settings Actions](https://developer.android.com/reference/android/provider/Settings)
- [Web Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

---

**Ostatnia aktualizacja**: 2025-11-01  
**Wersja**: 1.0  
**Autor**: eTrener Team

