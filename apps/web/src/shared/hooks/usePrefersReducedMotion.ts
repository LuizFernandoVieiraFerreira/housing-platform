import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
}

function subscribe(listener: () => void): () => void {
  const query = getQuery();
  query?.addEventListener('change', listener);

  return () => query?.removeEventListener('change', listener);
}

function getSnapshot(): boolean {
  return getQuery()?.matches ?? false;
}

/**
 * Motion preference as a value, so components can stop animating rather than only
 * hiding the animation. CSS `motion-reduce:` cannot stop a timer.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
