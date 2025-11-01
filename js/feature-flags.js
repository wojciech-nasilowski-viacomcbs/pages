/**
 * @fileoverview Feature Flags - Toggle features on/off
 * @module feature-flags
 */

const DEFAULTS = {
  ENABLE_QUIZZES: true,
  ENABLE_WORKOUTS: true,
  ENABLE_LISTENING: true,
  ENABLE_KNOWLEDGE_BASE: true, // Baza Wiedzy
  ENABLE_FILE_IMPORT: true,
  ENABLE_AI_GENERATOR: true
};

/**
 * Wykrywa czy aplikacja działa w środowisku produkcyjnym
 */
function isProduction() {
  const host = window.location.hostname;
  // Produkcja = NIE localhost, NIE file://
  return (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    !host.includes('192.168') &&
    !host.includes('.local') &&
    window.location.protocol !== 'file:'
  );
}

function getFlag(key) {
  const flags = window.APP_CONFIG?.FEATURE_FLAGS;
  if (flags && typeof flags[key] !== 'undefined') {
    // Handle 'true'/'false' strings from environment variables
    if (typeof flags[key] === 'string') {
      return flags[key].toLowerCase() === 'true';
    }
    return !!flags[key];
  }

  // Jeśli flaga nie jest zdefiniowana:
  // - PRODUKCJA: domyślnie WYŁĄCZONA (bezpieczeństwo)
  // - DEVELOPMENT: domyślnie WŁĄCZONA (wygoda)
  if (isProduction()) {
    console.warn(
      `⚠️ Feature flag "${key}" nie jest zdefiniowana na produkcji - domyślnie WYŁĄCZONA`
    );
    return false;
  }

  return DEFAULTS[key];
}

export const isQuizzesEnabled = () => getFlag('ENABLE_QUIZZES');
export const isWorkoutsEnabled = () => getFlag('ENABLE_WORKOUTS');
export const isListeningEnabled = () => getFlag('ENABLE_LISTENING');
export const isKnowledgeBaseEnabled = () => getFlag('ENABLE_KNOWLEDGE_BASE');
export const isFileImportEnabled = () => getFlag('ENABLE_FILE_IMPORT');
export const isAIGeneratorEnabled = () => getFlag('ENABLE_AI_GENERATOR');

/**
 * Zwraca listę zakładek do wyświetlenia w tab barze
 * Logika: główne moduły + funkcje dodatkowe bezpośrednio, jeśli jest miejsce
 * Maksymalnie 4 zakładki w tab barze (potem "Więcej")
 */
export function getEnabledTabs() {
  const MAX_TABS = 4;
  const tabs = [];

  // Sprawdź czy użytkownik jest zalogowany
  const isAuthenticated = !!window.state?.currentUser;

  // Główne moduły - priorytet: Treningi, Wiedza, Quizy, Słuchanie
  // Wszystkie moduły wymagają logowania
  if (getFlag('ENABLE_WORKOUTS') && isAuthenticated) tabs.push('workouts');
  if (getFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated) tabs.push('knowledge-base');
  if (getFlag('ENABLE_QUIZZES') && isAuthenticated) tabs.push('quizzes');
  if (getFlag('ENABLE_LISTENING') && isAuthenticated) tabs.push('listening');

  // Funkcje dodatkowe - również wymagają logowania
  const hasImport = getFlag('ENABLE_FILE_IMPORT') && isAuthenticated;
  const hasAI = getFlag('ENABLE_AI_GENERATOR') && isAuthenticated;
  const additionalFeatures = [];
  if (hasImport) additionalFeatures.push('import');
  if (hasAI) additionalFeatures.push('ai-generator');

  // Jeśli są funkcje dodatkowe
  if (additionalFeatures.length > 0) {
    const remainingSlots = MAX_TABS - tabs.length;

    if (remainingSlots >= additionalFeatures.length) {
      // Wszystkie funkcje dodatkowe zmieszczą się bezpośrednio
      tabs.push(...additionalFeatures);
    } else {
      // Nie ma miejsca - dodaj zakładkę "Więcej"
      tabs.push('more');
    }
  }

  return tabs;
}

export function getActiveCoreTabs() {
  const coreTabs = [];

  // Sprawdź czy użytkownik jest zalogowany
  const isAuthenticated = !!window.state?.currentUser;

  // Kolejność priorytetów: Treningi, Wiedza, Quizy, Słuchanie (spójna z getEnabledTabs)
  // Wszystkie moduły wymagają logowania
  if (getFlag('ENABLE_WORKOUTS') && isAuthenticated) coreTabs.push('workouts');
  if (getFlag('ENABLE_KNOWLEDGE_BASE') && isAuthenticated) coreTabs.push('knowledge-base');
  if (getFlag('ENABLE_QUIZZES') && isAuthenticated) coreTabs.push('quizzes');
  if (getFlag('ENABLE_LISTENING') && isAuthenticated) coreTabs.push('listening');
  return coreTabs;
}

/**
 * Sprawdza czy zakładka "Więcej" jest potrzebna
 */
export function needsMoreTab() {
  const tabs = getEnabledTabs();
  return tabs.includes('more');
}

/**
 * Sprawdza czy funkcja powinna być w tab barze czy w "Więcej"
 */
export function isInTabBar(feature) {
  const tabs = getEnabledTabs();
  return tabs.includes(feature);
}

// Export default object for backward compatibility
export default {
  isQuizzesEnabled,
  isWorkoutsEnabled,
  isListeningEnabled,
  isKnowledgeBaseEnabled,
  isFileImportEnabled,
  isAIGeneratorEnabled,
  getEnabledTabs,
  getActiveCoreTabs,
  needsMoreTab,
  isInTabBar
};

const env = isProduction() ? 'PRODUCTION' : 'DEVELOPMENT';
console.log(`✅ Feature flags initialized (${env} mode)`);
if (isProduction()) {
  console.log('🔒 Niezdefiniowane flagi domyślnie WYŁĄCZONE');
} else {
  console.log('🔧 Niezdefiniowane flagi domyślnie WŁĄCZONE');
}
