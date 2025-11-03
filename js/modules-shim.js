/**
 * @fileoverview ES6 Modules Compatibility Shim
 * Exports ES6 modules to global scope for backward compatibility with IIFE modules
 * This allows gradual migration from IIFE to ES6 modules
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

// Export to global scope for backward compatibility
window.createStore = createStore;
window.appState = appState;
window.uiState = uiState;

// Supabase client exports
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.getSession = getSession;

// Auth service exports
window.authService = authService;

// Data service exports
window.dataService = dataService;

// Feature flags exports
window.featureFlags = featureFlags;

// Wake Lock Manager exports
window.wakeLockManager = wakeLockManager;

// Audio module exports
window.playCorrectSound = audio.playCorrectSound;
window.playIncorrectSound = audio.playIncorrectSound;
window.playTimerEndSound = audio.playTimerEndSound;
window.toggleMute = audio.toggleMute;
window.isSoundMuted = audio.isSoundMuted;
window.setMuted = audio.setMuted;
window.speakText = audio.speakText;
window.stopSpeaking = audio.stopSpeaking;
window.isTTSAvailable = audio.isTTSAvailable;
window.getAvailableVoices = audio.getAvailableVoices;
window.initAudio = audio.initAudio;

console.log('✅ ES6 Modules shim loaded');
