import React from 'react';
import { useTheme } from './theme-controller';

/**
 * Applies the theme controller to the tree. The controller is module scoped, so
 * this provider mainly exists as an explicit, greppable mount point and a
 * natural home for future per-app preferences.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useTheme();
  return <>{children}</>;
};