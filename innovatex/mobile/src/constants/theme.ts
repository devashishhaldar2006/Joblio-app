import { Platform } from 'react-native';

export const COLORS = {
  bgCanvas: '#000000',
  bgCard: '#111111',
  bgCardHover: '#1A1A1A',
  bgSubtle: '#161616',
  bgInput: '#0E0E0E',

  border: '#222222',
  borderStrong: '#333333',
  borderDark: '#444444',
  borderSubtle: '#1A1A1A',

  textPrimary: '#FFFFFF',    
  textSecondary: '#A0A0A0',   
  textMuted: '#666666',       
  textInverse: '#000000',     

  primary: '#FFFFFF',
  primaryHover: '#E5E5E5',
  inputBg: '#0E0E0E',
  accentPrimary: '#FFFFFF',
  accentPrimaryHover: '#E5E5E5',
  accentSubtle: '#1C1C1C',
  accentText: '#FFFFFF',

  redText: '#FF5C5C',
  redBg: 'rgba(255, 92, 92, 0.12)',
  redBorder: 'rgba(255, 92, 92, 0.25)',
  yellowText: '#F5B041',
  yellowBg: 'rgba(245, 176, 65, 0.12)',
  yellowBorder: 'rgba(245, 176, 65, 0.25)',

  statusSuccessText: '#4ADE80',
  statusSuccessBg: 'rgba(74, 222, 128, 0.12)',
  statusAlertText: '#FF5C5C',
  statusAlertBg: 'rgba(255, 92, 92, 0.12)',
  statusWarningText: '#F5B041',
  statusWarningBg: 'rgba(245, 176, 65, 0.12)',
  statusNeutralText: '#A0A0A0',
  statusNeutralBg: '#1A1A1A',

  accentWarning: '#F5B041',
  accentAlert: '#FF5C5C',
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
    default: 'sans-serif-medium',
  }),
  mono: Platform.select({
    ios: 'Menlo',
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

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
};
