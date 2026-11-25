/**
 * Design tokens — the single source of truth for CreatorConnect's visual
 * identity. The same values are mirrored as CSS custom properties in
 * `tokens.css`, which both apps import. Keep the two in sync.
 *
 * Palette: warm off-white backgrounds, near-black text, one warm coral accent.
 * Contrast pairings are chosen to target WCAG 2.2 AA.
 */
export const tokens = {
  color: {
    bg: '#0E0C14',
    bgSubtle: '#15121E',
    surface: '#181424',
    surfaceSubtle: '#1F1A2E',

    text: '#F5F3FB',
    textMuted: '#B6AECB',
    textSubtle: '#867E9C',
    textOnAccent: '#1A1030',

    border: '#2A2540',
    borderStrong: '#3A3356',

    accent: '#A78BFA', // violet — buttons / large text
    accentHover: '#B9A3FB',
    accentInk: '#C4B5FD', // violet text on dark bg
    accentSoft: '#241C3C', // violet tint surface
    accentBorder: '#3D3163',

    focus: '#C4B5FD', // visible focus ring on dark
    success: '#5CE09B',
    successSoft: '#14301F',
    warning: '#F5C451',
    warningSoft: '#2E2510',
    danger: '#FF8A8A',
    dangerSoft: '#331519',
  },
  font: {
    sans: `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
    // High-contrast serif for marketing headlines
    display: `'Playfair Display', 'Georgia', serif`,
  },
  fontSize: {
    xs: '0.78rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.25rem',
    '4xl': '3rem',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    pill: '999px',
  },
  space: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.5rem',
    6: '2rem',
    7: '3rem',
    8: '4rem',
  },
  shadow: {
    sm: '0 1px 2px rgba(26, 25, 23, 0.06)',
    md: '0 4px 16px rgba(26, 25, 23, 0.08)',
    lg: '0 12px 32px rgba(26, 25, 23, 0.12)',
  },
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  maxWidth: {
    content: '1180px',
    prose: '720px',
  },
} as const;

export type Tokens = typeof tokens;
