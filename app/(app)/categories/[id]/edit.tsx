import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, ErrorState, LoadingState, Screen } from "@/components/ui";
import { deleteCategory, updateCategory } from "@/features/categories/api";
import { CategoryForm } from "@/features/categories/components/category-form";
import { useCategory } from "@/features/categories/hooks";
import { confirmDestructive } from "@/lib/confirm";
import type { CategoryFormValues } from "@/schemas/category";

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: category, isLoading, error, refetch } = useCategory(id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: CategoryFormValues) => {
    setSaving(true);
    setSubmitError(null);
    try {
      await updateCategory(id, values);
      router.back();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : "Could not save the category.",
      );
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!category) return;

    confirmDestructive({
      title: "Delete category?",
      message: `"${category.name}" will disappear from your arena. Its items and battle history stay saved.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        void (async () => {
          setDeleting(true);
          setSubmitError(null);
          try {
            await deleteCategory(id);
            router.replace("/");
          } catch (cause) {
            setSubmitError(
              cause instanceof Error
                ? cause.message
                : "Could not delete the category.",
            );
            setDeleting(false);
          }
        })();
      },
    });
  };

  if (isLoading) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  if (error || !category) {
    return (
      <Screen contentClassName="p-5 pb-10">
        <ErrorState
          title={error ? "Something went wrong" : "Category not found"}
          description={
            error
              ? `We couldn't load this category. ${error.message}`
              : "This category may have been deleted."
          }
          onRetry={error ? () => void refetch() : undefined}
          retryLabel="Try again"
          retryVariant="secondary"
          secondaryAction={{ label: "Go back", onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="p-5 pb-10">
      <CategoryForm
        title="Edit category"
        description="Rename your category or update its description."
        submitLabel="Save changes"
        initialValues={{
          name: category.name,
          description: category.description ?? "",
        }}
        saving={saving}
        disabled={deleting}
        submitError={submitError}
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => router.back()}
      >
        <View className="mt-10">
          <Button
            variant="destructive"
            onPress={handleDelete}
            loading={deleting}
            disabled={saving}
          >
            Delete category
          </Button>
        </View>
      </CategoryForm>
    </Screen>
  );
}
