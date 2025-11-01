/**
 * @jest-environment jsdom
 */

/**
 * Integration Tests: Content Management Flow
 *
 * Tests the complete content management journey:
 * 1. Create quiz/workout
 * 2. Fetch and display content
 * 3. Update content
 * 4. Delete content
 * 5. Public/private visibility management
 */

// Mock Supabase client
jest.mock('../js/supabase-client.js', () => ({
  supabaseClient: {
    from: jest.fn()
  },
  getCurrentUser: jest.fn()
}));

import dataService from '../js/data-service.js';
import { supabaseClient, getCurrentUser } from '../js/supabase-client.js';

const {
  fetchQuizzes,
  fetchQuizById,
  saveQuiz,
  deleteQuiz,
  updateQuizPublicStatus,
  fetchWorkouts,
  fetchWorkoutById,
  saveWorkout,
  deleteWorkout,
  updateWorkoutPublicStatus
} = dataService;

// Helper to create mock query chain
const createMockQuery = (finalData, finalError = null) => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  };

  mockQuery.single.mockResolvedValue({ data: finalData, error: finalError });

  mockQuery.then = (resolve, reject) => {
    if (finalError) {
      return reject ? reject(finalError) : Promise.reject(finalError);
    }
    return resolve({ data: finalData, error: finalError });
  };

  mockQuery.catch = jest.fn();

  return mockQuery;
};

