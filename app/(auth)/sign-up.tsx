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

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    // With email confirmation enabled there is no session yet.
    if (!data.session) {
      setNotice("Check your email to confirm your account, then sign in.");
    }
    // Otherwise the auth listener picks up the session and the layout redirects.
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

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              A new challenger approaches.
            </CardDescription>
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
            {notice ? (
              <Text variant="caption" className="text-primary">
                {notice}
              </Text>
            ) : null}
            <Button onPress={handleSignUp} loading={submitting}>
              Sign up
            </Button>
          </CardContent>
        </Card>

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
