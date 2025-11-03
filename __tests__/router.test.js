/**
 * @fileoverview Testy dla router.js
 * @jest-environment jsdom
 */

import { Router, Screen } from '../js/core/router.js';
import { appState } from '../js/state/app-state.js';

describe('Screen', () => {
  let mockElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.classList.add('hidden');
  });

  test('creates screen with correct properties', () => {
    const screen = new Screen('test', mockElement, { isActivity: true });

    expect(screen.name).toBe('test');
    expect(screen.element).toBe(mockElement);
    expect(screen.isActivity).toBe(true);
  });

  test('defaults isActivity to false', () => {
    const screen = new Screen('test', mockElement);

    expect(screen.isActivity).toBe(false);
  });

  test('show() removes hidden class and calls onShow', () => {
    const screen = new Screen('test', mockElement);
    screen.onShow = jest.fn();

    screen.show({ data: 'test' });

    expect(mockElement.classList.contains('hidden')).toBe(false);
    expect(screen.onShow).toHaveBeenCalledWith({ data: 'test' });
  });

  test('hide() adds hidden class and calls onHide', () => {
    const screen = new Screen('test', mockElement);
    screen.onHide = jest.fn();
    mockElement.classList.remove('hidden');

    screen.hide();

    expect(mockElement.classList.contains('hidden')).toBe(true);
    expect(screen.onHide).toHaveBeenCalled();
  });
});

