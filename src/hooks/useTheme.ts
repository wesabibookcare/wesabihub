import { useSettings } from '../context/SettingsContext';

export const useTheme = () => {
  const { theme, setTheme } = useSettings();
  return { theme, setTheme };
};
