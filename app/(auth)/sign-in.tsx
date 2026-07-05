import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Screen,
  Text,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
    }
    // On success the auth listener updates the session and the router
    // redirects via the (auth) layout guard.
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen contentClassName="flex-grow justify-center p-5">
        <View className="mb-8 items-center gap-2">
          <Text variant="title" className="text-center">
            Backlog Battle
          </Text>
          <Text variant="caption" className="text-center">
            Let your backlog fight it out
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Welcome back. Your backlog missed you.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
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
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!submitting}
              error={error ?? undefined}
            />
            <Button onPress={handleSignIn} loading={submitting}>
              Sign in
            </Button>
          </CardContent>
        </Card>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text variant="caption">Need an account?</Text>
          <Link href="/sign-up">
            <Text variant="caption" className="font-bold text-primary">
              Sign up
            </Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
