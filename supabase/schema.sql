-- ============================================
-- SCHEMA FOR QUIZ & WORKOUT APP v2.0
-- Supabase PostgreSQL Database
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- QUIZZES TABLES
-- ============================================

-- Main quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table (stores individual questions for each quiz)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    data JSONB NOT NULL,
    UNIQUE(quiz_id, "order")
);

-- ============================================
-- WORKOUTS TABLES
-- ============================================

-- Main workouts table
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases table (each workout has one or more phases)
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(workout_id, "order")
);

-- Exercises table (stores individual exercises for each phase)
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    data JSONB NOT NULL,
    UNIQUE(phase_id, "order")
);

-- ============================================
-- LISTENING SETS TABLE
-- ============================================

-- Main listening sets table (for language learning with TTS)
CREATE TABLE listening_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lang1_code TEXT NOT NULL DEFAULT 'pl-PL',
    lang2_code TEXT NOT NULL DEFAULT 'es-ES',
    content JSONB NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_is_sample ON quizzes(is_sample);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_is_sample ON workouts(is_sample);
CREATE INDEX idx_phases_workout_id ON phases(workout_id);
CREATE INDEX idx_exercises_phase_id ON exercises(phase_id);
CREATE INDEX idx_listening_sets_user_id ON listening_sets(user_id);
CREATE INDEX idx_listening_sets_is_sample ON listening_sets(is_sample);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUIZZES POLICIES
-- ============================================

-- Anyone can read sample quizzes OR their own quizzes
CREATE POLICY "Public read access to sample quizzes"
    ON quizzes FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Only authenticated users can insert their own quizzes
CREATE POLICY "Users can insert their own quizzes"
    ON quizzes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update only their own quizzes (not samples)
CREATE POLICY "Users can update their own quizzes"
    ON quizzes FOR UPDATE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- Users can delete only their own quizzes (not samples)
CREATE POLICY "Users can delete their own quizzes"
    ON quizzes FOR DELETE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- ============================================
-- QUESTIONS POLICIES
-- ============================================

-- Anyone can read questions for sample quizzes OR questions for their own quizzes
CREATE POLICY "Public read access to questions"
    ON questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = questions.quiz_id
            AND (quizzes.is_sample = TRUE OR quizzes.user_id = auth.uid())
        )
    );

-- Users can insert questions for their own quizzes
CREATE POLICY "Users can insert questions for their quizzes"
    ON questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

-- Users can update questions for their own quizzes (not samples)
CREATE POLICY "Users can update questions for their quizzes"
    ON questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
            AND quizzes.is_sample = FALSE
        )
    );

-- Users can delete questions for their own quizzes (not samples)
CREATE POLICY "Users can delete questions for their quizzes"
    ON questions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
            AND quizzes.is_sample = FALSE
        )
    );

-- ============================================
-- WORKOUTS POLICIES
-- ============================================

-- Anyone can read sample workouts OR their own workouts
CREATE POLICY "Public read access to sample workouts"
    ON workouts FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Only authenticated users can insert their own workouts
CREATE POLICY "Users can insert their own workouts"
    ON workouts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update only their own workouts (not samples)
CREATE POLICY "Users can update their own workouts"
    ON workouts FOR UPDATE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- Users can delete only their own workouts (not samples)
CREATE POLICY "Users can delete their own workouts"
    ON workouts FOR DELETE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- ============================================
-- PHASES POLICIES
-- ============================================

-- Anyone can read phases for sample workouts OR phases for their own workouts
CREATE POLICY "Public read access to phases"
    ON phases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = phases.workout_id
            AND (workouts.is_sample = TRUE OR workouts.user_id = auth.uid())
        )
    );

-- Users can insert phases for their own workouts
CREATE POLICY "Users can insert phases for their workouts"
    ON phases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = phases.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can update phases for their own workouts (not samples)
CREATE POLICY "Users can update phases for their workouts"
    ON phases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = phases.workout_id
            AND workouts.user_id = auth.uid()
            AND workouts.is_sample = FALSE
        )
    );

-- Users can delete phases for their own workouts (not samples)
CREATE POLICY "Users can delete phases for their workouts"
    ON phases FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = phases.workout_id
            AND workouts.user_id = auth.uid()
            AND workouts.is_sample = FALSE
        )
    );

-- ============================================
-- EXERCISES POLICIES
-- ============================================

-- Anyone can read exercises for sample workouts OR exercises for their own workouts
CREATE POLICY "Public read access to exercises"
    ON exercises FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM phases
            JOIN workouts ON workouts.id = phases.workout_id
            WHERE phases.id = exercises.phase_id
            AND (workouts.is_sample = TRUE OR workouts.user_id = auth.uid())
        )
    );

-- Users can insert exercises for their own workouts
CREATE POLICY "Users can insert exercises for their workouts"
    ON exercises FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM phases
            JOIN workouts ON workouts.id = phases.workout_id
            WHERE phases.id = exercises.phase_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can update exercises for their own workouts (not samples)
CREATE POLICY "Users can update exercises for their workouts"
    ON exercises FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM phases
            JOIN workouts ON workouts.id = phases.workout_id
            WHERE phases.id = exercises.phase_id
            AND workouts.user_id = auth.uid()
            AND workouts.is_sample = FALSE
        )
    );

-- Users can delete exercises for their own workouts (not samples)
CREATE POLICY "Users can delete exercises for their workouts"
    ON exercises FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM phases
            JOIN workouts ON workouts.id = phases.workout_id
            WHERE phases.id = exercises.phase_id
            AND workouts.user_id = auth.uid()
            AND workouts.is_sample = FALSE
        )
    );

-- ============================================
-- LISTENING SETS POLICIES
-- ============================================

-- Anyone can read sample listening sets OR their own listening sets
CREATE POLICY "Public read access to sample listening sets"
    ON listening_sets FOR SELECT
    USING (is_sample = TRUE OR user_id = auth.uid());

-- Only authenticated users can insert their own listening sets
CREATE POLICY "Users can insert their own listening sets"
    ON listening_sets FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update only their own listening sets (not samples)
CREATE POLICY "Users can update their own listening sets"
    ON listening_sets FOR UPDATE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- Users can delete only their own listening sets (not samples)
CREATE POLICY "Users can delete their own listening sets"
    ON listening_sets FOR DELETE
    USING (user_id = auth.uid() AND is_sample = FALSE);

-- ============================================
-- COMPLETED
-- ============================================
-- Schema created successfully!
-- Next step: Run insert_samples.sql to add sample content

