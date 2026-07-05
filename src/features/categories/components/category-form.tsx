import * as React from "react";
import { View } from "react-native";

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
import { categorySchema, type CategoryFormValues } from "@/schemas/category";

/**
 * Calm CRUD form shared by the create and edit category screens. Validates
 * with the zod category schema on save and shows inline field errors; the
 * parent screen owns submission (async work, error state, navigation).
 */

type FieldErrors = Partial<Record<keyof CategoryFormValues, string>>;

export interface CategoryFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: Partial<CategoryFormValues>;
  /** Disables inputs and shows a spinner on the submit button. */
  saving?: boolean;
  /** Disables the form without the submit spinner (e.g. delete in flight). */
  disabled?: boolean;
  /** Submission failure message rendered above the action row. */
  submitError?: string | null;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
  /** Extra content below the action row (e.g. the delete button on edit). */
  children?: React.ReactNode;
}

export function CategoryForm({
  title,
  description,
  submitLabel,
  initialValues,
  saving = false,
  disabled = false,
  submitError,
  onSubmit,
  onCancel,
  children,
}: CategoryFormProps) {
  const inactive = saving || disabled;
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [descriptionValue, setDescriptionValue] = React.useState(
    initialValues?.description ?? "",
  );
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const clearFieldError = (field: keyof CategoryFormValues) => {
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const handleSubmit = () => {
    const result = categorySchema.safeParse({
      name,
      description: descriptionValue,
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "name" || field === "description") &&
          !errors[field]
        ) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(result.data);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Name"
            placeholder="Steam games"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearFieldError("name");
            }}
            error={fieldErrors.name}
            editable={!inactive}
            autoFocus
            returnKeyType="next"
          />
          <Input
            label="Description"
            placeholder="Games I own but haven't started yet (optional)"
            value={descriptionValue}
            onChangeText={(value) => {
              setDescriptionValue(value);
              clearFieldError("description");
            }}
            error={fieldErrors.description}
            editable={!inactive}
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

      {submitError ? (
        <Text variant="caption" className="mt-4 text-destructive">
          {submitError}
        </Text>
      ) : null}

      <View className="mt-6 flex-row justify-end gap-3">
        <Button variant="ghost" onPress={onCancel} disabled={inactive}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          loading={saving}
          disabled={disabled}
        >
          {submitLabel}
        </Button>
      </View>

      {children}
    </>
  );
}
