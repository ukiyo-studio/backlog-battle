import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  sendDefaultPii: true,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Leave release and dist unset so EAS native builds keep automatic source map upload.
  environment: __DEV__ ? "development" : "production",
});

export { Sentry };
