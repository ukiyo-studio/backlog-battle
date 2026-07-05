import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { colors } from '../../theme';
import { Text } from './text';
import { cn } from './utils';

/**
 * 8-bit tactile button: chunky border + hard offset shadow at rest; pressing
 * translates the button into its shadow (translate-x/y-1 = 4px, matching the
 * shadow-box offset) so it physically "clicks" down. Ghost stays flat.
 */
const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded border-3 border-border',
  {
    variants: {
      variant: {
        default: 'bg-primary shadow-box',
        secondary: 'bg-secondary shadow-box',
        destructive: 'bg-destructive shadow-box',
        outline: 'bg-card shadow-box',
        ghost: 'border-0 bg-transparent',
      },
      size: {
        sm: 'h-9 px-3',
        default: 'h-12 px-5',
        lg: 'h-14 px-8',
      },
      pressed: {
        true: '',
        false: '',
      },
      disabled: {
        true: 'opacity-50',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: ['default', 'secondary', 'destructive', 'outline'],
        pressed: true,
        className: 'translate-x-1 translate-y-1 shadow-none',
      },
      {
        variant: 'ghost',
        pressed: true,
        className: 'bg-muted',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pressed: false,
      disabled: false,
    },
  },
);

const buttonTextVariants = cva('font-bold uppercase tracking-widest', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

/** Spinner color per variant (ActivityIndicator can't take a className). */
const spinnerColor: Record<ButtonVariant, string> = {
  default: colors.primaryForeground,
  secondary: colors.secondaryForeground,
  destructive: colors.destructiveForeground,
  outline: colors.foreground,
  ghost: colors.foreground,
};

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'disabled' | 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** String children get themed Text automatically; nodes render as-is. */
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Extra classes for the auto-wrapped Text when children is a string. */
  textClassName?: string;
}

const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      children,
      loading = false,
      disabled = false,
      textClassName,
      onPressIn,
      onPressOut,
      ...props
    },
    ref,
  ) => {
    // Managed pressed state instead of NativeWind `active:` so the press
    // animation behaves identically on iOS, Android, and web.
    const [pressed, setPressed] = React.useState(false);
    const inactive = disabled || loading;

    const handlePressIn = (event: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(event);
    };
    const handlePressOut = (event: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(event);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          buttonVariants({
            variant,
            size,
            pressed: pressed && !inactive,
            disabled: inactive,
          }),
          className,
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor[variant]} />
        ) : null}
        {typeof children === 'string' ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonSize, ButtonVariant };
