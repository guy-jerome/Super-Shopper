import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { useSettingsStore, type Season } from '../stores/useSettingsStore';

// ─── Season palettes ──────────────────────────────────────────────────────────

const springColors = {
  // Core
  primary: '#7BBFA8',      // warmer sage-teal (was sky blue)
  primaryDark: '#5A9E8A',  // deeper sage
  primaryLight: '#B8E0D2', // soft mint
  error: '#D47070',
  warning: '#D4A050',
  background: '#F5F8EE',   // softer sage-white (was too yellow)
  surface: '#FDFEF9',
  butter: '#EEF7E8',
  butterDark: '#D8EDCC',
  text: '#2A3828',         // deep garden green (was purple-dark)
  textLight: '#6A8870',
  dustyRose: '#F5D2D2',
  lavender: '#BDE3C3',
  softShadow: '#D4E8CC',
  // ── New decorative keys ──
  accent: '#E8A0A0',       // soft poppy red
  accentLight: '#FBE8E8',  // blush wash
  cardBg: '#FEFEFE',       // crisp white cards
  cardBorder: '#D4E8CC',   // pale sage border
  divider: '#C8DFC0',      // sage vine
  stripe: '#84CCAA',       // garden mint left stripe
};

const summerColors = {
  // Core
  primary: '#6BA85C',      // richer garden green (was too yellow-green)
  primaryDark: '#4A7A3C',  // deep garden
  primaryLight: '#B8E0A0', // pale garden
  error: '#C05454',
  warning: '#C87941',
  background: '#EFF8E8',   // garden fresh (was too lime)
  surface: '#F6FBF0',
  butter: '#E4F5D4',
  butterDark: '#C0E0A8',
  text: '#2A4020',         // deep forest
  textLight: '#507040',
  dustyRose: '#D4527A',    // raspberry (repurposed — more on-theme)
  lavender: '#B8E0A0',
  softShadow: '#C0E0A8',
  // ── New decorative keys ──
  accent: '#D4527A',       // raspberry pop
  accentLight: '#FBE8EF',  // blush wash
  cardBg: '#FAFDF5',       // near-white with green breath
  cardBorder: '#B8D9A0',   // light garden border
  divider: '#8BC47A',      // garden green divider
  stripe: '#D4527A',       // raspberry left stripe
};

const autumnColors = {
  // Core (unchanged — already strong)
  primary: '#DA8359',      // warm amber-orange
  primaryDark: '#C06A40',  // burnt sienna
  primaryLight: '#ECDCCC', // warm beige
  error: '#C0524A',
  warning: '#DA8359',
  background: '#FCFAEE',   // warm cream
  surface: '#FFFEF9',
  butter: '#ECDCCC',       // warm beige notepad
  butterDark: '#D4C0A5',
  text: '#3D2B1F',         // warm dark brown
  textLight: '#8C6E5A',
  dustyRose: '#ECDCCC',
  lavender: '#A5B68D',     // muted sage
  softShadow: '#E0CDB8',
  // ── New decorative keys ──
  accent: '#B84A3C',       // apple red
  accentLight: '#F5E8E6',  // apple blush
  cardBg: '#FEFAE8',       // warm sticky-note cream
  cardBorder: '#D4B896',   // kraft paper edge
  divider: '#C8A87A',      // warm tan divider
  stripe: '#DA8359',       // amber left stripe (reuses primary)
};

const winterColors = {
  // Core
  primary: '#94B4C1',      // icy blue — pops on dark bg
  primaryDark: '#547792',  // steel blue
  primaryLight: '#1E3A50', // dark teal (chip backgrounds)
  error: '#D4706A',        // slightly brighter for dark bg
  warning: '#D4874A',
  background: '#213448',   // deep midnight navy
  surface: '#2C4560',      // slightly lighter navy card
  butter: '#1E3A50',       // dark teal notepad
  butterDark: '#2A4A62',   // ruled lines
  text: '#EAE0CF',         // warm off-white
  textLight: '#94B4C1',    // muted icy blue
  dustyRose: '#3D5570',
  lavender: '#3D5570',
  softShadow: '#1A2E42',   // very dark navy
  // ── New decorative keys ──
  accent: '#E8954A',       // firelight orange — secret weapon on dark
  accentLight: '#4A3020',  // dark amber tint (for badges on dark bg)
  cardBg: '#2C4560',       // reuse surface — dark blue card
  cardBorder: '#3D5878',   // slightly lighter navy border
  divider: '#547792',      // steel blue divider
  stripe: '#E8954A',       // firelight orange left stripe
};

