/**
 * @jest-environment jsdom
 */

// Mock Supabase client BEFORE importing data-service
jest.mock('../js/supabase-client.js', () => ({
  supabaseClient: {
    from: jest.fn()
  },
  getCurrentUser: jest.fn()
}));

// Now import modules (after mocking)
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
  updateWorkoutPublicStatus,
  getListeningSets,
  getListeningSet,
  createListeningSet,
  deleteListeningSet,
  updateListeningSetPublicStatus,
  getKnowledgeBaseArticles,
  getKnowledgeBaseArticle,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle
} = dataService;

// Helper to create mock query chain that works with Supabase's fluent API
const createMockQuery = (finalData, finalError = null) => {
  // Create a thenable object that acts like a Promise
  const createThenable = (data, error) => {
    const thenable = {
      then: jest.fn(resolve => {
        if (error) {
          return Promise.reject(error);
        }
        return Promise.resolve({ data, error });
      }),
      catch: jest.fn()
    };
    return thenable;
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  };

  // Make single() return a resolved promise
  mockQuery.single.mockResolvedValue({ data: finalData, error: finalError });

  // Make the query itself awaitable (for queries without .single())
  mockQuery.then = (resolve, reject) => {
    if (finalError) {
      return reject ? reject(finalError) : Promise.reject(finalError);
    }
    return resolve({ data: finalData, error: finalError });
  };

  mockQuery.catch = jest.fn();

  return mockQuery;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Data Service - Quizzes', () => {
  // ============================================
  // FETCH QUIZZES
  // ============================================

  describe('fetchQuizzes', () => {
    it('should fetch all quizzes (public + user)', async () => {
      const mockQuizzes = [
        { id: '1', title: 'Quiz 1', is_public: true },
        { id: '2', title: 'Quiz 2', is_public: false }
      ];

      const mockQuery = createMockQuery(mockQuizzes);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes();

      expect(result).toEqual(mockQuizzes);
      expect(supabaseClient.from).toHaveBeenCalledWith('quizzes');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should fetch only user quizzes when userOnly=true', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuizzes = [{ id: '1', title: 'My Quiz', user_id: 'user-123' }];

      getCurrentUser.mockResolvedValue(mockUser);

      const mockQuery = createMockQuery(mockQuizzes);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes(true);

      expect(result).toEqual(mockQuizzes);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(getCurrentUser).toHaveBeenCalled();
    });

    it('should throw error when userOnly=true but user not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);

      await expect(fetchQuizzes(true)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchQuizzes()).rejects.toThrow('Database error');
    });

    it('should return empty array when no quizzes found', async () => {
      const mockQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchQuizzes();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // FETCH QUIZ BY ID
  // ============================================

  describe('fetchQuizById', () => {
    it('should fetch a quiz with its questions', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: 'Test Description'
      };

      const mockQuestions = [
        { id: 'q1', quiz_id: 'quiz-123', order: 1, data: { question: 'Q1', answer: 'A1' } },
        { id: 'q2', quiz_id: 'quiz-123', order: 2, data: { question: 'Q2', answer: 'A2' } }
      ];

      const quizQuery = createMockQuery(mockQuiz);
      const questionsQuery = createMockQuery(mockQuestions);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'quizzes') return quizQuery;
        if (table === 'questions') return questionsQuery;
      });

      const result = await fetchQuizById('quiz-123');

      expect(result).toEqual({
        ...mockQuiz,
        questions: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' }
        ]
      });

      expect(supabaseClient.from).toHaveBeenCalledWith('quizzes');
      expect(supabaseClient.from).toHaveBeenCalledWith('questions');
      expect(quizQuery.eq).toHaveBeenCalledWith('id', 'quiz-123');
      expect(questionsQuery.eq).toHaveBeenCalledWith('quiz_id', 'quiz-123');
      expect(questionsQuery.order).toHaveBeenCalledWith('order', { ascending: true });
    });

    it('should handle quiz not found', async () => {
      const error = new Error('Quiz not found');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchQuizById('nonexistent')).rejects.toThrow('Quiz not found');
    });
  });

  // ============================================
  // SAVE QUIZ
  // ============================================

  describe('saveQuiz', () => {
    it('should save a new quiz with questions', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuizData = {
        title: 'New Quiz',
        description: 'Test Description',
        questions: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' }
        ]
      };

      const mockSavedQuiz = {
        id: 'quiz-123',
        user_id: 'user-123',
        title: 'New Quiz',
        description: 'Test Description'
      };

      getCurrentUser.mockResolvedValue(mockUser);

      const quizQuery = createMockQuery(mockSavedQuiz);
      const questionsQuery = createMockQuery([]);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'quizzes') return quizQuery;
        if (table === 'questions') return questionsQuery;
      });

      const result = await saveQuiz(mockQuizData);

      expect(result).toEqual(mockSavedQuiz);
      expect(getCurrentUser).toHaveBeenCalled();
      expect(quizQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'New Quiz',
        description: 'Test Description',
        is_sample: false,
        is_public: false
      });

      // Check that questions were inserted
      expect(questionsQuery.insert).toHaveBeenCalled();
    });

    it('should throw error when user not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);

      await expect(saveQuiz({ title: 'Test' })).rejects.toThrow('User must be authenticated');
    });

    it('should support isPublic flag', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuizData = {
        title: 'Public Quiz',
        questions: []
      };

      getCurrentUser.mockResolvedValue(mockUser);

      const mockQuery = createMockQuery({ id: 'quiz-123' });
      supabaseClient.from.mockReturnValue(mockQuery);

      await saveQuiz(mockQuizData, true);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ is_public: true }));
    });
  });

  // ============================================
  // UPDATE QUIZ PUBLIC STATUS
  // ============================================

  describe('updateQuizPublicStatus', () => {
    it('should update quiz public status', async () => {
      const mockUpdatedQuiz = {
        id: 'quiz-123',
        is_public: true
      };

      const mockQuery = createMockQuery(mockUpdatedQuiz);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateQuizPublicStatus('quiz-123', true);

      expect(result).toEqual(mockUpdatedQuiz);
      expect(supabaseClient.from).toHaveBeenCalledWith('quizzes');
      expect(mockQuery.update).toHaveBeenCalledWith({ is_public: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'quiz-123');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(updateQuizPublicStatus('quiz-123', true)).rejects.toThrow('Update failed');
    });
  });

  // ============================================
  // DELETE QUIZ
  // ============================================

  describe('deleteQuiz', () => {
    it('should delete a quiz', async () => {
      const mockQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(mockQuery);

      await deleteQuiz('quiz-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('quizzes');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'quiz-123');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      const mockQuery = createMockQuery(null, error);
      supabaseClient.from.mockReturnValue(mockQuery);

      await expect(deleteQuiz('quiz-123')).rejects.toThrow('Delete failed');
    });
  });
});

