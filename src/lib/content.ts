import { supabase } from "@/integrations/supabase/client";
import type { Content, Category, ContentWithCategories, Interaction } from "@/types/database";
import { fetchUserPreferences } from "@/lib/preferences";

export async function fetchContent(): Promise<Content[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function fetchContentWithCategories(): Promise<ContentWithCategories[]> {
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .select('*')
    .order('view_count', { ascending: false });
  
  if (contentError) throw contentError;
  
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('content_categories')
    .select(`
      content_id,
      categories (*)
    `);
  
  if (categoriesError) throw categoriesError;
  
  const categoryMap = new Map<string, Category[]>();
  categoriesData?.forEach((item: { content_id: string; categories: Category }) => {
    const existing = categoryMap.get(item.content_id) || [];
    if (item.categories) {
      existing.push(item.categories);
    }
    categoryMap.set(item.content_id, existing);
  });
  
  return (contentData || []).map(content => ({
    ...content,
    categories: categoryMap.get(content.id) || []
  }));
}

export async function fetchRecommendedContent(userId?: string): Promise<ContentWithCategories[]> {
  const allContent = await fetchContentWithCategories();
  if (!userId) return [...allContent].sort(() => Math.random() - 0.5);

  const preferences = await fetchUserPreferences(userId).catch(() => []);
  const preferenceMap = new Map<string, number>(
    preferences.map((p) => [p.category_id, Number(p.weight)] as [string, number])
  );

  return allContent
    .map((item) => {
      const preferenceScore = item.categories.reduce(
        (total, category) => total + (preferenceMap.get(category.id) ?? 0),
        0
      );
      const engagementScore = Math.log1p(item.view_count) + Math.log1p(item.like_count) * 1.5;
      const mediaBoost = item.content_type === "video" ? 2 : 0.75;
      return {
        item,
        score: preferenceScore * 10 + engagementScore + mediaBoost + Math.random() * 2,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function fetchContentById(id: string): Promise<ContentWithCategories | null> {
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (contentError) throw contentError;
  if (!contentData) return null;
  
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('content_categories')
    .select(`categories (*)`)
    .eq('content_id', id);
  
  if (categoriesError) throw categoriesError;
  
  return {
    ...contentData,
    categories: categoriesData?.map((item: { categories: Category }) => item.categories).filter(Boolean) || []
  };
}

export async function fetchContentByCategory(categoryId: string): Promise<ContentWithCategories[]> {
  const { data: contentIds, error: idsError } = await supabase
    .from('content_categories')
    .select('content_id')
    .eq('category_id', categoryId);
  
  if (idsError) throw idsError;
  
  const ids = contentIds?.map(item => item.content_id) || [];
  if (ids.length === 0) return [];
  
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .select('*')
    .in('id', ids);
  
  if (contentError) throw contentError;
  
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('content_categories')
    .select(`content_id, categories (*)`)
    .in('content_id', ids);
  
  if (categoriesError) throw categoriesError;
  
  const categoryMap = new Map<string, Category[]>();
  categoriesData?.forEach((item: { content_id: string; categories: Category }) => {
    const existing = categoryMap.get(item.content_id) || [];
    if (item.categories) {
      existing.push(item.categories);
    }
    categoryMap.set(item.content_id, existing);
  });
  
  return (contentData || []).map(content => ({
    ...content,
    categories: categoryMap.get(content.id) || []
  }));
}

export async function recordInteraction(
  userId: string,
  contentId: string,
  type: Interaction['interaction_type'],
  rating?: number,
  watchDuration?: number
): Promise<void> {
  const { error } = await supabase
    .from('interactions')
    .insert({
      user_id: userId,
      content_id: contentId,
      interaction_type: type,
      rating: rating || null,
      watch_duration: watchDuration || null
    });
  
  if (error) throw error;
}

export async function toggleLike(userId: string, contentId: string): Promise<boolean> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .eq('interaction_type', 'like')
    .maybeSingle();
  
  if (existing) {
    // Unlike - delete the interaction
    await supabase
      .from('interactions')
      .delete()
      .eq('id', existing.id);
    return false;
  } else {
    // Like
    await recordInteraction(userId, contentId, 'like');
    return true;
  }
}

export async function toggleSave(userId: string, contentId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('saved_content')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  
  if (existing) {
    await supabase
      .from('saved_content')
      .delete()
      .eq('id', existing.id);
    return false;
  } else {
    await supabase
      .from('saved_content')
      .insert({ user_id: userId, content_id: contentId });
    return true;
  }
}

export async function fetchUserInteractions(userId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Interaction[];
}

export async function fetchUserSavedContent(userId: string): Promise<ContentWithCategories[]> {
  const { data: savedData, error: savedError } = await supabase
    .from('saved_content')
    .select('content_id')
    .eq('user_id', userId);
  
  if (savedError) throw savedError;
  
  const contentIds = savedData?.map(item => item.content_id) || [];
  if (contentIds.length === 0) return [];
  
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .select('*')
    .in('id', contentIds);
  
  if (contentError) throw contentError;
  
  return (contentData || []).map(content => ({
    ...content,
    categories: []
  }));
}

export async function fetchTrendingContent(limit = 10): Promise<ContentWithCategories[]> {
  const allContent = await fetchContentWithCategories();
  return allContent
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
}

export async function fetchNewContent(limit = 10): Promise<ContentWithCategories[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (data || []).map(content => ({
    ...content,
    categories: []
  }));
}
