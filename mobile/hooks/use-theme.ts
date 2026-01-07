import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    colors: Colors[colorScheme],
    isDark: colorScheme === 'dark',
    colorScheme,
  };
}