describe('Data Service - Workouts', () => {
  // ============================================
  // FETCH WORKOUTS
  // ============================================

  describe('fetchWorkouts', () => {
    it('should fetch all workouts', async () => {
      const mockWorkouts = [
        { id: '1', title: 'Workout 1', is_public: true },
        { id: '2', title: 'Workout 2', is_public: false }
      ];

      const mockQuery = createMockQuery(mockWorkouts);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchWorkouts();

      expect(result).toEqual(mockWorkouts);
      expect(supabaseClient.from).toHaveBeenCalledWith('workouts');
    });

    it('should fetch only user workouts when userOnly=true', async () => {
      const mockUser = { id: 'user-123' };
      const mockWorkouts = [{ id: '1', title: 'My Workout', user_id: 'user-123' }];

      getCurrentUser.mockResolvedValue(mockUser);

      const mockQuery = createMockQuery(mockWorkouts);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchWorkouts(true);

      expect(result).toEqual(mockWorkouts);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

  describe('fetchWorkoutById', () => {
    it('should fetch a workout with its phases and exercises', async () => {
      const mockWorkout = {
        id: 'workout-123',
        title: 'Test Workout',
        description: 'Test Description'
      };

      const mockPhases = [
        { id: 'phase-1', workout_id: 'workout-123', order: 1, name: 'Warm-up' },
        { id: 'phase-2', workout_id: 'workout-123', order: 2, name: 'Main' }
      ];

      const mockExercises1 = [
        { id: 'e1', phase_id: 'phase-1', order: 1, data: { name: 'Jumping Jacks', reps: 20 } }
      ];

      const mockExercises2 = [
        { id: 'e2', phase_id: 'phase-2', order: 1, data: { name: 'Push-up', reps: 10 } },
        { id: 'e3', phase_id: 'phase-2', order: 2, data: { name: 'Squat', reps: 15 } }
      ];

      const workoutQuery = createMockQuery(mockWorkout);
      const phasesQuery = createMockQuery(mockPhases);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'workouts') return workoutQuery;
        if (table === 'phases') return phasesQuery;
        if (table === 'exercises') {
          // Return different exercises based on phase_id
          const query = createMockQuery([]);
          query.eq.mockImplementation((field, value) => {
            if (field === 'phase_id') {
              if (value === 'phase-1') {
                return createMockQuery(mockExercises1);
              } else if (value === 'phase-2') {
                return createMockQuery(mockExercises2);
              }
            }
            return query;
          });
          return query;
        }
      });

      const result = await fetchWorkoutById('workout-123');

      expect(result).toEqual({
        ...mockWorkout,
        phases: [
          {
            name: 'Warm-up',
            exercises: [{ name: 'Jumping Jacks', reps: 20 }]
          },
          {
            name: 'Main',
            exercises: [
              { name: 'Push-up', reps: 10 },
              { name: 'Squat', reps: 15 }
            ]
          }
        ]
      });
    });
  });

  describe('saveWorkout', () => {
    it('should save a new workout with phases and exercises', async () => {
      const mockUser = { id: 'user-123' };
      const mockWorkoutData = {
        title: 'New Workout',
        description: 'Test Description',
        phases: [
          {
            name: 'Warm-up',
            exercises: [{ name: 'Jumping Jacks', reps: 20 }]
          },
          {
            name: 'Main',
            exercises: [
              { name: 'Push-up', reps: 10 },
              { name: 'Squat', reps: 15 }
            ]
          }
        ]
      };

      const mockSavedWorkout = {
        id: 'workout-123',
        user_id: 'user-123',
        title: 'New Workout',
        description: 'Test Description'
      };

      const mockSavedPhase = { id: 'phase-123' };

      getCurrentUser.mockResolvedValue(mockUser);

      const workoutQuery = createMockQuery(mockSavedWorkout);
      const phasesQuery = createMockQuery(mockSavedPhase);
      const exercisesQuery = createMockQuery([]);

      supabaseClient.from.mockImplementation(table => {
        if (table === 'workouts') return workoutQuery;
        if (table === 'phases') return phasesQuery;
        if (table === 'exercises') return exercisesQuery;
      });

      const result = await saveWorkout(mockWorkoutData);

      expect(result).toEqual(mockSavedWorkout);
      expect(workoutQuery.insert).toHaveBeenCalled();
      expect(phasesQuery.insert).toHaveBeenCalled();
      expect(exercisesQuery.insert).toHaveBeenCalled();
    });
  });

  describe('updateWorkoutPublicStatus', () => {
    it('should update workout public status', async () => {
      const mockUpdatedWorkout = {
        id: 'workout-123',
        is_public: true
      };

      const mockQuery = createMockQuery(mockUpdatedWorkout);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateWorkoutPublicStatus('workout-123', true);

      expect(result).toEqual(mockUpdatedWorkout);
      expect(mockQuery.update).toHaveBeenCalledWith({ is_public: true });
    });
  });

  describe('deleteWorkout', () => {
    it('should delete a workout', async () => {
      const mockQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(mockQuery);

      await deleteWorkout('workout-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('workouts');
      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });
});

describe('Data Service - Listening Sets', () => {
  describe('getListeningSets', () => {
    it('should fetch all listening sets', async () => {
      const mockSets = [{ id: '1', title: 'Set 1', is_public: true }];

      const mockQuery = createMockQuery(mockSets);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await getListeningSets();

      expect(result).toEqual(mockSets);
      expect(supabaseClient.from).toHaveBeenCalledWith('listening_sets');
    });
  });

  describe('getListeningSet', () => {
    it('should fetch a listening set by id', async () => {
      const mockSet = {
        id: 'set-123',
        title: 'Test Set',
        items: []
      };

      const mockQuery = createMockQuery(mockSet);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await getListeningSet('set-123');

      expect(result).toEqual(mockSet);
      expect(supabaseClient.from).toHaveBeenCalledWith('listening_sets');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'set-123');
    });
  });

  describe('createListeningSet', () => {
    it('should save a new listening set', async () => {
      const mockUser = { id: 'user-123' };
      const mockSetData = {
        title: 'New Set',
        language: 'en',
        items: [{ text: 'Hello', translation: 'Cześć' }]
      };

      const mockSavedSet = {
        id: 'set-123',
        user_id: 'user-123',
        title: 'New Set',
        language: 'en'
      };

      getCurrentUser.mockResolvedValue(mockUser);

      const mockQuery = createMockQuery(mockSavedSet);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await createListeningSet(mockSetData);

      expect(result).toEqual(mockSavedSet);
    });
  });

  describe('updateListeningSetPublicStatus', () => {
    it('should update listening set public status', async () => {
      const mockUpdatedSet = {
        id: 'set-123',
        is_public: true
      };

      const mockQuery = createMockQuery(mockUpdatedSet);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateListeningSetPublicStatus('set-123', true);

      expect(result).toEqual(mockUpdatedSet);
      expect(mockQuery.update).toHaveBeenCalledWith({ is_public: true });
    });
  });

  describe('deleteListeningSet', () => {
    it('should delete a listening set', async () => {
      const mockQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(mockQuery);

      await deleteListeningSet('set-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('listening_sets');
      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });
});

describe('Data Service - Knowledge Base', () => {
  describe('getKnowledgeBaseArticles', () => {
    it('should fetch all knowledge base articles', async () => {
      const mockArticles = [{ id: '1', title: 'Article 1', is_public: true }];

      const mockQuery = createMockQuery(mockArticles);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await getKnowledgeBaseArticles();

      expect(result).toEqual(mockArticles);
      expect(supabaseClient.from).toHaveBeenCalledWith('knowledge_base_articles');
    });
  });

  describe('getKnowledgeBaseArticle', () => {
    it('should fetch a single knowledge base article by slug', async () => {
      const mockArticle = {
        id: 'article-123',
        slug: 'test-article',
        title: 'Test Article',
        content: 'Test Content'
      };

      const mockQuery = createMockQuery(mockArticle);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await getKnowledgeBaseArticle('test-article');

      expect(result).toEqual(mockArticle);
      expect(mockQuery.eq).toHaveBeenCalledWith('slug', 'test-article');
    });
  });

  describe('createKnowledgeBaseArticle', () => {
    it('should save a new knowledge base article', async () => {
      const mockUser = { id: 'user-123' };
      const mockArticleData = {
        title: 'New Article',
        slug: 'new-article',
        content: 'Test Content',
        category: 'general'
      };

      const mockSavedArticle = {
        id: 'article-123',
        user_id: 'user-123',
        title: 'New Article',
        slug: 'new-article',
        content: 'Test Content',
        category: 'general'
      };

      getCurrentUser.mockResolvedValue(mockUser);

      const mockQuery = createMockQuery(mockSavedArticle);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await createKnowledgeBaseArticle(mockArticleData);

      expect(result).toEqual(mockSavedArticle);
    });
  });

  describe('updateKnowledgeBaseArticle', () => {
    it('should update an existing knowledge base article', async () => {
      const mockUpdatedArticle = {
        id: 'article-123',
        title: 'Updated Article'
      };

      const mockQuery = createMockQuery(mockUpdatedArticle);
      supabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateKnowledgeBaseArticle('article-123', { title: 'Updated Article' });

      expect(result).toEqual(mockUpdatedArticle);
    });
  });

  describe('deleteKnowledgeBaseArticle', () => {
    it('should delete a knowledge base article', async () => {
      const mockQuery = createMockQuery(null);
      supabaseClient.from.mockReturnValue(mockQuery);

      await deleteKnowledgeBaseArticle('article-123');

      expect(supabaseClient.from).toHaveBeenCalledWith('knowledge_base_articles');
      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });
});

describe('Data Service - Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    const error = new Error('Network error');
    const mockQuery = createMockQuery(null, error);
    supabaseClient.from.mockReturnValue(mockQuery);

    await expect(fetchQuizzes()).rejects.toThrow('Network error');
  });

  it('should handle empty data arrays', async () => {
    const mockQuery = createMockQuery([]);
    supabaseClient.from.mockReturnValue(mockQuery);

    const result = await fetchQuizzes();

    expect(result).toEqual([]);
  });

  it('should handle null responses', async () => {
    const mockQuery = createMockQuery(null);
    supabaseClient.from.mockReturnValue(mockQuery);

    const result = await fetchQuizzes();

    expect(result).toEqual([]);
  });
});
