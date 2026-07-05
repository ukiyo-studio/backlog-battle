import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

/**
 * Themed text. Body copy stays a plain readable system font (per UI
 * principles); the retro personality comes from weight, tracking, and
 * uppercase on the display variants — never from tiny pixel fonts.
 */
const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      /** Screen titles and battle banners. Loud but readable. */
      title: 'text-3xl font-extrabold uppercase tracking-widest',
      /** Section headings and card titles. */
      heading: 'text-xl font-bold tracking-wide',
      /** Default body copy. */
      body: 'text-base leading-6',
      /** Supporting text, hints, metadata. */
      caption: 'text-sm text-muted-foreground',
      /** Small uppercase labels for badges, rounds, and form labels. */
      label: 'text-xs font-bold uppercase tracking-widest',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

export interface TextProps
  extends RNTextProps,
    VariantProps<typeof textVariants> {
  className?: string;
}

const Text = React.forwardRef<RNText, TextProps>(
  ({ className, variant, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  ),
);
Text.displayName = 'Text';

export { Text, textVariants };
