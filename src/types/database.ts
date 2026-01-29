export type ContentType = 'image' | 'video';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  url: string;
  thumbnail_url: string | null;
  duration: number | null;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentWithCategories extends Content {
  categories: Category[];
}

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  user_id: string;
  content_id: string;
  interaction_type: 'view' | 'like' | 'skip' | 'save' | 'rating';
  rating: number | null;
  watch_duration: number | null;
  created_at: string;
}

export interface SavedContent {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface UserCategoryPreference {
  id: string;
  user_id: string;
  category_id: string;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface RecommendationReason {
  type: 'similar_content' | 'popular_category' | 'trending' | 'new' | 'collaborative';
  message: string;
}

export interface ContentRecommendation extends ContentWithCategories {
  score: number;
  reason: RecommendationReason;
}
