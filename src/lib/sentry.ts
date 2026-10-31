import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  // Avoid shipping emails/auth form contents by default.
  sendDefaultPii: false,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  // Keep production cheap; full sampling in __DEV__ for local debugging.
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableLogs: __DEV__,
  replaysSessionSampleRate: __DEV__ ? 0.1 : 0.02,
  replaysOnErrorSampleRate: 1.0,
  // Leave release and dist unset so EAS native builds keep automatic source map upload.
  environment: __DEV__ ? "development" : "production",
});

export { Sentry };
