/**
 * @fileoverview ES6 Modules Compatibility Shim
 * Exports ES6 modules to global scope for backward compatibility with IIFE modules
 * This allows gradual migration from IIFE to ES6 modules
 *
 * TODO-REFACTOR-CLEANUP: Cały ten plik do usunięcia w FAZIE 5, Krok 17
 * Po zakończeniu refaktoringu wszystkie moduły będą używać ES6 imports
 */

import { createStore } from './state/store.js';
import { appState } from './state/app-state.js';
import uiState from './ui-state.js';
import * as audio from './audio.js';
import { supabaseClient, getCurrentUser, isLoggedIn, getSession } from './supabase-client.js';
import authService from './auth-service.js';
import dataService from './data-service.js';
import featureFlags from './feature-flags.js';
import wakeLockManager from './wake-lock.js';

// TODO-REFACTOR-CLEANUP: Export to global scope for backward compatibility
window.createStore = createStore; // TODO-REFACTOR-CLEANUP
window.appState = appState; // TODO-REFACTOR-CLEANUP
window.uiState = uiState; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Supabase client exports
window.supabaseClient = supabaseClient; // TODO-REFACTOR-CLEANUP
window.getCurrentUser = getCurrentUser; // TODO-REFACTOR-CLEANUP
window.isLoggedIn = isLoggedIn; // TODO-REFACTOR-CLEANUP
window.getSession = getSession; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Auth service exports
window.authService = authService; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Data service exports
window.dataService = dataService; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Feature flags exports
window.featureFlags = featureFlags; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Wake Lock Manager exports
window.wakeLockManager = wakeLockManager; // TODO-REFACTOR-CLEANUP

// TODO-REFACTOR-CLEANUP: Audio module exports
window.playCorrectSound = audio.playCorrectSound; // TODO-REFACTOR-CLEANUP
window.playIncorrectSound = audio.playIncorrectSound; // TODO-REFACTOR-CLEANUP
window.playTimerEndSound = audio.playTimerEndSound; // TODO-REFACTOR-CLEANUP
window.toggleMute = audio.toggleMute; // TODO-REFACTOR-CLEANUP
window.isSoundMuted = audio.isSoundMuted; // TODO-REFACTOR-CLEANUP
window.setMuted = audio.setMuted; // TODO-REFACTOR-CLEANUP
window.speakText = audio.speakText; // TODO-REFACTOR-CLEANUP
window.stopSpeaking = audio.stopSpeaking; // TODO-REFACTOR-CLEANUP
window.isTTSAvailable = audio.isTTSAvailable; // TODO-REFACTOR-CLEANUP
window.getAvailableVoices = audio.getAvailableVoices; // TODO-REFACTOR-CLEANUP
window.initAudio = audio.initAudio; // TODO-REFACTOR-CLEANUP

console.log('✅ ES6 Modules shim loaded');
