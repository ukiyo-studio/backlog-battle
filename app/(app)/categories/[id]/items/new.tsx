import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { Screen } from "@/components/ui";
import { createBacklogItem } from "@/features/backlog-items/api";
import {
  BacklogItemForm,
  type BacklogItemFormValues,
} from "@/features/backlog-items/components";

import { useAuth } from "../../../../_layout";

export default function NewBacklogItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: BacklogItemFormValues) => {
    if (!session || !id) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await createBacklogItem({
        userId: session.user.id,
        categoryId: id,
        title: values.title,
        description: values.description,
        itemType: values.itemType,
      });
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save the item.",
      );
      setSaving(false);
    }
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <BacklogItemForm
        mode="create"
        saving={saving}
        submitError={submitError}
        submitLabel="Add item"
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
