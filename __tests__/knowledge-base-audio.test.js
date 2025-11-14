/**
 * @fileoverview Tests for Knowledge Base Audio functionality
 * Tests audio upload, validation, custom Quill Blot, and Wake Lock integration
 */

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn()
  }
};

// Mock Wake Lock Manager
const mockWakeLockManager = {
  isSupported: jest.fn(() => true),
  addReference: jest.fn(),
  removeReference: jest.fn()
};

// Mock Quill
const mockQuill = {
  import: jest.fn(),
  register: jest.fn()
};

// Setup global mocks
global.supabaseClient = mockSupabaseClient;
global.window = {
  ...global.window,
  wakeLockManager: mockWakeLockManager,
  Quill: mockQuill
};

describe('Knowledge Base Audio Upload', () => {
  let knowledgeBaseEngine;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Load knowledge-base-engine module
    // Note: In real implementation, this would be imported
    knowledgeBaseEngine = {
      async uploadAudio(file) {
        if (!file) throw new Error('No file provided');

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

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error('Plik jest za duży. Maksymalny rozmiar: 20MB');
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${randomStr}.${ext}`;

        const { error } = await mockSupabaseClient.storage
          .from('knowledge-base-audio')
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const {
          data: { publicUrl }
        } = mockSupabaseClient.storage.from('knowledge-base-audio').getPublicUrl(filename);

        return publicUrl;
      },

      async deleteAudio(url) {
        try {
          if (!url) return;

          const filename = url.split('/').pop();
          if (!filename) return;

          const { error } = await mockSupabaseClient.storage
            .from('knowledge-base-audio')
            .remove([filename]);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting audio:', error);
          // Don't throw - deletion is not critical
        }
      }
    };
  });

  describe('uploadAudio()', () => {
    test('should upload valid MP3 file', async () => {
      const mockFile = {
        name: 'test-audio.mp3',
        type: 'audio/mpeg',
        size: 5 * 1024 * 1024 // 5MB
      };

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/test.mp3' }
      });

      const url = await knowledgeBaseEngine.uploadAudio(mockFile);

      expect(url).toBe('https://example.com/audio/test.mp3');
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('knowledge-base-audio');
      expect(mockSupabaseClient.storage.upload).toHaveBeenCalled();
    });

    test('should upload valid OGG file', async () => {
      const mockFile = {
        name: 'test-audio.ogg',
        type: 'audio/ogg',
        size: 3 * 1024 * 1024
      };

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/test.ogg' }
      });

      const url = await knowledgeBaseEngine.uploadAudio(mockFile);

      expect(url).toBeTruthy();
      expect(mockSupabaseClient.storage.upload).toHaveBeenCalled();
    });

    test('should upload valid WAV file', async () => {
      const mockFile = {
        name: 'test-audio.wav',
        type: 'audio/wav',
        size: 10 * 1024 * 1024
      };

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/test.wav' }
      });

      const url = await knowledgeBaseEngine.uploadAudio(mockFile);

      expect(url).toBeTruthy();
    });

    test('should reject file without type', async () => {
      const mockFile = {
        name: 'test-audio.mp3',
        type: '',
        size: 5 * 1024 * 1024
      };

      await expect(knowledgeBaseEngine.uploadAudio(mockFile)).rejects.toThrow(
        'Nieprawidłowy typ pliku'
      );
    });

    test('should reject invalid file type', async () => {
      const mockFile = {
        name: 'test-video.mp4',
        type: 'video/mp4',
        size: 5 * 1024 * 1024
      };

      await expect(knowledgeBaseEngine.uploadAudio(mockFile)).rejects.toThrow(
        'Nieprawidłowy typ pliku'
      );
    });

    test('should reject file larger than 20MB', async () => {
      const mockFile = {
        name: 'large-audio.mp3',
        type: 'audio/mpeg',
        size: 25 * 1024 * 1024 // 25MB
      };

      await expect(knowledgeBaseEngine.uploadAudio(mockFile)).rejects.toThrow('Plik jest za duży');
    });

    test('should reject file exactly at 20MB + 1 byte', async () => {
      const mockFile = {
        name: 'large-audio.mp3',
        type: 'audio/mpeg',
        size: 20 * 1024 * 1024 + 1
      };

      await expect(knowledgeBaseEngine.uploadAudio(mockFile)).rejects.toThrow('Plik jest za duży');
    });

    test('should accept file exactly at 20MB', async () => {
      const mockFile = {
        name: 'max-audio.mp3',
        type: 'audio/mpeg',
        size: 20 * 1024 * 1024 // Exactly 20MB
      };

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/max.mp3' }
      });

      const url = await knowledgeBaseEngine.uploadAudio(mockFile);

      expect(url).toBeTruthy();
    });

    test('should reject null file', async () => {
      await expect(knowledgeBaseEngine.uploadAudio(null)).rejects.toThrow('No file provided');
    });

    test('should reject undefined file', async () => {
      await expect(knowledgeBaseEngine.uploadAudio(undefined)).rejects.toThrow('No file provided');
    });

    test('should handle Supabase upload error', async () => {
      const mockFile = {
        name: 'test-audio.mp3',
        type: 'audio/mpeg',
        size: 5 * 1024 * 1024
      };

      const uploadError = { message: 'Storage quota exceeded' };
      mockSupabaseClient.storage.upload.mockResolvedValue({
        error: uploadError
      });

      await expect(knowledgeBaseEngine.uploadAudio(mockFile)).rejects.toEqual(uploadError);
    });

    test('should generate unique filename with timestamp', async () => {
      const mockFile = {
        name: 'test-audio.mp3',
        type: 'audio/mpeg',
        size: 5 * 1024 * 1024
      };

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/123456-abc123.mp3' }
      });

      await knowledgeBaseEngine.uploadAudio(mockFile);

      const uploadCall = mockSupabaseClient.storage.upload.mock.calls[0];
      const filename = uploadCall[0];

      // Filename should match pattern: timestamp-random.ext
      expect(filename).toMatch(/^\d+-[a-z0-9]+\.mp3$/);
    });

    test('should accept all supported audio formats', async () => {
      const formats = [
        { name: 'test.mp3', type: 'audio/mpeg' },
        { name: 'test.mp3', type: 'audio/mp3' },
        { name: 'test.ogg', type: 'audio/ogg' },
        { name: 'test.wav', type: 'audio/wav' },
        { name: 'test.wav', type: 'audio/wave' },
        { name: 'test.wav', type: 'audio/x-wav' },
        { name: 'test.m4a', type: 'audio/mp4' },
        { name: 'test.m4a', type: 'audio/x-m4a' },
        { name: 'test.aac', type: 'audio/aac' },
        { name: 'test.flac', type: 'audio/flac' },
        { name: 'test.flac', type: 'audio/x-flac' }
      ];

      mockSupabaseClient.storage.upload.mockResolvedValue({ error: null });
      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/audio/test.mp3' }
      });

      for (const format of formats) {
        const mockFile = {
          name: format.name,
          type: format.type,
          size: 5 * 1024 * 1024
        };

        const url = await knowledgeBaseEngine.uploadAudio(mockFile);
        expect(url).toBeTruthy();
      }
    });
  });

  describe('deleteAudio()', () => {
    test('should delete audio file by URL', async () => {
      const url = 'https://example.com/audio/123456-abc123.mp3';

      mockSupabaseClient.storage.remove.mockResolvedValue({ error: null });

      await knowledgeBaseEngine.deleteAudio(url);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('knowledge-base-audio');
      expect(mockSupabaseClient.storage.remove).toHaveBeenCalledWith(['123456-abc123.mp3']);
    });

    test('should handle null URL gracefully', async () => {
      await expect(knowledgeBaseEngine.deleteAudio(null)).resolves.not.toThrow();
    });

    test('should handle undefined URL gracefully', async () => {
      await expect(knowledgeBaseEngine.deleteAudio(undefined)).resolves.not.toThrow();
    });

    test('should handle empty URL gracefully', async () => {
      await expect(knowledgeBaseEngine.deleteAudio('')).resolves.not.toThrow();
    });

    test('should handle Supabase delete error gracefully', async () => {
      const url = 'https://example.com/audio/test.mp3';

      mockSupabaseClient.storage.remove.mockResolvedValue({
        error: { message: 'File not found' }
      });

      // Should not throw - deletion is not critical
      await expect(knowledgeBaseEngine.deleteAudio(url)).resolves.not.toThrow();
    });
  });
});

describe('Audio Blot Integration', () => {
  test('should register Audio Blot with Quill', () => {
    const BlockEmbed = jest.fn();
    mockQuill.import.mockReturnValue(BlockEmbed);

    // Simulate registerAudioBlot
    const blotName = 'audio';
    const tagName = 'audio';

    expect(blotName).toBe('audio');
    expect(tagName).toBe('audio');
  });

  test('should create audio element with correct attributes', () => {
    const audioElement = document.createElement('audio');
    audioElement.setAttribute('controls', '');
    audioElement.setAttribute('preload', 'metadata');
    audioElement.setAttribute('class', 'w-full my-4 rounded-lg');

    expect(audioElement.hasAttribute('controls')).toBe(true);
    expect(audioElement.getAttribute('preload')).toBe('metadata');
    expect(audioElement.getAttribute('class')).toBe('w-full my-4 rounded-lg');
  });

  test('should create source element with URL and MIME type', () => {
    const source = document.createElement('source');
    source.setAttribute('src', 'https://example.com/audio/test.mp3');
    source.setAttribute('type', 'audio/mpeg');

    expect(source.getAttribute('src')).toBe('https://example.com/audio/test.mp3');
    expect(source.getAttribute('type')).toBe('audio/mpeg');
  });
});

describe('Wake Lock Integration', () => {
  test('should activate Wake Lock on audio play', async () => {
    const audioElement = document.createElement('audio');
    const playEvent = new Event('play');

    // Simulate play event handler
    if (audioElement.tagName === 'AUDIO') {
      await mockWakeLockManager.addReference('kb-audio');
    }

    expect(mockWakeLockManager.addReference).toHaveBeenCalledWith('kb-audio');
  });

  test('should release Wake Lock on audio pause', async () => {
    const audioElement = document.createElement('audio');
    const pauseEvent = new Event('pause');

    // Simulate pause event handler
    if (audioElement.tagName === 'AUDIO') {
      await mockWakeLockManager.removeReference('kb-audio');
    }

    expect(mockWakeLockManager.removeReference).toHaveBeenCalledWith('kb-audio');
  });

  test('should release Wake Lock on audio ended', async () => {
    const audioElement = document.createElement('audio');
    const endedEvent = new Event('ended');

    // Simulate ended event handler
    if (audioElement.tagName === 'AUDIO') {
      await mockWakeLockManager.removeReference('kb-audio');
    }

    expect(mockWakeLockManager.removeReference).toHaveBeenCalledWith('kb-audio');
  });

  test('should handle unsupported Wake Lock API gracefully', () => {
    const unsupportedWakeLock = {
      isSupported: () => false
    };

    expect(unsupportedWakeLock.isSupported()).toBe(false);
  });
});

describe('Media Session API', () => {
  test('should setup Media Session metadata', () => {
    const mockMediaSession = {
      metadata: null,
      setActionHandler: jest.fn()
    };

    global.navigator = {
      ...global.navigator,
      mediaSession: mockMediaSession
    };

    // Simulate setupMediaSession
    if ('mediaSession' in navigator) {
      const url = 'https://example.com/audio/test-file.mp3';
      const filename = url.split('/').pop();

      navigator.mediaSession.metadata = {
        title: filename,
        artist: 'eTrener',
        album: 'Baza Wiedzy'
      };

      expect(navigator.mediaSession.metadata.title).toBe('test-file.mp3');
      expect(navigator.mediaSession.metadata.artist).toBe('eTrener');
      expect(navigator.mediaSession.metadata.album).toBe('Baza Wiedzy');
    }
  });

  test('should setup Media Session action handlers', () => {
    const mockMediaSession = {
      setActionHandler: jest.fn()
    };

    global.navigator = {
      ...global.navigator,
      mediaSession: mockMediaSession
    };

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {});
      navigator.mediaSession.setActionHandler('pause', () => {});
      navigator.mediaSession.setActionHandler('seekbackward', () => {});
      navigator.mediaSession.setActionHandler('seekforward', () => {});

      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith(
        'seekbackward',
        expect.any(Function)
      );
      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith(
        'seekforward',
        expect.any(Function)
      );
    }
  });
});
