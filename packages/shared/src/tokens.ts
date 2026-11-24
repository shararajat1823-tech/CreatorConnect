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
    bg: '#FBFAF7',
    bgSubtle: '#F3F1EC',
    surface: '#FFFFFF',
    surfaceSubtle: '#FAF8F4',

    text: '#1A1917', // near-black, ~15.8:1 on bg
    textMuted: '#595650', // ~7.2:1 on bg
    textSubtle: '#7A756C', // ~4.6:1 on bg (AA for normal text)
    textOnAccent: '#FFFFFF',

    border: '#E6E1D8',
    borderStrong: '#D2CCC0',

    accent: '#E8482D', // coral — buttons / large text
    accentHover: '#CC3B22',
    accentInk: '#B2351E', // coral text on light bg (AA for normal text)
    accentSoft: '#FCEEE9', // coral tint surface
    accentBorder: '#F3C9BD',

    focus: '#0B5BD3', // visible focus ring, distinct from the accent
    success: '#1F7A4D',
    successSoft: '#E7F3EC',
    warning: '#8A5A00',
    warningSoft: '#FBF1DC',
    danger: '#B4332A',
    dangerSoft: '#FBEAE8',
  },
  font: {
    sans: `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
    // Fluid display for marketing headlines
    display: `'Inter', system-ui, sans-serif`,
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
