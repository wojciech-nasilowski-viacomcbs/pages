// ============================================
// DATA SERVICE - CRUD Operations for Quizzes and Workouts
// ============================================

(function() {
'use strict';

const dataService = {
    
    // ============================================
    // QUIZZES
    // ============================================
    
    /**
     * Fetch all quizzes (user's own + sample content)
     * @param {boolean} userOnly - If true, only fetch user's quizzes (requires auth)
     * @returns {Promise<Array>} Array of quiz objects
     */
    async fetchQuizzes(userOnly = false) {
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
    },
    
    /**
     * Fetch a single quiz with all its questions
     * @param {string} quizId - UUID of the quiz
     * @returns {Promise<Object>} Quiz object with questions array
     */
    async fetchQuizById(quizId) {
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
    },
    
    /**
     * Save a new quiz with questions
     * @param {Object} quizData - Quiz object with title, description, and questions array
     * @returns {Promise<Object>} Created quiz object
     */
    async saveQuiz(quizData) {
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
                    is_sample: false
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
    },
    
    /**
     * Delete a quiz (and all its questions via CASCADE)
     * @param {string} quizId - UUID of the quiz to delete
     * @returns {Promise<void>}
     */
    async deleteQuiz(quizId) {
        try {
            const { error } = await supabaseClient
                .from('quizzes')
                .delete()
                .eq('id', quizId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting quiz:', error);
            throw error;
        }
    },
    
    // ============================================
    // WORKOUTS
    // ============================================
    
    /**
     * Fetch all workouts (user's own + sample content)
     * @param {boolean} userOnly - If true, only fetch user's workouts (requires auth)
     * @returns {Promise<Array>} Array of workout objects
     */
    async fetchWorkouts(userOnly = false) {
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
    },
    
    /**
     * Fetch a single workout with all its phases and exercises
     * @param {string} workoutId - UUID of the workout
     * @returns {Promise<Object>} Workout object with phases array
     */
    async fetchWorkoutById(workoutId) {
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
                phases.map(async (phase) => {
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
    },
    
    /**
     * Save a new workout with phases and exercises
     * @param {Object} workoutData - Workout object with title, description, and phases array
     * @returns {Promise<Object>} Created workout object
     */
    async saveWorkout(workoutData) {
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('User must be authenticated to save workouts');
            
            // Insert workout metadata
            const { data: workout, error: workoutError } = await supabaseClient
                .from('workouts')
                .insert({
                    user_id: user.id,
                    title: workoutData.title,
                    description: workoutData.description || '',
                    is_sample: false
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
    },
    
    /**
     * Delete a workout (and all its phases/exercises via CASCADE)
     * @param {string} workoutId - UUID of the workout to delete
     * @returns {Promise<void>}
     */
    async deleteWorkout(workoutId) {
        try {
            const { error } = await supabaseClient
                .from('workouts')
                .delete()
                .eq('id', workoutId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting workout:', error);
            throw error;
        }
    }
};

// Export for use in other modules
window.dataService = dataService;

console.log('✅ Data service initialized');

})(); // End of IIFE

