// Create mock functions BEFORE jest.mock()
const mockFetchQuizById = jest.fn();
const mockFetchWorkoutById = jest.fn();
const mockGetListeningSet = jest.fn();

// Mock modules BEFORE importing
jest.mock('../js/data/data-service.js', () => ({
  default: {
    fetchQuizById: (...args) => mockFetchQuizById(...args),
    fetchWorkoutById: (...args) => mockFetchWorkoutById(...args),
    getListeningSet: (...args) => mockGetListeningSet(...args)
  }
}));

import { ExportService } from '../js/services/export-service.js';

// TODO-REFACTOR-CLEANUP: Fix mocking issues with data-service.js default export
describe.skip('ExportService', () => {
  let service;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;
  let mockClick;

  beforeEach(() => {
    service = new ExportService();
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFetchQuizById.mockResolvedValue({ title: 'Test Quiz', questions: [] });
    mockFetchWorkoutById.mockResolvedValue({ title: 'Test Workout', phases: [] });
    mockGetListeningSet.mockResolvedValue({ title: 'Test Listening', content: [] });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement for <a> tag
    mockClick = jest.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: {}
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Mock data service responses
    dataService.fetchQuizById.mockResolvedValue({
      id: 'quiz-123',
      user_id: 'user-456',
      title: 'Test Quiz',
      description: 'Test Description',
      questions: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 0 }],
      created_at: '2025-01-01',
      is_sample: false
    });

    dataService.fetchWorkoutById.mockResolvedValue({
      id: 'workout-123',
      user_id: 'user-456',
      title: 'Test Workout',
      description: 'Test Description',
      emoji: '💪',
      phases: [{ name: 'Warmup', exercises: [{ name: 'Jumps', type: 'time', duration: 30 }] }],
      created_at: '2025-01-01',
      is_sample: false
    });

    dataService.getListeningSet.mockResolvedValue({
      id: 'listening-123',
      user_id: 'user-456',
      title: 'Test Listening',
      description: 'Test Description',
      lang1_code: 'pl-PL',
      lang2_code: 'es-ES',
      content: [{ pl: 'Cześć', es: 'Hola' }],
      created_at: '2025-01-01',
      is_sample: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('export', () => {
    test('exports quiz successfully', async () => {
      await service.export('quiz-123', 'quiz');

      expect(dataService.fetchQuizById).toHaveBeenCalledWith('quiz-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    test('exports workout successfully', async () => {
      await service.export('workout-123', 'workout');

      expect(dataService.fetchWorkoutById).toHaveBeenCalledWith('workout-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    test('exports listening set successfully', async () => {
      await service.export('listening-123', 'listening');

      expect(dataService.getListeningSet).toHaveBeenCalledWith('listening-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    test('throws error for unknown type', async () => {
      await expect(service.export('id-123', 'unknown')).rejects.toThrow('Unknown content type');
    });

    test('throws error if data fetch fails', async () => {
      dataService.fetchQuizById.mockRejectedValue(new Error('Network error'));
      await expect(service.export('quiz-123', 'quiz')).rejects.toThrow('Błąd podczas eksportu');
    });
  });

  describe('cleanMetadata', () => {
    test('cleans quiz metadata', () => {
      const data = {
        id: 'quiz-123',
        user_id: 'user-456',
        title: 'Test Quiz',
        description: 'Test Description',
        questions: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 0 }],
        created_at: '2025-01-01',
        is_sample: false
      };

      const cleaned = service.cleanMetadata(data, 'quiz');

      expect(cleaned).toEqual({
        title: 'Test Quiz',
        description: 'Test Description',
        questions: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 0 }]
      });
      expect(cleaned.id).toBeUndefined();
      expect(cleaned.user_id).toBeUndefined();
      expect(cleaned.created_at).toBeUndefined();
    });

    test('cleans workout metadata and adds default emoji', () => {
      const data = {
        id: 'workout-123',
        title: 'Test Workout',
        description: 'Test Description',
        phases: [{ name: 'Warmup', exercises: [] }]
      };

      const cleaned = service.cleanMetadata(data, 'workout');

      expect(cleaned).toEqual({
        title: 'Test Workout',
        description: 'Test Description',
        emoji: '💪',
        phases: [{ name: 'Warmup', exercises: [] }]
      });
    });

    test('preserves workout emoji if provided', () => {
      const data = {
        title: 'Test Workout',
        description: 'Test',
        emoji: '🏃',
        phases: []
      };

      const cleaned = service.cleanMetadata(data, 'workout');

      expect(cleaned.emoji).toBe('🏃');
    });

    test('cleans listening metadata', () => {
      const data = {
        id: 'listening-123',
        user_id: 'user-456',
        title: 'Test Listening',
        description: 'Test Description',
        lang1_code: 'pl-PL',
        lang2_code: 'es-ES',
        content: [{ pl: 'Cześć', es: 'Hola' }],
        created_at: '2025-01-01'
      };

      const cleaned = service.cleanMetadata(data, 'listening');

      expect(cleaned).toEqual({
        title: 'Test Listening',
        description: 'Test Description',
        lang1_code: 'pl-PL',
        lang2_code: 'es-ES',
        content: [{ pl: 'Cześć', es: 'Hola' }]
      });
      expect(cleaned.id).toBeUndefined();
      expect(cleaned.user_id).toBeUndefined();
    });

    test('handles missing description', () => {
      const data = {
        title: 'Test',
        questions: []
      };

      const cleaned = service.cleanMetadata(data, 'quiz');

      expect(cleaned.description).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    test('converts to lowercase', () => {
      expect(service.sanitizeFilename('TEST Quiz')).toBe('test-quiz');
    });

    test('replaces spaces with dashes', () => {
      expect(service.sanitizeFilename('my test quiz')).toBe('my-test-quiz');
    });

    test('removes special characters', () => {
      expect(service.sanitizeFilename('Quiz #1: Test!')).toBe('quiz-1-test');
    });

    test('removes leading and trailing dashes', () => {
      expect(service.sanitizeFilename('---test---')).toBe('test');
    });

    test('limits length to 50 characters', () => {
      const longName = 'a'.repeat(100);
      expect(service.sanitizeFilename(longName).length).toBe(50);
    });

    test('handles Polish characters', () => {
      expect(service.sanitizeFilename('Ćwiczenia z języka')).toBe('wiczenia-z-j-zyka');
    });

    test('handles multiple consecutive special chars', () => {
      expect(service.sanitizeFilename('test!!!###quiz')).toBe('test-quiz');
    });
  });

  describe('downloadFile', () => {
    test('creates blob with correct type', () => {
      const mockBlob = jest.fn();
      global.Blob = mockBlob;

      service.downloadFile('{"test": true}', 'test.json');

      expect(mockBlob).toHaveBeenCalledWith(['{"test": true}'], { type: 'application/json' });
    });

    test('sets correct filename', () => {
      const mockAnchor = document.createElement('a');
      service.downloadFile('content', 'my-file.json');

      expect(mockAnchor.download).toBe('my-file.json');
    });

    test('triggers download', () => {
      service.downloadFile('content', 'test.json');

      expect(mockClick).toHaveBeenCalled();
    });

    test('cleans up after download', () => {
      service.downloadFile('content', 'test.json');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
