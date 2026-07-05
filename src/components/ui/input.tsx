import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../../theme';
import { Text } from './text';
import { cn } from './utils';

/**
 * Calm, readable labeled input for CRUD screens. Keeps the chunky border for
 * cohesion but skips the hard shadow and loud colors: focus swaps the border
 * to the ring blue, errors swap it to destructive red with helper text.
 */
export interface InputProps extends TextInputProps {
  className?: string;
  /** Extra classes for the outer wrapper (label + field + error). */
  containerClassName?: string;
  label?: string;
  /** When set, shows the message and paints the border destructive. */
  error?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      editable = true,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);

    const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
      setFocused(true);
      onFocus?.(event);
    };
    const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
      setFocused(false);
      onBlur?.(event);
    };

    return (
      <View className={cn('gap-1.5', containerClassName)}>
        {label ? <Text variant="label">{label}</Text> : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.mutedForeground}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          className={cn(
            'min-h-12 rounded border-3 border-input bg-card px-3 py-2 text-base text-foreground',
            focused && 'border-ring',
            error && 'border-destructive',
            !editable && 'bg-muted opacity-60',
            className,
          )}
          {...props}
        />
        {error ? (
          <Text variant="caption" className="text-destructive">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);
Input.displayName = 'Input';

export { Input };
