# Baza Wiedzy - Wsparcie dla plików audio

## 📋 Przegląd

Moduł Bazy Wiedzy obsługuje teraz **osadzanie plików audio** w artykułach. Administratorzy mogą uploadować pliki audio (MP3, OGG, WAV, M4A, AAC, FLAC) i wstawiać odtwarzacze HTML5 bezpośrednio w treści artykułów.

### ✨ Główne funkcje

- ✅ Upload plików audio do Supabase Storage (max 20MB)
- ✅ HTML5 audio player z pełnymi kontrolkami
- ✅ Media Session API - kontrolki na lockscreen i w powiadomieniach (mobile)
- ✅ Wake Lock API - ekran nie gaśnie podczas odtwarzania
- ✅ Obsługa wielu formatów audio
- ✅ Direct upload (omija limit Vercel 5MB)
- ✅ Responsywny design (Tailwind CSS)

---

## 🎵 Obsługiwane formaty audio

| Format | MIME Type | Rozszerzenie | Wsparcie przeglądarek |
|--------|-----------|--------------|----------------------|
| MP3 | `audio/mpeg`, `audio/mp3` | `.mp3` | ✅ Wszystkie |
| OGG Vorbis | `audio/ogg` | `.ogg` | ✅ Chrome, Firefox, Opera |
| WAV | `audio/wav`, `audio/wave`, `audio/x-wav` | `.wav` | ✅ Wszystkie |
| M4A/AAC | `audio/mp4`, `audio/x-m4a`, `audio/aac` | `.m4a`, `.aac` | ✅ Safari, Chrome, Edge |
| FLAC | `audio/flac`, `audio/x-flac` | `.flac` | ✅ Chrome, Firefox, Edge |

**Rekomendacja:** Używaj **MP3** dla maksymalnej kompatybilności.

---

## 📦 Architektura

### 1. Supabase Storage

#### Bucket: `knowledge-base-audio`

```sql
-- Publiczny bucket dla plików audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'knowledge-base-audio',
    'knowledge-base-audio',
    true,
    20971520,  -- 20MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', ...]
);
```

#### RLS Policies

```sql
-- Wszyscy mogą pobierać (publiczny dostęp)
CREATE POLICY "Public read access for KB audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base-audio');

-- Tylko admini mogą uploadować
CREATE POLICY "Admin can upload KB audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base-audio' AND
  auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = TRUE)
);

-- Tylko admini mogą usuwać
CREATE POLICY "Admin can delete KB audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base-audio' AND
  auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = TRUE)
);
```

### 2. Direct Upload (omija Vercel limit)

**Problem:** Vercel ma limit 5MB dla body request.

**Rozwiązanie:** Upload bezpośrednio z przeglądarki do Supabase Storage.

```
Browser → Supabase Storage ✅ (bez limitu Vercel!)
```

```javascript
// Frontend uploaduje bezpośrednio
const { error } = await supabaseClient.storage
  .from('knowledge-base-audio')
  .upload(filename, file);
```

### 3. Custom Quill Blot

Quill.js nie ma wbudowanego wsparcia dla audio, więc stworzyliśmy **custom Blot**:

```javascript
class AudioBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('controls', '');
    node.setAttribute('preload', 'metadata');
    node.setAttribute('class', 'w-full my-4 rounded-lg');
    
    const source = document.createElement('source');
    source.setAttribute('src', value.url);
    source.setAttribute('type', value.type);
    node.appendChild(source);
    
    return node;
  }
  
  static value(node) {
    const source = node.querySelector('source');
    return {
      url: source.getAttribute('src'),
      type: source.getAttribute('type')
    };
  }
}

AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'audio';

Quill.register(AudioBlot);
```

---

## 🔧 Implementacja

### Funkcje w `knowledge-base-engine.js`

#### 1. `uploadAudio(file)`

Uploaduje plik audio do Supabase Storage.

```javascript
/**
 * Upload audio file to Supabase Storage
 * @param {File} file - Audio file to upload
 * @returns {Promise<string>} Public URL of uploaded audio
 */
async uploadAudio(file) {
  // Walidacja typu
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', ...];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Nieprawidłowy typ pliku');
  }
  
  // Walidacja rozmiaru (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Plik jest za duży. Maksymalny rozmiar: 20MB');
  }
  
  // Generuj unikalną nazwę
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  
  // Upload do Supabase Storage (direct upload)
  const { error } = await supabaseClient.storage
    .from('knowledge-base-audio')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Pobierz publiczny URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('knowledge-base-audio')
    .getPublicUrl(filename);
  
  return publicUrl;
}
```

#### 2. `deleteAudio(url)`

Usuwa plik audio z Supabase Storage.

