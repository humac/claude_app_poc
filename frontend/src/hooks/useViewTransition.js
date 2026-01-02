import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for View Transitions API navigation
 * Provides seamless page transitions using the native browser API
 * Falls back to regular navigation if not supported
 */
export function useViewTransition() {
  const navigate = useNavigate();

  const transitionTo = useCallback((to, options = {}) => {
    // Check if View Transitions API is supported
    if (typeof document === 'undefined' || !document.startViewTransition) {
      navigate(to, options);
      return;
    }

    // Start view transition
    document.startViewTransition(() => {
      navigate(to, options);
    });
  }, [navigate]);

  const transitionBack = useCallback(() => {
    if (typeof document === 'undefined' || !document.startViewTransition) {
      navigate(-1);
      return;
    }

    document.startViewTransition(() => {
      navigate(-1);
    });
  }, [navigate]);

  // Safe feature detection inside the hook
  const isSupported = typeof document !== 'undefined' && 'startViewTransition' in document;

  return {
    transitionTo,
    transitionBack,
    isSupported,
  };
}

/**
 * Utility to wrap any async operation in a view transition
 */
export function withViewTransition(callback) {
  if (typeof document === 'undefined' || !document.startViewTransition) {
    return callback();
  }

  return document.startViewTransition(callback);
}