describe('Integration: Content Management Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quiz Management Flow', () => {
    it('should handle complete quiz lifecycle: create → fetch → update → delete', async () => {
      const mockUser = { id: 'user-123', email: 'creator@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);

      // STEP 1: Create a new quiz
      const newQuizData = {
        title: 'Spanish Basics',
        description: 'Learn basic Spanish vocabulary',
        questions: [
          {
            type: 'multiple-choice',
            question: '¿Cómo estás?',
            options: ['Good', 'Bad'],
            correctAnswer: 0
          },
          { type: 'fill-in-blank', question: 'Hola ___', correctAnswer: 'mundo' }
        ]
      };

      const savedQuiz = {
        id: 'quiz-123',
        user_id: 'user-123',
        title: 'Spanish Basics',
        description: 'Learn basic Spanish vocabulary',
        is_public: false,
        created_at: new Date().toISOString()
      };

      const quizQuery = createMockQuery(savedQuiz);
      const questionsQuery = createMockQuery([]);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'quizzes') return quizQuery;
        if (table === 'questions') return questionsQuery;
      });

      const createResult = await saveQuiz(newQuizData);

      expect(createResult).toEqual(savedQuiz);
      expect(quizQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Spanish Basics',
        description: 'Learn basic Spanish vocabulary',
        is_sample: false,
        is_public: false
      });

      // STEP 2: Fetch the quiz by ID
      const quizWithQuestions = {
        ...savedQuiz,
        questions: newQuizData.questions
      };

      const fetchQuizQuery = createMockQuery(savedQuiz);
      const fetchQuestionsQuery = createMockQuery([
        { id: 'q1', quiz_id: 'quiz-123', order: 1, data: newQuizData.questions[0] },
        { id: 'q2', quiz_id: 'quiz-123', order: 2, data: newQuizData.questions[1] }
      ]);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'quizzes') return fetchQuizQuery;
        if (table === 'questions') return fetchQuestionsQuery;
      });

      const fetchedQuiz = await fetchQuizById('quiz-123');

      expect(fetchedQuiz.id).toBe('quiz-123');
      expect(fetchedQuiz.questions).toHaveLength(2);
      expect(fetchedQuiz.questions[0].question).toBe('¿Cómo estás?');

      // STEP 3: Update quiz visibility to public
      const updatedQuiz = { ...savedQuiz, is_public: true };
      const updateQuery = createMockQuery(updatedQuiz);
      supabaseClient.from.mockReturnValue(updateQuery);

      const updateResult = await updateQuizPublicStatus('quiz-123', true);

      expect(updateResult.is_public).toBe(true);
      expect(updateQuery.update).toHaveBeenCalledWith({ is_public: true });

      // STEP 4: Delete the quiz
      const deleteQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(deleteQuery);

      await deleteQuiz('quiz-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('quizzes');
      expect(deleteQuery.delete).toHaveBeenCalled();
      expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'quiz-123');
    });

    it('should handle fetching user-only quizzes', async () => {
      const mockUser = { id: 'user-123' };
      getCurrentUser.mockResolvedValue(mockUser);

      const userQuizzes = [
        { id: 'quiz-1', title: 'My Quiz 1', user_id: 'user-123', is_public: false },
        { id: 'quiz-2', title: 'My Quiz 2', user_id: 'user-123', is_public: true }
      ];

      const mockQuery = createMockQuery(userQuizzes);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes(true);

      expect(result).toEqual(userQuizzes);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should handle fetching all public quizzes', async () => {
      const publicQuizzes = [
        { id: 'quiz-1', title: 'Public Quiz 1', is_public: true },
        { id: 'quiz-2', title: 'Public Quiz 2', is_public: true },
        { id: 'quiz-3', title: 'My Private Quiz', is_public: false, user_id: 'user-123' }
      ];

      const mockQuery = createMockQuery(publicQuizzes);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes(false);

      expect(result).toEqual(publicQuizzes);
      expect(mockQuery.eq).not.toHaveBeenCalled(); // Should not filter by user_id
    });
  });

  describe('Workout Management Flow', () => {
    it('should handle complete workout lifecycle: create → fetch → update → delete', async () => {
      const mockUser = { id: 'user-123', email: 'trainer@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);

      // STEP 1: Create a new workout
      const newWorkoutData = {
        title: 'Full Body Workout',
        description: 'Complete full body training',
        phases: [
          {
            name: 'Warm-up',
            exercises: [{ name: 'Jumping Jacks', type: 'time', duration: 30 }]
          },
          {
            name: 'Main',
            exercises: [
              { name: 'Push-ups', type: 'reps', reps: 10, sets: 3 },
              { name: 'Squats', type: 'reps', reps: 15, sets: 3 }
            ]
          }
        ]
      };

      const savedWorkout = {
        id: 'workout-123',
        user_id: 'user-123',
        title: 'Full Body Workout',
        description: 'Complete full body training',
        is_public: false,
        created_at: new Date().toISOString()
      };

      const workoutQuery = createMockQuery(savedWorkout);
      const phasesQuery = createMockQuery({ id: 'phase-123' });
      const exercisesQuery = createMockQuery([]);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'workouts') return workoutQuery;
        if (table === 'phases') return phasesQuery;
        if (table === 'exercises') return exercisesQuery;
      });

      const createResult = await saveWorkout(newWorkoutData);

      expect(createResult).toEqual(savedWorkout);
      expect(workoutQuery.insert).toHaveBeenCalled();
      expect(phasesQuery.insert).toHaveBeenCalled();

      // STEP 2: Fetch the workout by ID
      const mockWorkout = {
        id: 'workout-123',
        title: 'Full Body Workout',
        description: 'Complete full body training'
      };

      const mockPhases = [
        { id: 'phase-1', workout_id: 'workout-123', order: 1, name: 'Warm-up' },
        { id: 'phase-2', workout_id: 'workout-123', order: 2, name: 'Main' }
      ];

      const mockExercises1 = [
        { id: 'e1', phase_id: 'phase-1', order: 1, data: { name: 'Jumping Jacks', duration: 30 } }
      ];

      const mockExercises2 = [
        { id: 'e2', phase_id: 'phase-2', order: 1, data: { name: 'Push-ups', reps: 10 } },
        { id: 'e3', phase_id: 'phase-2', order: 2, data: { name: 'Squats', reps: 15 } }
      ];

      const fetchWorkoutQuery = createMockQuery(mockWorkout);
      const fetchPhasesQuery = createMockQuery(mockPhases);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'workouts') return fetchWorkoutQuery;
        if (table === 'phases') return fetchPhasesQuery;
        if (table === 'exercises') {
          const query = createMockQuery([]);
          query.eq.mockImplementation((field, value) => {
            if (field === 'phase_id') {
              if (value === 'phase-1') return createMockQuery(mockExercises1);
              if (value === 'phase-2') return createMockQuery(mockExercises2);
            }
            return query;
          });
          return query;
        }
      });

      const fetchedWorkout = await fetchWorkoutById('workout-123');

      expect(fetchedWorkout.id).toBe('workout-123');
      expect(fetchedWorkout.phases).toHaveLength(2);
      expect(fetchedWorkout.phases[0].name).toBe('Warm-up');
      expect(fetchedWorkout.phases[1].exercises).toHaveLength(2);

      // STEP 3: Update workout visibility to public
      const updatedWorkout = { ...savedWorkout, is_public: true };
      const updateQuery = createMockQuery(updatedWorkout);
      supabaseClient.from.mockReturnValue(updateQuery);

      const updateResult = await updateWorkoutPublicStatus('workout-123', true);

      expect(updateResult.is_public).toBe(true);
      expect(updateQuery.update).toHaveBeenCalledWith({ is_public: true });

      // STEP 4: Delete the workout
      const deleteQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(deleteQuery);

      await deleteWorkout('workout-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('workouts');
      expect(deleteQuery.delete).toHaveBeenCalled();
    });

    it('should handle fetching user-only workouts', async () => {
      const mockUser = { id: 'user-123' };
      getCurrentUser.mockResolvedValue(mockUser);

      const userWorkouts = [
        { id: 'workout-1', title: 'My Workout 1', user_id: 'user-123' },
        { id: 'workout-2', title: 'My Workout 2', user_id: 'user-123' }
      ];

      const mockQuery = createMockQuery(userWorkouts);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchWorkouts(true);

      expect(result).toEqual(userWorkouts);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

  describe('Error Handling in Content Management', () => {
    it('should handle unauthorized content creation', async () => {
      getCurrentUser.mockResolvedValue(null);

      await expect(saveQuiz({ title: 'Test Quiz', questions: [] })).rejects.toThrow(
        'User must be authenticated'
      );
    });

    it('should handle content not found', async () => {
      const error = new Error('Quiz not found');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchQuizById('nonexistent-id')).rejects.toThrow('Quiz not found');
    });

    it('should handle database errors during save', async () => {
      const mockUser = { id: 'user-123' };
      getCurrentUser.mockResolvedValue(mockUser);

      const error = new Error('Database connection failed');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(saveQuiz({ title: 'Test Quiz', questions: [] })).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle delete errors', async () => {
      const error = new Error('Cannot delete: quiz is referenced by other records');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(deleteQuiz('quiz-123')).rejects.toThrow('Cannot delete');
    });
  });

  describe('Content Visibility Management', () => {
    it('should toggle quiz visibility from private to public', async () => {
      const quiz = { id: 'quiz-123', is_public: false };

      // Make public
      const publicQuery = createMockQuery({ ...quiz, is_public: true });
      supabaseClient.from.mockReturnValue(publicQuery);

      const publicResult = await updateQuizPublicStatus('quiz-123', true);
      expect(publicResult.is_public).toBe(true);

      // Make private again
      const privateQuery = createMockQuery({ ...quiz, is_public: false });
      supabaseClient.from.mockReturnValue(privateQuery);

      const privateResult = await updateQuizPublicStatus('quiz-123', false);
      expect(privateResult.is_public).toBe(false);
    });

    it('should toggle workout visibility from private to public', async () => {
      const workout = { id: 'workout-123', is_public: false };

      // Make public
      const publicQuery = createMockQuery({ ...workout, is_public: true });
      supabaseClient.from.mockReturnValue(publicQuery);

      const publicResult = await updateWorkoutPublicStatus('workout-123', true);
      expect(publicResult.is_public).toBe(true);

      // Make private again
      const privateQuery = createMockQuery({ ...workout, is_public: false });
      supabaseClient.from.mockReturnValue(privateQuery);

      const privateResult = await updateWorkoutPublicStatus('workout-123', false);
      expect(privateResult.is_public).toBe(false);
    });
  });

  describe('Multi-User Content Management', () => {
    it('should allow multiple users to create their own content', async () => {
      // User 1 creates a quiz
      const user1 = { id: 'user-1', email: 'user1@example.com' };
      getCurrentUser.mockResolvedValue(user1);

      const quiz1 = {
        id: 'quiz-1',
        user_id: 'user-1',
        title: 'User 1 Quiz',
        is_public: false
      };

      const query1 = createMockQuery(quiz1);
      supabaseClient.from.mockReturnValue(query1);

      const result1 = await saveQuiz({ title: 'User 1 Quiz', questions: [] });
      expect(result1.user_id).toBe('user-1');

      // User 2 creates a quiz
      const user2 = { id: 'user-2', email: 'user2@example.com' };
      getCurrentUser.mockResolvedValue(user2);

      const quiz2 = {
        id: 'quiz-2',
        user_id: 'user-2',
        title: 'User 2 Quiz',
        is_public: false
      };

      const query2 = createMockQuery(quiz2);
      supabaseClient.from.mockReturnValue(query2);

      const result2 = await saveQuiz({ title: 'User 2 Quiz', questions: [] });
      expect(result2.user_id).toBe('user-2');

      // Verify different users
      expect(result1.user_id).not.toBe(result2.user_id);
    });

    it('should filter content by user when requested', async () => {
      const user = { id: 'user-123' };
      getCurrentUser.mockResolvedValue(user);

      const userContent = [
        { id: 'quiz-1', user_id: 'user-123', title: 'My Quiz' },
        { id: 'quiz-2', user_id: 'user-123', title: 'My Other Quiz' }
      ];

      const mockQuery = createMockQuery(userContent);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes(true); // userOnly = true

      expect(result).toHaveLength(2);
      expect(result.every(q => q.user_id === 'user-123')).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });
});
