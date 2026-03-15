import { useEffect } from 'react';
import { Platform } from 'react-native';

interface WebKeyboardHandlers {
  onEscape?: () => void;
  onEnter?: () => void;
  onSlash?: () => void;
}

/**
 * Attaches keyboard shortcuts on web only. Safely no-ops on native.
 */
export function useWebKeyboard(handlers: WebKeyboardHandlers) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handle = (e: KeyboardEvent) => {
      // Don't intercept when focus is inside an input/textarea
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') handlers.onEscape?.();
      if (e.key === 'Enter') handlers.onEnter?.();
      if (e.key === '/') handlers.onSlash?.();
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlers.onEscape, handlers.onEnter, handlers.onSlash]);
}
