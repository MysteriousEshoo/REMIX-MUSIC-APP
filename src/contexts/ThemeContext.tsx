import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Colors as DefaultColors } from '../theme';

// Light theme colors
const LightColors = {
  ...DefaultColors,
  background: '#F5F5F5',
  backgroundElevated: '#FFFFFF',
  backgroundHighlight: '#EEEEEE',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F0',
  textPrimary: '#121212',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  border: '#E0E0E0',
  borderLight: '#D0D0D0',
  tabBarActive: '#121212',
  tabBarInactive: '#999999',
};

type ThemeType = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof DefaultColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isDark: true,
  colors: DefaultColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((t: ThemeType) => {
    setThemeState(t);
  }, []);

  const colors = theme === 'dark' ? DefaultColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
