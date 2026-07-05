import { Alert, Platform } from "react-native";

/**
 * Cross-platform destructive-action confirmation. React Native's Alert is a
 * no-op on web, so web falls back to window.confirm.
 */
export function confirmDestructive(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  const { title, message, confirmLabel = "Delete", onConfirm } = options;

  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
