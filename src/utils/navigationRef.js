import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

// Global reference to the navigation container enabling control
// from outside React component lifecycles (e.g. Redux middleware or firebase handlers)
export const navigationRef = createNavigationContainerRef();

/**
 * Navigates to a specific screen route.
 * 
 * @param {string} name - Name of the target screen
 * @param {object} [params] - Parameter dictionary passed to target screen
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/**
 * Pops the current screen and returns to the previous one in the stack.
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Resets the entire navigation stack and designates a single screen as the new root.
 * Useful for auth transitions (e.g., logging in or logging out).
 * 
 * @param {string} routeName - Name of the screen to become the new root
 */
export function reset(routeName) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName }],
      })
    );
  }
}

/**
 * Retrieves the currently active route object details.
 * 
 * @returns {object|null} Active route object or null if ref is not initialized
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}