```javascript
/**
 * Delete audio from Supabase Storage
 * @param {string} url - Public URL of audio to delete
 */
async deleteAudio(url) {
  try {
    const filename = url.split('/').pop();
    const { error } = await supabaseClient.storage
      .from('knowledge-base-audio')
      .remove([filename]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting audio:', error);
    // Don't throw - deletion is not critical
  }
}
```

#### 3. `registerAudioBlot()`

Rejestruje custom Quill Blot dla audio.

```javascript
/**
 * Register custom Audio Blot for Quill.js
 */
registerAudioBlot() {
  const BlockEmbed = Quill.import('blots/block/embed');
  
  class AudioBlot extends BlockEmbed {
    static create(value) { ... }
    static value(node) { ... }
    static setupMediaSession(audioElement, url) { ... }
  }
  
  AudioBlot.blotName = 'audio';
  AudioBlot.tagName = 'audio';
  
  Quill.register(AudioBlot);
}
```

#### 4. `addAudioButton(quill)`

Dodaje przycisk 🎵 do Quill toolbar.

```javascript
/**
 * Add custom audio button to Quill toolbar
 * @param {Object} quill - Quill instance
 */
addAudioButton(quill) {
  const toolbar = quill.container.previousSibling;
  const cleanButton = toolbar.querySelector('.ql-clean');
  
  const audioButton = document.createElement('button');
  audioButton.type = 'button';
  audioButton.className = 'ql-audio';
  audioButton.title = 'Wstaw plik audio';
  audioButton.innerHTML = '🎵';
  
  audioButton.addEventListener('click', e => {
    e.preventDefault();
    this.handleAudioUpload(quill);
  });
  
  cleanButton.parentNode.insertBefore(audioButton, cleanButton);
}
```

#### 5. `handleAudioUpload(quill)`

Obsługuje upload i wstawianie audio do edytora.

```javascript
/**
 * Handle audio upload in Quill editor
 * @param {Object} quill - Quill instance
 */
async handleAudioUpload(quill) {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'audio/*');
  input.click();
  
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    
    try {
      // Show loading state
      const range = quill.getSelection(true);
      quill.insertText(range.index, 'Uploading audio...');
      
      // Upload audio
      const url = await this.uploadAudio(file);
      const mimeType = file.type || 'audio/mpeg';
      
      // Remove loading text and insert audio
      quill.deleteText(range.index, 18);
      quill.insertEmbed(range.index, 'audio', { url, type: mimeType });
      quill.setSelection(range.index + 1);
    } catch (error) {
      console.error('Błąd podczas uploadowania audio:', error);
      alert(`Błąd: ${error.message}`);
    }
  };
}
```

#### 6. `setupAudioWakeLock(quill)`

Aktywuje Wake Lock podczas odtwarzania audio.

```javascript
/**
 * Setup Wake Lock for audio playback in editor
 * @param {Object} quill - Quill instance
 */
setupAudioWakeLock(quill) {
  if (!window.wakeLockManager || !window.wakeLockManager.isSupported()) {
    console.warn('Wake Lock API not supported');
    return;
  }
  
  const editorElement = quill.root;
  
  editorElement.addEventListener('play', async e => {
    if (e.target.tagName === 'AUDIO') {
      await window.wakeLockManager.addReference('kb-audio');
    }
  }, true);
  
  editorElement.addEventListener('pause', async e => {
    if (e.target.tagName === 'AUDIO') {
      await window.wakeLockManager.removeReference('kb-audio');
    }
  }, true);
  
  editorElement.addEventListener('ended', async e => {
    if (e.target.tagName === 'AUDIO') {
      await window.wakeLockManager.removeReference('kb-audio');
    }
  }, true);
}
```

---

## 📱 Media Session API

**Media Session API** pozwala kontrolować odtwarzanie audio z poziomu systemu (lockscreen, powiadomienia, słuchawki Bluetooth).

### Implementacja w AudioBlot

```javascript
static setupMediaSession(audioElement, url) {
  if ('mediaSession' in navigator) {
    const filename = url.split('/').pop();
    
    // Ustaw metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: filename || 'Audio',
      artist: 'eTrener',
      album: 'Baza Wiedzy'
    });
    
    // Ustaw handlery akcji
    navigator.mediaSession.setActionHandler('play', () => {
      audioElement.play();
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audioElement.pause();
    });
    
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0);
    });
    
    navigator.mediaSession.setActionHandler('seekforward', () => {
      audioElement.currentTime = Math.min(
        audioElement.currentTime + 10,
        audioElement.duration
      );
    });
  }
}
```

### Wsparcie przeglądarek

