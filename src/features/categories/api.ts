import type { CategoryFormValues } from "@/schemas/category";
import { supabase } from "@/lib/supabase";
import type { Category, CategoryWithItemCount } from "@/types/backlog";

/**
 * Data access for categories. Read helpers back the hooks in hooks.ts;
 * mutations are called directly from screens, which own submitting/error
 * state. All functions throw Error on failure.
 *
 * Deletes are soft: rows get a deleted_at timestamp and every read filters
 * on deleted_at being null.
 */

/** Empty description strings are stored as NULL. */
function toDescriptionColumn(description: string): string | null {
  return description.length > 0 ? description : null;
}

export async function fetchCategoriesWithItemCounts(): Promise<
  CategoryWithItemCount[]
> {
  const { data, error } = await supabase
    .from("categories")
    .select("*, backlog_items(count)")
    .is("deleted_at", null)
    .is("backlog_items.deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(({ backlog_items, ...category }) => ({
    ...category,
    itemCount: backlog_items[0]?.count ?? 0,
  }));
}

export async function fetchCategory(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createCategory(
  input: CategoryFormValues & { userId: string },
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: input.userId,
      name: input.name,
      description: toDescriptionColumn(input.description),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: values.name,
      description: toDescriptionColumn(values.description),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Soft delete: items and battle history keep their rows. */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
