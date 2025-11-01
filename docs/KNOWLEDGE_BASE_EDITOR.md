# Baza Wiedzy - Edytor (Quill.js)

## 📋 Spis treści
1. [Przegląd](#przegląd)
2. [Quill.js Editor](#quilljs-editor)
3. [Upload obrazków](#upload-obrazków)
4. [Embed video](#embed-video)
5. [Sanityzacja HTML](#sanityzacja-html)
6. [API Reference](#api-reference)

---

## Przegląd

Edytor Bazy Wiedzy wykorzystuje **Quill.js** - nowoczesny WYSIWYG editor z pełnym wsparciem dla:
- Formatowania tekstu (bold, italic, underline)
- Nagłówków (H1, H2, H3)
- List (uporządkowane i nieuporządkowane)
- Linków
- Obrazków (z uploadem do Supabase Storage)
- Video (YouTube/Vimeo embed)

---

## Quill.js Editor

### Inicjalizacja

Edytor jest automatycznie inicjalizowany przy starcie aplikacji (jeśli feature flag `ENABLE_KNOWLEDGE_BASE` jest włączony):

```javascript
// W app.js
if (featureFlags.isKnowledgeBaseEnabled()) {
  const quill = knowledgeBaseEngine.initEditor('#kb-editor-quill');
  window.knowledgeBaseQuillEditor = quill;
}
```

### Toolbar

Domyślny toolbar zawiera:

```javascript
toolbar: {
  container: [
    [{ 'header': [1, 2, 3, false] }],      // Nagłówki H1, H2, H3
    ['bold', 'italic', 'underline'],       // Formatowanie tekstu
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Listy
    ['link', 'image', 'video'],            // Media
    ['emoji'],                              // 😀 Emoji picker (NEW!)
    ['clean']                               // Usuń formatowanie
  ]
}
```

### 📌 Sticky Toolbar (UX Enhancement)

**Problem:** Gdy artykuł ma wiele linii, pasek narzędzi oddala się od miejsca edycji.

**Rozwiązanie:** Toolbar jest **przypięty na górze ekranu** podczas przewijania (sticky positioning).

**Funkcje:**
- ✅ Toolbar pozostaje widoczny podczas przewijania
- ✅ Smooth transition i shadow effect przy przewijaniu
- ✅ Responsywne na wszystkich urządzeniach
- ✅ Automatyczna detekcja za pomocą Intersection Observer

**Implementacja:**

```css
/* CSS - Sticky positioning */
.ql-toolbar {
    position: sticky;
    top: 0;
    z-index: 100;
    transition: box-shadow 0.3s ease;
}

/* Shadow effect gdy toolbar jest przypięty */
.ql-toolbar.is-stuck {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}
```

```javascript
// JavaScript - Automatyczna detekcja
knowledgeBaseEngine.setupStickyToolbar(quill);
```

**Jak to działa:**
1. Toolbar ma `position: sticky` w CSS
2. Intersection Observer monitoruje pozycję toolbara
3. Gdy toolbar "przykleja się" do góry, dodawana jest klasa `is-stuck`
4. Klasa `is-stuck` dodaje efekt cienia dla lepszej widoczności

### Dostęp do edytora

```javascript
const quill = window.knowledgeBaseQuillEditor;

// Pobierz treść HTML
const html = quill.root.innerHTML;

// Ustaw treść HTML
quill.root.innerHTML = '<p>Hello world</p>';

// Pobierz zaznaczenie
const range = quill.getSelection();

// Wstaw tekst
quill.insertText(range.index, 'Hello');

// Wstaw embed (obrazek, video)
quill.insertEmbed(range.index, 'image', 'https://example.com/image.jpg');
```

---

## 😀 Emoji Picker

### Jak to działa?

1. **Użytkownik klika ikonę emoji** (😀) w toolbarze
2. **Otwiera się popup z emoji picker**
3. **Emoji są pogrupowane po kategoriach** (Emocje, Gesty, Sport, Jedzenie, Zwierzęta, Natura, Obiekty, Symbole)
4. **Użytkownik klika wybrany emoji**
5. **Emoji jest wstawiany** w miejscu kursora

### Kategorie emoji

Emoji picker zawiera **ponad 1000 emoji** w 8 kategoriach:

- **Emocje** - 😀 😃 😄 😁 😅 😂 🤣 😊 😍 🥰 😘 😋 😎 🤩 🥳 😏 😢 😭 😤 😠 😡 🤯 😱 😨 😰 ...
- **Gesty** - 👍 👎 👊 ✊ 🤞 ✌️ 🤟 🤘 👌 👈 👉 👆 👇 👋 👏 🙌 🤝 🙏 ...
- **Sport** - ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🥊 🥋 🛹 ⛸️ 🎿 🏂 🏋️ 🤸 🏊 🚴 🚵 ...
- **Jedzenie** - 🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🥦 🥐 🍞 🧀 🥚 🍳 🥓 🥩 🍗 🍔 🍟 🍕 🥪 🌮 🌯 🍝 🍜 🍲 🍛 🍣 🍱 🍰 🎂 🍮 🍭 🍬 🍫 🍩 🍪 ...
- **Zwierzęta** - 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐴 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🦎 🐙 🦑 🦐 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐘 🦛 🦏 🦒 🦘 🐕 🐩 🐈 🦜 🦩 🐇 🦔 ...
- **Natura** - 🌸 🌺 🌻 🌷 🌹 💐 🌾 🌱 🌿 ☘️ 🍀 🍁 🍂 🍃 🌵 🌴 🌳 🌲 ⛰️ 🏔️ 🌋 🏖️ 🏝️ 🌅 🌄 🌠 🌌 🌈 ☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌬️ 💨 🌪️ 🌫️ 💧 💦 🌊 ...
- **Obiekty** - 💻 ⌨️ 🖥️ 🖨️ 🖱️ 📱 📞 ☎️ 📺 📻 📷 📸 📹 🎥 🎬 📽️ 🎞️ 📡 🔋 🔌 💡 🔦 🕯️ 💰 💳 💎 🔧 🔨 🛠️ ⚙️ 🔪 🗡️ ⚔️ 🛡️ 🔮 💊 💉 🧬 🔬 🔭 🚪 🪑 🛋️ 🛏️ 🖼️ 🎁 🎈 🎀 🎊 🎉 📦 📧 📨 📩 💌 📪 📫 📬 📭 📮 📜 📃 📄 📑 📊 📈 📉 📋 📁 📂 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 📎 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓 ...
- **Symbole** - ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 💕 💞 💓 💗 💖 💘 💝 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ ☯️ ⚛️ ✅ ❌ ⭕ 🛑 ⛔ 🚫 💯 ❗ ❓ ⚠️ ♻️ 🔱 ⚜️ 🔰 💠 🌐 ℹ️ 🆗 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾️ 💲 ™️ ©️ ®️ ✔️ ☑️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 ...

### UX Features

- ✅ **Popup z animacją** - smooth fade-in effect
- ✅ **Kategorie** - emoji pogrupowane tematycznie
- ✅ **Hover effect** - emoji powiększa się przy najechaniu
- ✅ **Scroll** - custom scrollbar w dark theme
- ✅ **Click outside to close** - automatyczne zamykanie
- ✅ **Responsywny** - działa na desktop i mobile

### Kod

```javascript
// W knowledge-base-engine.js
handleEmojiPicker(quill) {
    const range = quill.getSelection(true);
    const emojiPopup = this.createEmojiPickerPopup();
    
    // Position popup
    const toolbar = quill.container.previousSibling;
    const toolbarRect = toolbar.getBoundingClientRect();
    emojiPopup.style.position = 'absolute';
    emojiPopup.style.top = `${toolbarRect.bottom + window.scrollY}px`;
    emojiPopup.style.left = `${toolbarRect.left + window.scrollX}px`;
    
    document.body.appendChild(emojiPopup);
    
    // Handle emoji selection
    emojiPopup.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            const emoji = e.target.textContent;
            quill.insertText(range.index, emoji);
            quill.setSelection(range.index + emoji.length);
            document.body.removeChild(emojiPopup);
        }
    });
}
```

### Custom handler w Quill

```javascript
const toolbar = quill.getModule('toolbar');
toolbar.addHandler('emoji', () => {
    knowledgeBaseEngine.handleEmojiPicker(quill);
});
```

---

## Upload obrazków

### Jak to działa?

1. **Użytkownik klika ikonę obrazka** w toolbarze
2. **Otwiera się dialog wyboru pliku**
3. **Plik jest walidowany** (typ, rozmiar)
4. **Upload do Supabase Storage** (`knowledge-base-images` bucket)
5. **Obrazek jest wstawiany** do edytora z publicznym URL

### Walidacja

- **Dozwolone typy:** JPG, PNG, GIF, WEBP
- **Maksymalny rozmiar:** 5MB
- **Nazwa pliku:** `{timestamp}-{random}.{ext}` (unikalna)

### Kod

```javascript
// W knowledge-base-engine.js
async uploadImage(file) {
  // 1. Walidacja typu
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Nieprawidłowy typ pliku');
  }
  
  // 2. Walidacja rozmiaru (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Plik jest za duży');
  }
  
  // 3. Generuj unikalną nazwę
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  
  // 4. Upload do Supabase Storage
  const { data, error } = await supabaseClient.storage
    .from('knowledge-base-images')
    .upload(filename, file);
  
  // 5. Pobierz publiczny URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('knowledge-base-images')
    .getPublicUrl(filename);
  
  return publicUrl;
}
```

### Custom handler w Quill

```javascript
const toolbar = quill.getModule('toolbar');
toolbar.addHandler('image', async () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  
  input.onchange = async () => {
    const file = input.files[0];
    const url = await knowledgeBaseEngine.uploadImage(file);
    
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image', url);
  };
});
```

### Supabase Storage - RLS Policies

```sql
-- Admini mogą uploadować obrazki
CREATE POLICY "kb_images_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base-images' AND
  auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = TRUE)
);

-- Wszyscy mogą czytać obrazki
CREATE POLICY "kb_images_select_all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'knowledge-base-images');
```

---

## Embed video

### Obsługiwane platformy

- **YouTube** (youtube.com, youtu.be)
- **Vimeo** (vimeo.com)

### Jak to działa?

1. **Użytkownik klika ikonę video** w toolbarze
2. **Prompt z prośbą o URL**
3. **Ekstrakcja video ID** z URL (regex)
4. **Wstawienie iframe** do edytora

### Kod

```javascript
// Ekstrakcja video info
extractVideoInfo(url) {
  // YouTube regex
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  
  if (youtubeMatch && youtubeMatch[1]) {
    return { platform: 'youtube', id: youtubeMatch[1] };
  }
  
  // Vimeo regex
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = url.match(vimeoRegex);
  
  if (vimeoMatch && vimeoMatch[3]) {
    return { platform: 'vimeo', id: vimeoMatch[3] };
  }
  
  return { platform: null, id: null };
}

// Custom handler w Quill
toolbar.addHandler('video', () => {
  const url = prompt('Wklej link do video (YouTube lub Vimeo):');
  const videoInfo = knowledgeBaseEngine.extractVideoInfo(url);
  
  if (videoInfo.platform === 'youtube') {
    quill.insertEmbed(range.index, 'video', `https://www.youtube.com/embed/${videoInfo.id}`);
  } else if (videoInfo.platform === 'vimeo') {
    quill.insertEmbed(range.index, 'video', `https://player.vimeo.com/video/${videoInfo.id}`);
  }
});
```

### Przykłady URL

**YouTube:**
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`

**Vimeo:**
- `https://vimeo.com/123456789`
- `https://vimeo.com/channels/staffpicks/123456789`

### HTML Output

```html
<!-- YouTube -->
<iframe 
  class="ql-video" 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0"
  allowfullscreen>
</iframe>

<!-- Vimeo -->
<iframe 
  class="ql-video" 
  src="https://player.vimeo.com/video/123456789"
  frameborder="0"
  allowfullscreen>
</iframe>
```

---

## Sanityzacja HTML

### Dlaczego?

Treść HTML z edytora może zawierać potencjalnie niebezpieczny kod (XSS):
- Tagi `<script>`
- Event handlery (`onclick`, `onerror`, etc.)
- `javascript:` w linkach

### Implementacja

```javascript
sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 1. Usuń tagi <script>
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // 2. Usuń event handlery (on*)
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
    
    // 3. Usuń javascript: w href
    if (el.hasAttribute('href')) {
      const href = el.getAttribute('href');
      if (href && href.toLowerCase().startsWith('javascript:')) {
        el.removeAttribute('href');
      }
    }
  });
  
  return temp.innerHTML;
}
```

### Użycie

```javascript
// Przed zapisem do bazy
const rawHTML = quill.root.innerHTML;
const safeHTML = knowledgeBaseEngine.sanitizeHTML(rawHTML);

await dataService.createKnowledgeBaseArticle({
  title: 'My Article',
  content: safeHTML  // ✅ Bezpieczny HTML
});
```

### Uwaga: DOMPurify

Dla produkcji zalecane jest użycie biblioteki **DOMPurify**:

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

```javascript
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'iframe'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style']
});
```

---

## API Reference

### `knowledgeBaseEngine.initEditor(container, options)`

Inicjalizuje Quill.js editor z automatycznym sticky toolbar.

**Parametry:**
- `container` (string|HTMLElement) - Kontener dla edytora
- `options` (Object, opcjonalny) - Opcje Quill

**Zwraca:** `Object|null` - Instancja Quill lub null

**Funkcje:**
- Inicjalizuje Quill.js z domyślnym toolbarem
- Dodaje custom handlery dla obrazków i video
- **Automatycznie konfiguruje sticky toolbar** (nowa funkcja!)

**Przykład:**
```javascript
const quill = knowledgeBaseEngine.initEditor('#editor', {
  theme: 'snow',
  placeholder: 'Napisz coś...'
});
// Sticky toolbar jest automatycznie skonfigurowany!
```

---

### `knowledgeBaseEngine.setupStickyToolbar(quill)`

Konfiguruje sticky toolbar z shadow effect.

**Parametry:**
- `quill` (Object) - Instancja Quill

**Zwraca:** `void`

**Funkcje:**
- Dodaje Intersection Observer do monitorowania pozycji toolbara
- Automatycznie dodaje/usuwa klasę `is-stuck`
- Tworzy sentinel element do detekcji

**Przykład:**
```javascript
// Wywoływane automatycznie przez initEditor()
// Ale można wywołać ręcznie jeśli potrzeba:
knowledgeBaseEngine.setupStickyToolbar(quill);
```

**Uwaga:** Ta metoda jest wywoływana automatycznie przez `initEditor()`, nie ma potrzeby wywoływać jej ręcznie.

---

### `knowledgeBaseEngine.handleEmojiPicker(quill)`

Otwiera emoji picker popup.

**Parametry:**
- `quill` (Object) - Instancja Quill

**Zwraca:** `void`

**Funkcje:**
- Tworzy popup z emoji picker
- Pozycjonuje popup pod toolbarem
- Obsługuje wybór emoji
- Automatycznie zamyka popup po wyborze lub kliknięciu poza

**Przykład:**
```javascript
// Wywoływane automatycznie przez toolbar handler
// Ale można wywołać ręcznie:
knowledgeBaseEngine.handleEmojiPicker(quill);
```

---

### `knowledgeBaseEngine.createEmojiPickerPopup()`

Tworzy element HTML emoji picker popup.

**Parametry:** brak

**Zwraca:** `HTMLElement` - Popup element

**Funkcje:**
- Tworzy popup z 8 kategoriami emoji
- Ponad 1000 emoji do wyboru
- Custom styling (dark theme)
- Responsywny grid layout

**Przykład:**
```javascript
const popup = knowledgeBaseEngine.createEmojiPickerPopup();
document.body.appendChild(popup);
```

---

### `knowledgeBaseEngine.uploadImage(file)`

Uploaduje obrazek do Supabase Storage.

**Parametry:**
- `file` (File) - Plik obrazka

**Zwraca:** `Promise<string>` - Publiczny URL obrazka

**Błędy:**
- `'Nieprawidłowy typ pliku'` - Nieobsługiwany format
- `'Plik jest za duży'` - Przekroczono 5MB

**Przykład:**
```javascript
const url = await knowledgeBaseEngine.uploadImage(file);
console.log('Image URL:', url);
```

---

### `knowledgeBaseEngine.embedVideo(url)`

Generuje HTML embed dla video.

**Parametry:**
- `url` (string) - URL video (YouTube/Vimeo)

**Zwraca:** `string|null` - HTML embed lub null

**Przykład:**
```javascript
const embed = knowledgeBaseEngine.embedVideo('https://youtube.com/watch?v=...');
// => '<div class="video-embed">...</div>'
```

---

### `knowledgeBaseEngine.extractVideoInfo(url)`

Ekstrahuje informacje o video z URL.

**Parametry:**
- `url` (string) - URL video

**Zwraca:** `{platform: string|null, id: string|null}`

**Przykład:**
```javascript
const info = knowledgeBaseEngine.extractVideoInfo('https://youtube.com/watch?v=dQw4w9WgXcQ');
// => { platform: 'youtube', id: 'dQw4w9WgXcQ' }
```

---

### `knowledgeBaseEngine.sanitizeHTML(html)`

Sanityzuje HTML (usuwa niebezpieczny kod).

**Parametry:**
- `html` (string) - HTML do sanityzacji

**Zwraca:** `string` - Bezpieczny HTML

**Przykład:**
```javascript
const safe = knowledgeBaseEngine.sanitizeHTML('<p onclick="alert()">Hello</p>');
// => '<p>Hello</p>'
```

---

### `knowledgeBaseEngine.generateSlug(title)`

Generuje URL-friendly slug z tytułu.

**Parametry:**
- `title` (string) - Tytuł artykułu

**Zwraca:** `string` - Slug

**Przykład:**
```javascript
const slug = knowledgeBaseEngine.generateSlug('Jak zacząć trening?');
// => 'jak-zaczac-trening'
```

---

### `knowledgeBaseEngine.parseTags(tagsString)`

Parsuje tagi z ciągu znaków do tablicy.

**Parametry:**
- `tagsString` (string) - Tagi oddzielone przecinkami

**Zwraca:** `string[]` - Tablica tagów

**Przykład:**
```javascript
const tags = knowledgeBaseEngine.parseTags('trening, fitness, siła');
// => ['trening', 'fitness', 'siła']
```

---

### `knowledgeBaseEngine.formatTags(tagsArray)`

Formatuje tablicę tagów do ciągu znaków.

**Parametry:**
- `tagsArray` (string[]) - Tablica tagów

**Zwraca:** `string` - Tagi oddzielone przecinkami

**Przykład:**
```javascript
const str = knowledgeBaseEngine.formatTags(['trening', 'fitness']);
// => 'trening, fitness'
```

---

### `knowledgeBaseEngine.validateArticle(article)`

Waliduje dane artykułu przed zapisem.

**Parametry:**
- `article` (KnowledgeBaseArticleInput) - Dane artykułu

**Zwraca:** `{valid: boolean, errors: string[]}`

**Przykład:**
```javascript
const result = knowledgeBaseEngine.validateArticle({
  title: 'My Article',
  slug: 'my-article',
  content: '<p>Content</p>'
});

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

---

## 🎯 Podsumowanie

### ✅ Co zostało zaimplementowane:

1. **Quill.js Editor** z pełnym toolbarem
2. **📌 Sticky Toolbar** - przypięty pasek narzędzi (UX enhancement)
3. **😀 Emoji Picker** - ponad 1000 emoji w 8 kategoriach (NEW!)
4. **Upload obrazków** do Supabase Storage
5. **Embed video** (YouTube/Vimeo)
6. **Sanityzacja HTML** (usuwanie XSS)
7. **Walidacja danych** artykułu
8. **Generowanie slug** z polskimi znakami
9. **Parsowanie tagów**

### 🔒 Bezpieczeństwo:

- ✅ Walidacja typu i rozmiaru plików
- ✅ Unikalne nazwy plików
- ✅ RLS policies w Supabase Storage
- ✅ Sanityzacja HTML przed zapisem
- ✅ Tylko admini mogą uploadować

### 📚 Dokumentacja:

- ✅ API Reference
- ✅ Przykłady kodu
- ✅ Instrukcje użycia

---

## 🆕 Changelog

### 2025-11-01 (v2)
- ✅ **😀 Emoji Picker** - Dodano narzędzie do wstawiania emoji
- ✅ **1000+ emoji** - 8 kategorii (Emocje, Gesty, Sport, Jedzenie, Zwierzęta, Natura, Obiekty, Symbole)
- ✅ **Popup z animacją** - Smooth fade-in effect, hover animations
- ✅ **Custom button** - Przycisk emoji (😀) w toolbarze
- ✅ **Click outside to close** - Automatyczne zamykanie popup

### 2025-11-01 (v1)
- ✅ **Sticky Toolbar** - Dodano przypięty pasek narzędzi z shadow effect
- ✅ **UX Enhancement** - Toolbar pozostaje widoczny podczas przewijania długich artykułów
- ✅ **Intersection Observer** - Automatyczna detekcja pozycji toolbara
- ✅ **Responsywność** - Działa na wszystkich urządzeniach (mobile, tablet, desktop)

### 2025-10-30
- ✅ Inicjalna implementacja Quill.js
- ✅ Upload obrazków do Supabase Storage
- ✅ Embed video (YouTube/Vimeo)
- ✅ Sanityzacja HTML

---

**Ostatnia aktualizacja:** 2025-11-01

