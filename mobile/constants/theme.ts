import { Platform } from 'react-native';

const primaryLight = '#284D63';
const secondaryLight = '#81BFC3';
const primaryDark = '#81BFC3';
const secondaryDark = '#284D63';

export const Colors = {
  light: {
    primary: primaryLight,
    secondary: secondaryLight,
    tint: primaryLight,
    text: '#465C4F',
    textSecondary: '#B4B4B4',
    background: '#FFFFFF',
    card: '#F8FAFB',
    cardBorder: '#E5E7EB',
    input: '#F3F4F6',
    inputBorder: '#E5E7EB',
    income: '#15803D',
    expense: '#0369A1',
    success: '#15803D',
    warning: '#D97706',
    error: '#B91C1C',
    icon: '#687076',
    tabIconDefault: '#B4B4B4',
    tabIconSelected: primaryLight,
    progressBg: '#E5E7EB',
    overlay: 'rgba(0, 0, 0, 0.3)',
    fab: primaryLight,
    fabIcon: '#FFFFFF',
  },
  dark: {
    primary: primaryDark,
    secondary: secondaryDark,
    tint: primaryDark,
    text: '#F8FAFB',
    textSecondary: '#9CA3AF',
    background: '#0F1419',
    card: '#1A2332',
    cardBorder: '#2D3B4F',
    input: '#1A2332',
    inputBorder: '#2D3B4F',
    income: '#4ADE80',
    expense: '#38BDF8',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryDark,
    progressBg: '#2D3B4F',
    overlay: 'rgba(0, 0, 0, 0.6)',
    fab: primaryDark,
    fabIcon: '#0F1419',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
