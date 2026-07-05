import * as React from 'react';
import { View } from 'react-native';

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
} from '../ui';

/**
 * Category form prototype: the calm, efficient side of the app. Plain
 * readable type, quiet colors, no battle theatrics — the retro identity only
 * shows in the chunky card border and button treatment.
 */

export interface CategoryFormValues {
  name: string;
  description: string;
}

export interface CategoryFormScreenProps {
  initialValues?: Partial<CategoryFormValues>;
  onSave?: (values: CategoryFormValues) => void;
  onCancel?: () => void;
  /** Shows a spinner on the save button and disables inputs. */
  saving?: boolean;
}

export function CategoryFormScreen({
  initialValues,
  onSave,
  onCancel,
  saving = false,
}: CategoryFormScreenProps) {
  const [name, setName] = React.useState(initialValues?.name ?? '');
  const [description, setDescription] = React.useState(
    initialValues?.description ?? '',
  );
  const [nameError, setNameError] = React.useState<string | undefined>();

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Give your category a name.');
      return;
    }
    setNameError(undefined);
    onSave?.({ name: trimmed, description: description.trim() });
  };

  return (
    <Screen contentClassName="p-5 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
          <CardDescription>
            A category groups the backlog items that battle each other, like
            Steam games or unread books.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Name"
            placeholder="Steam games"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
            editable={!saving}
            autoFocus
            returnKeyType="next"
          />
          <Input
            label="Description"
            placeholder="Games I own but haven't started yet (optional)"
            value={description}
            onChangeText={setDescription}
            editable={!saving}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="min-h-24 py-3"
          />
          <Text variant="caption">
            You&apos;ll need at least 2 items in a category to start a battle.
          </Text>
        </CardContent>
      </Card>

      <View className="mt-6 flex-row justify-end gap-3">
        <Button variant="ghost" onPress={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onPress={handleSave} loading={saving}>
          Save category
        </Button>
      </View>
    </Screen>
  );
}
