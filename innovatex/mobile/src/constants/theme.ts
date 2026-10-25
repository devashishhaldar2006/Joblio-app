/**
 * Strict Minimalist Monochrome Design Tokens
 * Clean, Swiss/Scandinavian-inspired black & white system.
 * Zero neon glow, zero flashy AI-style gradients.
 */
import { Platform } from 'react-native';

export const COLORS = {
  // Backgrounds
  bgCanvas: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgSubtle: '#F8F9FA',
  bgHover: '#F1F3F5',
  
  // Borders & Dividers
  border: '#E9ECEF',
  borderStrong: '#CED4DA',
  borderDark: '#111111',

  // Foreground / Typography
  textPrimary: '#111111',
  textSecondary: '#495057',
  textMuted: '#868E96',
  textInverse: '#FFFFFF',

  // Primary Action Elements (Solid Black / Charcoal)
  primary: '#111111',
  primaryHover: '#212529',
  inputBg: '#FFFFFF',

  // Minimal Status Accents (Restrained, high contrast, low saturation)
  statusSuccessText: '#1B4332',
  statusSuccessBg: '#E8F5E9',
  statusAlertText: '#7F1D1D',
  statusAlertBg: '#FEE2E2',
  statusNeutralText: '#374151',
  statusNeutralBg: '#F3F4F6',
};

export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
