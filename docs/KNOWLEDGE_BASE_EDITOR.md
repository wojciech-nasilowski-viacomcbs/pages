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
toolbar: [
  [{ 'header': [1, 2, 3, false] }],      // Nagłówki H1, H2, H3
  ['bold', 'italic', 'underline'],       // Formatowanie tekstu
  [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Listy
  ['link', 'image', 'video'],            // Media
  ['clean']                               // Usuń formatowanie
]
```

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

Inicjalizuje Quill.js editor.

**Parametry:**
- `container` (string|HTMLElement) - Kontener dla edytora
- `options` (Object, opcjonalny) - Opcje Quill

**Zwraca:** `Object|null` - Instancja Quill lub null

**Przykład:**
```javascript
const quill = knowledgeBaseEngine.initEditor('#editor', {
  theme: 'snow',
  placeholder: 'Napisz coś...'
});
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
2. **Upload obrazków** do Supabase Storage
3. **Embed video** (YouTube/Vimeo)
4. **Sanityzacja HTML** (usuwanie XSS)
5. **Walidacja danych** artykułu
6. **Generowanie slug** z polskimi znakami
7. **Parsowanie tagów**

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

**Ostatnia aktualizacja:** 2025-10-30

