import { useRouter } from "expo-router";

import { CategoryFormScreen } from "@/components/prototype";

// Phase 0 UI spike: calm category form. Save/cancel just navigate back for now.
export default function CategoryFormPrototypeRoute() {
  const router = useRouter();
  return (
    <CategoryFormScreen
      onSave={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
