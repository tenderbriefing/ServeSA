/**
 * Serve SA design tokens — TypeScript mirror of apps/web/src/app/globals.css.
 * Use these values in JS (charts, maps, canvas) so colour never drifts from CSS.
 */
export const colour = {
  primary: {
    50: '#f2f7fb',
    100: '#e1edf6',
    200: '#bbd6ea',
    300: '#7fb1d8',
    400: '#3b84bf',
    500: '#14639f',
    600: '#0e4c7e',
    700: '#0a3b63',
    800: '#072b4a',
    900: '#04182b',
  },
  secondary: {
    50: '#effaf7',
    100: '#dcf2ec',
    200: '#a7ded0',
    300: '#5fc2ab',
    400: '#12907a',
    500: '#0e7361',
    600: '#0b5c4e',
    700: '#08453a',
  },
  gold: {
    50: '#fffbeb',
    100: '#fdf3d7',
    200: '#f2dfa0',
    300: '#d9a93c',
    400: '#c08a18',
    500: '#a16207',
    600: '#7c4a05',
  },
  ink: '#16202a',
  inkMuted: '#46535f',
  canvas: '#f7f8fa',
  surface: '#ffffff',
  success: '#146c43',
  warning: '#a16207',
  danger: '#b3261e',
  info: '#0e4c7e',
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const

export const radii = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
} as const

export const motion = {
  fast: 120,
  base: 180,
  slow: 280,
} as const

export const breakpoints = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const touchTargetMinPx = 44
export const bodyFontMinPx = 16
