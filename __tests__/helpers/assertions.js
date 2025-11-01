/**
 * Custom Assertions - High-level assertions for integration tests
 *
 * These assertions encapsulate common verification patterns and provide
 * better error messages for debugging test failures.
 */

/**
 * Asserts that a specific tab is active
 * @param {string} expectedTab - Expected tab name
 * @param {string} message - Optional custom message
 */
function assertTabIsActive(expectedTab, message) {
  const activeTab = document.querySelector('.tab-button.active');
  const actualTab = activeTab ? activeTab.dataset.tab : null;

  if (actualTab !== expectedTab) {
    const msg =
      message || `Expected tab "${expectedTab}" to be active, but "${actualTab}" is active`;
    throw new Error(msg);
  }
}

/**
 * Asserts that a specific screen is visible
 * @param {string} expectedScreen - Expected screen name
 * @param {string} message - Optional custom message
 */
function assertScreenIsVisible(expectedScreen, message) {
  const screenEl = document.getElementById(`${expectedScreen}-screen`);

  if (!screenEl) {
    throw new Error(`Screen element not found: ${expectedScreen}-screen`);
  }

  if (screenEl.classList.contains('hidden')) {
    const msg = message || `Expected screen "${expectedScreen}" to be visible, but it's hidden`;
    throw new Error(msg);
  }
}

/**
 * Asserts that content cards contain specific text
 * @param {string} text - Text to search for
 * @param {string} message - Optional custom message
 */
function assertCardsContain(text, message) {
  const contentCards = document.getElementById('content-cards');
  if (!contentCards) {
    throw new Error('Content cards element not found');
  }

  if (!contentCards.innerHTML.includes(text)) {
    const msg = message || `Expected content cards to contain "${text}", but it doesn't`;
    throw new Error(msg);
  }
}

/**
 * Asserts that content cards do NOT contain specific text
 * @param {string} text - Text that should not be present
 * @param {string} message - Optional custom message
 */
function assertCardsDoNotContain(text, message) {
  const contentCards = document.getElementById('content-cards');
  if (!contentCards) {
    throw new Error('Content cards element not found');
  }

  if (contentCards.innerHTML.includes(text)) {
    const msg = message || `Expected content cards NOT to contain "${text}", but it does`;
    throw new Error(msg);
  }
}

/**
 * Asserts that an element is visible
 * @param {string} selector - CSS selector
 * @param {string} message - Optional custom message
 */
function assertVisible(selector, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  if (el.classList.contains('hidden') || el.style.display === 'none') {
    const msg = message || `Expected element "${selector}" to be visible, but it's hidden`;
    throw new Error(msg);
  }
}

/**
 * Asserts that an element is hidden
 * @param {string} selector - CSS selector
 * @param {string} message - Optional custom message
 */
function assertHidden(selector, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  if (!el.classList.contains('hidden') && el.style.display !== 'none') {
    const msg = message || `Expected element "${selector}" to be hidden, but it's visible`;
    throw new Error(msg);
  }
}

/**
 * Asserts that localStorage contains a specific key-value pair
 * @param {string} key - localStorage key
 * @param {string} expectedValue - Expected value
 * @param {string} message - Optional custom message
 */
function assertLocalStorageContains(key, expectedValue, message) {
  const actualValue = localStorage.getItem(key);

  if (actualValue !== expectedValue) {
    const msg =
      message ||
      `Expected localStorage["${key}"] to be "${expectedValue}", but got "${actualValue}"`;
    throw new Error(msg);
  }
}

/**
 * Asserts that state.currentTab matches expected value
 * @param {Object} state - App state
 * @param {string} expectedTab - Expected tab
 * @param {string} message - Optional custom message
 */
function assertStateTab(state, expectedTab, message) {
  if (state.currentTab !== expectedTab) {
    const msg =
      message || `Expected state.currentTab to be "${expectedTab}", but got "${state.currentTab}"`;
    throw new Error(msg);
  }
}

/**
 * Asserts that state.currentView matches expected value
 * @param {Object} state - App state
 * @param {string} expectedView - Expected view
 * @param {string} message - Optional custom message
 */
function assertStateView(state, expectedView, message) {
  if (state.currentView !== expectedView) {
    const msg =
      message ||
      `Expected state.currentView to be "${expectedView}", but got "${state.currentView}"`;
    throw new Error(msg);
  }
}

/**
 * Asserts that only one tab is active
 * @param {string} message - Optional custom message
 */
