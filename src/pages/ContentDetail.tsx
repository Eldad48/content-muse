import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { ContentRow } from "@/components/ContentRow";
import { ContentWithCategories } from "@/types/database";
import { fetchContentById, fetchContentByCategory, toggleLike, toggleSave, recordInteraction } from "@/lib/content";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Bookmark, Share2, Eye, Clock, ArrowLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentWithCategories | null>(null);
  const [similarContent, setSimilarContent] = useState<ContentWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadContent() {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await fetchContentById(id);
        setContent(data);
        
        // Record view interaction
        if (user && data) {
          await recordInteraction(user.id, id, 'view');
        }
        
        // Fetch similar content based on categories
        if (data && data.categories.length > 0) {
          const similar = await fetchContentByCategory(data.categories[0].id);
          setSimilarContent(similar.filter(item => item.id !== id).slice(0, 10));
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }
    try {
      const nowLiked = await toggleLike(user.id, id);
      setIsLiked(nowLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }
    try {
      const nowSaved = await toggleSave(user.id, id);
      setIsSaved(nowSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleRate = async (stars: number) => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }
    try {
      await recordInteraction(user.id, id, 'rating', stars);
      setRating(stars);
    } catch (error) {
      console.error('Error rating:', error);
    }
  };

  const handleSimilarLike = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowLiked = await toggleLike(user.id, contentId);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (isNowLiked) next.add(contentId);
        else next.delete(contentId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSimilarSave = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowSaved = await toggleSave(user.id, contentId);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isNowSaved) next.add(contentId);
        else next.delete(contentId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!content) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Content not found</h2>
          <Button variant="link" onClick={() => navigate('/')}>
            Go back home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Back button */}
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Media */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl">
              {content.content_type === 'video' ? (
                <div className="relative aspect-video bg-secondary">
                  <img
                    src={content.thumbnail_url || content.url}
                    alt={content.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-primary/90 p-6">
                      <div className="h-12 w-12 border-l-4 border-t-4 border-primary-foreground" 
                           style={{ borderRadius: '0 0 0 0', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={content.url}
                  alt={content.title}
                  className="w-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {content.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatCount(content.view_count)} views
              </span>
              {content.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(content.duration)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{content.description}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isLiked ? "default" : "secondary"}
                className="gap-2"
                onClick={handleLike}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button
                variant={isSaved ? "default" : "secondary"}
                className="gap-2"
                onClick={handleSave}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="secondary" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Rate this content</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        rating !== null && star <= rating && "fill-primary text-primary"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar content */}
        {similarContent.length > 0 && (
          <ContentRow
            title="Similar Content"
            content={similarContent}
            onLike={handleSimilarLike}
            onSave={handleSimilarSave}
            likedIds={likedIds}
            savedIds={savedIds}
            showReason
            getReasonForContent={(item) => 
              `Similar to ${content.categories[0]?.name || 'this content'}`
            }
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ContentDetail;