export const seasonPalettes: Record<Season, typeof autumnColors> = {
  spring: springColors,
  summer: summerColors,
  autumn: autumnColors,
  winter: winterColors,
};

export type Colors = typeof autumnColors;

export function useColors(): Colors {
  const season = useSettingsStore((s) => s.season);
  return seasonPalettes[season];
}

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ─── Border radii ─────────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 24,
};

// ─── Font config ──────────────────────────────────────────────────────────────
export const fontConfig = {
  fontFamily: 'Nunito_400Regular',
};

// ─── React Native Paper MD3 themes (one per season) ──────────────────────────
function makePaperTheme(c: Colors) {
  return {
    ...MD3LightTheme,
    fonts: configureFonts({ config: { fontFamily: 'Nunito_400Regular' } }),
    colors: {
      ...MD3LightTheme.colors,
      primary: c.primary,
      secondary: c.accent,        // accent replaces dustyRose as Paper secondary
      error: c.error,
      background: c.background,
      surface: c.surface,
      onPrimary: '#FFFFFF',
      onBackground: c.text,
      onSurface: c.text,
    },
  };
}

export const seasonThemes: Record<Season, ReturnType<typeof makePaperTheme>> = {
  spring: makePaperTheme(springColors),
  summer: makePaperTheme(summerColors),
  autumn: makePaperTheme(autumnColors),
  winter: makePaperTheme(winterColors),
};

// Legacy exports kept so auth screens and any stray imports don't break
export const colors = autumnColors;
export const theme = seasonThemes.autumn;
export const darkTheme = seasonThemes.winter;

// Returns seasonal card container style (web boxShadow + borderRadius + bg)
export function getCardStyle(colors: Colors): Record<string, unknown> {
  const base = {
    backgroundColor: colors.cardBg,
    borderRadius: colors.cardBg === '#FEFAE8' ? 4 :   // autumn sticky note
                  colors.cardBg === '#FEFEFE' ? 12 :   // spring
                  colors.cardBg === '#FAFDF5' ? 8 :    // summer
                  10,                                   // winter
  };
  if (typeof document === 'undefined') return base;
  // Web only: box shadow + border
  const isAutumn = colors.cardBg === '#FEFAE8';
  const isSpring = colors.cardBg === '#FEFEFE';
  const isSummer = colors.cardBg === '#FAFDF5';
  return {
    ...base,
    boxShadow: isAutumn
      ? '2px 3px 8px rgba(80,40,10,0.18)'
      : isSpring
      ? '0 1px 4px rgba(100,160,120,0.15)'
      : isSummer
      ? '0 2px 6px rgba(180,100,80,0.12)'
      : '0 1px 4px rgba(20,40,80,0.25)',
    border: isAutumn ? 'none' : `1px solid ${colors.cardBorder}`,
  };
}

// ─── Paper texture (web-only, graceful no-op on native) ───────────────────────
// Returns a subtle linen/paper texture for backgrounds (web-only, no-op on native)
export function getTextureStyle(backgroundColor: string): Record<string, unknown> {
  if (typeof document === 'undefined') return { backgroundColor };
  // Tiny repeating SVG noise pattern at 3% opacity — zero runtime cost
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.035'/></svg>`;
  const encoded = encodeURIComponent(svg);
  return {
    backgroundColor,
    backgroundImage: `url("data:image/svg+xml,${encoded}")`,
  };
}

// ─── Seasonal background patterns (web-only tiled motifs) ─────────────────────
const _noiseSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.03'/></svg>`;

