/**
 * Backlog Battle design tokens.
 *
 * CONTRACT: Consumed by tailwind.config.js via theme.extend. The integrator
 * must add exactly this to tailwind.config.js:
 *
 *   const { themeExtend } = require('./src/theme/tokens');
 *   module.exports = {
 *     // ...content, presets, etc.
 *     theme: { extend: themeExtend },
 *   };
 *
 * This file is intentionally CommonJS so tailwind.config.js can `require` it
 * in Node. Typed access for app code lives in src/theme/index.ts (backed by
 * tokens.d.ts) — do not import this file directly from feature code.
 *
 * Visual direction (docs/decisions-log.md Decision 002): retro-arcade on a
 * light background. Chunky ink borders + hard offset shadows carry the 8-bit
 * feel; body text stays plain and readable.
 */

/** Semantic color palette. Single source of truth for every color in the app. */
const palette = {
  // Warm paper background with near-black "ink" text — readable, not neon.
  background: '#FAF5EA',
  foreground: '#211E1A',

  // Surfaces.
  card: '#FFFDF7',
  cardForeground: '#211E1A',

  // Player-1 arcade blue. Primary actions.
  primary: '#2563EB',
  primaryForeground: '#FFFDF7',

  // Coin gold. Secondary actions, highlights, selected states.
  secondary: '#F4C430',
  secondaryForeground: '#211E1A',

  // Flame orange. Battle moments: VS badges, round banners, progress fill.
  accent: '#E4572E',
  accentForeground: '#FFFDF7',

  // Game-over red.
  destructive: '#C0271C',
  destructiveForeground: '#FFFDF7',

  // Quiet surfaces and supporting text.
  muted: '#EFE7D6',
  mutedForeground: '#6B6255',

  // Chunky pixel borders are ink-colored; form-field borders are calmer.
  border: '#211E1A',
  input: '#B8AD9C',
  ring: '#2563EB',
};

/** Tailwind theme.extend object. Keys become utility classes (bg-primary, border-3, shadow-box, ...). */
const themeExtend = {
  colors: {
    background: palette.background,
    foreground: palette.foreground,
    card: {
      DEFAULT: palette.card,
      foreground: palette.cardForeground,
    },
    primary: {
      DEFAULT: palette.primary,
      foreground: palette.primaryForeground,
    },
    secondary: {
      DEFAULT: palette.secondary,
      foreground: palette.secondaryForeground,
    },
    accent: {
      DEFAULT: palette.accent,
      foreground: palette.accentForeground,
    },
    destructive: {
      DEFAULT: palette.destructive,
      foreground: palette.destructiveForeground,
    },
    muted: {
      DEFAULT: palette.muted,
      foreground: palette.mutedForeground,
    },
    border: palette.border,
    input: palette.input,
    ring: palette.ring,
  },

  // border-3 is the standard chunky pixel border; border-5 for hero moments.
  borderWidth: {
    3: '3px',
    5: '5px',
  },

  // Hard offset shadows (zero blur) — the 8-bit "sticker" look.
  // Pressed states pair shadow-box with translate-x-1 translate-y-1 (both 4px)
  // and shadow-none so the element visually drops into its shadow.
  boxShadow: {
    'box-sm': `2px 2px 0px 0px ${palette.border}`,
    box: `4px 4px 0px 0px ${palette.border}`,
    'box-lg': `6px 6px 0px 0px ${palette.border}`,
  },

  // Pixel aesthetic: `rounded` is square by default; rounded-pixel softens
  // corners just enough to avoid anti-aliasing artifacts on dense screens.
  borderRadius: {
    DEFAULT: '0px',
    pixel: '2px',
  },
};

module.exports = { palette, themeExtend };
