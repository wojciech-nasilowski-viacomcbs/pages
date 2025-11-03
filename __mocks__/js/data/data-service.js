/**
 * Mock dla data-service.js
 * Używany w testach: import-service, export-service, ai-service
 */

const dataService = {
  // Quiz methods
  saveQuiz: jest.fn(),
  fetchQuizById: jest.fn(),
  fetchQuizzes: jest.fn(),
  deleteQuiz: jest.fn(),

  // Workout methods
  saveWorkout: jest.fn(),
  fetchWorkoutById: jest.fn(),
  fetchWorkouts: jest.fn(),
  deleteWorkout: jest.fn(),

  // Listening methods
  createListeningSet: jest.fn(),
  getListeningSet: jest.fn(),
  getListeningSets: jest.fn(),
  deleteListeningSet: jest.fn(),

  // Public status
  updateQuizPublicStatus: jest.fn(),
  updateWorkoutPublicStatus: jest.fn(),
  updateListeningSetPublicStatus: jest.fn()
};

export default dataService;
