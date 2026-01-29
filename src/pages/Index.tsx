import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { ContentRow } from "@/components/ContentRow";
import { ContentWithCategories, Category } from "@/types/database";
import { fetchContentWithCategories, fetchCategories, toggleLike, toggleSave, recordInteraction } from "@/lib/content";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentWithCategories[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [featuredContent, setFeaturedContent] = useState<ContentWithCategories | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentData, categoriesData] = await Promise.all([
          fetchContentWithCategories(),
          fetchCategories()
        ]);
        setContent(contentData);
        setCategories(categoriesData);
        
        // Set a random featured content
        if (contentData.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, contentData.length));
          setFeaturedContent(contentData[randomIndex]);
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLike = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowLiked = await toggleLike(user.id, contentId);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (isNowLiked) {
          next.add(contentId);
        } else {
          next.delete(contentId);
        }
        return next;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowSaved = await toggleSave(user.id, contentId);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isNowSaved) {
          next.add(contentId);
        } else {
          next.delete(contentId);
        }
        return next;
      });
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Get trending content (top by views)
  const trending = content.slice(0, 10);
  
  // Get new releases (most recent)
  const newReleases = [...content].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10);

  // Get content by category
  const getContentByCategory = (categoryId: string) => {
    return content.filter(item => 
      item.categories.some(cat => cat.id === categoryId)
    ).slice(0, 10);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Featured skeleton */}
          <Skeleton className="h-[400px] w-full rounded-xl" />
          
          {/* Content rows skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-48 w-64 flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Featured Hero */}
        {featuredContent && (
          <div className="relative h-[400px] overflow-hidden rounded-xl">
            <img
              src={featuredContent.thumbnail_url || featuredContent.url}
              alt={featuredContent.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-8">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Featured</span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-foreground">
                {featuredContent.title}
              </h1>
              <p className="mb-4 max-w-xl text-muted-foreground">
                {featuredContent.description}
              </p>
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => navigate(`/content/${featuredContent.id}`)}
                >
                  <Play className="h-5 w-5 fill-current" />
                  {featuredContent.content_type === 'video' ? 'Watch Now' : 'View'}
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => handleSave(featuredContent.id)}
                >
                  Save for Later
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trending */}
        <ContentRow
          title="🔥 Trending Now"
          content={trending}
          onLike={handleLike}
          onSave={handleSave}
          likedIds={likedIds}
          savedIds={savedIds}
        />

        {/* New Releases */}
        <ContentRow
          title="✨ New Releases"
          content={newReleases}
          onLike={handleLike}
          onSave={handleSave}
          likedIds={likedIds}
          savedIds={savedIds}
        />

        {/* Content by Category */}
        {categories.map((category) => {
          const categoryContent = getContentByCategory(category.id);
          if (categoryContent.length === 0) return null;
          return (
            <ContentRow
              key={category.id}
              title={category.name}
              content={categoryContent}
              onLike={handleLike}
              onSave={handleSave}
              likedIds={likedIds}
              savedIds={savedIds}
            />
          );
        })}
      </div>
    </MainLayout>
  );
};

export default Index;
