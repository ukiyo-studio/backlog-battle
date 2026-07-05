/**
 * Typed theme entry point for app code.
 *
 * Use these constants wherever a real color value is needed outside of
 * NativeWind className props — e.g. React Navigation themes,
 * <ActivityIndicator color={...}>, StatusBar, or chart libraries.
 * For component styling, prefer the Tailwind utilities generated from
 * tokens.js (bg-primary, border-border, shadow-box, ...).
 */

import { palette } from './tokens';
import type { Palette } from './tokens';

export type { Palette };

export const colors: Palette = palette;

/**
 * Hard offset shadow values, mirroring the shadow-box* Tailwind tokens.
 * Handy for React Native `style` shadows on components that can't use
 * className (shadow color/offset via style props on native).
 */
export const hardShadow = {
  sm: { offset: 2, color: palette.border },
  md: { offset: 4, color: palette.border },
  lg: { offset: 6, color: palette.border },
} as const;

/** Standard chunky border width in px (matches Tailwind `border-3`). */
export const pixelBorderWidth = 3;
