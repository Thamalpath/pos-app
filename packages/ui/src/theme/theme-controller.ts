import { useCallback, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'omnipos-theme';
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

type Listener = () => void;

const listeners = new Set<Listener>();

export const DEFAULT_THEME: ThemePreference = 'light';

let preference: ThemePreference = DEFAULT_THEME;
let systemPrefersDark = false;
let initialized = false;
let mediaQuery: MediaQueryList | null = null;

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const readStoredPreference = (): ThemePreference => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Private mode / blocked storage — fall back to the light default.
    return DEFAULT_THEME;
  }
};

const writeStoredPreference = (value: ThemePreference): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Non-fatal: the theme still applies for this session.
  }
};

const detectSystemTheme = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DARK_MEDIA_QUERY).matches;

/**
 * Reflects the resolved theme onto <html>, which drives both the CSS variable
 * palette and Tailwind's `dark:` variants. Must mirror THEME_INIT_SCRIPT.
 */
export const applyResolvedTheme = (resolved: ResolvedTheme): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
};

export const getThemePreference = (): ThemePreference => preference;

export const getResolvedTheme = (): ResolvedTheme =>
  preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

const emit = (): void => {
  listeners.forEach(listener => listener());
};

/**
 * Idempotent bootstrap: wires up OS-preference and cross-tab listeners, then
 * applies the persisted theme. Safe to call during render.
 */
export const initTheme = (): void => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  preference = readStoredPreference();
  systemPrefersDark = detectSystemTheme();

  if (typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    systemPrefersDark = mediaQuery.matches;

    const handleSystemChange = (event: MediaQueryListEvent) => {
      systemPrefersDark = event.matches;
      applyResolvedTheme(getResolvedTheme());
      emit();
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      // Safari < 14
      mediaQuery.addListener(handleSystemChange);
    }
  }

  // Keep multiple tabs / windows in sync.
  window.addEventListener('storage', event => {
    if (event.key !== THEME_STORAGE_KEY) return;
    preference = readStoredPreference();
    applyResolvedTheme(getResolvedTheme());
    emit();
  });

  applyResolvedTheme(getResolvedTheme());
};

export const setThemePreference = (next: ThemePreference): void => {
  initTheme();
  if (next === preference) return;
  preference = next;
  writeStoredPreference(next);
  applyResolvedTheme(getResolvedTheme());
  emit();
};

export const toggleTheme = (): void => {
  setThemePreference(getResolvedTheme() === 'dark' ? 'light' : 'dark');
};

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export interface ThemeController {
  /** The user's choice: `system` tracks the OS. */
  theme: ThemePreference;
  /** The concrete theme currently painted. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

/**
 * Works with or without a <ThemeProvider> — the controller is module scoped, so
 * every consumer stays in sync. A missing provider degrades to a working theme
 * toggle rather than crashing a live till.
 */
export const useTheme = (): ThemeController => {
  initTheme();

  const theme = useSyncExternalStore(subscribe, getThemePreference, () => DEFAULT_THEME);
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedTheme, () => 'light' as const);

  const setTheme = useCallback((next: ThemePreference) => setThemePreference(next), []);
  const handleToggle = useCallback(() => toggleTheme(), []);

  return { theme, resolvedTheme, setTheme, toggleTheme: handleToggle };
};

/**
 * Blocking script injected in index.html to apply the persisted theme before
 * first paint, preventing a flash of the wrong theme. Keep in sync with
 * applyResolvedTheme / THEME_STORAGE_KEY above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);if(p!=='light'&&p!=='dark'&&p!=='system'){p='${DEFAULT_THEME}';}var d=p==='system'?(window.matchMedia&&window.matchMedia('${DARK_MEDIA_QUERY}').matches?'dark':'light'):p;var e=document.documentElement;e.classList.toggle('dark',d==='dark');e.classList.toggle('light',d==='light');e.setAttribute('data-theme',d);e.style.colorScheme=d;}catch(_){}})();`;