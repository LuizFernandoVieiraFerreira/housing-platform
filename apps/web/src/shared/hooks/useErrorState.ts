/**
 * Hook for managing error state in components.
 *
 * Provides a consistent pattern for handling and displaying errors
 * from mutations, form submissions, and other async operations.
 *
 * @example
 * function MyComponent() {
 *   const { error, setError, clearError, handleError } = useErrorState();
 *   const mutation = useMutation({
 *     mutationFn: saveData,
 *     onError: handleError('Unable to save'),
 *   });
 *
 *   return (
 *     <form>
 *       {error && <Alert variant="error">{error}</Alert>}
 *       <button onClick={() => mutation.mutate(data)}>Save</button>
 *     </form>
 *   );
 * }
 */

import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/errors';

interface UseErrorStateReturn {
  /** Current error message, or null if no error */
  error: string | null;

  /** Set a specific error message */
  setError: (message: string) => void;

  /** Clear the current error */
  clearError: () => void;

  /**
   * Create an error handler function for mutation onError callbacks.
   *
   * @param fallback - Fallback message if error cannot be parsed
   * @returns A function that extracts the error message and sets it
   */
  handleError: (fallback?: string) => (error: unknown) => void;

  /**
   * Handle an error directly, extracting the message.
   *
   * @param error - The error to handle
   * @param fallback - Fallback message if error cannot be parsed
   */
  handleErrorDirect: (error: unknown, fallback?: string) => void;
}

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

export function useErrorState(): UseErrorStateReturn {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = useCallback((message: string) => {
    setErrorState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleErrorDirect = useCallback((err: unknown, fallback = DEFAULT_FALLBACK) => {
    const message = getErrorMessage(err, fallback);
    setErrorState(message);
  }, []);

  const handleError = useCallback(
    (fallback = DEFAULT_FALLBACK) => {
      return (err: unknown) => {
        handleErrorDirect(err, fallback);
      };
    },
    [handleErrorDirect],
  );

  return {
    error,
    setError,
    clearError,
    handleError,
    handleErrorDirect,
  };
}

/**
 * Hook for managing multiple named error states.
 *
 * Useful when a component has multiple independent operations
 * that can each have their own error state.
 *
 * @example
 * const { errors, setError, clearError } = useMultiErrorState();
 *
 * // In mutation onError
 * onError: (err) => setError('save', err, 'Unable to save'),
 *
 * // In JSX
 * {errors.save && <Alert>{errors.save}</Alert>}
 */
export function useMultiErrorState() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = useCallback(
    (key: string, error: unknown, fallback = DEFAULT_FALLBACK) => {
      const message = getErrorMessage(error, fallback);
      setErrors((prev) => ({ ...prev, [key]: message }));
    },
    [],
  );

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    hasErrors,
    setError,
    clearError,
    clearAllErrors,
  };
}
