-- ============================================
-- SAMPLE CONTENT FOR QUIZ & WORKOUT APP
-- Generic quiz and workout for demonstration
-- ============================================

-- ============================================
-- SAMPLE QUIZ: "General Knowledge Quiz"
-- ============================================

-- Insert sample quiz (user_id = NULL, is_sample = TRUE)
INSERT INTO quizzes (id, user_id, title, description, is_sample, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'General Knowledge Quiz',
    'Test your general knowledge with this sample quiz covering various topics.',
    TRUE,
    NOW()
);

-- Insert questions for the sample quiz
INSERT INTO questions (quiz_id, "order", data) VALUES
-- Question 1: Multiple Choice
('00000000-0000-0000-0000-000000000001', 1, '{
    "type": "multiple-choice",
    "questionText": "What is the capital of France?",
    "options": [
        {"text": "Paris", "isCorrect": true, "explanation": "Correct! Paris is the capital and largest city of France."},
        {"text": "London", "isCorrect": false, "explanation": "Incorrect. London is the capital of the United Kingdom."},
        {"text": "Berlin", "isCorrect": false, "explanation": "Incorrect. Berlin is the capital of Germany."},
        {"text": "Madrid", "isCorrect": false, "explanation": "Incorrect. Madrid is the capital of Spain."}
    ]
}'::jsonb),

-- Question 2: True/False
('00000000-0000-0000-0000-000000000001', 2, '{
    "type": "true-false",
    "questionText": "The Earth is flat.",
    "isCorrect": false,
    "explanation": "False! The Earth is approximately spherical in shape."
}'::jsonb),

-- Question 3: Fill in the blank
('00000000-0000-0000-0000-000000000001', 3, '{
    "type": "fill-in-the-blank",
    "questionText": "The largest ocean on Earth is the ___ Ocean.",
    "correctAnswer": "Pacific",
    "explanation": "Correct! The Pacific Ocean is the largest and deepest ocean on Earth."
}'::jsonb),

-- Question 4: Multiple Choice
('00000000-0000-0000-0000-000000000001', 4, '{
    "type": "multiple-choice",
    "questionText": "How many continents are there on Earth?",
    "options": [
        {"text": "7", "isCorrect": true, "explanation": "Correct! There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America."},
        {"text": "5", "isCorrect": false, "explanation": "Incorrect. There are more than 5 continents."},
        {"text": "6", "isCorrect": false, "explanation": "Incorrect. Some models use 6, but the most common is 7."},
        {"text": "8", "isCorrect": false, "explanation": "Incorrect. There are not 8 continents."}
    ]
}'::jsonb),

-- Question 5: Matching
('00000000-0000-0000-0000-000000000001', 5, '{
    "type": "matching",
    "questionText": "Match the countries with their capitals:",
    "pairs": [
        {"item": "Italy", "match": "Rome"},
        {"item": "Japan", "match": "Tokyo"},
        {"item": "Egypt", "match": "Cairo"},
        {"item": "Canada", "match": "Ottawa"}
    ]
}'::jsonb),

-- Question 6: True/False
('00000000-0000-0000-0000-000000000001', 6, '{
    "type": "true-false",
    "questionText": "Water boils at 100 degrees Celsius at sea level.",
    "isCorrect": true,
    "explanation": "True! Water boils at 100°C (212°F) at standard atmospheric pressure."
}'::jsonb),

-- Question 7: Fill in the blank
('00000000-0000-0000-0000-000000000001', 7, '{
    "type": "fill-in-the-blank",
    "questionText": "The chemical symbol for gold is ___.",
    "correctAnswer": "Au",
    "explanation": "Correct! Au comes from the Latin word ''aurum'' meaning gold."
}'::jsonb),

-- Question 8: Multiple Choice
('00000000-0000-0000-0000-000000000001', 8, '{
    "type": "multiple-choice",
    "questionText": "Who painted the Mona Lisa?",
    "options": [
        {"text": "Leonardo da Vinci", "isCorrect": true, "explanation": "Correct! Leonardo da Vinci painted the Mona Lisa in the early 16th century."},
        {"text": "Pablo Picasso", "isCorrect": false, "explanation": "Incorrect. Picasso was a 20th century artist known for Cubism."},
        {"text": "Vincent van Gogh", "isCorrect": false, "explanation": "Incorrect. Van Gogh was known for works like Starry Night."},
        {"text": "Michelangelo", "isCorrect": false, "explanation": "Incorrect. Michelangelo was known for the Sistine Chapel ceiling."}
    ]
}'::jsonb),

-- Question 9: Matching
('00000000-0000-0000-0000-000000000001', 9, '{
    "type": "matching",
    "questionText": "Match the planets with their order from the Sun:",
    "pairs": [
        {"item": "Mercury", "match": "1st"},
        {"item": "Venus", "match": "2nd"},
        {"item": "Earth", "match": "3rd"},
        {"item": "Mars", "match": "4th"}
    ]
}'::jsonb),

-- Question 10: True/False
('00000000-0000-0000-0000-000000000001', 10, '{
    "type": "true-false",
    "questionText": "The Great Wall of China is visible from space with the naked eye.",
    "isCorrect": false,
    "explanation": "False! This is a common myth. The Great Wall is not visible from space without aid."
}'::jsonb);

