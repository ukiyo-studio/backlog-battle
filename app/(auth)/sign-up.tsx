import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Text,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";

type Step = "form" | "verify";

export default function SignUpScreen() {
  const [step, setStep] = useState<Step>("form");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: displayName.trim() ? { display_name: displayName.trim() } : {},
      },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      // Email confirmation disabled — auth listener redirects automatically.
      return;
    }
    setStep("verify");
  };

  const handleVerify = async () => {
    const token = code.trim();
    if (token.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "signup",
    });
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message);
    }
    // On success the auth listener picks up the session and redirects.
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    setSubmitting(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setNotice("A new code is on its way.");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 items-center gap-2">
          <Text variant="title" className="text-center">
            Backlog Battle
          </Text>
          <Text variant="caption" className="text-center">
            Pick your next thing by making it earn it
          </Text>
        </View>

        {step === "form" ? (
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>A new challenger approaches.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Input
                label="Display name"
                placeholder="Player 1 (optional)"
                value={displayName}
                onChangeText={setDisplayName}
                autoComplete="name"
                editable={!submitting}
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!submitting}
              />
              <Input
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!submitting}
                error={error ?? undefined}
              />
              <Button onPress={handleSignUp} loading={submitting}>
                Sign up
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Enter your code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {email.trim()}. Enter it below to
                confirm your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Input
                label="Confirmation code"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                editable={!submitting}
                error={error ?? undefined}
                autoFocus
              />
              {notice ? (
                <Text variant="caption" className="text-primary">
                  {notice}
                </Text>
              ) : null}
              <Button onPress={handleVerify} loading={submitting}>
                Verify
              </Button>
              <Button
                variant="ghost"
                onPress={handleResend}
                disabled={submitting}
              >
                Resend code
              </Button>
            </CardContent>
          </Card>
        )}

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text variant="caption">Already have an account?</Text>
          <Link href="/sign-in">
            <Text variant="caption" className="font-bold text-primary">
              Sign in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
