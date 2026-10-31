import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@/components/ui";
import type { StartCheckOutcome } from "@/types/backlog";

import { recordStartCheck, type DueStartCheck } from "../api";

const OUTCOMES: { outcome: StartCheckOutcome; label: string }[] = [
  { outcome: "sticking", label: "Sticking" },
  { outcome: "bounced", label: "Bounced" },
  { outcome: "never_opened", label: "Never opened" },
];

export function StartCheckPrompt({
  check,
  onAnswered,
}: {
  check: DueStartCheck;
  onAnswered: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = async (outcome: StartCheckOutcome, markFinished = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await recordStartCheck({
        checkId: check.id,
        itemId: check.itemId,
        outcome: markFinished ? "sticking" : outcome,
        markFinished,
      });
      onAnswered();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Did you start {check.title}?</CardTitle>
        <CardDescription>
          Sticking keeps it eligible. Bounced or never opened sits out this
          same window for 14 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="gap-2">
          {OUTCOMES.map((option) => (
            <Button
              key={option.outcome}
              variant={option.outcome === "sticking" ? "default" : "outline"}
              disabled={submitting}
              onPress={() => void answer(option.outcome)}
            >
              {option.label}
            </Button>
          ))}
        </View>
        <Button
          variant="ghost"
          disabled={submitting}
          onPress={() => void answer("sticking", true)}
        >
          I finished it
        </Button>
        {error ? (
          <Text variant="caption" className="text-destructive">
            {error}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}
