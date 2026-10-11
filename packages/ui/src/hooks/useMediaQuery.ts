import { useEffect, useState } from 'react';

/** Must stay in sync with the `screens` map in tailwind-preset.js. */
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const evaluate = (query: string): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
};

/**
 * Subscribes to a CSS media query. Uses the `addEventListener` API with a
 * legacy fallback for older WebKit (Tauri on macOS).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => evaluate(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return;
  }, [query]);

  return matches;
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const resolve = () => {
      const width = window.innerWidth;
      const next = order.find(name => width >= breakpoints[name]);
      setBreakpoint(next ?? 'xs');
    };

    resolve();
    window.addEventListener('resize', resolve);
    window.addEventListener('orientationchange', resolve);
    return () => {
      window.removeEventListener('resize', resolve);
      window.removeEventListener('orientationchange', resolve);
    };
  }, []);

  return breakpoint;
}

/** `true` at or above the `lg` breakpoint — the docked-sidebar threshold. */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}