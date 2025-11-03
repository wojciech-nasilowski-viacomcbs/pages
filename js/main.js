/**
 * @fileoverview Main entry point for Vite bundling
 * This file imports all modules in the correct order
 * SPIKE: Testing Vite activation with current architecture
 */

// ========== CORE MODULES (ES6) ==========
import './audio.js';
import './feature-flags.js';
import './supabase-client.js';
import './auth-service.js';
import './data-service.js';

// ========== STATE MANAGEMENT (ES6) ==========
import './wake-lock.js';
import './state/store.js';
import './state/app-state.js';
import './ui-state.js';
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
// These are loaded via <script> tags because they use window.* API
// TODO-REFACTOR-CLEANUP: Convert to ES6 modules in Phase 5
// - js/ui-manager.js
// - js/session-manager.js
// - js/ai-prompts.js
// - js/content-manager.js

// ========== ENGINES ==========
// FAZA 3.2-3.3: Quiz & Workout Engines migrated to ES6 classes
import './engines/quiz-engine.js';
import './engines/workout-engine.js';

// TODO-REFACTOR-CLEANUP: These are still IIFE, will be converted in Phase 3.4
// - js/listening-engine.js (FAZA 3.4)
// - js/knowledge-base-engine.js (later)

// ========== APP INITIALIZATION (IIFE) ==========
// TODO-REFACTOR-CLEANUP: Convert to ES6 module in Phase 4
// - js/app.js

console.log('✅ Vite entry point loaded (main.js)');
console.log('⚠️  Note: IIFE modules still loaded via <script> tags for backward compatibility');
