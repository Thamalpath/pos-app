import { useEffect } from 'react';

/** Invokes `handler` on Escape while `isActive`. */
export function useEscapeKey(isActive: boolean, handler: () => void): void {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handler]);
}