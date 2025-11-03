/**
 * @fileoverview DOM Helper utilities for creating and manipulating DOM elements
 * @module dom-helpers
 */

/**
 * Creates an HTML element with properties and children
 * @param {string} tag - HTML tag name (e.g., 'div', 'button', 'span')
 * @param {Object} [props={}] - Element properties and attributes
 * @param {string} [props.className] - CSS class names
 * @param {string} [props.id] - Element ID
 * @param {string} [props.textContent] - Text content
 * @param {string} [props.innerHTML] - HTML content (use with caution)
 * @param {Object} [props.style] - Inline styles object
 * @param {Object} [props.dataset] - Data attributes
 * @param {...(string|Node|null|undefined)} children - Child elements or text nodes
 * @returns {HTMLElement} The created element
 *
 * @example
 * const button = h('button',
 *   { className: 'btn btn-primary', onclick: () => alert('Clicked!') },
 *   'Click me'
 * );
 *
 * @example
 * const card = h('div', { className: 'card' },
 *   h('h2', {}, 'Title'),
 *   h('p', {}, 'Description')
 * );
 */
export const h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag);

  // Handle special properties
  if (props) {
    const { style, dataset, className, ...restProps } = props;

    // Set className separately (since 'class' is reserved)
    if (className) {
      el.className = className;
    }

    // Apply inline styles
    if (style && typeof style === 'object') {
      Object.assign(el.style, style);
    }

    // Apply data attributes
    if (dataset && typeof dataset === 'object') {
      Object.entries(dataset).forEach(([key, value]) => {
        el.dataset[key] = value;
      });
    }

    // Apply remaining properties
    Object.entries(restProps).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        // Event listeners
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (value !== null && value !== undefined) {
        // Regular attributes/properties
        el[key] = value;
      }
    });
  }

  // Append children
  children.forEach(child => {
    if (child !== null && child !== undefined) {
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  });

  return el;
};

/**
 * Creates a text node
 * @param {string|number} text - Text content
 * @returns {Text} Text node
 *
 * @example
 * const textNode = text('Hello World');
 */
export const text = text => document.createTextNode(String(text));

/**
 * Creates a document fragment from multiple elements
 * @param {...(Node|string)} children - Child elements
 * @returns {DocumentFragment} Document fragment
 *
 * @example
 * const fragment = fragment(
 *   h('div', {}, 'First'),
 *   h('div', {}, 'Second')
 * );
 */
export const fragment = (...children) => {
  const frag = document.createDocumentFragment();
  children.forEach(child => {
    if (child instanceof Node) {
      frag.appendChild(child);
    } else if (typeof child === 'string') {
      frag.appendChild(document.createTextNode(child));
    }
  });
  return frag;
};

/**
 * Removes all children from an element
 * @param {HTMLElement} element - Element to clear
 * @returns {HTMLElement} The cleared element (for chaining)
 *
 * @example
 * clear(document.getElementById('container'));
 */
export const clear = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  return element;
};

/**
 * Replaces all children of an element with new content
 * @param {HTMLElement} element - Parent element
 * @param {...(Node|string)} children - New children
 * @returns {HTMLElement} The parent element (for chaining)
 *
 * @example
 * replace(container,
 *   h('h1', {}, 'New Title'),
 *   h('p', {}, 'New content')
 * );
 */
export const replace = (element, ...children) => {
  clear(element);
  children.forEach(child => {
    if (child instanceof Node) {
      element.appendChild(child);
    } else if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    }
  });
  return element;
};

/**
 * Adds CSS classes to an element
 * @param {HTMLElement} element - Target element
 * @param {...string} classes - Class names to add
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * addClass(button, 'active', 'highlighted');
 */
export const addClass = (element, ...classes) => {
  element.classList.add(...classes);
  return element;
};

/**
 * Removes CSS classes from an element
 * @param {HTMLElement} element - Target element
 * @param {...string} classes - Class names to remove
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * removeClass(button, 'active', 'highlighted');
 */
export const removeClass = (element, ...classes) => {
  element.classList.remove(...classes);
  return element;
};

/**
 * Toggles CSS classes on an element
 * @param {HTMLElement} element - Target element
 * @param {...string} classes - Class names to toggle
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * toggleClass(button, 'active');
 */
export const toggleClass = (element, ...classes) => {
  classes.forEach(cls => element.classList.toggle(cls));
  return element;
};

/**
 * Sets multiple attributes on an element
 * @param {HTMLElement} element - Target element
 * @param {Object.<string, string>} attributes - Attributes to set
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * setAttrs(img, { src: 'image.jpg', alt: 'Description' });
 */
