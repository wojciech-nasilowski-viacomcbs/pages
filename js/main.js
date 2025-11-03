/**
 * @fileoverview Main entry point for Vite bundling
 * This file imports all modules in the correct order
 * SPIKE: Testing Vite activation with current architecture
 */

// ========== CORE MODULES (ES6) ==========
import './utils/audio.js';
import './data/feature-flags.js';
import './data/supabase-client.js';
import './data/auth-service.js';
import './data/data-service.js';

// ========== STATE MANAGEMENT (ES6) ==========
import './utils/wake-lock.js';
import './state/store.js';
import './state/app-state.js';
import './ui/ui-state.js';
import './modules-shim.js';

// ========== SERVICES (ES6) ==========
import './services/validation-service.js';
import './services/import-service.js';
import './services/ai-service.js';
import './services/export-service.js';
import './services/error-handler.js';

// ========== UI COMPONENTS (ES6) ==========
import './ui/card-renderer.js';

// ========== MANAGERS (IIFE - need to stay global for now) ==========
// TODO-PHASE-6: These IIFE modules will be converted to ES6 in Phase 6
// - js/ui-manager.js
// - js/session-manager.js
// - js/ai-prompts.js
// - js/content-manager.js
// - js/knowledge-base-engine.js
// - js/app.js

// ========== ENGINES ==========
// FAZA 5.2: Engines loaded via engines-bridge.js for IIFE compatibility
// import './engines/quiz-engine.js';
// import './engines/workout-engine.js';
// import './engines/listening-engine.js';

console.log('✅ Vite entry point loaded (main.js)');
console.log('⚠️  Note: IIFE modules still loaded via <script> tags for backward compatibility');
