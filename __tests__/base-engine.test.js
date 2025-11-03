/**
 * @fileoverview Testy dla base-engine.js
 */

import { BaseEngine } from '../js/engines/base-engine.js';

// Test implementation of BaseEngine
class TestEngine extends BaseEngine {
  constructor(elements) {
    super('test', elements);
    this.initCalled = false;
    this.startCalled = false;
    this.stopCalled = false;
  }

  init() {
    this.initCalled = true;
    this.isInitialized = true;
  }

  start(data, id, options = {}) {
    this.ensureInitialized();
    this._setCurrentData(data, id);
    this.startCalled = true;
  }

  stop() {
    this._clearState();
    this.stopCalled = true;
  }

  getProgress() {
    return {
      current: 1,
      total: 10,
      percentage: 10
    };
  }
}

describe('BaseEngine', () => {
  let engine;
  let mockElements;

  beforeEach(() => {
    mockElements = {
      screen: document.createElement('div'),
      button: document.createElement('button')
    };
    engine = new TestEngine(mockElements);
  });

  describe('constructor', () => {
    test('cannot instantiate BaseEngine directly', () => {
      expect(() => {
        new BaseEngine('test', {});
      }).toThrow('Cannot construct BaseEngine instances directly');
    });

    test('initializes with correct properties', () => {
      expect(engine.engineName).toBe('test');
      expect(engine.elements).toBe(mockElements);
      expect(engine.isInitialized).toBe(false);
      expect(engine.isActive).toBe(false);
      expect(engine.currentData).toBeNull();
      expect(engine.currentId).toBeNull();
    });
  });

  describe('lifecycle methods', () => {
    test('init() sets isInitialized to true', () => {
      engine.init();
      expect(engine.isInitialized).toBe(true);
      expect(engine.initCalled).toBe(true);
    });

    test('start() requires initialization', () => {
      expect(() => {
        engine.start({ test: 'data' }, 'test-id');
      }).toThrow('not initialized');
    });

    test('start() sets current data and active state', () => {
      engine.init();
      const testData = { title: 'Test', questions: [] };
      engine.start(testData, 'test-123');

      expect(engine.currentData).toBe(testData);
      expect(engine.currentId).toBe('test-123');
      expect(engine.isActive).toBe(true);
      expect(engine.startCalled).toBe(true);
    });

    test('stop() clears state', () => {
      engine.init();
      engine.start({ test: 'data' }, 'test-id');
      engine.stop();

      expect(engine.isActive).toBe(false);
      expect(engine.currentData).toBeNull();
      expect(engine.currentId).toBeNull();
      expect(engine.stopCalled).toBe(true);
    });

    test('restart() stops and starts again', () => {
      engine.init();
      const testData = { test: 'data' };
      engine.start(testData, 'test-id');

      engine.restart();

      expect(engine.stopCalled).toBe(true);
      expect(engine.startCalled).toBe(true);
      expect(engine.isActive).toBe(true);
    });

    test('restart() warns if no current data', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      engine.restart();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no current data'));
      warnSpy.mockRestore();
    });
  });

  describe('optional lifecycle methods', () => {
    test('pause() logs warning by default', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      engine.pause();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pause() not implemented'));
      warnSpy.mockRestore();
    });

    test('resume() logs warning by default', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      engine.resume();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('resume() not implemented'));
      warnSpy.mockRestore();
    });
  });

  describe('state management', () => {
    test('getProgress() returns progress object', () => {
      const progress = engine.getProgress();
      expect(progress).toEqual({
        current: 1,
        total: 10,
        percentage: 10
      });
    });

    test('saveProgress() logs by default', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      engine.saveProgress();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('saveProgress()'));
      logSpy.mockRestore();
    });

    test('loadProgress() returns null by default', () => {
      expect(engine.loadProgress()).toBeNull();
    });
  });

  describe('helper methods', () => {
    test('ensureInitialized() throws if not initialized', () => {
      expect(() => {
        engine.ensureInitialized();
      }).toThrow('not initialized');
    });

    test('ensureInitialized() does not throw if initialized', () => {
      engine.init();
      expect(() => {
        engine.ensureInitialized();
      }).not.toThrow();
    });

    test('isActivityActive() returns correct state', () => {
      expect(engine.isActivityActive()).toBe(false);
      engine.init();
      engine.start({ test: 'data' }, 'test-id');
      expect(engine.isActivityActive()).toBe(true);
    });

    test('getCurrentData() returns current data', () => {
      expect(engine.getCurrentData()).toBeNull();
      engine.init();
      const testData = { test: 'data' };
      engine.start(testData, 'test-id');
      expect(engine.getCurrentData()).toBe(testData);
    });

    test('getCurrentId() returns current id', () => {
      expect(engine.getCurrentId()).toBeNull();
      engine.init();
      engine.start({ test: 'data' }, 'test-123');
      expect(engine.getCurrentId()).toBe('test-123');
    });
  });

  describe('logging methods', () => {
    test('log() prefixes with engine name', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      engine.log('test message', 'arg1');
      expect(logSpy).toHaveBeenCalledWith('[TEST]', 'test message', 'arg1');
      logSpy.mockRestore();
    });

    test('error() prefixes with engine name', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      engine.error('error message', 'arg1');
      expect(errorSpy).toHaveBeenCalledWith('[TEST]', 'error message', 'arg1');
      errorSpy.mockRestore();
    });

    test('warn() prefixes with engine name', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      engine.warn('warning message', 'arg1');
      expect(warnSpy).toHaveBeenCalledWith('[TEST]', 'warning message', 'arg1');
      warnSpy.mockRestore();
    });
  });

  describe('abstract methods enforcement', () => {
    class IncompleteEngine extends BaseEngine {
      constructor() {
        super('incomplete', {});
      }
      // Missing required methods
    }

    test('throws error if init() not implemented', () => {
      const incomplete = new IncompleteEngine();
      expect(() => {
        incomplete.init();
      }).toThrow('must be implemented by subclass');
    });

    test('throws error if start() not implemented', () => {
      const incomplete = new IncompleteEngine();
      expect(() => {
        incomplete.start({}, 'id');
      }).toThrow('must be implemented by subclass');
    });

    test('throws error if stop() not implemented', () => {
      const incomplete = new IncompleteEngine();
      expect(() => {
        incomplete.stop();
      }).toThrow('must be implemented by subclass');
    });

    test('throws error if getProgress() not implemented', () => {
      const incomplete = new IncompleteEngine();
      expect(() => {
        incomplete.getProgress();
      }).toThrow('must be implemented by subclass');
    });
  });
});
