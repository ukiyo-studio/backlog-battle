import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from "@/components/ui";
import { deleteBacklogItem, updateBacklogItem } from "@/features/backlog-items/api";
import {
  BacklogItemForm,
  type BacklogItemFormValues,
} from "@/features/backlog-items/components";
import { useBacklogItem } from "@/features/backlog-items/hooks";
import { confirmDestructive } from "@/lib/confirm";
import type { ItemStatus } from "@/types/backlog";

export default function EditBacklogItemScreen() {
  const { itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const router = useRouter();

  const item = useBacklogItem(itemId ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: BacklogItemFormValues) => {
    if (!itemId) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await updateBacklogItem(itemId, {
        title: values.title,
        description: values.description,
        itemType: values.itemType,
        status: values.status,
      });
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save the item.",
      );
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!item.data || !itemId) return;

    confirmDestructive({
      title: "Delete item",
      message: `"${item.data.title}" will be removed from this category.`,
      onConfirm: () => {
        setDeleting(true);
        setSubmitError(null);
        deleteBacklogItem(itemId)
          .then(() => router.back())
          .catch((err: unknown) => {
            setSubmitError(
              err instanceof Error ? err.message : "Could not delete the item.",
            );
            setDeleting(false);
          });
      },
    });
  };

  if (item.isLoading && !item.data) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  if (item.error) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <ErrorState
          title="Couldn't load this item"
          description={item.error}
          onRetry={() => void item.refetch()}
          secondaryAction={{ label: "Go back", onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  if (!item.data) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <EmptyState
          title="Item not found"
          description="This item doesn't exist or has been deleted."
          action={{ label: "Go back", onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <BacklogItemForm
        mode="edit"
        initialValues={{
          title: item.data.title,
          description: item.data.description ?? "",
          itemType: item.data.item_type ?? "",
          status: item.data.status as ItemStatus,
        }}
        saving={saving}
        disabled={deleting}
        submitError={submitError}
        submitLabel="Save item"
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => router.back()}
      />

      <Button
        variant="destructive"
        onPress={handleDelete}
        loading={deleting}
        disabled={saving}
      >
        Delete item
      </Button>
    </Screen>
  );
}