-- ============================================
-- SAMPLE WORKOUT: "Basic Fitness Routine"
-- ============================================

-- Insert sample workout (user_id = NULL, is_sample = TRUE)
INSERT INTO workouts (id, user_id, title, description, is_sample, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Basic Fitness Routine',
    'A simple full-body workout suitable for beginners. No equipment needed.',
    TRUE,
    NOW()
);

-- Insert Phase 1: Warm-up
INSERT INTO phases (id, workout_id, "order", name)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    1,
    'Warm-up'
);

-- Exercises for Warm-up phase
INSERT INTO exercises (phase_id, "order", data) VALUES
('00000000-0000-0000-0000-000000000003', 1, '{
    "name": "Jumping Jacks",
    "type": "time",
    "duration": 60,
    "description": "Stand with feet together, arms at sides. Jump while spreading legs and raising arms overhead. Return to start.",
    "details": "1 minute",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000003', 2, '{
    "name": "Arm Circles",
    "type": "time",
    "duration": 30,
    "description": "Extend arms to sides. Make small circles, gradually increasing size. Switch direction halfway.",
    "details": "30 seconds",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000003', 3, '{
    "name": "High Knees",
    "type": "time",
    "duration": 45,
    "description": "Run in place, bringing knees up to hip level. Keep core engaged and maintain good posture.",
    "details": "45 seconds",
    "mediaUrl": ""
}'::jsonb);

-- Insert Phase 2: Main Workout
INSERT INTO phases (id, workout_id, "order", name)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    2,
    'Main Workout'
);

-- Exercises for Main Workout phase
INSERT INTO exercises (phase_id, "order", data) VALUES
('00000000-0000-0000-0000-000000000004', 1, '{
    "name": "Push-ups",
    "type": "reps",
    "details": "3 sets × 10-15 reps",
    "description": "Start in plank position. Lower body until chest nearly touches floor. Push back up. Modify on knees if needed.",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 2, '{
    "name": "Rest",
    "type": "time",
    "duration": 30,
    "description": "Rest between sets.",
    "details": "",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 3, '{
    "name": "Squats",
    "type": "reps",
    "details": "3 sets × 15-20 reps",
    "description": "Stand with feet shoulder-width apart. Lower hips back and down as if sitting. Keep chest up and knees behind toes.",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 4, '{
    "name": "Rest",
    "type": "time",
    "duration": 30,
    "description": "Rest between sets.",
    "details": "",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 5, '{
    "name": "Plank",
    "type": "time",
    "duration": 30,
    "description": "Hold plank position on forearms and toes. Keep body in straight line from head to heels. Engage core.",
    "details": "3 sets × 30 seconds",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 6, '{
    "name": "Rest",
    "type": "time",
    "duration": 30,
    "description": "Rest between sets.",
    "details": "",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 7, '{
    "name": "Lunges",
    "type": "reps",
    "details": "3 sets × 10 reps per leg",
    "description": "Step forward with one leg, lowering hips until both knees are bent at 90 degrees. Push back to start. Alternate legs.",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 8, '{
    "name": "Rest",
    "type": "time",
    "duration": 30,
    "description": "Rest between sets.",
    "details": "",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000004', 9, '{
    "name": "Mountain Climbers",
    "type": "time",
    "duration": 45,
    "description": "Start in plank position. Alternate bringing knees to chest in a running motion. Keep hips level.",
    "details": "3 sets × 45 seconds",
    "mediaUrl": ""
}'::jsonb);

-- Insert Phase 3: Cool Down
INSERT INTO phases (id, workout_id, "order", name)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    3,
    'Cool Down'
);

-- Exercises for Cool Down phase
INSERT INTO exercises (phase_id, "order", data) VALUES
('00000000-0000-0000-0000-000000000005', 1, '{
    "name": "Standing Quad Stretch",
    "type": "time",
    "duration": 30,
    "description": "Stand on one leg. Pull other foot toward glutes. Hold for 30 seconds each side.",
    "details": "30 seconds per leg",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000005', 2, '{
    "name": "Hamstring Stretch",
    "type": "time",
    "duration": 30,
    "description": "Sit with one leg extended, other bent. Reach toward extended foot. Hold for 30 seconds each side.",
    "details": "30 seconds per leg",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000005', 3, '{
    "name": "Shoulder Stretch",
    "type": "time",
    "duration": 30,
    "description": "Pull one arm across chest with other arm. Hold for 30 seconds each side.",
    "details": "30 seconds per arm",
    "mediaUrl": ""
}'::jsonb),

('00000000-0000-0000-0000-000000000005', 4, '{
    "name": "Deep Breathing",
    "type": "time",
    "duration": 60,
    "description": "Stand or sit comfortably. Take slow, deep breaths. Inhale through nose, exhale through mouth.",
    "details": "1 minute",
    "mediaUrl": ""
}'::jsonb);

-- ============================================
-- COMPLETED
-- ============================================
-- Sample content inserted successfully!
-- 1 Quiz: "General Knowledge Quiz" (10 questions)
-- 1 Workout: "Basic Fitness Routine" (3 phases, multiple exercises)

