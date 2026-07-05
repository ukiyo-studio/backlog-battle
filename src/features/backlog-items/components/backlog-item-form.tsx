import * as React from "react";
import { View } from "react-native";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Text } from "@/components/ui";
import { backlogItemEditSchema, backlogItemFormSchema } from "@/schemas/backlog-item";
import { ITEM_STATUSES, type ItemStatus } from "@/types/backlog";

import { Chip } from "./chip";
import { statusLabel } from "./status-filter";

const QUICK_TYPES = ["Game", "Movie", "TV", "Book", "Anime", "Other"] as const;

export interface BacklogItemFormValues {
  title: string;
  description: string;
  itemType: string;
  status: ItemStatus;
}

interface FieldErrors {
  title?: string;
  description?: string;
  itemType?: string;
}

export interface BacklogItemFormProps {
  /** Edit mode adds the status selector; new items are always 'active'. */
  mode: "create" | "edit";
  initialValues?: Partial<BacklogItemFormValues>;
  /** Shows a spinner on the submit button and disables the whole form. */
  saving?: boolean;
  /** Disables the form without the submit spinner (e.g. while deleting). */
  disabled?: boolean;
  /** Server-side failure message shown above the actions. */
  submitError?: string | null;
  submitLabel: string;
  onSubmit: (values: BacklogItemFormValues) => void;
  onCancel: () => void;
}

/**
 * Shared add/edit form for backlog items: title, optional notes, optional
 * free-text type with quick-pick chips, and (edit only) a status selector.
 */
export function BacklogItemForm({
  mode,
  initialValues,
  saving = false,
  disabled = false,
  submitError,
  submitLabel,
  onSubmit,
  onCancel,
}: BacklogItemFormProps) {
  const inactive = saving || disabled;
  const [title, setTitle] = React.useState(initialValues?.title ?? "");
  const [description, setDescription] = React.useState(
    initialValues?.description ?? "",
  );
  const [itemType, setItemType] = React.useState(initialValues?.itemType ?? "");
  const [status, setStatus] = React.useState<ItemStatus>(
    initialValues?.status ?? "active",
  );
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const toggleQuickType = (type: string) => {
    setItemType((prev) => (prev.trim() === type ? "" : type));
    clearFieldError("itemType");
  };

  const handleSubmit = () => {
    const raw = { title, description, itemType, status };
    const result =
      mode === "edit"
        ? backlogItemEditSchema.safeParse(raw)
        : backlogItemFormSchema.safeParse(raw);

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          (key === "title" || key === "description" || key === "itemType") &&
          !errors[key]
        ) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit({ ...result.data, status });
  };

  return (
    <View className="gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "New item" : "Edit item"}</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Title"
            placeholder="Hollow Knight"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              clearFieldError("title");
            }}
            error={fieldErrors.title}
            editable={!inactive}
            autoFocus={mode === "create"}
            returnKeyType="next"
          />
          <Input
            label="Notes"
            placeholder="Anything worth remembering (optional)"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearFieldError("description");
            }}
            error={fieldErrors.description}
            editable={!inactive}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="min-h-24 py-3"
          />
          <View className="gap-1.5">
            <Input
              label="Type"
              placeholder="Game, movie, book... (optional)"
              value={itemType}
              onChangeText={(value) => {
                setItemType(value);
                clearFieldError("itemType");
              }}
              error={fieldErrors.itemType}
              editable={!inactive}
            />
            <View className="mt-1 flex-row flex-wrap gap-2">
              {QUICK_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={itemType.trim() === type}
                  disabled={inactive}
                  onPress={() => toggleQuickType(type)}
                />
              ))}
            </View>
          </View>
          {mode === "edit" ? (
            <View className="gap-1.5">
              <Text variant="label">Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {ITEM_STATUSES.map((value) => (
                  <Chip
                    key={value}
                    label={statusLabel(value)}
                    selected={status === value}
                    disabled={inactive}
                    onPress={() => setStatus(value)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </CardContent>
      </Card>

      {submitError ? (
        <Text variant="caption" className="text-destructive">
          {submitError}
        </Text>
      ) : null}

      <View className="flex-row justify-end gap-3">
        <Button variant="ghost" onPress={onCancel} disabled={inactive}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} loading={saving} disabled={disabled}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
