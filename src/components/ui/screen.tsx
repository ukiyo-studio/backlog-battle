import * as React from 'react';
import { Platform, ScrollView, View, type ViewInstance, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from './utils';

/**
 * Screen container that pads content into the safe area (status bar, notch,
 * home indicator). Headers are hidden app-wide (headerShown: false), so every
 * screen should render inside a Screen. Native padding comes from
 * react-native-safe-area-context. Web uses CSS safe-area insets, because
 * Expo Router no longer measures them on web.
 */
export interface ScreenProps extends ViewProps {
  className?: string;
  /** Scrollable content (default). Set false for fixed layouts. */
  scroll?: boolean;
  /** Classes for the ScrollView content container when scroll is true. */
  contentClassName?: string;
  /** Safe edges to pad. Defaults to top and bottom. */
  edges?: ("top" | "bottom")[];
  children?: React.ReactNode;
}

const Screen = React.forwardRef<ViewInstance, ScreenProps>(
  (
    {
      className,
      scroll = true,
      contentClassName,
      edges = ["top", "bottom"],
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const padding =
      Platform.OS === "web"
        ? {
            paddingTop: edges.includes("top") ? "env(safe-area-inset-top, 0px)" : 0,
            paddingBottom: edges.includes("bottom")
              ? "env(safe-area-inset-bottom, 0px)"
              : 0,
          }
        : {
            paddingTop: edges.includes("top") ? insets.top : 0,
            paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
          };

    if (scroll) {
      return (
        <ScrollView
          className={cn("flex-1 bg-background", className)}
          contentContainerClassName={contentClassName}
          contentContainerStyle={padding}
          keyboardShouldPersistTaps="handled"
          {...props}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View
        ref={ref}
        className={cn("flex-1 bg-background", className)}
        style={[padding, style]}
        {...props}
      >
        {children}
      </View>
    );
  },
);
Screen.displayName = "Screen";

export { Screen };