function assertOnlyOneTabActive(message) {
  const activeTabs = document.querySelectorAll('.tab-button.active');

  if (activeTabs.length !== 1) {
    const activeTabNames = Array.from(activeTabs)
      .map(t => t.dataset.tab)
      .join(', ');
    const msg =
      message ||
      `Expected exactly 1 active tab, but found ${activeTabs.length}: [${activeTabNames}]`;
    throw new Error(msg);
  }
}

/**
 * Asserts that only one screen is visible
 * @param {string} message - Optional custom message
 */
function assertOnlyOneScreenVisible(message) {
  const screens = [
    'main',
    'quiz',
    'quiz-summary',
    'workout',
    'workout-end',
    'listening',
    'knowledge-base',
    'more'
  ];
  const visibleScreens = screens.filter(screen => {
    const el = document.getElementById(`${screen}-screen`);
    return el && !el.classList.contains('hidden');
  });

  if (visibleScreens.length !== 1) {
    const msg =
      message ||
      `Expected exactly 1 visible screen, but found ${visibleScreens.length}: [${visibleScreens.join(', ')}]`;
    throw new Error(msg);
  }
}

/**
 * Asserts that an element has a specific CSS class
 * @param {string} selector - CSS selector
 * @param {string} className - Expected class name
 * @param {string} message - Optional custom message
 */
function assertHasClass(selector, className, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  if (!el.classList.contains(className)) {
    const msg =
      message || `Expected element "${selector}" to have class "${className}", but it doesn't`;
    throw new Error(msg);
  }
}

/**
 * Asserts that an element does NOT have a specific CSS class
 * @param {string} selector - CSS selector
 * @param {string} className - Class name that should not be present
 * @param {string} message - Optional custom message
 */
function assertDoesNotHaveClass(selector, className, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  if (el.classList.contains(className)) {
    const msg =
      message || `Expected element "${selector}" NOT to have class "${className}", but it does`;
    throw new Error(msg);
  }
}

/**
 * Asserts that a specific number of elements match selector
 * @param {string} selector - CSS selector
 * @param {number} expectedCount - Expected count
 * @param {string} message - Optional custom message
 */
function assertElementCount(selector, expectedCount, message) {
  const elements = document.querySelectorAll(selector);
  const actualCount = elements.length;

  if (actualCount !== expectedCount) {
    const msg =
      message ||
      `Expected ${expectedCount} elements matching "${selector}", but found ${actualCount}`;
    throw new Error(msg);
  }
}

/**
 * Asserts that element text content matches expected value
 * @param {string} selector - CSS selector
 * @param {string} expectedText - Expected text
 * @param {string} message - Optional custom message
 */
function assertTextContent(selector, expectedText, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  const actualText = el.textContent.trim();

  if (actualText !== expectedText) {
    const msg =
      message ||
      `Expected element "${selector}" to have text "${expectedText}", but got "${actualText}"`;
    throw new Error(msg);
  }
}

/**
 * Asserts that element text content contains expected substring
 * @param {string} selector - CSS selector
 * @param {string} expectedSubstring - Expected substring
 * @param {string} message - Optional custom message
 */
function assertTextContains(selector, expectedSubstring, message) {
  const el = document.querySelector(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  const actualText = el.textContent.trim();

  if (!actualText.includes(expectedSubstring)) {
    const msg =
      message ||
      `Expected element "${selector}" text to contain "${expectedSubstring}", but got "${actualText}"`;
    throw new Error(msg);
  }
}

/**
 * Asserts that user is logged in (state.currentUser is not null)
 * @param {Object} state - App state
 * @param {string} message - Optional custom message
 */
function assertUserLoggedIn(state, message) {
  if (!state.currentUser) {
    const msg = message || 'Expected user to be logged in, but currentUser is null';
    throw new Error(msg);
  }
}

/**
 * Asserts that user is NOT logged in (state.currentUser is null)
 * @param {Object} state - App state
 * @param {string} message - Optional custom message
 */
function assertUserNotLoggedIn(state, message) {
  if (state.currentUser) {
    const msg =
      message ||
      `Expected user to be logged out, but currentUser is ${JSON.stringify(state.currentUser)}`;
    throw new Error(msg);
  }
}

module.exports = {
  assertTabIsActive,
  assertScreenIsVisible,
  assertCardsContain,
  assertCardsDoNotContain,
  assertVisible,
  assertHidden,
  assertLocalStorageContains,
  assertStateTab,
  assertStateView,
  assertOnlyOneTabActive,
  assertOnlyOneScreenVisible,
  assertHasClass,
  assertDoesNotHaveClass,
  assertElementCount,
  assertTextContent,
  assertTextContains,
  assertUserLoggedIn,
  assertUserNotLoggedIn
};
