import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme';

import { Text } from './text';
import { cn } from './utils';

export interface LoadingStateProps {
  className?: string;
  /** Page: compact centered block for full-screen gates. Inline: py-8 list placeholder. */
  variant?: 'page' | 'inline';
  label?: string;
}

export function LoadingState({
  className,
  variant = 'page',
  label,
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <View className={cn('items-center py-8', className)}>
        <ActivityIndicator size="large" color={colors.primary} />
        {label ? (
          <Text variant="caption" className="mt-3">
            {label}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className={cn('items-center gap-3', className)}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text variant="caption">{label}</Text> : null}
    </View>
  );
}