// Tiny bee — spring motif
const _springSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><g transform='translate(24,26) rotate(-25)' opacity='0.07'><ellipse ry='7' rx='4.5' fill='#E8A030'/><rect x='-4.5' y='-4' width='9' height='2' fill='#1A1500'/><rect x='-4.5' y='0.5' width='9' height='2' fill='#1A1500'/><ellipse cx='-7' cy='-3' rx='6' ry='2' fill='#C8E8F4' transform='rotate(-25,-7,-3)'/><ellipse cx='7' cy='-3' rx='6' ry='2' fill='#C8E8F4' transform='rotate(25,7,-3)'/><circle cy='-9' r='2.5' fill='#1A1500'/><line x1='-1' y1='-11' x2='-3' y2='-14' stroke='#1A1500' stroke-width='1'/><line x1='1' y1='-11' x2='3' y2='-14' stroke='#1A1500' stroke-width='1'/><circle cx='-3' cy='-14' r='0.8' fill='#1A1500'/><circle cx='3' cy='-14' r='0.8' fill='#1A1500'/></g></svg>`;

// Tiny raspberry cluster — summer motif
const _summerSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g transform='translate(20,23)' opacity='0.08'><line x1='0' y1='-15' x2='0' y2='-9' stroke='#507040' stroke-width='1.5'/><ellipse cx='-4' cy='-13' rx='4' ry='1.5' fill='#507040' transform='rotate(-35,-4,-13)'/><ellipse cx='4' cy='-13' rx='4' ry='1.5' fill='#507040' transform='rotate(35,4,-13)'/><circle cx='-3.5' cy='-3' r='3' fill='#D4527A'/><circle cx='3.5' cy='-3' r='3' fill='#C84B6B'/><circle cx='0' cy='-6' r='3' fill='#D4527A'/><circle cx='-3.5' cy='2' r='3' fill='#C84B6B'/><circle cx='3.5' cy='2' r='3' fill='#D4527A'/><circle cx='0' cy='0' r='3' fill='#C84B6B'/><circle cx='-2' cy='-4' r='0.9' fill='white'/><circle cx='4' cy='-4' r='0.9' fill='white'/></g></svg>`;

// Tiny maple leaf — autumn motif
const _autumnSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><g transform='translate(22,22) rotate(15)' opacity='0.08'><path d='M0,-11 L-2.5,-6 L-8,-7.5 L-5,-2.5 L-9.5,0.5 L-5,0.5 L-5.5,6.5 L0,4.5 L5.5,6.5 L5,0.5 L9.5,0.5 L5,-2.5 L8,-7.5 L2.5,-6 Z' fill='#DA8359'/><line x1='0' y1='-11' x2='0' y2='6.5' stroke='#B86040' stroke-width='0.9'/></g></svg>`;

// Tiny snowflake — winter motif
const _winterSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g transform='translate(20,20)' opacity='0.09' stroke='#94B4C1' stroke-linecap='round'><g transform='rotate(0)'><line x1='0' y1='-8' x2='0' y2='8' stroke-width='1.5'/><line x1='-2' y1='-5.5' x2='2' y2='-5.5' stroke-width='1'/><line x1='-2' y1='5.5' x2='2' y2='5.5' stroke-width='1'/></g><g transform='rotate(60)'><line x1='0' y1='-8' x2='0' y2='8' stroke-width='1.5'/><line x1='-2' y1='-5.5' x2='2' y2='-5.5' stroke-width='1'/><line x1='-2' y1='5.5' x2='2' y2='5.5' stroke-width='1'/></g><g transform='rotate(120)'><line x1='0' y1='-8' x2='0' y2='8' stroke-width='1.5'/><line x1='-2' y1='-5.5' x2='2' y2='-5.5' stroke-width='1'/><line x1='-2' y1='5.5' x2='2' y2='5.5' stroke-width='1'/></g></g></svg>`;

const _seasonPatternSvgs: Record<Season, string> = {
  spring: _springSvg,
  summer: _summerSvg,
  autumn: _autumnSvg,
  winter: _winterSvg,
};

const _patternSizes: Record<Season, string> = {
  spring: '48px 48px',
  summer: '40px 40px',
  autumn: '44px 44px',
  winter: '40px 40px',
};

// Returns combined seasonal pattern + paper noise for screen backgrounds (web-only)
export function getSeasonalBgStyle(backgroundColor: string, season: Season): Record<string, unknown> {
  if (typeof document === 'undefined') return { backgroundColor };
  const pattern = encodeURIComponent(_seasonPatternSvgs[season]);
  const noise = encodeURIComponent(_noiseSvg);
  return {
    backgroundColor,
    backgroundImage: `url("data:image/svg+xml,${pattern}"), url("data:image/svg+xml,${noise}")`,
    backgroundSize: `${_patternSizes[season]}, 200px 200px`,
    backgroundRepeat: 'repeat, repeat',
  };
}

// Hook version — reads current season automatically
export function useSeasonalBgStyle(backgroundColor: string): Record<string, unknown> {
  const season = useSettingsStore((s) => s.season);
  return getSeasonalBgStyle(backgroundColor, season);
}
