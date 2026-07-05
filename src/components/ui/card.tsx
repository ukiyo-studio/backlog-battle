import * as React from 'react';
import {
  View,
  type Text as RNText,
  type ViewProps,
} from 'react-native';

import { Text, type TextProps } from './text';
import { cn } from './utils';

/**
 * Retro card: chunky ink border + hard offset shadow, square corners.
 * Compose Card > CardHeader/CardContent/CardFooter like shadcn.
 */

export interface CardProps extends ViewProps {
  className?: string;
}

const Card = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'rounded border-3 border-border bg-card shadow-box',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('gap-1.5 p-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
  <Text
    ref={ref}
    variant="heading"
    className={cn('text-card-foreground', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} variant="caption" className={className} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-row items-center gap-3 p-4 pt-0', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
