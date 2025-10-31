/**
 * @fileoverview Knowledge Base Engine - Business logic for Knowledge Base
 * Handles article operations, Quill.js editor, image uploads, video embeds
 * @module knowledge-base-engine
 */

/** @typedef {import('./types.js').KnowledgeBaseArticle} KnowledgeBaseArticle */
/** @typedef {import('./types.js').KnowledgeBaseArticleInput} KnowledgeBaseArticleInput */

// ============================================
// KNOWLEDGE BASE ENGINE
// ============================================

(function() {
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
            'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
            'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
            'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
            'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z'
        };
        
        return title
            .toLowerCase()
            .split('')
            .map(char => polishChars[char] || char)
            .join('')
            .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dash
            .replace(/^-+|-+$/g, '')       // Remove leading/trailing dashes
            .replace(/-+/g, '-')           // Replace multiple dashes with single
            .substring(0, 100);            // Limit length
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
            const { data, error } = await supabaseClient.storage
                .from('knowledge-base-images')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('knowledge-base-images')
                .getPublicUrl(filename);
            
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
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
        const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
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
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
            return { platform: 'youtube', id: youtubeMatch[1] };
        }
        
        // Vimeo
        const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[3]) {
            return { platform: 'vimeo', id: vimeoMatch[3] };
        }
        
        return { platform: null, id: null };
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
        
        const defaultOptions = {
            theme: 'snow',
            placeholder: 'Napisz treść artykułu...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const quill = new Quill(container, mergedOptions);
            
            // Custom image handler for upload
            const toolbar = quill.getModule('toolbar');
            toolbar.addHandler('image', async () => {
                await this.handleImageUpload(quill);
            });
            
            // Custom video handler
            toolbar.addHandler('video', () => {
                this.handleVideoEmbed(quill);
            });
            
            return quill;
        } catch (error) {
            console.error('Error initializing Quill editor:', error);
            return null;
        }
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
                alert('Błąd podczas uploadowania obrazka: ' + error.message);
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
        const url = prompt('Wklej link do video (YouTube lub Vimeo):');
        if (!url) return;
        
        const videoInfo = this.extractVideoInfo(url);
        if (!videoInfo.platform) {
            alert('Nieprawidłowy link. Obsługiwane platformy: YouTube, Vimeo');
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

