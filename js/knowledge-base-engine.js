/**
 * @fileoverview Knowledge Base Engine - Business logic for Knowledge Base
 * Handles article operations, Quill.js editor, image uploads, video embeds
 * @module knowledge-base-engine
 */

/** @typedef {import('./types.js').KnowledgeBaseArticle} KnowledgeBaseArticle */
/** @typedef {import('./types.js').KnowledgeBaseArticleInput} KnowledgeBaseArticleInput */

/* global Quill */

// ============================================
// KNOWLEDGE BASE ENGINE
// ============================================

(function () {
  'use strict';

  const knowledgeBaseEngine = {
    // ============================================
    // SLUG GENERATION
    // ============================================

    /**
     * Generate URL-friendly slug from title
     * @param {string} title - Article title
     * @returns {string} URL-friendly slug
     * @example
     * generateSlug('Jak zacząć trening?') // => 'jak-zaczac-trening'
     */
    generateSlug(title) {
      if (!title) return '';

      // Polish character mapping
      const polishChars = {
        ą: 'a',
        ć: 'c',
        ę: 'e',
        ł: 'l',
        ń: 'n',
        ó: 'o',
        ś: 's',
        ź: 'z',
        ż: 'z',
        Ą: 'a',
        Ć: 'c',
        Ę: 'e',
        Ł: 'l',
        Ń: 'n',
        Ó: 'o',
        Ś: 's',
        Ź: 'z',
        Ż: 'z'
      };

      return title
        .toLowerCase()
        .split('')
        .map(char => polishChars[char] || char)
        .join('')
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .replace(/-+/g, '-') // Replace multiple dashes with single
        .substring(0, 100); // Limit length
    },

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate article data before save
     * @param {KnowledgeBaseArticleInput} article - Article data to validate
     * @returns {{valid: boolean, errors: string[]}} Validation result
     */
    validateArticle(article) {
      const errors = [];

      // Title is required
      if (!article.title || article.title.trim().length === 0) {
        errors.push('Tytuł jest wymagany');
      } else if (article.title.length > 200) {
        errors.push('Tytuł nie może być dłuższy niż 200 znaków');
      }

      // Slug is required
      if (!article.slug || article.slug.trim().length === 0) {
        errors.push('Slug jest wymagany');
      } else if (!/^[a-z0-9-]+$/.test(article.slug)) {
        errors.push('Slug może zawierać tylko małe litery, cyfry i myślniki');
      } else if (article.slug.length > 100) {
        errors.push('Slug nie może być dłuższy niż 100 znaków');
      }

      // Content is required
      if (!article.content || article.content.trim().length === 0) {
        errors.push('Treść jest wymagana');
      } else if (article.content.length > 100000) {
        errors.push('Treść nie może być dłuższa niż 100 000 znaków');
      }

      // Description length check
      if (article.description && article.description.length > 500) {
        errors.push('Opis nie może być dłuższy niż 500 znaków');
      }

      // Category length check
      if (article.category && article.category.length > 50) {
        errors.push('Kategoria nie może być dłuższa niż 50 znaków');
      }

      // Tags validation
      if (article.tags) {
        if (!Array.isArray(article.tags)) {
          errors.push('Tagi muszą być tablicą');
        } else if (article.tags.length > 10) {
          errors.push('Maksymalnie 10 tagów');
        } else {
          article.tags.forEach((tag, index) => {
            if (typeof tag !== 'string') {
              errors.push(`Tag #${index + 1} musi być tekstem`);
            } else if (tag.length > 30) {
              errors.push(`Tag #${index + 1} nie może być dłuższy niż 30 znaków`);
            }
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    // ============================================
    // HTML SANITIZATION
    // ============================================

    /**
     * Sanitize HTML content (basic sanitization)
     * For production, consider using DOMPurify library
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
      if (!html) return '';

      // Create a temporary div to parse HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Remove script tags
      const scripts = temp.querySelectorAll('script');
      scripts.forEach(script => script.remove());

      // Remove event handlers
      const allElements = temp.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove on* attributes (onclick, onerror, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        });

        // Remove javascript: in href
        if (el.hasAttribute('href')) {
          const href = el.getAttribute('href');
          if (href && href.toLowerCase().startsWith('javascript:')) {
            el.removeAttribute('href');
          }
        }
      });

      return temp.innerHTML;
    },

    // ============================================
    // DATE FORMATTING
    // ============================================

    /**
     * Format date to Polish locale
     * @param {string|Date} date - Date to format
     * @param {boolean} [includeTime=false] - Include time in output
     * @returns {string} Formatted date
     * @example
     * formatDate('2025-10-30T10:00:00Z') // => '30.10.2025'
     * formatDate('2025-10-30T10:00:00Z', true) // => '30.10.2025, 10:00'
     */
    formatDate(date, includeTime = false) {
      if (!date) return '';

      const d = new Date(date);
      if (isNaN(d.getTime())) return '';

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      let formatted = `${day}.${month}.${year}`;

      if (includeTime) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        formatted += `, ${hours}:${minutes}`;
      }

      return formatted;
    },

    /**
     * Get relative time (e.g., "2 dni temu")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
      if (!date) return '';

      const d = new Date(date);
      if (isNaN(d.getTime())) return '';

      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);

      if (diffSec < 60) return 'przed chwilą';
      if (diffMin < 60) return `${diffMin} min temu`;
      if (diffHour < 24) return `${diffHour} godz. temu`;
      if (diffDay < 30) return `${diffDay} dni temu`;
      if (diffMonth < 12) return `${diffMonth} mies. temu`;
      return `${diffYear} lat temu`;
    },

    // ============================================
    // TAGS HANDLING
    // ============================================

    /**
     * Parse tags from comma-separated string to array
     * @param {string} tagsString - Comma-separated tags
     * @returns {string[]} Array of tags
     * @example
     * parseTags('trening, fitness, siła') // => ['trening', 'fitness', 'siła']
     */
    parseTags(tagsString) {
      if (!tagsString || typeof tagsString !== 'string') return [];

      return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Max 10 tags
    },

    /**
     * Format tags array to comma-separated string
     * @param {string[]} tagsArray - Array of tags
     * @returns {string} Comma-separated tags
     * @example
     * formatTags(['trening', 'fitness']) // => 'trening, fitness'
     */
    formatTags(tagsArray) {
      if (!Array.isArray(tagsArray)) return '';
      return tagsArray.join(', ');
    },

    // ============================================
    // AUDIO UPLOAD (SUPABASE STORAGE)
    // ============================================

    /**
     * Upload audio file to Supabase Storage
     * @param {File} file - Audio file to upload
     * @returns {Promise<string>} Public URL of uploaded audio
     */
    async uploadAudio(file) {
      try {
        if (!file) throw new Error('No file provided');

        // Validate file type
        const allowedTypes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/ogg',
          'audio/wav',
          'audio/wave',
          'audio/x-wav',
          'audio/mp4',
          'audio/x-m4a',
          'audio/aac',
          'audio/flac',
          'audio/x-flac'
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Nieprawidłowy typ pliku. Dozwolone: MP3, OGG, WAV, M4A, AAC, FLAC');
        }

        // Validate file size (max 20MB)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
          throw new Error('Plik jest za duży. Maksymalny rozmiar: 20MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${randomStr}.${ext}`;

        // Upload to Supabase Storage (direct upload, bypasses Vercel)
        const { error } = await supabaseClient.storage
          .from('knowledge-base-audio')
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl }
        } = supabaseClient.storage.from('knowledge-base-audio').getPublicUrl(filename);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading audio:', error);
        throw error;
      }
    },

    /**
     * Delete audio from Supabase Storage
     * @param {string} url - Public URL of audio to delete
     */
    async deleteAudio(url) {
      try {
        if (!url) return;

        // Extract filename from URL
        const filename = url.split('/').pop();
        if (!filename) return;

        const { error } = await supabaseClient.storage
          .from('knowledge-base-audio')
          .remove([filename]);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting audio:', error);
        // Don't throw - deletion is not critical
      }
    },

    // ============================================
    // IMAGE UPLOAD (SUPABASE STORAGE)
    // ============================================

    /**
     * Upload image to Supabase Storage
     * @param {File} file - Image file to upload
     * @returns {Promise<string>} Public URL of uploaded image
     */
    async uploadImage(file) {
      try {
        if (!file) throw new Error('No file provided');

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF, WEBP');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Plik jest za duży. Maksymalny rozmiar: 5MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${randomStr}.${ext}`;

        // Upload to Supabase Storage
        const { error } = await supabaseClient.storage
          .from('knowledge-base-images')
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl }
        } = supabaseClient.storage.from('knowledge-base-images').getPublicUrl(filename);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    },

    /**
     * Delete image from Supabase Storage
     * @param {string} url - Public URL of image to delete
     */
    async deleteImage(url) {
      try {
        if (!url) return;

        // Extract filename from URL
        const filename = url.split('/').pop();
        if (!filename) return;

        const { error } = await supabaseClient.storage
          .from('knowledge-base-images')
          .remove([filename]);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw - deletion is not critical
      }
    },

    // ============================================
    // VIDEO EMBED (YOUTUBE/VIMEO)
    // ============================================

    /**
     * Generate embed HTML for YouTube or Vimeo video
     * @param {string} url - Video URL
     * @returns {string|null} Embed HTML or null if invalid
     * @example
     * embedVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
     * embedVideo('https://vimeo.com/123456789')
     */
    embedVideo(url) {
      if (!url) return null;

      // YouTube
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/ |.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const youtubeMatch = url.match(youtubeRegex);

      if (youtubeMatch && youtubeMatch[1]) {
        const videoId = youtubeMatch[1];
        return `<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>`;
      }

      // Vimeo
      const vimeoRegex =
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
      const vimeoMatch = url.match(vimeoRegex);

      if (vimeoMatch && vimeoMatch[3]) {
        const videoId = vimeoMatch[3];
        return `<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <iframe 
                    src="https://player.vimeo.com/video/${videoId}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>`;
      }

      return null;
    },

    /**
     * Extract video ID from YouTube or Vimeo URL
     * @param {string} url - Video URL
     * @returns {{platform: 'youtube'|'vimeo'|null, id: string|null}} Video info
     */
    extractVideoInfo(url) {
      if (!url) return { platform: null, id: null };

      // YouTube
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/ |.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const youtubeMatch = url.match(youtubeRegex);
      if (youtubeMatch && youtubeMatch[1]) {
        return { platform: 'youtube', id: youtubeMatch[1] };
      }

      // Vimeo
      const vimeoRegex =
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
      const vimeoMatch = url.match(vimeoRegex);
      if (vimeoMatch && vimeoMatch[3]) {
        return { platform: 'vimeo', id: vimeoMatch[3] };
      }

      return { platform: null, id: null };
    },

    // ============================================
    // QUILL.JS CUSTOM BLOTS
    // ============================================

    /**
     * Register custom Audio Blot for Quill.js
     * Allows embedding HTML5 audio players in the editor
     */
    registerAudioBlot() {
      if (typeof Quill === 'undefined') {
        console.warn('Quill is not loaded, cannot register Audio Blot');
        return;
      }

      const BlockEmbed = Quill.import('blots/block/embed');

      class AudioBlot extends BlockEmbed {
        static create(value) {
          const node = super.create();
          node.setAttribute('controls', '');
          node.setAttribute('preload', 'metadata');
          node.setAttribute('class', 'w-full my-4 rounded-lg');
          node.setAttribute('controlsList', 'nodownload'); // Optional: prevent download

          // Add source element
          const source = document.createElement('source');
          source.setAttribute('src', value.url);
          source.setAttribute('type', value.type || 'audio/mpeg');
          node.appendChild(source);

          // Add fallback text
          const fallback = document.createTextNode(
            'Twoja przeglądarka nie obsługuje odtwarzania audio.'
          );
          node.appendChild(fallback);

          // Setup Media Session API when audio is loaded
          node.addEventListener('loadedmetadata', () => {
            this.setupMediaSession(node, value.url);
          });

          return node;
        }

        static value(node) {
          const source = node.querySelector('source');
          return {
            url: source ? source.getAttribute('src') : '',
            type: source ? source.getAttribute('type') : 'audio/mpeg'
          };
        }

        static setupMediaSession(audioElement, url) {
          if ('mediaSession' in navigator) {
            // Extract filename for title
            const filename = url.split('/').pop();

            navigator.mediaSession.metadata = new MediaMetadata({
              title: filename || 'Audio',
              artist: 'eTrener',
              album: 'Baza Wiedzy'
            });

            // Setup action handlers
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
      }

      AudioBlot.blotName = 'audio';
      AudioBlot.tagName = 'audio';

      Quill.register(AudioBlot);
      console.log('✅ Audio Blot registered');
    },

    // ============================================
    // QUILL.JS EDITOR INITIALIZATION
    // ============================================

    /**
     * Initialize Quill.js editor
     * @param {string|HTMLElement} container - Container element or selector
     * @param {Object} [options] - Quill options
     * @returns {Object|null} Quill instance or null if Quill not loaded
     */
    initEditor(container, options = {}) {
      // Check if Quill is loaded
      if (typeof Quill === 'undefined') {
        console.error('Quill.js is not loaded. Include Quill CDN in your HTML.');
        return null;
      }

      // Register custom Audio Blot
      this.registerAudioBlot();

      const defaultOptions = {
        theme: 'snow',
        placeholder: 'Napisz treść artykułu...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'audio', 'video'],
            ['clean']
          ]
        }
      };

      const mergedOptions = { ...defaultOptions, ...options };

      try {
        const quill = new Quill(container, mergedOptions);

        // Custom handlers
        const toolbar = quill.getModule('toolbar');

        // Image upload handler
        toolbar.addHandler('image', async () => {
          await this.handleImageUpload(quill);
        });

        // Audio upload handler
        toolbar.addHandler('audio', async () => {
          await this.handleAudioUpload(quill);
        });

        // Video embed handler
        toolbar.addHandler('video', () => {
          this.handleVideoEmbed(quill);
        });

        // Add custom emoji button to toolbar
        this.addEmojiButton(quill);

        // Setup sticky toolbar with shadow effect
        this.setupStickyToolbar(quill);

        // Setup Wake Lock for audio playback
        this.setupAudioWakeLock(quill);

        return quill;
      } catch (error) {
        console.error('Error initializing Quill editor:', error);
        return null;
      }
    },

    /**
     * Add custom emoji button to Quill toolbar
     * @param {Object} quill - Quill instance
     */
    addEmojiButton(quill) {
      const toolbar = quill.container.previousSibling;
      if (!toolbar || !toolbar.classList.contains('ql-toolbar')) {
        console.warn('Toolbar not found');
        return;
      }

      // Find the clean button (last button in toolbar)
      const cleanButton = toolbar.querySelector('.ql-clean');
      if (!cleanButton) {
        console.warn('Clean button not found');
        return;
      }

      // Create emoji button
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.className = 'ql-emoji';
      emojiButton.title = 'Wstaw emoji';
      emojiButton.innerHTML = '😀';

      // Add click handler
      emojiButton.addEventListener('click', e => {
        e.preventDefault();
        this.handleEmojiPicker(quill);
      });

      // Insert before clean button
      cleanButton.parentNode.insertBefore(emojiButton, cleanButton);
    },

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
          quill.setSelection(range.index + 18);

          // Upload audio
          const url = await this.uploadAudio(file);

          // Detect MIME type
          const mimeType = file.type || 'audio/mpeg';

          // Remove loading text and insert audio
          quill.deleteText(range.index, 18);
          quill.insertEmbed(range.index, 'audio', { url, type: mimeType });
          quill.setSelection(range.index + 1);

          console.log('✅ Audio uploaded and inserted:', url);
        } catch (error) {
          console.error('Błąd podczas uploadowania audio:', error);
          alert(`Błąd: ${error.message}`);
          // Remove loading text
          const range = quill.getSelection(true);
          if (range) {
            quill.deleteText(range.index - 18, 18);
          }
        }
      };
    },

    /**
     * Handle emoji picker in Quill editor
     * @param {Object} quill - Quill instance
     */
    handleEmojiPicker(quill) {
      // Get current cursor position
      const range = quill.getSelection(true);

      // Create emoji picker popup
      const emojiPopup = this.createEmojiPickerPopup();

      // Position popup near cursor or toolbar
      const toolbar = quill.container.previousSibling;
      const toolbarRect = toolbar.getBoundingClientRect();

      emojiPopup.style.position = 'absolute';
      emojiPopup.style.top = `${toolbarRect.bottom + window.scrollY}px`;
      emojiPopup.style.left = `${toolbarRect.left + window.scrollX}px`;
      emojiPopup.style.zIndex = '1000';

      document.body.appendChild(emojiPopup);

      // Handle emoji selection
      emojiPopup.addEventListener('click', e => {
        if (e.target.classList.contains('emoji-item')) {
          const emoji = e.target.textContent;
          quill.insertText(range.index, emoji);
          quill.setSelection(range.index + emoji.length);
          document.body.removeChild(emojiPopup);
        }
      });

      // Close on click outside
      const closeHandler = e => {
        if (!emojiPopup.contains(e.target)) {
          if (document.body.contains(emojiPopup)) {
            document.body.removeChild(emojiPopup);
          }
          document.removeEventListener('click', closeHandler);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 100);
    },

    /**
     * Create emoji picker popup element
     * @returns {HTMLElement} Emoji picker popup
     */
    createEmojiPickerPopup() {
      const popup = document.createElement('div');
      popup.className = 'emoji-picker-popup';

      // Popular emojis categorized
      const emojiCategories = {
        Emocje: [
          '😀',
          '😃',
          '😄',
          '😁',
          '😅',
          '😂',
          '🤣',
          '😊',
          '😇',
          '🙂',
          '🙃',
          '😉',
          '😌',
          '😍',
          '🥰',
          '😘',
          '😗',
          '😙',
          '😚',
          '😋',
          '😛',
          '😝',
          '😜',
          '🤪',
          '🤨',
          '🧐',
          '🤓',
          '😎',
          '🤩',
          '🥳',
          '😏',
          '😒',
          '😞',
          '😔',
          '😟',
          '😕',
          '🙁',
          '😣',
          '😖',
          '😫',
          '😩',
          '🥺',
          '😢',
          '😭',
          '😤',
          '😠',
          '😡',
          '🤬',
          '🤯',
          '😳',
          '🥵',
          '🥶',
          '😱',
          '😨',
          '😰',
          '😥',
          '😓'
        ],
        Gesty: [
          '👍',
          '👎',
          '👊',
          '✊',
          '🤛',
          '🤜',
          '🤞',
          '✌️',
          '🤟',
          '🤘',
          '👌',
          '🤌',
          '🤏',
          '👈',
          '👉',
          '👆',
          '👇',
          '☝️',
          '👋',
          '🤚',
          '🖐️',
          '✋',
          '🖖',
          '👏',
          '🙌',
          '👐',
          '🤲',
          '🤝',
          '🙏'
        ],
        Sport: [
          '⚽',
          '🏀',
          '🏈',
          '⚾',
          '🥎',
          '🎾',
          '🏐',
          '🏉',
          '🥏',
          '🎱',
          '🪀',
          '🏓',
          '🏸',
          '🏒',
          '🏑',
          '🥍',
          '🏏',
          '🪃',
          '🥅',
          '⛳',
          '🪁',
          '🏹',
          '🎣',
          '🤿',
          '🥊',
          '🥋',
          '🎽',
          '🛹',
          '🛼',
          '🛷',
          '⛸️',
          '🥌',
          '🎿',
          '⛷️',
          '🏂',
          '🪂',
          '🏋️',
          '🤼',
          '🤸',
          '🤺',
          '⛹️',
          '🤾',
          '🏌️',
          '🏇',
          '🧘',
          '🏊',
          '🤽',
          '🚣',
          '🧗',
          '🚴',
          '🚵',
          '🤹'
        ],
        Jedzenie: [
          '🍎',
          '🍊',
          '🍋',
          '🍌',
          '🍉',
          '🍇',
          '🍓',
          '🫐',
          '🍈',
          '🍒',
          '🍑',
          '🥭',
          '🍍',
          '🥥',
          '🥝',
          '🍅',
          '🍆',
          '🥑',
          '🥦',
          '🥬',
          '🥒',
          '🌶️',
          '🫑',
          '🌽',
          '🥕',
          '🫒',
          '🧄',
          '🧅',
          '🥔',
          '🍠',
          '🥐',
          '🥯',
          '🍞',
          '🥖',
          '🥨',
          '🧀',
          '🥚',
          '🍳',
          '🧈',
          '🥞',
          '🧇',
          '🥓',
          '🥩',
          '🍗',
          '🍖',
          '🦴',
          '🌭',
          '🍔',
          '🍟',
          '🍕',
          '🫓',
          '🥪',
          '🥙',
          '🧆',
          '🌮',
          '🌯',
          '🫔',
          '🥗',
          '🥘',
          '🫕',
          '🥫',
          '🍝',
          '🍜',
          '🍲',
          '🍛',
          '🍣',
          '🍱',
          '🥟',
          '🦪',
          '🍤',
          '🍙',
          '🍚',
          '🍘',
          '🍥',
          '🥠',
          '🥮',
          '🍢',
          '🍡',
          '🍧',
          '🍨',
          '🍦',
          '🥧',
          '🧁',
          '🍰',
          '🎂',
          '🍮',
          '🍭',
          '🍬',
          '🍫',
          '🍿',
          '🍩',
          '🍪',
          '🌰',
          '🥜',
          '🍯'
        ],
        Zwierzęta: [
          '🐶',
          '🐱',
          '🐭',
          '🐹',
          '🐰',
          '🦊',
          '🐻',
          '🐼',
          '🐨',
          '🐯',
          '🦁',
          '🐮',
          '🐷',
          '🐽',
          '🐸',
          '🐵',
          '🙈',
          '🙉',
          '🙊',
          '🐒',
          '🐔',
          '🐧',
          '🐦',
          '🐤',
          '🐣',
          '🐥',
          '🦆',
          '🦅',
          '🦉',
          '🦇',
          '🐺',
          '🐗',
          '🐴',
          '🦄',
          '🐝',
          '🪱',
          '🐛',
          '🦋',
          '🐌',
          '🐞',
          '🐜',
          '🪰',
          '🪲',
          '🪳',
          '🦟',
          '🦗',
          '🕷️',
          '🕸️',
          '🦂',
          '🐢',
          '🐍',
          '🦎',
          '🦖',
          '🦕',
          '🐙',
          '🦑',
          '🦐',
          '🦞',
          '🦀',
          '🐡',
          '🐠',
          '🐟',
          '🐬',
          '🐳',
          '🐋',
          '🦈',
          '🐊',
          '🐅',
          '🐆',
          '🦓',
          '🦍',
          '🦧',
          '🦣',
          '🐘',
          '🦛',
          '🦏',
          '🐪',
          '🐫',
          '🦒',
          '🦘',
          '🦬',
          '🐃',
          '🐂',
          '🐄',
          '🐎',
          '🐖',
          '🐏',
          '🐑',
          '🦙',
          '🐐',
          '🦌',
          '🐕',
          '🐩',
          '🦮',
          '🐕‍🦺',
          '🐈',
          '🐈‍⬛',
          '🪶',
          '🐓',
          '🦃',
          '🦤',
          '🦚',
          '🦜',
          '🦢',
          '🦩',
          '🕊️',
          '🐇',
          '🦝',
          '🦨',
          '🦡',
          '🦫',
          '🦦',
          '🦥',
          '🐁',
          '🐀',
          '🐿️',
          '🦔'
        ],
        Natura: [
          '🌸',
          '🌺',
          '🌻',
          '🌷',
          '🌹',
          '🥀',
          '🏵️',
          '💐',
          '🌾',
          '🌱',
          '🌿',
          '☘️',
          '🍀',
          '🍁',
          '🍂',
          '🍃',
          '🪴',
          '🌵',
          '🌴',
          '🌳',
          '🌲',
          '🪵',
          '🎋',
          '🎍',
          '🪨',
          '⛰️',
          '🏔️',
          '🌋',
          '🗻',
          '🏕️',
          '🏖️',
          '🏜️',
          '🏝️',
          '🏞️',
          '🌅',
          '🌄',
          '🌠',
          '🌌',
          '🌉',
          '🌁',
          '☀️',
          '🌤️',
          '⛅',
          '🌥️',
          '☁️',
          '🌦️',
          '🌧️',
          '⛈️',
          '🌩️',
          '🌨️',
          '❄️',
          '☃️',
          '⛄',
          '🌬️',
          '💨',
          '🌪️',
          '🌫️',
          '🌈',
          '☔',
          '💧',
          '💦',
          '🌊'
        ],
        Obiekty: [
          '⚽',
          '🏀',
          '🏈',
          '⚾',
          '🥎',
          '🎾',
          '🏐',
          '🏉',
          '🥏',
          '🎱',
          '🪀',
          '🏓',
          '🏸',
          '🏒',
          '🏑',
          '🥍',
          '🏏',
          '🪃',
          '🥅',
          '⛳',
          '🪁',
          '🏹',
          '🎣',
          '🤿',
          '🥊',
          '🥋',
          '🎽',
          '🛹',
          '🛼',
          '🛷',
          '⛸️',
          '🥌',
          '🎿',
          '⛷️',
          '🏂',
          '🪂',
          '💻',
          '⌨️',
          '🖥️',
          '🖨️',
          '🖱️',
          '🖲️',
          '🕹️',
          '🗜️',
          '💾',
          '💿',
          '📀',
          '📼',
          '📷',
          '📸',
          '📹',
          '🎥',
          '📽️',
          '🎞️',
          '📞',
          '☎️',
          '📟',
          '📠',
          '📺',
          '📻',
          '🎙️',
          '🎚️',
          '🎛️',
          '🧭',
          '⏱️',
          '⏲️',
          '⏰',
          '🕰️',
          '⌛',
          '⏳',
          '📡',
          '🔋',
          '🔌',
          '💡',
          '🔦',
          '🕯️',
          '🪔',
          '🧯',
          '🛢️',
          '💸',
          '💵',
          '💴',
          '💶',
          '💷',
          '🪙',
          '💰',
          '💳',
          '🪪',
          '💎',
          '⚖️',
          '🪜',
          '🧰',
          '🪛',
          '🔧',
          '🔨',
          '⚒️',
          '🛠️',
          '⛏️',
          '🪚',
          '🔩',
          '⚙️',
          '🪤',
          '🧱',
          '⛓️',
          '🧲',
          '🔫',
          '💣',
          '🧨',
          '🪓',
          '🔪',
          '🗡️',
          '⚔️',
          '🛡️',
          '🚬',
          '⚰️',
          '🪦',
          '⚱️',
          '🏺',
          '🔮',
          '📿',
          '🧿',
          '💈',
          '⚗️',
          '🔭',
          '🔬',
          '🕳️',
          '🩹',
          '🩺',
          '💊',
          '💉',
          '🩸',
          '🧬',
          '🦠',
          '🧫',
          '🧪',
          '🌡️',
          '🧹',
          '🪠',
          '🧺',
          '🧻',
          '🚽',
          '🚰',
          '🚿',
          '🛁',
          '🛀',
          '🧼',
          '🪥',
          '🪒',
          '🧽',
          '🪣',
          '🧴',
          '🛎️',
          '🔑',
          '🗝️',
          '🚪',
          '🪑',
          '🛋️',
          '🛏️',
          '🛌',
          '🧸',
          '🪆',
          '🖼️',
          '🪞',
          '🪟',
          '🛍️',
          '🎁',
          '🎈',
          '🎏',
          '🎀',
          '🪄',
          '🪅',
          '🎊',
          '🎉',
          '🎎',
          '🏮',
          '🎐',
          '🧧',
          '✉️',
          '📩',
          '📨',
          '📧',
          '💌',
          '📥',
          '📤',
          '📦',
          '🏷️',
          '🪧',
          '📪',
          '📫',
          '📬',
          '📭',
          '📮',
          '📯',
          '📜',
          '📃',
          '📄',
          '📑',
          '🧾',
          '📊',
          '📈',
          '📉',
          '🗒️',
          '🗓️',
          '📆',
          '📅',
          '🗑️',
          '📇',
          '🗃️',
          '🗳️',
          '🗄️',
          '📋',
          '📁',
          '📂',
          '🗂️',
          '🗞️',
          '📰',
          '📓',
          '📔',
          '📒',
          '📕',
          '📗',
          '📘',
          '📙',
          '📚',
          '📖',
          '🔖',
          '🧷',
          '🔗',
          '📎',
          '🖇️',
          '📐',
          '📏',
          '🧮',
          '📌',
          '📍',
          '✂️',
          '🖊️',
          '🖋️',
          '✒️',
          '🖌️',
          '🖍️',
          '📝',
          '✏️',
          '🔍',
          '🔎',
          '🔏',
          '🔐',
          '🔒',
          '🔓'
        ],
        Symbole: [
          '❤️',
          '🧡',
          '💛',
          '💚',
          '💙',
          '💜',
          '🖤',
          '🤍',
          '🤎',
          '💔',
          '❣️',
          '💕',
          '💞',
          '💓',
          '💗',
          '💖',
          '💘',
          '💝',
          '💟',
          '☮️',
          '✝️',
          '☪️',
          '🕉️',
          '☸️',
          '✡️',
          '🔯',
          '🕎',
          '☯️',
          '☦️',
          '🛐',
          '⛎',
          '♈',
          '♉',
          '♊',
          '♋',
          '♌',
          '♍',
          '♎',
          '♏',
          '♐',
          '♑',
          '♒',
          '♓',
          '🆔',
          '⚛️',
          '🉑',
          '☢️',
          '☣️',
          '📴',
          '📳',
          '🈶',
          '🈚',
          '🈸',
          '🈺',
          '🈷️',
          '✴️',
          '🆚',
          '💮',
          '🉐',
          '㊙️',
          '㊗️',
          '🈴',
          '🈵',
          '🈹',
          '🈲',
          '🅰️',
          '🅱️',
          '🆎',
          '🆑',
          '🅾️',
          '🆘',
          '❌',
          '⭕',
          '🛑',
          '⛔',
          '📛',
          '🚫',
          '💯',
          '💢',
          '♨️',
          '🚷',
          '🚯',
          '🚳',
          '🚱',
          '🔞',
          '📵',
          '🚭',
          '❗',
          '❕',
          '❓',
          '❔',
          '‼️',
          '⁉️',
          '🔅',
          '🔆',
          '〽️',
          '⚠️',
          '🚸',
          '🔱',
          '⚜️',
          '🔰',
          '♻️',
          '✅',
          '🈯',
          '💹',
          '❇️',
          '✳️',
          '❎',
          '🌐',
          '💠',
          'Ⓜ️',
          '🌀',
          '💤',
          '🏧',
          '🚾',
          '♿',
          '🅿️',
          '🛗',
          '🈳',
          '🈂️',
          '🛂',
          '🛃',
          '🛄',
          '🛅',
          '🚹',
          '🚺',
          '🚼',
          '⚧️',
          '🚻',
          '🚮',
          '🎦',
          '📶',
          '🈁',
          '🔣',
          'ℹ️',
          '🔤',
          '🔡',
          '🔠',
          '🆖',
          '🆗',
          '🆙',
          '🆒',
          '🆕',
          '🆓',
          '0️⃣',
          '1️⃣',
          '2️⃣',
          '3️⃣',
          '4️⃣',
          '5️⃣',
          '6️⃣',
          '7️⃣',
          '8️⃣',
          '9️⃣',
          '🔟',
          '🔢',
          '#️⃣',
          '*️⃣',
          '⏏️',
          '▶️',
          '⏸️',
          '⏯️',
          '⏹️',
          '⏺️',
          '⏭️',
          '⏮️',
          '⏩',
          '⏪',
          '⏫',
          '⏬',
          '◀️',
          '🔼',
          '🔽',
          '➡️',
          '⬅️',
          '⬆️',
          '⬇️',
          '↗️',
          '↘️',
          '↙️',
          '↖️',
          '↕️',
          '↔️',
          '↪️',
          '↩️',
          '⤴️',
          '⤵️',
          '🔀',
          '🔁',
          '🔂',
          '🔄',
          '🔃',
          '🎵',
          '🎶',
          '➕',
          '➖',
          '➗',
          '✖️',
          '🟰',
          '♾️',
          '💲',
          '💱',
          '™️',
          '©️',
          '®️',
          '〰️',
          '➰',
          '➿',
          '🔚',
          '🔙',
          '🔛',
          '🔝',
          '🔜',
          '✔️',
          '☑️',
          '🔘',
          '🔴',
          '🟠',
          '🟡',
          '🟢',
          '🔵',
          '🟣',
          '⚫',
          '⚪',
          '🟤',
          '🔺',
          '🔻',
          '🔸',
          '🔹',
          '🔶',
          '🔷',
          '🔳',
          '🔲',
          '▪️',
          '▫️',
          '◾',
          '◽',
          '◼️',
          '◻️',
          '🟥',
          '🟧',
          '🟨',
          '🟩',
          '🟦',
          '🟪',
          '⬛',
          '⬜',
          '🟫',
          '🔈',
          '🔇',
          '🔉',
          '🔊',
          '🔔',
          '🔕',
          '📣',
          '📢',
          '👁️‍🗨️',
          '💬',
          '💭',
          '🗯️',
          '♠️',
          '♣️',
          '♥️',
          '♦️',
          '🃏',
          '🎴',
          '🀄',
          '🕐',
          '🕑',
          '🕒',
          '🕓',
          '🕔',
          '🕕',
          '🕖',
          '🕗',
          '🕘',
          '🕙',
          '🕚',
          '🕛',
          '🕜',
          '🕝',
          '🕞',
          '🕟',
          '🕠',
          '🕡',
          '🕢',
          '🕣',
          '🕤',
          '🕥',
          '🕦',
          '🕧'
        ]
      };

      // Create header
      const header = document.createElement('div');
      header.className = 'emoji-picker-header';
      header.innerHTML = '<strong>Wybierz emoji</strong>';
      popup.appendChild(header);

      // Create emoji grid
      const grid = document.createElement('div');
      grid.className = 'emoji-picker-grid';

      // Add emojis by category
      for (const [category, emojis] of Object.entries(emojiCategories)) {
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'emoji-category-label';
        categoryLabel.textContent = category;
        grid.appendChild(categoryLabel);

        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'emoji-category-grid';

        emojis.forEach(emoji => {
          const emojiItem = document.createElement('span');
          emojiItem.className = 'emoji-item';
          emojiItem.textContent = emoji;
          emojiItem.title = emoji;
          categoryGrid.appendChild(emojiItem);
        });

        grid.appendChild(categoryGrid);
      }

      popup.appendChild(grid);

      return popup;
    },

    /**
     * Setup sticky toolbar with shadow effect on scroll
     * @param {Object} quill - Quill instance
     */
    setupStickyToolbar(quill) {
      const toolbarElement = quill.container.previousSibling;

      if (!toolbarElement || !toolbarElement.classList.contains('ql-toolbar')) {
        console.warn('Toolbar element not found');
        return;
      }

      // Intersection Observer to detect when toolbar becomes sticky
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When toolbar is NOT intersecting with its original position, it's stuck
          if (!entry.isIntersecting) {
            toolbarElement.classList.add('is-stuck');
          } else {
            toolbarElement.classList.remove('is-stuck');
          }
        },
        {
          threshold: [1],
          rootMargin: '-1px 0px 0px 0px'
        }
      );

      // Create a sentinel element just before the toolbar
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.position = 'absolute';
      sentinel.style.top = '0';
      sentinel.style.width = '100%';
      sentinel.style.pointerEvents = 'none';

      toolbarElement.parentElement.style.position = 'relative';
      toolbarElement.parentElement.insertBefore(sentinel, toolbarElement);

      observer.observe(sentinel);

      // Store observer for cleanup
      if (!quill._stickyToolbarObserver) {
        quill._stickyToolbarObserver = observer;
      }
    },

    /**
     * Setup Wake Lock for audio playback in editor
     * Prevents screen from turning off during audio playback
     * @param {Object} quill - Quill instance
     */
    setupAudioWakeLock(quill) {
      if (!window.wakeLockManager || !window.wakeLockManager.isSupported()) {
        console.warn('Wake Lock API not supported');
        return;
      }

      // Listen for play/pause events on all audio elements in the editor
      const editorElement = quill.root;

      editorElement.addEventListener(
        'play',
        async e => {
          if (e.target.tagName === 'AUDIO') {
            console.log('🔊 Audio playback started, activating Wake Lock');
            await window.wakeLockManager.addReference('kb-audio');
          }
        },
        true
      );

      editorElement.addEventListener(
        'pause',
        async e => {
          if (e.target.tagName === 'AUDIO') {
            console.log('⏸️ Audio playback paused, releasing Wake Lock');
            await window.wakeLockManager.removeReference('kb-audio');
          }
        },
        true
      );

      editorElement.addEventListener(
        'ended',
        async e => {
          if (e.target.tagName === 'AUDIO') {
            console.log('⏹️ Audio playback ended, releasing Wake Lock');
            await window.wakeLockManager.removeReference('kb-audio');
          }
        },
        true
      );

      console.log('✅ Wake Lock setup for audio playback');
    },

    /**
     * Stop all audio playback in the editor
     * Called when user leaves the knowledge base editor
     * @param {Object} quill - Quill instance
     */
    stopAllAudio(quill) {
      if (!quill || !quill.root) return;

      const audioElements = quill.root.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      // Release Wake Lock
      if (window.wakeLockManager && window.wakeLockManager.isSupported()) {
        window.wakeLockManager.removeReference('kb-audio');
      }

      console.log('🔇 All audio stopped in editor');
    },

    /**
     * Handle image upload in Quill editor
     * @param {Object} quill - Quill instance
     */
    async handleImageUpload(quill) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        try {
          // Show loading state
          const range = quill.getSelection(true);
          quill.insertText(range.index, 'Uploading image...');
          quill.setSelection(range.index + 19);

          // Upload image
          const url = await this.uploadImage(file);

          // Remove loading text and insert image
          quill.deleteText(range.index, 19);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
        } catch (error) {
          console.error('Błąd podczas uploadowania obrazka:', error);
          // Remove loading text
          const range = quill.getSelection(true);
          quill.deleteText(range.index - 19, 19);
        }
      };
    },

    /**
     * Handle video embed in Quill editor
     * @param {Object} quill - Quill instance
     */
    handleVideoEmbed(quill) {
      // eslint-disable-next-line no-alert
      const url = prompt('Wklej link do video (YouTube lub Vimeo):');
      if (!url) return;

      const videoInfo = this.extractVideoInfo(url);
      if (!videoInfo.platform) {
        console.warn('Nieprawidłowy link video:', url);
        return;
      }

      const range = quill.getSelection(true);

      // Quill has built-in video support
      if (videoInfo.platform === 'youtube') {
        quill.insertEmbed(range.index, 'video', `https://www.youtube.com/embed/${videoInfo.id}`);
      } else if (videoInfo.platform === 'vimeo') {
        quill.insertEmbed(range.index, 'video', `https://player.vimeo.com/video/${videoInfo.id}`);
      }

      quill.setSelection(range.index + 1);
    }
  };

  // Export for use in other modules
  window.knowledgeBaseEngine = knowledgeBaseEngine;

  console.log('✅ Knowledge Base engine initialized');
})(); // End of IIFE
