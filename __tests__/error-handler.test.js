import { ErrorHandler } from '../js/services/error-handler.js';

describe('ErrorHandler', () => {
  let handler;
  let consoleErrorSpy;
  let alertSpy;

  beforeEach(() => {
    handler = new ErrorHandler();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Clear window mocks
    delete window.showToast;
    delete window.uiManager;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  describe('handle', () => {
    test('logs error to console', () => {
      const error = new Error('Test error');
      handler.handle(error, { context: 'Test', showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Test:', error);
    });

    test('shows error to user by default', () => {
      const error = new Error('Test error');
      handler.handle(error, { context: 'Test' });

      expect(alertSpy).toHaveBeenCalledWith('Test\n\nTest error');
    });

    test('does not show error to user if showToUser=false', () => {
      const error = new Error('Test error');
      handler.handle(error, { context: 'Test', showToUser: false });

      expect(alertSpy).not.toHaveBeenCalled();
    });

    test('calls onError callback if provided', () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      handler.handle(error, { context: 'Test', showToUser: false, onError });

      expect(onError).toHaveBeenCalledWith(error);
    });

    test('handles string errors', () => {
      handler.handle('String error', { context: 'Test', showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Test:', 'String error');
    });

    test('uses default context if not provided', () => {
      handler.handle(new Error('Test'), { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Operacja:', expect.any(Error));
    });
  });

  describe('showUserMessage', () => {
    test('uses showToast if available', () => {
      const showToast = jest.fn();
      window.showToast = showToast;

      handler.showUserMessage('Test', 'Error message');

      expect(showToast).toHaveBeenCalledWith('Test: Error message', 'error');
      expect(alertSpy).not.toHaveBeenCalled();
    });

    test('uses uiManager.showError if showToast not available', () => {
      const showError = jest.fn();
      window.uiManager = { showError };

      handler.showUserMessage('Test', 'Error message');

      expect(showError).toHaveBeenCalledWith('Test: Error message');
      expect(alertSpy).not.toHaveBeenCalled();
    });

    test('falls back to alert if no other method available', () => {
      handler.showUserMessage('Test', 'Error message');

      expect(alertSpy).toHaveBeenCalledWith('Test\n\nError message');
    });
  });

  describe('handleNetworkError', () => {
    test('detects fetch errors', () => {
      const error = new Error('Failed to fetch');
      handler.handleNetworkError(error, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Błąd połączenia:',
        expect.objectContaining({
          message: 'Sprawdź połączenie z internetem i spróbuj ponownie'
        })
      );
    });

    test('detects network errors', () => {
      const error = new Error('Network request failed');
      handler.handleNetworkError(error, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Błąd połączenia:',
        expect.objectContaining({
          message: 'Sprawdź połączenie z internetem i spróbuj ponownie'
        })
      );
    });

    test('handles non-network errors normally', () => {
      const error = new Error('Other error');
      handler.handleNetworkError(error, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Błąd połączenia:', error);
    });
  });

  describe('handleValidationErrors', () => {
    test('formats multiple validation errors', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      handler.handleValidationErrors(errors, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Błąd walidacji:',
        expect.objectContaining({
          message: expect.stringContaining('Error 1')
        })
      );
    });

    test('shows formatted errors to user', () => {
      const errors = ['Error 1', 'Error 2'];
      handler.handleValidationErrors(errors);

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Error 1'));
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Error 2'));
    });
  });

  describe('handleAuthError', () => {
    test('handles authorization errors', () => {
      const error = new Error('Unauthorized');
      handler.handleAuthError(error, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Błąd autoryzacji:', error);
    });

    test('calls onError callback', () => {
      const error = new Error('Unauthorized');
      const onError = jest.fn();
      handler.handleAuthError(error, { showToUser: false, onError });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleUnexpectedError', () => {
    test('logs detailed error info', () => {
      const error = new Error('Unexpected');
      error.stack = 'Stack trace';
      handler.handleUnexpectedError(error, { showToUser: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '🔥 Unexpected error details:',
        expect.objectContaining({
          message: 'Unexpected',
          stack: 'Stack trace',
          name: 'Error'
        })
      );
    });

    test('shows user-friendly message', () => {
      const error = new Error('Complex technical error');
      handler.handleUnexpectedError(error);

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Coś poszło nie tak'));
    });
  });

  describe('wrap', () => {
    test('returns function result on success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await handler.wrap(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    test('handles errors and returns undefined', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const result = await handler.wrap(fn, { showToUser: false });

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('applies error handling options', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const onError = jest.fn();

      await handler.wrap(fn, { context: 'Custom context', showToUser: false, onError });

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Custom context:', expect.any(Error));
      expect(onError).toHaveBeenCalled();
    });
  });
});
