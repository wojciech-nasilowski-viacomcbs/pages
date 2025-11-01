/**
 * @fileoverview Data Service - CRUD Operations for Quizzes, Workouts, and Knowledge Base
 * @module data-service
 */

import { supabaseClient, getCurrentUser } from './supabase-client.js';

// ============================================
// QUIZZES
// ============================================

/**
 * Fetch all quizzes (user's own + sample content)
 * @param {boolean} userOnly - If true, only fetch user's quizzes (requires auth)
 * @returns {Promise<Array>} Array of quiz objects
 */
export async function fetchQuizzes(userOnly = false) {
  try {
    let query = supabaseClient
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (userOnly) {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
}

/**
 * Fetch a single quiz with all its questions
 * @param {string} quizId - UUID of the quiz
 * @returns {Promise<Object>} Quiz object with questions array
 */
export async function fetchQuizById(quizId) {
  try {
    // Fetch quiz metadata
    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Fetch questions for this quiz
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true });

    if (questionsError) throw questionsError;

    // Combine quiz with questions
    return {
      ...quiz,
      questions: questions.map(q => q.data)
    };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
}

/**
 * Save a new quiz with questions
 * @param {Object} quizData - Quiz object with title, description, and questions array
 * @param {boolean} [isPublic=false] - Whether the quiz should be public (only for admins)
 * @returns {Promise<Object>} Created quiz object
 */
export async function saveQuiz(quizData, isPublic = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User must be authenticated to save quizzes');

    // Insert quiz metadata
    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: quizData.title,
        description: quizData.description || '',
        is_sample: false,
        is_public: isPublic || false
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Insert questions
    const questionsToInsert = quizData.questions.map((question, index) => ({
      quiz_id: quiz.id,
      order: index + 1,
      data: question
    }));

    const { error: questionsError } = await supabaseClient
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return quiz;
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

/**
 * Delete a quiz (and all its questions via CASCADE)
 * @param {string} quizId - UUID of the quiz to delete
 * @returns {Promise<void>}
 */
export async function deleteQuiz(quizId) {
  try {
    const { error } = await supabaseClient.from('quizzes').delete().eq('id', quizId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

// ============================================
// WORKOUTS
// ============================================

/**
 * Fetch all workouts (user's own + sample content)
 * @param {boolean} userOnly - If true, only fetch user's workouts (requires auth)
 * @returns {Promise<Array>} Array of workout objects
 */
export async function fetchWorkouts(userOnly = false) {
  try {
    let query = supabaseClient
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (userOnly) {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
}

/**
 * Fetch a single workout with all its phases and exercises
 * @param {string} workoutId - UUID of the workout
 * @returns {Promise<Object>} Workout object with phases array
 */
export async function fetchWorkoutById(workoutId) {
  try {
    // Fetch workout metadata
    const { data: workout, error: workoutError } = await supabaseClient
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (workoutError) throw workoutError;

    // Fetch phases for this workout
    const { data: phases, error: phasesError } = await supabaseClient
      .from('phases')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order', { ascending: true });

    if (phasesError) throw phasesError;

    // Fetch exercises for each phase
    const phasesWithExercises = await Promise.all(
      phases.map(async phase => {
        const { data: exercises, error: exercisesError } = await supabaseClient
          .from('exercises')
          .select('*')
          .eq('phase_id', phase.id)
          .order('order', { ascending: true });

        if (exercisesError) throw exercisesError;

        return {
          name: phase.name,
          exercises: exercises.map(e => e.data)
        };
      })
    );

    // Combine workout with phases
    return {
      ...workout,
      phases: phasesWithExercises
    };
  } catch (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
}

/**
 * Save a new workout with phases and exercises
 * @param {Object} workoutData - Workout object with title, description, and phases array
 * @param {boolean} [isPublic=false] - Whether the workout should be public (only for admins)
 * @returns {Promise<Object>} Created workout object
 */
export async function saveWorkout(workoutData, isPublic = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User must be authenticated to save workouts');

    // Sprawdź czy tytuł ma już numer (zaczyna się od "#")
    let finalTitle = workoutData.title;
    if (!finalTitle.match(/^#\d+\s+-\s+/)) {
      // Tytuł nie ma numeru - pobierz liczbę treningów użytkownika i dodaj numer
      const { data: existingWorkouts, error: countError } = await supabaseClient
        .from('workouts')
        .select('id')
        .eq('user_id', user.id);

      if (countError) throw countError;

      const nextNumber = (existingWorkouts?.length || 0) + 1;
      finalTitle = `#${nextNumber} - ${workoutData.title}`;
    }

    // Insert workout metadata
    const { data: workout, error: workoutError } = await supabaseClient
      .from('workouts')
      .insert({
        user_id: user.id,
        title: finalTitle,
        description: workoutData.description || '',
        emoji: workoutData.emoji || '💪', // Dodaj emoji
        is_sample: false,
        is_public: isPublic || false
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Insert phases and exercises
    for (let phaseIndex = 0; phaseIndex < workoutData.phases.length; phaseIndex++) {
      const phaseData = workoutData.phases[phaseIndex];

      // Insert phase
      const { data: phase, error: phaseError } = await supabaseClient
        .from('phases')
        .insert({
          workout_id: workout.id,
          order: phaseIndex + 1,
          name: phaseData.name
        })
        .select()
        .single();

      if (phaseError) throw phaseError;

      // Insert exercises for this phase
      const exercisesToInsert = phaseData.exercises.map((exercise, exerciseIndex) => ({
        phase_id: phase.id,
        order: exerciseIndex + 1,
        data: exercise
      }));

      const { error: exercisesError } = await supabaseClient
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    return workout;
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error;
  }
}

/**
 * Delete a workout (and all its phases/exercises via CASCADE)
 * @param {string} workoutId - UUID of the workout to delete
 * @returns {Promise<void>}
 */
export async function deleteWorkout(workoutId) {
  try {
    const { error } = await supabaseClient.from('workouts').delete().eq('id', workoutId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

// ============================================
// LISTENING SETS
// ============================================

/**
 * Fetch all listening sets (user's own + sample content)
 * @returns {Promise<Array>} Array of listening set objects
 */
export async function getListeningSets() {
  try {
    const { data, error } = await supabaseClient
      .from('listening_sets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching listening sets:', error);
    throw error;
  }
}

/**
 * Fetch a single listening set by ID
 * @param {string} id - UUID of the listening set
 * @returns {Promise<Object>} Listening set object
 */
export async function getListeningSet(id) {
  try {
    const { data, error } = await supabaseClient
      .from('listening_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching listening set:', error);
    throw error;
  }
}

/**
 * Create a new listening set
 * @param {string} title - Title of the listening set
 * @param {string} description - Description of the listening set
 * @param {string} lang1Code - Language 1 code (e.g., 'pl-PL')
 * @param {string} lang2Code - Language 2 code (e.g., 'es-ES')
 * @param {Array} content - Array of language pairs
 * @param {boolean} [isPublic=false] - Whether the listening set should be public (only for admins)
 * @returns {Promise<Object>} Created listening set
 */
export async function createListeningSet(
  title,
  description,
  lang1Code,
  lang2Code,
  content,
  isPublic = false
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabaseClient
      .from('listening_sets')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          lang1_code: lang1Code,
          lang2_code: lang2Code,
          content,
          is_sample: false,
          is_public: isPublic || false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating listening set:', error);
    throw error;
  }
}

/**
 * Delete a listening set
 * @param {string} id - UUID of the listening set
 */
export async function deleteListeningSet(id) {
  try {
    const { error } = await supabaseClient.from('listening_sets').delete().eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting listening set:', error);
    throw error;
  }
}

// ============================================
// KNOWLEDGE BASE (BAZA WIEDZY)
// ============================================

/**
 * Fetch all published knowledge base articles (with optional filters)
 * Admin can see unpublished articles too
 * @param {import('./types.js').KnowledgeBaseFilters} [filters] - Filter options
 * @returns {Promise<import('./types.js').KnowledgeBaseArticle[]>} Array of articles
 */
export async function getKnowledgeBaseArticles(filters = {}) {
  try {
    let query = supabaseClient.from('knowledge_base_articles').select('*');

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters.search) {
      // Search in title, description, or use full-text search
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    throw error;
  }
}

/**
 * Fetch a single knowledge base article by slug
 * @param {string} slug - Article slug (URL-friendly identifier)
 * @returns {Promise<import('./types.js').KnowledgeBaseArticle|null>} Article object or null
 */
export async function getKnowledgeBaseArticle(slug) {
  try {
    const { data, error } = await supabaseClient
      .from('knowledge_base_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    throw error;
  }
}

/**
 * Create a new knowledge base article (ADMIN ONLY)
 * @param {import('./types.js').KnowledgeBaseArticleInput} article - Article data
 * @returns {Promise<import('./types.js').KnowledgeBaseArticle>} Created article
 */
export async function createKnowledgeBaseArticle(article) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('knowledge_base_articles')
      .insert([
        {
          ...article,
          author_id: user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating knowledge base article:', error);
    throw error;
  }
}

/**
 * Update a knowledge base article (ADMIN ONLY)
 * @param {string} id - Article ID (UUID)
 * @param {Partial<import('./types.js').KnowledgeBaseArticleInput>} updates - Fields to update
 * @returns {Promise<import('./types.js').KnowledgeBaseArticle>} Updated article
 */
export async function updateKnowledgeBaseArticle(id, updates) {
  try {
    const { data, error } = await supabaseClient
      .from('knowledge_base_articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating knowledge base article:', error);
    throw error;
  }
}

/**
 * Delete a knowledge base article (ADMIN ONLY)
 * @param {string} id - Article ID (UUID)
 */
export async function deleteKnowledgeBaseArticle(id) {
  try {
    const { error } = await supabaseClient.from('knowledge_base_articles').delete().eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting knowledge base article:', error);
    throw error;
  }
}

/**
 * Increment view count for a knowledge base article
 * @param {string} id - Article ID (UUID)
 */
export async function incrementKnowledgeBaseArticleViews(id) {
  try {
    const { error } = await supabaseClient.rpc('increment_kb_article_views', { article_id: id });

    // If RPC doesn't exist, fallback to manual increment
    if (error && error.code === '42883') {
      // Function doesn't exist, use manual increment
      const { data: article } = await supabaseClient
        .from('knowledge_base_articles')
        .select('view_count')
        .eq('id', id)
        .single();

      if (article) {
        await supabaseClient
          .from('knowledge_base_articles')
          .update({ view_count: (article.view_count || 0) + 1 })
          .eq('id', id);
      }
    } else if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error incrementing article views:', error);
    // Don't throw - view count is not critical
  }
}

/**
 * Search knowledge base articles using full-text search
 * @param {string} query - Search query
 * @param {number} [limit=10] - Maximum results
 * @returns {Promise<import('./types.js').KnowledgeBaseArticle[]>} Array of articles
 */
export async function searchKnowledgeBaseArticles(query, limit = 10) {
  try {
    // Use PostgreSQL full-text search if available
    const { data, error } = await supabaseClient
      .from('knowledge_base_articles')
      .select('*')
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'polish'
      })
      .eq('is_published', true)
      .limit(limit);

    if (error) {
      // Fallback to simple search if full-text search fails
      return await getKnowledgeBaseArticles({ search: query, limit });
    }

    return data || [];
  } catch (error) {
    console.error('Error searching knowledge base articles:', error);
    // Fallback to simple search
    return await getKnowledgeBaseArticles({ search: query, limit });
  }
}

// ============================================
// PUBLIC/PRIVATE STATUS MANAGEMENT
// ============================================

/**
 * Toggle public status of a quiz (admin only)
 * @param {string} quizId - UUID of the quiz
 * @param {boolean} isPublic - New public status
 * @returns {Promise<Object>} Updated quiz
 */
export async function updateQuizPublicStatus(quizId, isPublic) {
  try {
    const { data, error } = await supabaseClient
      .from('quizzes')
      .update({ is_public: isPublic })
      .eq('id', quizId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quiz public status:', error);
    throw error;
  }
}

/**
 * Toggle public status of a workout (admin only)
 * @param {string} workoutId - UUID of the workout
 * @param {boolean} isPublic - New public status
 * @returns {Promise<Object>} Updated workout
 */
export async function updateWorkoutPublicStatus(workoutId, isPublic) {
  try {
    const { data, error } = await supabaseClient
      .from('workouts')
      .update({ is_public: isPublic })
      .eq('id', workoutId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workout public status:', error);
    throw error;
  }
}

/**
 * Toggle public status of a listening set (admin only)
 * @param {string} setId - UUID of the listening set
 * @param {boolean} isPublic - New public status
 * @returns {Promise<Object>} Updated listening set
 */
export async function updateListeningSetPublicStatus(setId, isPublic) {
  try {
    const { data, error } = await supabaseClient
      .from('listening_sets')
      .update({ is_public: isPublic })
      .eq('id', setId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating listening set public status:', error);
    throw error;
  }
}

// Export default object for backward compatibility
export default {
  fetchQuizzes,
  fetchQuizById,
  saveQuiz,
  deleteQuiz,
  fetchWorkouts,
  fetchWorkoutById,
  saveWorkout,
  deleteWorkout,
  getListeningSets,
  getListeningSet,
  createListeningSet,
  deleteListeningSet,
  getKnowledgeBaseArticles,
  getKnowledgeBaseArticle,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle,
  incrementKnowledgeBaseArticleViews,
  searchKnowledgeBaseArticles,
  updateQuizPublicStatus,
  updateWorkoutPublicStatus,
  updateListeningSetPublicStatus
};

console.log('✅ Data service initialized');