| Przeglądarka | Wsparcie |
|--------------|----------|
| Chrome (Android) | ✅ Pełne |
| Chrome (Desktop) | ✅ Pełne |
| Safari (iOS) | ✅ Pełne |
| Firefox (Android) | ✅ Pełne |
| Edge | ✅ Pełne |

---

## 🔒 Wake Lock API

**Wake Lock API** zapobiega wygaszaniu ekranu podczas odtwarzania audio.

### Jak to działa?

1. **Play event** → Aktywuj Wake Lock
2. **Pause event** → Zwolnij Wake Lock
3. **Ended event** → Zwolnij Wake Lock

```javascript
// Aktywuj Wake Lock
await window.wakeLockManager.addReference('kb-audio');

// Zwolnij Wake Lock
await window.wakeLockManager.removeReference('kb-audio');
```

### Wsparcie przeglądarek

| Przeglądarka | Wsparcie |
|--------------|----------|
| Chrome (Android) | ✅ |
| Chrome (Desktop) | ✅ |
| Safari (iOS) | ⚠️ Ograniczone |
| Firefox (Android) | ⚠️ Ograniczone |
| Edge | ✅ |

**Uwaga:** Wake Lock może nie działać na wszystkich urządzeniach mobilnych. Użytkownicy mogą zmienić ustawienia telefonu (czas wygaszania ekranu) jako alternatywę.

---

## 🎨 Wygląd audio playera

### HTML wygenerowany przez Quill

```html
<audio controls preload="metadata" class="w-full my-4 rounded-lg">
  <source src="https://[PROJECT].supabase.co/storage/v1/object/public/knowledge-base-audio/123-abc.mp3" type="audio/mpeg">
  Twoja przeglądarka nie obsługuje odtwarzania audio.
</audio>
```

### Atrybuty

- `controls` - Wyświetla kontrolki (play, pause, volume, seek)
- `preload="metadata"` - Ładuje tylko metadata (nie cały plik)
- `class="w-full my-4 rounded-lg"` - Tailwind CSS (responsywny, zaokrąglone rogi)

### Responsywność

Player automatycznie dostosowuje się do szerokości kontenera dzięki `w-full` (width: 100%).

---

## 🧪 Testy

### Testy jednostkowe

**Plik:** `__tests__/knowledge-base-audio.test.js`

**Pokrycie:**
- ✅ Upload plików audio (wszystkie formaty)
- ✅ Walidacja typu pliku
- ✅ Walidacja rozmiaru (max 20MB)
- ✅ Obsługa błędów Supabase
- ✅ Usuwanie plików audio
- ✅ Generowanie unikalnych nazw plików

**Uruchomienie:**
```bash
npm test -- knowledge-base-audio.test.js
```

**Wynik:** 27/27 testów przechodzi ✅

### Testy integracyjne

**Plik:** `__tests__/integration/knowledge-base-audio.integration.test.js`

**Pokrycie:**
- ✅ Pełny workflow: upload → insert → playback → delete
- ✅ Wiele plików audio w jednym artykule
- ✅ Wake Lock integration
- ✅ Media Session API
- ✅ Obsługa błędów
- ✅ Wydajność (wiele playerów)
- ✅ Kompatybilność mobile

**Uruchomienie:**
```bash
npm test -- knowledge-base-audio.integration.test.js
```

**Wynik:** 18/18 testów przechodzi ✅

---

## 📝 Jak używać?

### 1. Uruchom migrację SQL

```bash
# W panelu Supabase: SQL Editor
# Wklej i uruchom: supabase/migration_audio_support.sql
```

### 2. Zaloguj się jako admin

```javascript
// W konsoli przeglądarki
sessionManager.isAdmin() // powinno zwrócić true
```

### 3. Przejdź do edytora Bazy Wiedzy

```
Aplikacja → Zakładka "📚 Wiedza" → "➕ Nowy artykuł"
```

### 4. Kliknij przycisk 🎵 w toolbarze

Toolbar Quill:
```
[H1 H2 H3] [B I U] [List] [Link Image 🎵 Video] [😀] [Clean]
                                        ↑ Nowy przycisk audio!
```

**Uwaga:** Przycisk audio ma ikonę SVG nutki i znajduje się między przyciskiem Image a Video.

### 5. Wybierz plik audio

- Kliknij przycisk 🎵
- Wybierz plik audio (MP3, OGG, WAV, M4A, AAC, FLAC)
- Max rozmiar: 20MB
- Poczekaj na upload (pojawi się "Uploading audio...")

### 6. Audio player zostanie wstawiony

```html
<audio controls preload="metadata" class="w-full my-4 rounded-lg">
  <source src="..." type="audio/mpeg">
</audio>
```

### 7. Zapisz artykuł

Kliknij **💾 Zapisz** - audio player zostanie zapisany w HTML artykułu.

