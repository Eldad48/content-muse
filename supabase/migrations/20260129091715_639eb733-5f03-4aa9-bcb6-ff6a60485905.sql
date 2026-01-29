-- Create enum for content types
CREATE TYPE public.content_type AS ENUM ('image', 'video');

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content table (images and videos)
CREATE TABLE public.content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type public.content_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds, for videos
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_categories junction table
CREATE TABLE public.content_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(content_id, category_id)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_category_preferences table
CREATE TABLE public.user_category_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    weight DECIMAL NOT NULL DEFAULT 1.0, -- preference weight for recommendations
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id)
);

-- Create interactions table
CREATE TABLE public.interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- 'view', 'like', 'skip', 'save', 'rating'
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    watch_duration INTEGER, -- in seconds for videos
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_content table
CREATE TABLE public.saved_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, content_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, no public write
CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

-- Content: Public read, no public write  
CREATE POLICY "Content is viewable by everyone"
    ON public.content FOR SELECT
    USING (true);

-- Content Categories: Public read
CREATE POLICY "Content categories are viewable by everyone"
    ON public.content_categories FOR SELECT
    USING (true);

-- Profiles: Users can view all profiles, manage their own
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- User Category Preferences: Users manage their own
CREATE POLICY "Users can view their own preferences"
    ON public.user_category_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
    ON public.user_category_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_category_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
    ON public.user_category_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Interactions: Users manage their own
CREATE POLICY "Users can view their own interactions"
    ON public.interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
    ON public.interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Saved Content: Users manage their own
CREATE POLICY "Users can view their own saved content"
    ON public.saved_content FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save content"
    ON public.saved_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave content"
    ON public.saved_content FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON public.content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_category_preferences_updated_at
    BEFORE UPDATE ON public.user_category_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_view_count ON public.content(view_count DESC);
CREATE INDEX idx_content_like_count ON public.content(like_count DESC);
CREATE INDEX idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX idx_interactions_content_id ON public.interactions(content_id);
CREATE INDEX idx_interactions_type ON public.interactions(interaction_type);
CREATE INDEX idx_saved_content_user_id ON public.saved_content(user_id);