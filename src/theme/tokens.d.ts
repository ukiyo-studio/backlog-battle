/**
 * Type declarations for tokens.js (CommonJS, consumed by tailwind.config.js).
 * Lets src/theme/index.ts import the palette with full typing without
 * requiring `allowJs` in tsconfig.
 */

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
}

export declare const palette: Palette;

/** Tailwind theme.extend object; only tailwind.config.js should consume this. */
export declare const themeExtend: Record<string, unknown>;
