import { supabase } from "@/integrations/supabase/client";

export async function saveCategoryPreferences(userId: string, categoryIds: string[]) {
  // Clear existing then insert
  await supabase.from("user_category_preferences").delete().eq("user_id", userId);
  if (categoryIds.length === 0) return;
  const rows = categoryIds.map((category_id) => ({
    user_id: userId,
    category_id,
    weight: 2.0,
  }));
  const { error } = await supabase.from("user_category_preferences").insert(rows);
  if (error) throw error;
}

export async function bumpCategoryWeights(userId: string, categoryIds: string[], delta: number) {
  if (categoryIds.length === 0) return;
  const { data: existing } = await supabase
    .from("user_category_preferences")
    .select("category_id, weight")
    .eq("user_id", userId)
    .in("category_id", categoryIds);

  const existingMap = new Map(existing?.map((r) => [r.category_id, Number(r.weight)]) ?? []);
  const upserts = categoryIds.map((cid) => ({
    user_id: userId,
    category_id: cid,
    weight: Math.max(0, (existingMap.get(cid) ?? 1) + delta),
  }));

  for (const row of upserts) {
    const { data: found } = await supabase
      .from("user_category_preferences")
      .select("id")
      .eq("user_id", userId)
      .eq("category_id", row.category_id)
      .maybeSingle();
    if (found) {
      await supabase
        .from("user_category_preferences")
        .update({ weight: row.weight })
        .eq("id", found.id);
    } else {
      await supabase.from("user_category_preferences").insert(row);
    }
  }
}

export async function completeOnboarding(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from("user_category_preferences")
    .select("category_id, weight")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
