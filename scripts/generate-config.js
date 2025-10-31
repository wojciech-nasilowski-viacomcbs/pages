#!/usr/bin/env node
// Generuje config.js z environment variables dla Vercel

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Feature Flags with FF_ prefix
const FF_ENABLE_QUIZZES = process.env.FF_ENABLE_QUIZZES;
const FF_ENABLE_WORKOUTS = process.env.FF_ENABLE_WORKOUTS;
const FF_ENABLE_LISTENING = process.env.FF_ENABLE_LISTENING;
const FF_ENABLE_KNOWLEDGE_BASE = process.env.FF_ENABLE_KNOWLEDGE_BASE;
const FF_ENABLE_FILE_IMPORT = process.env.FF_ENABLE_FILE_IMPORT;
const FF_ENABLE_AI_GENERATOR = process.env.FF_ENABLE_AI_GENERATOR;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}

const config = `// ============================================
// APPLICATION CONFIGURATION (Auto-generated)
// Generated from environment variables
// ============================================

window.APP_CONFIG = {
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
    OPENROUTER_API_KEY: '${OPENROUTER_API_KEY || ''}',
    
    FEATURE_FLAGS: {
        ENABLE_QUIZZES: ${FF_ENABLE_QUIZZES !== undefined ? FF_ENABLE_QUIZZES : 'true'},
        ENABLE_WORKOUTS: ${FF_ENABLE_WORKOUTS !== undefined ? FF_ENABLE_WORKOUTS : 'true'},
        ENABLE_LISTENING: ${FF_ENABLE_LISTENING !== undefined ? FF_ENABLE_LISTENING : 'true'},
        ENABLE_KNOWLEDGE_BASE: ${FF_ENABLE_KNOWLEDGE_BASE !== undefined ? FF_ENABLE_KNOWLEDGE_BASE : 'true'},
        ENABLE_FILE_IMPORT: ${FF_ENABLE_FILE_IMPORT !== undefined ? FF_ENABLE_FILE_IMPORT : 'true'},
        ENABLE_AI_GENERATOR: ${FF_ENABLE_AI_GENERATOR !== undefined ? FF_ENABLE_AI_GENERATOR : 'true'}
    }
};
`;

const outputPath = path.join(__dirname, '../js/config.js');
fs.writeFileSync(outputPath, config, 'utf8');

console.log('✅ config.js generated successfully!');
console.log('📍 Location:', outputPath);

