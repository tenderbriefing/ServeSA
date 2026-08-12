/**
 * Serve SA design tokens — TypeScript mirror of apps/web/src/app/globals.css.
 * Use in JS (charts, maps, canvas) so colour never drifts from CSS.
 *
 * Anchors: Blue #002395 · Green #007A4D · Gold #FFB81C · Red #DE3831
 * Charcoal #1F2933 · Warm Off-White #FAF8F3 · White #FFFFFF
 */
export const colour = {
  blue: {
    50: '#eef1fa',
    100: '#d5dbf3',
    200: '#aab7e7',
    300: '#7a8fd6',
    400: '#4a66c4',
    500: '#1e44b0',
    600: '#002395',
    700: '#001c78',
    800: '#00155a',
    900: '#000e3d',
    950: '#000829',
  },
  green: {
    50: '#eef8f3',
    100: '#d5efe3',
    200: '#a8dfc6',
    300: '#6fc5a0',
    400: '#2ea574',
    500: '#008c58',
    600: '#007A4D',
    700: '#005c3a',
    800: '#00432b',
    900: '#002c1c',
    950: '#001910',
  },
  gold: {
    50: '#fff8e8',
    100: '#ffefc4',
    200: '#ffe08a',
    300: '#ffd04d',
    400: '#ffc229',
    500: '#FFB81C',
    600: '#d99700',
    700: '#a67400',
    800: '#735100',
    900: '#473200',
    950: '#2a1d00',
  },
  red: {
    50: '#fef2f1',
    100: '#fce3e1',
    200: '#f7c0bc',
    300: '#ef9089',
    400: '#e65d54',
    500: '#DE3831',
    600: '#b92a24',
    700: '#8f1f1b',
    800: '#681715',
    900: '#45100e',
    950: '#2a0908',
  },
  neutral: {
    50: '#FAF8F3',
    100: '#f3f1ec',
    200: '#e5e2db',
    300: '#d0cdc5',
    400: '#a8a59c',
    500: '#7a7770',
    600: '#56544e',
    700: '#3d3b37',
    800: '#2a2926',
    900: '#1F2933',
    950: '#121820',
  },
  /** @deprecated Prefer colour.blue — kept for chart callers during migration */
  primary: {
    50: '#eef1fa',
    100: '#d5dbf3',
    200: '#aab7e7',
    300: '#7a8fd6',
    400: '#4a66c4',
    500: '#1e44b0',
    600: '#002395',
    700: '#001c78',
    800: '#00155a',
    900: '#000e3d',
  },
  /** @deprecated Prefer colour.green */
  secondary: {
    50: '#eef8f3',
    100: '#d5efe3',
    200: '#a8dfc6',
    300: '#6fc5a0',
    400: '#2ea574',
    500: '#008c58',
    600: '#007A4D',
    700: '#005c3a',
  },
  white: '#FFFFFF',
  ink: '#1F2933',
  inkMuted: '#46535f',
  canvas: '#FAF8F3',
  surface: '#FFFFFF',
  success: '#005c3a',
  warning: '#735100',
  danger: '#b92a24',
  info: '#001c78',
} as const

export const typography = {
  display: 'var(--text-display)',
  h1: 'var(--text-h1)',
  h2: 'var(--text-h2)',
  h3: 'var(--text-h3)',
  h4: 'var(--text-h4)',
  bodyLg: 'var(--text-body-lg)',
  body: 'var(--text-body)',
  bodySm: 'var(--text-body-sm)',
  label: 'var(--text-label)',
  caption: 'var(--text-caption)',
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

/**
 * Motion system tokens (ms).
 * Prefer transform/opacity. Respect prefers-reduced-motion at call sites.
 */
export const motion = {
  /** Micro-interactions: hover, press, focus */
  micro: 160,
  fast: 120,
  base: 180,
  slow: 280,
  /** UI transitions: panels, status chips */
  ui: 320,
  /** Section entrance reveals */
  reveal: 560,
  /** Hero product-film frame crossfades */
  heroFrame: 1100,
  /** Ambient / looping pulse (keep very subtle) */
  ambient: 3200,
} as const

export const motionEasing = {
  civic: 'cubic-bezier(0.2, 0, 0.13, 1)',
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
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

/** Motto / identity copy — product voice */
export const brandCopy = {
  name: 'Serve SA',
  motto: 'Building Better Communities Together',
  tagline: 'Built for South Africa. Built for every community.',
  motifCaption: 'Many communities. One country.',
} as const
