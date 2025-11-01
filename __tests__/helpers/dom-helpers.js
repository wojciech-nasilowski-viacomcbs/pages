/**
 * DOM Test Helpers - Utilities for interacting with DOM in tests
 *
 * These helpers make tests more readable and maintainable by providing
 * high-level abstractions for common DOM interactions.
 */

/**
 * Clicks an element by selector
 * @param {string} selector - CSS selector
 * @throws {Error} If element not found
 */
function clickElement(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }
  el.click();
}

/**
 * Clicks an element by text content
 * @param {string} text - Text to search for
 * @param {string} tag - Optional tag name to narrow search
 */
function clickElementByText(text, tag = '*') {
  const elements = Array.from(document.querySelectorAll(tag));
  const el = elements.find(e => e.textContent.trim() === text);
  if (!el) {
    throw new Error(`Element with text "${text}" not found`);
  }
  el.click();
}

/**
 * Types text into an input field
 * @param {string} selector - CSS selector for input
 * @param {string} value - Value to type
 */
function typeIntoInput(selector, value) {
  const input = document.querySelector(selector);
  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Checks/unchecks a checkbox
 * @param {string} selector - CSS selector for checkbox
 * @param {boolean} checked - Whether to check or uncheck
 */
function setCheckbox(selector, checked) {
  const checkbox = document.querySelector(selector);
  if (!checkbox) {
    throw new Error(`Checkbox not found: ${selector}`);
  }
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Gets the currently active tab
 * @returns {string|null} Tab name or null
 */
function getActiveTab() {
  const activeTab = document.querySelector('.tab-button.active');
  return activeTab ? activeTab.dataset.tab : null;
}

/**
 * Gets the currently visible screen
 * @returns {string|null} Screen name or null
 */
function getCurrentScreen() {
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

  for (const screen of screens) {
    const el = document.getElementById(`${screen}-screen`);
    if (el && !el.classList.contains('hidden')) {
      return screen;
    }
  }

  return null;
}

/**
 * Checks if an element is visible (not hidden)
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
function isVisible(selector) {
  const el = document.querySelector(selector);
  if (!el) return false;
  return !el.classList.contains('hidden') && el.style.display !== 'none';
}

/**
 * Checks if an element exists in the DOM
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
function elementExists(selector) {
  return document.querySelector(selector) !== null;
}

/**
 * Gets text content of an element
 * @param {string} selector - CSS selector
 * @returns {string}
 */
function getTextContent(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }
  return el.textContent.trim();
}

/**
 * Gets HTML content of an element
 * @param {string} selector - CSS selector
 * @returns {string}
 */
function getHTMLContent(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }
  return el.innerHTML;
}

/**
 * Checks if element has a CSS class
 * @param {string} selector - CSS selector
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
function hasClass(selector, className) {
  const el = document.querySelector(selector);
  if (!el) return false;
  return el.classList.contains(className);
}

/**
 * Gets all elements matching selector
 * @param {string} selector - CSS selector
 * @returns {Array<Element>}
 */
function getAllElements(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/**
 * Counts elements matching selector
 * @param {string} selector - CSS selector
 * @returns {number}
 */
function countElements(selector) {
  return document.querySelectorAll(selector).length;
}

/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms (default 1000)
 * @returns {Promise<Element>}
 */
async function waitForElement(selector, timeout = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error(`Timeout waiting for element: ${selector}`);
}

/**
 * Waits for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in ms (default 1000)
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Waits for an element to be visible
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms (default 1000)
 * @returns {Promise<void>}
 */
async function waitForVisible(selector, timeout = 1000) {
  await waitFor(() => isVisible(selector), timeout);
}

/**
 * Waits for an element to be hidden
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms (default 1000)
 * @returns {Promise<void>}
 */
async function waitForHidden(selector, timeout = 1000) {
  await waitFor(() => !isVisible(selector), timeout);
}

/**
 * Simulates pressing Enter key in an input
 * @param {string} selector - CSS selector for input
 */
function pressEnter(selector) {
  const input = document.querySelector(selector);
  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }

  const event = new KeyboardEvent('keypress', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  });

  input.dispatchEvent(event);
}

/**
 * Gets value of an input field
 * @param {string} selector - CSS selector
 * @returns {string}
 */
function getInputValue(selector) {
  const input = document.querySelector(selector);
  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }
  return input.value;
}

/**
 * Gets checked state of a checkbox
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
function isChecked(selector) {
  const checkbox = document.querySelector(selector);
  if (!checkbox) {
    throw new Error(`Checkbox not found: ${selector}`);
  }
  return checkbox.checked;
}

/**
 * Triggers a custom event on an element
 * @param {string} selector - CSS selector
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail
 */
function triggerEvent(selector, eventName, detail = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  const event = new CustomEvent(eventName, {
    bubbles: true,
    detail
  });

  el.dispatchEvent(event);
}

/**
 * Scrolls an element into view
 * @param {string} selector - CSS selector
 */
function scrollIntoView(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Mock scrollIntoView in jsdom
  if (el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

module.exports = {
  clickElement,
  clickElementByText,
  typeIntoInput,
  setCheckbox,
  getActiveTab,
  getCurrentScreen,
  isVisible,
  elementExists,
  getTextContent,
  getHTMLContent,
  hasClass,
  getAllElements,
  countElements,
  waitForElement,
  waitFor,
  waitForVisible,
  waitForHidden,
  pressEnter,
  getInputValue,
  isChecked,
  triggerEvent,
  scrollIntoView
};
