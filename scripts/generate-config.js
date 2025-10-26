#!/usr/bin/env node
// Generuje config.js z environment variables dla Vercel

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

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
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'
};
`;

const outputPath = path.join(__dirname, '../js/config.js');
fs.writeFileSync(outputPath, config, 'utf8');

console.log('✅ config.js generated successfully!');
console.log('📍 Location:', outputPath);