---

## 🐛 Troubleshooting

### Problem: "Nieprawidłowy typ pliku"

**Przyczyna:** Plik nie jest w obsługiwanym formacie.

**Rozwiązanie:** Użyj MP3, OGG, WAV, M4A, AAC lub FLAC.

### Problem: "Plik jest za duży"

**Przyczyna:** Plik przekracza 20MB.

**Rozwiązanie:** Skompresuj plik audio lub użyj niższego bitrate.

### Problem: Audio nie odtwarza się

**Przyczyna:** Przeglądarka nie obsługuje formatu.

**Rozwiązanie:** Użyj MP3 (najlepsza kompatybilność).

### Problem: Ekran gaśnie podczas odtwarzania (mobile)

**Przyczyna:** Wake Lock API nie jest wspierane lub nie działa.

**Rozwiązanie:** Zmień ustawienia telefonu:
- **Android:** Ustawienia → Wyświetlacz → Wygaszanie ekranu → 10 minut
- **iOS:** Ustawienia → Ekran i jasność → Autoblokada → Nigdy

### Problem: Upload trwa bardzo długo

**Przyczyna:** Wolne połączenie internetowe lub duży plik.

**Rozwiązanie:**
- Użyj mniejszego pliku
- Skompresuj audio (niższy bitrate)
- Sprawdź połączenie internetowe

---

## 🔐 Bezpieczeństwo

### RLS Policies

- ✅ **Publiczny odczyt:** Wszyscy mogą pobierać pliki audio
- ✅ **Tylko admin upload:** Tylko administratorzy mogą uploadować
- ✅ **Tylko admin delete:** Tylko administratorzy mogą usuwać

### Walidacja

- ✅ Typ pliku (MIME type)
- ✅ Rozmiar pliku (max 20MB)
- ✅ Unikalne nazwy plików (timestamp + random)

### Sanityzacja

- ✅ HTML jest sanityzowany przez Quill.js
- ✅ URL są walidowane przez Supabase Storage

---

## 📊 Limity

| Limit | Wartość |
|-------|---------|
| Max rozmiar pliku | 20MB |
| Max liczba plików w artykule | Brak limitu |
| Dozwolone formaty | MP3, OGG, WAV, M4A, AAC, FLAC |
| Supabase Storage (Free) | 1GB |
| Supabase Storage (Pro) | 100GB |
| Supabase Bandwidth (Free) | 2GB/miesiąc |
| Supabase Bandwidth (Pro) | 200GB/miesiąc |

---

## 🚀 Przyszłe ulepszenia

### Możliwe rozszerzenia

- [ ] **Playlista:** Automatyczne odtwarzanie kolejnych plików audio
- [ ] **Transkrypcja:** Automatyczna transkrypcja audio → tekst (Whisper API)
- [ ] **Fale dźwiękowe:** Wizualizacja waveform
- [ ] **Znaczniki czasu:** Dodawanie zakładek w audio
- [ ] **Prędkość odtwarzania:** 0.5x, 1x, 1.5x, 2x
- [ ] **Pobieranie:** Przycisk download dla użytkowników
- [ ] **Kompresja:** Automatyczna kompresja dużych plików

---

## 📚 Powiązane dokumenty

- [KNOWLEDGE_BASE_FEATURE.md](./KNOWLEDGE_BASE_FEATURE.md) - Ogólna dokumentacja Bazy Wiedzy
- [KNOWLEDGE_BASE_EDITOR.md](./KNOWLEDGE_BASE_EDITOR.md) - Dokumentacja edytora Quill.js
- [KNOWLEDGE_BASE_QUICK_START.md](./KNOWLEDGE_BASE_QUICK_START.md) - Szybki start
- [WAKE_LOCK.md](./WAKE_LOCK.md) - Dokumentacja Wake Lock API
- [DB_SCHEMA.md](./DB_SCHEMA.md) - Schemat bazy danych

---

## 🎉 Podsumowanie

Moduł audio w Bazie Wiedzy oferuje:

✅ **Prosty upload** - Przeciągnij i upuść plik audio  
✅ **Direct upload** - Omija limit Vercel 5MB  
✅ **HTML5 player** - Standardowy, responsywny odtwarzacz  
✅ **Media Session API** - Kontrolki na lockscreen (mobile)  
✅ **Wake Lock API** - Ekran nie gaśnie podczas odtwarzania  
✅ **Wiele formatów** - MP3, OGG, WAV, M4A, AAC, FLAC  
✅ **Bezpieczny** - RLS policies, walidacja, sanityzacja  
✅ **Przetestowany** - 45 testów jednostkowych i integracyjnych  

**Gotowe do użycia!** 🚀

