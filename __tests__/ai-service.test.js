// Mock modules BEFORE importing
jest.mock('../js/services/validation-service.js');
jest.mock('../js/data-service.js', () => ({
  default: {
    saveQuiz: jest.fn(),
    saveWorkout: jest.fn(),
    createListeningSet: jest.fn()
  }
}));

import { AIService } from '../js/services/ai-service.js';
import { validationService } from '../js/services/validation-service.js';

// Get mocked dataService
const dataService = jest.requireMock('../js/data-service.js').default;

// Mock global fetch
global.fetch = jest.fn();

// Mock window objects (before importing service)
Object.defineProperty(window, 'AI_PROMPTS', {
  writable: true,
  value: {
    quiz: 'Generate quiz: {USER_PROMPT}',
    workout: 'Generate workout: {USER_PROMPT}',
    listening:
      'Generate listening: {USER_PROMPT} with {LANG1_CODE}/{LANG1_KEY} and {LANG2_CODE}/{LANG2_KEY}'
  }
});

Object.defineProperty(window, 'APP_CONFIG', {
  writable: true,
  value: {
    OPENROUTER_API_KEY: 'test-api-key'
  }
});

describe('AIService', () => {
  let service;

  beforeEach(() => {
    service = new AIService();
    validationService.validate.mockReturnValue([]);
    dataService.saveQuiz.mockResolvedValue({ id: 'quiz-123', title: 'Test Quiz' });
    dataService.saveWorkout.mockResolvedValue({ id: 'workout-123', title: 'Test Workout' });
    dataService.createListeningSet.mockResolvedValue({
      id: 'listening-123',
      title: 'Test Listening'
    });
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    test('generates quiz successfully', async () => {
      const mockQuiz = {
        title: 'Test Quiz',
        questions: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 0 }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockQuiz) } }]
        })
      });

      const result = await service.generate('Create a quiz', 'quiz', { isPublic: true });

      expect(result.id).toBe('quiz-123');
      expect(validationService.validate).toHaveBeenCalledWith(mockQuiz, 'quiz');
      expect(dataService.saveQuiz).toHaveBeenCalledWith(mockQuiz, true);
    });

    test('generates workout successfully', async () => {
      const mockWorkout = {
        title: 'Test Workout',
        phases: [{ name: 'Warmup', exercises: [{ name: 'Jumps', type: 'time', duration: 30 }] }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockWorkout) } }]
        })
      });

      const result = await service.generate('Create a workout', 'workout');

      expect(result.id).toBe('workout-123');
      expect(validationService.validate).toHaveBeenCalledWith(mockWorkout, 'workout');
      expect(dataService.saveWorkout).toHaveBeenCalledWith(mockWorkout, false);
    });

    test('generates listening set successfully', async () => {
      const mockListening = {
        title: 'Test Listening',
        description: 'Test',
        lang1_code: 'pl-PL',
        lang2_code: 'es-ES',
        content: [{ pl: 'Cześć', es: 'Hola' }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockListening) } }]
        })
      });

      const result = await service.generate('Create listening', 'listening', {
        lang1Code: 'pl-PL',
        lang2Code: 'es-ES',
        isPublic: true
      });

      expect(result.id).toBe('listening-123');
      expect(validationService.validate).toHaveBeenCalledWith(mockListening, 'listening');
      expect(dataService.createListeningSet).toHaveBeenCalledWith(
        mockListening.title,
        mockListening.description,
        mockListening.lang1_code,
        mockListening.lang2_code,
        mockListening.content,
        true
      );
    });

    test('throws error for empty prompt', async () => {
      await expect(service.generate('', 'quiz')).rejects.toThrow('Opisz co chcesz wygenerować');
    });

    test('throws error for listening without languages', async () => {
      await expect(service.generate('Create listening', 'listening')).rejects.toThrow(
        'Wybierz oba języki'
      );
    });

    test('throws error for listening with same languages', async () => {
      await expect(
        service.generate('Create listening', 'listening', {
          lang1Code: 'pl-PL',
          lang2Code: 'pl-PL'
        })
      ).rejects.toThrow('Języki muszą być różne');
    });

    test('throws error for validation failures', async () => {
      validationService.validate.mockReturnValue(['Validation Error']);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"title": "Test"}' } }]
        })
      });

      await expect(service.generate('Create quiz', 'quiz')).rejects.toThrow(
        'Wygenerowane dane są nieprawidłowe'
      );
    });

    test('throws error for unknown content type', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"title": "Test"}' } }]
        })
      });

      await expect(service.generate('Create something', 'unknown')).rejects.toThrow(
        'Unknown content type'
      );
    });
  });

  describe('callAI', () => {
    test('replaces USER_PROMPT in template', async () => {
      const mockQuiz = { title: 'Test Quiz', questions: [] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockQuiz) } }]
        })
      });

      await service.callAI('My custom prompt', 'quiz');

      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messages[0].content).toContain('My custom prompt');
    });

    test('replaces language codes for listening', async () => {
      const mockListening = {
        title: 'Test',
        lang1_code: 'pl-PL',
        lang2_code: 'es-ES',
        content: []
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockListening) } }]
        })
      });

      await service.callAI('Create listening', 'listening', {
        lang1Code: 'pl-PL',
        lang2Code: 'es-ES'
      });

      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messages[0].content).toContain('pl-PL');
      expect(body.messages[0].content).toContain('es-ES');
      expect(body.messages[0].content).toContain('pl');
      expect(body.messages[0].content).toContain('es');
    });
  });

  describe('shouldUseVercelFunction', () => {
    test('returns true for vercel.app domain', () => {
      // Spy on window.location getters
      jest.spyOn(window.location, 'hostname', 'get').mockReturnValue('my-app.vercel.app');
      jest.spyOn(window.location, 'protocol', 'get').mockReturnValue('https:');

      expect(service.shouldUseVercelFunction()).toBe(true);

      jest.restoreAllMocks();
    });

    test('returns false for localhost', () => {
      jest.spyOn(window.location, 'hostname', 'get').mockReturnValue('localhost');
      jest.spyOn(window.location, 'protocol', 'get').mockReturnValue('http:');

      expect(service.shouldUseVercelFunction()).toBe(false);

      jest.restoreAllMocks();
    });

    test('returns false for file protocol', () => {
      jest.spyOn(window.location, 'hostname', 'get').mockReturnValue('');
      jest.spyOn(window.location, 'protocol', 'get').mockReturnValue('file:');

      expect(service.shouldUseVercelFunction()).toBe(false);

      jest.restoreAllMocks();
    });
  });

  describe('parseAIResponse', () => {
    test('parses valid JSON', () => {
      const json = '{"title": "Test"}';
      const result = service.parseAIResponse(json);
      expect(result.title).toBe('Test');
    });

    test('removes markdown json wrapper', () => {
      const json = '```json\n{"title": "Test"}\n```';
      const result = service.parseAIResponse(json);
      expect(result.title).toBe('Test');
    });

    test('removes markdown wrapper without json tag', () => {
      const json = '```\n{"title": "Test"}\n```';
      const result = service.parseAIResponse(json);
      expect(result.title).toBe('Test');
    });

    test('throws error for HTML response', () => {
      const html = '<!DOCTYPE html><html><body>Error</body></html>';
      expect(() => service.parseAIResponse(html)).toThrow(
        'AI zwróciło nieprawidłową odpowiedź (HTML)'
      );
    });

    test('throws error for invalid JSON', () => {
      const invalid = 'not json at all';
      expect(() => service.parseAIResponse(invalid)).toThrow(
        'AI zwróciło nieprawidłowy format JSON'
      );
    });
  });

  describe('callOpenRouterDirect', () => {
    beforeEach(() => {
      global.fetch.mockClear();
    });

    test('throws error if API key is missing', async () => {
      window.APP_CONFIG.OPENROUTER_API_KEY = 'YOUR_OPENROUTER_API_KEY';
      await expect(service.callOpenRouterDirect('test prompt')).rejects.toThrow(
        'Brak klucza OpenRouter API'
      );
    });

    test('calls OpenRouter API with correct parameters', async () => {
      window.APP_CONFIG.OPENROUTER_API_KEY = 'test-api-key';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"title": "Test"}' } }]
        })
      });

      const result = await service.callOpenRouterDirect('test prompt');

      expect(result).toBe('{"title": "Test"}');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key'
          })
        })
      );
    });

    test('throws error if API returns error', async () => {
      window.APP_CONFIG.OPENROUTER_API_KEY = 'test-api-key';

      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      await expect(service.callOpenRouterDirect('test prompt')).rejects.toThrow('Invalid API key');
    });

    test('throws error if response has no content', async () => {
      window.APP_CONFIG.OPENROUTER_API_KEY = 'test-api-key';

      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] })
      });

      await expect(service.callOpenRouterDirect('test prompt')).rejects.toThrow(
        'Brak odpowiedzi od AI'
      );
    });
  });

  describe('callVercelFunction', () => {
    beforeEach(() => {
      global.fetch.mockClear();
    });

    test('calls Vercel Function with correct parameters', async () => {
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: '{"title": "Test"}' })
      });

      const result = await service.callVercelFunction('system prompt', 'user prompt', 'quiz');

      expect(result).toBe('{"title": "Test"}');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            systemPrompt: 'system prompt',
            userPrompt: 'user prompt',
            contentType: 'quiz'
          })
        })
      );
    });

    test('throws error if Vercel Function returns error', async () => {
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      await expect(service.callVercelFunction('system', 'user', 'quiz')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    test('throws error if response has no content', async () => {
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await expect(service.callVercelFunction('system', 'user', 'quiz')).rejects.toThrow(
        'Brak odpowiedzi od serwera'
      );
    });
  });
});
