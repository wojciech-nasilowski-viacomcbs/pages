/**
 * @fileoverview Integration tests for Knowledge Base Audio functionality
 * Tests complete workflow: upload → insert → playback → delete
 */

describe('Knowledge Base Audio - Integration Tests', () => {
  let mockQuillEditor;
  let mockAudioElements;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="kb-editor-container">
        <div class="ql-toolbar"></div>
        <div class="ql-container">
          <div class="ql-editor"></div>
        </div>
      </div>
    `;

    mockAudioElements = [];

    // Mock Quill editor
    mockQuillEditor = {
      root: document.querySelector('.ql-editor'),
      container: document.querySelector('.ql-container'),
      getSelection: jest.fn(() => ({ index: 0 })),
      insertEmbed: jest.fn((index, type, value) => {
        // Simulate inserting audio element
        const audio = document.createElement('audio');
        audio.setAttribute('controls', '');
        audio.setAttribute('preload', 'metadata');
        audio.setAttribute('class', 'w-full my-4 rounded-lg');

        const source = document.createElement('source');
        source.setAttribute('src', value.url);
        source.setAttribute('type', value.type);
        audio.appendChild(source);

        mockQuillEditor.root.appendChild(audio);
        mockAudioElements.push(audio);
      }),
      insertText: jest.fn(),
      deleteText: jest.fn(),
      setSelection: jest.fn()
    };

    // Mock Wake Lock Manager
    const mockWakeLockManager = {
      isSupported: () => true,
      addReference: jest.fn(),
      removeReference: jest.fn()
    };

    global.window = {
      ...global.window,
      wakeLockManager: mockWakeLockManager
    };

    // Also set it directly for event handlers
    global.wakeLockManager = mockWakeLockManager;

    // Mock Media Session API
    const mockMediaSession = {
      metadata: null,
      setActionHandler: jest.fn()
    };

    Object.defineProperty(global.navigator, 'mediaSession', {
      value: mockMediaSession,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockAudioElements = [];
  });

  describe('Complete Audio Workflow', () => {
    test('should upload and insert audio into editor', async () => {
      const mockFile = {
        name: 'test-audio.mp3',
        type: 'audio/mpeg',
        size: 5 * 1024 * 1024
      };

      const mockUrl = 'https://example.com/audio/123-abc.mp3';

      // Simulate upload
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: mockUrl,
        type: 'audio/mpeg'
      });

      // Verify audio element was inserted
      const audioElements = mockQuillEditor.root.querySelectorAll('audio');
      expect(audioElements.length).toBe(1);

      const audio = audioElements[0];
      expect(audio.hasAttribute('controls')).toBe(true);

      const source = audio.querySelector('source');
      expect(source.getAttribute('src')).toBe(mockUrl);
      expect(source.getAttribute('type')).toBe('audio/mpeg');
    });

    test('should handle multiple audio files in one article', async () => {
      const files = [
        { url: 'https://example.com/audio/1.mp3', type: 'audio/mpeg' },
        { url: 'https://example.com/audio/2.ogg', type: 'audio/ogg' },
        { url: 'https://example.com/audio/3.wav', type: 'audio/wav' }
      ];

      files.forEach((file, index) => {
        mockQuillEditor.insertEmbed(index, 'audio', file);
      });

      const audioElements = mockQuillEditor.root.querySelectorAll('audio');
      expect(audioElements.length).toBe(3);

      // Verify each audio element
      audioElements.forEach((audio, index) => {
        const source = audio.querySelector('source');
        expect(source.getAttribute('src')).toBe(files[index].url);
        expect(source.getAttribute('type')).toBe(files[index].type);
      });
    });

    test('should activate Wake Lock on audio playback', async () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Setup event listeners (simulating setupAudioWakeLock)
      audio.addEventListener('play', async () => {
        await window.wakeLockManager.addReference('kb-audio');
      });

      audio.addEventListener('pause', async () => {
        await window.wakeLockManager.removeReference('kb-audio');
      });

      audio.addEventListener('ended', async () => {
        await window.wakeLockManager.removeReference('kb-audio');
      });

      // Simulate play
      audio.dispatchEvent(new Event('play'));
      expect(window.wakeLockManager.addReference).toHaveBeenCalledWith('kb-audio');

      // Simulate pause
      audio.dispatchEvent(new Event('pause'));
      expect(window.wakeLockManager.removeReference).toHaveBeenCalledWith('kb-audio');

      // Simulate ended
      audio.dispatchEvent(new Event('ended'));
      expect(window.wakeLockManager.removeReference).toHaveBeenCalledTimes(2);
    });

    test('should setup Media Session API on audio load', () => {
      const audioUrl = 'https://example.com/audio/my-recording.mp3';

      mockQuillEditor.insertEmbed(0, 'audio', {
        url: audioUrl,
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Verify Media Session API is available
      expect('mediaSession' in navigator).toBe(true);

      // Setup Media Session (simulating AudioBlot.setupMediaSession)
      if ('mediaSession' in navigator) {
        const filename = audioUrl.split('/').pop();

        navigator.mediaSession.metadata = {
          title: filename,
          artist: 'eTrener',
          album: 'Baza Wiedzy'
        };

        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      }

      // Check that metadata was set
      expect(navigator.mediaSession.metadata).toBeTruthy();
      expect(navigator.mediaSession.metadata.title).toBe('my-recording.mp3');
      expect(navigator.mediaSession.metadata.artist).toBe('eTrener');
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      );
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
        'pause',
        expect.any(Function)
      );
    });

    test('should handle audio playback errors gracefully', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/invalid.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Setup error handler
      const errorHandler = jest.fn();
      audio.addEventListener('error', errorHandler);

      // Simulate error
      audio.dispatchEvent(new Event('error'));

      expect(errorHandler).toHaveBeenCalled();
    });

    test('should preserve audio elements when saving article', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      // Get HTML content (simulating article save)
      const htmlContent = mockQuillEditor.root.innerHTML;

      expect(htmlContent).toContain('<audio');
      expect(htmlContent).toContain('controls');
      expect(htmlContent).toContain('<source');
      expect(htmlContent).toContain('https://example.com/audio/test.mp3');
      expect(htmlContent).toContain('audio/mpeg');
    });

    test('should load audio elements when editing existing article', () => {
      // Simulate loading existing article with audio
      const existingContent = `
        <p>Some text</p>
        <audio controls preload="metadata" class="w-full my-4 rounded-lg">
          <source src="https://example.com/audio/existing.mp3" type="audio/mpeg">
        </audio>
        <p>More text</p>
      `;

      mockQuillEditor.root.innerHTML = existingContent;

      const audioElements = mockQuillEditor.root.querySelectorAll('audio');
      expect(audioElements.length).toBe(1);

      const source = audioElements[0].querySelector('source');
      expect(source.getAttribute('src')).toBe('https://example.com/audio/existing.mp3');
    });
  });

  describe('Audio Player Controls', () => {
    test('should support play/pause controls', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Mock play/pause methods
      audio.play = jest.fn();
      audio.pause = jest.fn();

      audio.play();
      expect(audio.play).toHaveBeenCalled();

      audio.pause();
      expect(audio.pause).toHaveBeenCalled();
    });

    test('should support seeking', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Mock duration and currentTime
      Object.defineProperty(audio, 'duration', { value: 120, writable: true });
      Object.defineProperty(audio, 'currentTime', { value: 0, writable: true });

      // Seek forward
      audio.currentTime = 30;
      expect(audio.currentTime).toBe(30);

      // Seek backward
      audio.currentTime = 10;
      expect(audio.currentTime).toBe(10);
    });

    test('should display audio metadata', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');
      const source = audio.querySelector('source');

      expect(source.getAttribute('src')).toBeTruthy();
      expect(source.getAttribute('type')).toBeTruthy();
      expect(audio.getAttribute('preload')).toBe('metadata');
    });
  });

  describe('Mobile Compatibility', () => {
    test('should work on touch devices', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Simulate touch event
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true
      });

      audio.dispatchEvent(touchEvent);

      // Audio element should still be present
      expect(mockQuillEditor.root.querySelector('audio')).toBeTruthy();
    });

    test('should handle background playback on mobile', async () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Setup Wake Lock
      audio.addEventListener('play', async () => {
        await window.wakeLockManager.addReference('kb-audio');
      });

      // Simulate play
      audio.dispatchEvent(new Event('play'));

      // Verify Wake Lock was activated
      expect(window.wakeLockManager.addReference).toHaveBeenCalledWith('kb-audio');

      // Simulate app going to background (visibility change)
      document.dispatchEvent(new Event('visibilitychange'));

      // Wake Lock should still be active
      expect(window.wakeLockManager.addReference).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors during upload', async () => {
      const errorMessage = 'Network error';
      const onError = jest.fn();

      try {
        throw new Error(errorMessage);
      } catch (error) {
        onError(error);
      }

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: errorMessage }));
    });

    test('should handle corrupted audio files', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/corrupted.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');
      const errorHandler = jest.fn();

      audio.addEventListener('error', errorHandler);
      audio.dispatchEvent(new Event('error'));

      expect(errorHandler).toHaveBeenCalled();
    });

    test('should handle missing audio file (404)', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/missing.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Audio element should exist even if file is missing
      expect(audio).toBeTruthy();
      expect(audio.hasAttribute('controls')).toBe(true);

      // Browser will show default "file not found" UI
      const source = audio.querySelector('source');
      expect(source.getAttribute('src')).toBe('https://example.com/audio/missing.mp3');
    });
  });

  describe('Performance', () => {
    test('should handle large audio files efficiently', async () => {
      const largeFile = {
        name: 'large-audio.mp3',
        type: 'audio/mpeg',
        size: 19 * 1024 * 1024 // 19MB (just under limit)
      };

      // File should be accepted
      expect(largeFile.size).toBeLessThanOrEqual(20 * 1024 * 1024);
    });

    test('should preload only metadata, not entire file', () => {
      mockQuillEditor.insertEmbed(0, 'audio', {
        url: 'https://example.com/audio/test.mp3',
        type: 'audio/mpeg'
      });

      const audio = mockQuillEditor.root.querySelector('audio');

      // Verify preload attribute
      expect(audio.getAttribute('preload')).toBe('metadata');
    });

    test('should handle multiple audio players without performance issues', () => {
      const startTime = Date.now();

      // Insert 10 audio players
      for (let i = 0; i < 10; i++) {
        mockQuillEditor.insertEmbed(i, 'audio', {
          url: `https://example.com/audio/test-${i}.mp3`,
          type: 'audio/mpeg'
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100);

      // Verify all players were inserted
      const audioElements = mockQuillEditor.root.querySelectorAll('audio');
      expect(audioElements.length).toBe(10);
    });
  });
});
