import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { useSettingsStore, type Season } from '../stores/useSettingsStore';

// ─── Season palettes ──────────────────────────────────────────────────────────

const springColors = {
  primary: '#A3CCDA',     // sky blue
  primaryDark: '#7AAFBF', // deeper sky
  primaryLight: '#BDE3C3',// soft mint
  error: '#D47070',
  warning: '#D4A050',
  background: '#F8F7BA',  // soft warm yellow
  surface: '#FEFEF5',
  butter: '#F8F7BA',
  butterDark: '#EDEAA0',
  text: '#3D3050',        // soft purple-dark
  textLight: '#8A7090',
  dustyRose: '#F5D2D2',
  lavender: '#BDE3C3',
  softShadow: '#E8D8D8',
};

const summerColors = {
  primary: '#84B179',     // leafy sage
  primaryDark: '#5E8B54', // deep garden
  primaryLight: '#C7EABB',// pale mint
  error: '#C05454',
  warning: '#C87941',
  background: '#E8F5BD',  // fresh lime-yellow
  surface: '#F4FADF',
  butter: '#E8F5BD',
  butterDark: '#C7EABB',
  text: '#2D4A28',        // deep forest green
  textLight: '#5A7A55',
  dustyRose: '#A2CB8B',
  lavender: '#C7EABB',
  softShadow: '#C7EABB',
};

const autumnColors = {
  primary: '#DA8359',     // warm amber-orange
  primaryDark: '#C06A40', // burnt sienna
  primaryLight: '#ECDCCC',// warm beige
  error: '#C0524A',
  warning: '#DA8359',
  background: '#FCFAEE',  // warm cream
  surface: '#FFFEF9',
  butter: '#ECDCCC',      // warm beige notepad
  butterDark: '#D4C0A5',
  text: '#3D2B1F',        // warm dark brown
  textLight: '#8C6E5A',
  dustyRose: '#ECDCCC',
  lavender: '#A5B68D',    // muted sage
  softShadow: '#E0CDB8',
};

const winterColors = {
  primary: '#94B4C1',     // icy blue — pops on dark bg
  primaryDark: '#547792', // steel blue
  primaryLight: '#1E3A50',// dark teal (chip backgrounds)
  error: '#D4706A',       // slightly brighter for dark bg
  warning: '#D4874A',
  background: '#213448',  // deep midnight navy
  surface: '#2C4560',     // slightly lighter navy card
  butter: '#1E3A50',      // dark teal notepad
  butterDark: '#2A4A62',  // ruled lines
  text: '#EAE0CF',        // warm off-white
  textLight: '#94B4C1',   // muted icy blue
  dustyRose: '#3D5570',
  lavender: '#3D5570',
  softShadow: '#1A2E42',  // very dark navy
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
      secondary: c.dustyRose,
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
