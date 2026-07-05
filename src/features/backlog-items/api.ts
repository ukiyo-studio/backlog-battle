import { supabase } from "@/lib/supabase";
import type { BacklogItem, ItemStatus } from "@/types/backlog";

/** Empty/whitespace-only optional fields are stored as NULL, not "". */
function normalizeOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createBacklogItem(input: {
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  itemType: string;
}): Promise<BacklogItem> {
  const { data, error } = await supabase
    .from("backlog_items")
    .insert({
      user_id: input.userId,
      category_id: input.categoryId,
      title: input.title.trim(),
      description: normalizeOptional(input.description),
      item_type: normalizeOptional(input.itemType),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBacklogItem(
  itemId: string,
  input: {
    title: string;
    description: string;
    itemType: string;
    status: ItemStatus;
  },
): Promise<BacklogItem> {
  const { data, error } = await supabase
    .from("backlog_items")
    .update({
      title: input.title.trim(),
      description: normalizeOptional(input.description),
      item_type: normalizeOptional(input.itemType),
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Soft delete: mark deleted_at; reads filter these rows out. */
export async function deleteBacklogItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("backlog_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}
