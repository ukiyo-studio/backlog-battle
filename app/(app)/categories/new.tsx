import { useRouter } from "expo-router";
import { useState } from "react";

import { Screen } from "@/components/ui";
import { createCategory } from "@/features/categories/api";
import { CategoryForm } from "@/features/categories/components/category-form";
import type { CategoryFormValues } from "@/schemas/category";

import { useAuth } from "../../_layout";

export default function NewCategoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: CategoryFormValues) => {
    if (!session) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await createCategory({ ...values, userId: session.user.id });
      router.back();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : "Could not save the category.",
      );
      setSaving(false);
    }
  };

  return (
    <Screen contentClassName="p-5 pb-10">
      <CategoryForm
        title="New category"
        description="A category groups the backlog items that battle each other, like Steam games or unread books."
        submitLabel="Save category"
        saving={saving}
        submitError={submitError}
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
