import * as React from 'react';
import {
  Pressable,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { Screen, Text, cn } from '../ui';

/**
 * Battle matchup prototype: one head-to-head pick. This is the playful side
 * of the app — round banner, two challenger cards, a VS badge, and an
 * XP-style progress meter. Routes wire it up later; every prop has a demo
 * default so it renders standalone.
 */

export interface MatchupItem {
  id: string;
  title: string;
  /** Optional supporting line, e.g. "Added 3 months ago" or a genre. */
  note?: string;
}

export interface MatchupScreenProps {
  round?: number;
  matchNumber?: number;
  totalMatches?: number;
  itemA?: MatchupItem;
  itemB?: MatchupItem;
  /** Called with the chosen item when the user taps a challenger card. */
  onPick?: (winner: MatchupItem) => void;
}

const DEMO_ITEM_A: MatchupItem = {
  id: 'demo-a',
  title: 'Elden Ring',
  note: 'In backlog for 14 months',
};

const DEMO_ITEM_B: MatchupItem = {
  id: 'demo-b',
  title: 'Hades',
  note: 'In backlog for 6 months',
};

/** Tappable challenger panel with the same press-into-shadow feel as Button. */
function ChallengerCard({
  item,
  onPress,
}: {
  item: MatchupItem;
  onPress?: (event: GestureResponderEvent) => void;
}) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pick ${item.title}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={cn(
        'flex-row items-center gap-4 rounded border-3 border-border bg-card p-4 shadow-box-lg',
        pressed && 'translate-x-1 translate-y-1 shadow-none',
      )}
    >
      {/* Initial-letter avatar — item images are optional in MVP (OD-003). */}
      <View className="h-14 w-14 items-center justify-center rounded border-3 border-border bg-secondary">
        <Text variant="title" className="text-2xl text-secondary-foreground">
          {item.title.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text variant="heading">{item.title}</Text>
        {item.note ? <Text variant="caption">{item.note}</Text> : null}
      </View>
      <Text variant="label" className="text-accent">
        Pick
      </Text>
    </Pressable>
  );
}

export function MatchupScreen({
  round = 1,
  matchNumber = 2,
  totalMatches = 7,
  itemA = DEMO_ITEM_A,
  itemB = DEMO_ITEM_B,
  onPick,
}: MatchupScreenProps) {
  const progress =
    totalMatches > 0
      ? Math.min(Math.max(matchNumber - 1, 0) / totalMatches, 1)
      : 0;

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      {/* Round banner */}
      <View className="items-center gap-2">
        <View className="rounded border-3 border-border bg-accent px-5 py-1.5 shadow-box-sm">
          <Text variant="label" className="text-base text-accent-foreground">
            Round {round}
          </Text>
        </View>
        <Text variant="title" className="text-center">
          Who wins?
        </Text>
        <Text variant="caption">Tap the one you&apos;d rather pick right now</Text>
      </View>

      {/* Matchup */}
      <View className="gap-3">
        <ChallengerCard item={itemA} onPress={() => onPick?.(itemA)} />

        <View className="z-10 -my-6 items-center">
          <View className="h-12 w-12 -rotate-6 items-center justify-center rounded border-3 border-border bg-secondary shadow-box">
            <Text
              variant="label"
              className="text-base text-secondary-foreground"
            >
              VS
            </Text>
          </View>
        </View>

        <ChallengerCard item={itemB} onPress={() => onPick?.(itemB)} />
      </View>

      {/* Battle progress meter */}
      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text variant="label">Battle progress</Text>
          <Text variant="caption">
            Match {matchNumber} of {totalMatches}
          </Text>
        </View>
        <View className="h-5 overflow-hidden rounded border-3 border-border bg-muted">
          <View
            className="h-full bg-accent"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      </View>
    </Screen>
  );
}
