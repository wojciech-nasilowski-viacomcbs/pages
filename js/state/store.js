/**
 * @fileoverview Lightweight state manager for vanilla JS
 * Provides reactive state management with subscriptions (pub/sub pattern)
 * @module state-manager
 */

/**
 * Creates a reactive store with state management and subscriptions
 * @template T
 * @param {T} initialState - Initial state object
 * @returns {Store<T>} Store instance with getState, setState, and subscribe methods
 *
 * @example
 * const store = createStore({ count: 0 });
 * store.subscribe((state) => console.log('Count:', state.count));
 * store.setState({ count: 1 }); // Logs: "Count: 1"
 */
export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    /**
     * Gets current state (returns a copy to prevent mutations)
     * @returns {T} Current state
     */
    getState() {
      return { ...state };
    },

    /**
     * Updates state and notifies all subscribers
     * @param {Partial<T>} updates - Object with state updates (shallow merge)
     * @param {boolean} [silent=false] - If true, don't notify listeners
     */
    setState(updates, silent = false) {
      const prevState = { ...state };
      state = { ...state, ...updates };

      if (!silent) {
        // Notify all listeners with new state and previous state
        listeners.forEach(listener => {
          try {
            listener(state, prevState);
          } catch (error) {
            console.error('Error in state listener:', error);
          }
        });
      }
    },

    /**
     * Subscribes to state changes
     * @param {(state: T, prevState: T) => void} listener - Callback function
     * @returns {() => void} Unsubscribe function
     *
     * @example
     * const unsubscribe = store.subscribe((state) => {
     *   console.log('State changed:', state);
     * });
     * // Later: unsubscribe();
     */
    subscribe(listener) {
      listeners.add(listener);

      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },

    /**
     * Gets number of active subscribers (for debugging)
     * @returns {number} Number of subscribers
     */
    getSubscriberCount() {
      return listeners.size;
    },

    /**
     * Resets state to initial values
     */
    reset() {
      state = { ...initialState };
      listeners.forEach(listener => {
        try {
          listener(state, {});
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  };
}

console.log('✅ State manager initialized');