describe('Router', () => {
  let router;
  let mainScreen;
  let quizScreen;
  let workoutScreen;
  let mainElement;
  let quizElement;
  let workoutElement;

  beforeEach(() => {
    // Create mock elements
    mainElement = document.createElement('div');
    quizElement = document.createElement('div');
    workoutElement = document.createElement('div');

    // Create screens
    mainScreen = new Screen('main', mainElement);
    quizScreen = new Screen('quiz', quizElement, { isActivity: true });
    workoutScreen = new Screen('workout', workoutElement, { isActivity: true });

    // Create router with screens
    const screens = new Map([
      ['main', mainScreen],
      ['quiz', quizScreen],
      ['workout', workoutScreen]
    ]);

    router = new Router(screens);

    // Mock appState.setState
    jest.spyOn(appState, 'setState');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    test('creates router with screens', () => {
      expect(router.screens.size).toBe(3);
      expect(router.currentScreen).toBeNull();
      expect(router.history).toEqual([]);
    });

    test('creates empty router', () => {
      const emptyRouter = new Router();
      expect(emptyRouter.screens.size).toBe(0);
    });
  });

  describe('registerScreen', () => {
    test('registers new screen', () => {
      const newElement = document.createElement('div');
      const newScreen = new Screen('more', newElement);

      router.registerScreen('more', newScreen);

      expect(router.screens.has('more')).toBe(true);
      expect(router.screens.get('more')).toBe(newScreen);
    });
  });

  describe('navigate', () => {
    test('navigates to screen successfully', () => {
      const result = router.navigate('main');

      expect(result).toBe(true);
      expect(router.currentScreen).toBe(mainScreen);
      expect(mainElement.classList.contains('hidden')).toBe(false);
    });

    test('returns false for non-existent screen', () => {
      const result = router.navigate('nonexistent');

      expect(result).toBe(false);
      expect(router.currentScreen).toBeNull();
    });

    test('updates appState when navigating', () => {
      router.navigate('main');

      expect(appState.setState).toHaveBeenCalledWith({
        currentScreen: 'main',
        isActivity: false,
        showTabBar: true
      });
    });

    test('hides tab bar for activity screens', () => {
      router.navigate('quiz');

      expect(appState.setState).toHaveBeenCalledWith({
        currentScreen: 'quiz',
        isActivity: true,
        showTabBar: false
      });
    });

    test('hides previous screen when navigating', () => {
      router.navigate('main');
      mainElement.classList.remove('hidden');

      router.navigate('quiz');

      expect(mainElement.classList.contains('hidden')).toBe(true);
      expect(quizElement.classList.contains('hidden')).toBe(false);
    });

    test('adds previous screen to history', () => {
      router.navigate('main');
      router.navigate('quiz');

      expect(router.history).toEqual(['main']);
    });

    test('does not add to history when navigating to same screen', () => {
      router.navigate('main');
      router.navigate('main');

      expect(router.history).toEqual([]);
    });

    test('passes options to screen.show()', () => {
      jest.spyOn(quizScreen, 'show');

      router.navigate('quiz', { quizId: '123', data: { title: 'Test' } });

      expect(quizScreen.show).toHaveBeenCalledWith({ quizId: '123', data: { title: 'Test' } });
    });
  });

  describe('back', () => {
    test('navigates to previous screen', () => {
      router.navigate('main');
      router.navigate('quiz');
      router.navigate('workout');

      const result = router.back();

      expect(result).toBe(true);
      expect(router.getCurrentScreenName()).toBe('quiz');
      expect(router.history).toEqual(['main']);
    });

    test('navigates to main when history is empty', () => {
      const result = router.back();

      expect(result).toBe(true);
      expect(router.getCurrentScreenName()).toBe('main');
    });

    test('removes screen from history after going back', () => {
      router.navigate('main');
      router.navigate('quiz');
      expect(router.history).toEqual(['main']);

      router.back();
      expect(router.history).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    test('clears navigation history', () => {
      router.navigate('main');
      router.navigate('quiz');
      router.navigate('workout');

      router.clearHistory();

      expect(router.history).toEqual([]);
    });
  });

  describe('getCurrentScreen', () => {
    test('returns current screen', () => {
      router.navigate('quiz');

      expect(router.getCurrentScreen()).toBe(quizScreen);
    });

    test('returns null when no screen is active', () => {
      expect(router.getCurrentScreen()).toBeNull();
    });
  });

  describe('getCurrentScreenName', () => {
    test('returns current screen name', () => {
      router.navigate('workout');

      expect(router.getCurrentScreenName()).toBe('workout');
    });

    test('returns null when no screen is active', () => {
      expect(router.getCurrentScreenName()).toBeNull();
    });
  });

  describe('hasScreen', () => {
    test('returns true for registered screen', () => {
      expect(router.hasScreen('main')).toBe(true);
      expect(router.hasScreen('quiz')).toBe(true);
    });

    test('returns false for unregistered screen', () => {
      expect(router.hasScreen('nonexistent')).toBe(false);
    });
  });

  describe('getScreenNames', () => {
    test('returns array of screen names', () => {
      const names = router.getScreenNames();

      expect(names).toEqual(expect.arrayContaining(['main', 'quiz', 'workout']));
      expect(names.length).toBe(3);
    });
  });

  describe('complex navigation flow', () => {
    test('handles multiple navigations and back', () => {
      // Navigate: main -> quiz -> workout
      router.navigate('main');
      router.navigate('quiz');
      router.navigate('workout');

      expect(router.getCurrentScreenName()).toBe('workout');
      expect(router.history).toEqual(['main', 'quiz']);

      // Back: workout -> quiz
      router.back();
      expect(router.getCurrentScreenName()).toBe('quiz');
      expect(router.history).toEqual(['main']);

      // Back: quiz -> main
      router.back();
      expect(router.getCurrentScreenName()).toBe('main');
      expect(router.history).toEqual([]);

      // Back: main -> main (no history)
      router.back();
      expect(router.getCurrentScreenName()).toBe('main');
    });

    test('handles navigation with options', () => {
      jest.spyOn(quizScreen, 'onShow');

      router.navigate('quiz', { quizId: '123', startFromQuestion: 5 });

      expect(quizScreen.onShow).toHaveBeenCalledWith({
        quizId: '123',
        startFromQuestion: 5
      });
    });
  });
});