export const setAttrs = (element, attributes) => {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

/**
 * Queries a single element (shorthand for querySelector)
 * @param {string} selector - CSS selector
 * @param {Document|HTMLElement} [parent=document] - Parent element to search within
 * @returns {HTMLElement|null} Found element or null
 *
 * @example
 * const button = qs('.btn-primary');
 * const nested = qs('.item', container);
 */
export const qs = (selector, parent = document) => parent.querySelector(selector);

/**
 * Queries multiple elements (shorthand for querySelectorAll)
 * @param {string} selector - CSS selector
 * @param {Document|HTMLElement} [parent=document] - Parent element to search within
 * @returns {NodeListOf<HTMLElement>} NodeList of found elements
 *
 * @example
 * const buttons = qsa('.btn');
 * qsa('.item', container).forEach(item => console.log(item));
 */
export const qsa = (selector, parent = document) => parent.querySelectorAll(selector);

/**
 * Gets element by ID (shorthand)
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Found element or null
 *
 * @example
 * const header = byId('main-header');
 */
export const byId = id => document.getElementById(id);

/**
 * Adds event listener with optional delegation
 * @param {HTMLElement|Document} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {string|Function} selectorOrHandler - CSS selector for delegation or handler function
 * @param {Function} [handler] - Handler function (if using delegation)
 * @returns {Function} Function to remove the listener
 *
 * @example
 * // Direct listener
 * on(button, 'click', () => console.log('clicked'));
 *
 * @example
 * // Delegated listener
 * on(document, 'click', '.btn', (e) => console.log('Button clicked', e.target));
 */
export const on = (element, event, selectorOrHandler, handler) => {
  if (typeof selectorOrHandler === 'function') {
    // Direct listener
    element.addEventListener(event, selectorOrHandler);
    return () => element.removeEventListener(event, selectorOrHandler);
  } else {
    // Delegated listener
    const delegatedHandler = e => {
      if (e.target.matches(selectorOrHandler)) {
        handler(e);
      }
    };
    element.addEventListener(event, delegatedHandler);
    return () => element.removeEventListener(event, delegatedHandler);
  }
};

/**
 * Shows an element (removes 'hidden' class)
 * @param {HTMLElement} element - Element to show
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * show(modal);
 */
export const show = element => {
  element.classList.remove('hidden');
  return element;
};

/**
 * Hides an element (adds 'hidden' class)
 * @param {HTMLElement} element - Element to hide
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * hide(modal);
 */
export const hide = element => {
  element.classList.add('hidden');
  return element;
};

/**
 * Toggles element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} [force] - Force show (true) or hide (false)
 * @returns {HTMLElement} The element (for chaining)
 *
 * @example
 * toggle(modal); // Toggle visibility
 * toggle(modal, true); // Force show
 */
export const toggle = (element, force) => {
  element.classList.toggle('hidden', force !== undefined ? !force : undefined);
  return element;
};

/**
 * Creates a button element with common patterns
 * @param {string} text - Button text
 * @param {Object} [options={}] - Button options
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onClick] - Click handler
 * @param {string} [options.type='button'] - Button type
 * @param {boolean} [options.disabled=false] - Disabled state
 * @returns {HTMLButtonElement} Button element
 *
 * @example
 * const btn = button('Save', {
 *   className: 'btn-primary',
 *   onClick: () => save()
 * });
 */
export const button = (text, options = {}) => {
  const { className = '', onClick, type = 'button', disabled = false } = options;
  return h(
    'button',
    {
      className: `px-4 py-2 rounded ${className}`,
      type,
      disabled,
      onclick: onClick
    },
    text
  );
};

/**
 * Creates an input element with common patterns
 * @param {Object} [options={}] - Input options
 * @param {string} [options.type='text'] - Input type
 * @param {string} [options.placeholder] - Placeholder text
 * @param {string} [options.value] - Initial value
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onInput] - Input handler
 * @returns {HTMLInputElement} Input element
 *
 * @example
 * const input = inputEl({
 *   type: 'email',
 *   placeholder: 'Enter email',
 *   onInput: (e) => console.log(e.target.value)
 * });
 */
export const inputEl = (options = {}) => {
  const { type = 'text', placeholder = '', value = '', className = '', onInput } = options;

  return h('input', {
    type,
    placeholder,
    value,
    className: `px-3 py-2 rounded border ${className}`,
    oninput: onInput
  });
};

/**
 * Creates a loading spinner element
 * @param {string} [size='md'] - Size: 'sm', 'md', 'lg'
 * @returns {HTMLElement} Spinner element
 *
 * @example
 * const spinner = loading('lg');
 * container.appendChild(spinner);
 */
export const loading = (size = 'md') => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return h('div', {
    className: `animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`
  });
};

/**
 * Creates an icon element (using emoji or text)
 * @param {string} icon - Icon character or emoji
 * @param {string} [className=''] - Additional CSS classes
 * @returns {HTMLElement} Icon element
 *
 * @example
 * const icon = iconEl('🎯', 'text-2xl');
 */
export const iconEl = (icon, className = '') => {
  return h('span', { className: `inline-block ${className}` }, icon);
};
