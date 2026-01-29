import { useState } from "react";
import { Heart, Play, Bookmark, Eye, Clock } from "lucide-react";
import { ContentWithCategories } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ContentCardProps {
  content: ContentWithCategories;
  onLike?: () => void;
  onSave?: () => void;
  isLiked?: boolean;
  isSaved?: boolean;
  showReason?: boolean;
  reason?: string;
}

export function ContentCard({
  content,
  onLike,
  onSave,
  isLiked = false,
  isSaved = false,
  showReason = false,
  reason,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-card transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/content/${content.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={content.thumbnail_url || content.url}
          alt={content.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Video overlay */}
        {content.content_type === 'video' && (
          <>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-xs">
              <Clock className="h-3 w-3" />
              {content.duration && formatDuration(content.duration)}
            </div>
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-background/40 transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-6 w-6 fill-current" />
              </div>
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
      </div>

      {/* Content info */}
      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold text-foreground">{content.title}</h3>
        
        {/* Categories */}
        <div className="mt-2 flex flex-wrap gap-1">
          {content.categories.slice(0, 2).map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="text-xs"
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatCount(content.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatCount(content.like_count)}
          </span>
        </div>

        {/* Recommendation reason */}
        {showReason && reason && (
          <p className="mt-2 line-clamp-1 text-xs text-primary">{reason}</p>
        )}
      </div>

      {/* Action buttons (visible on hover) */}
      <div
        className={cn(
          "absolute right-2 top-2 flex flex-col gap-2 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onLike}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors",
            isLiked ? "text-primary" : "text-foreground hover:text-primary"
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </button>
        <button
          onClick={onSave}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors",
            isSaved ? "text-primary" : "text-foreground hover:text-primary"
          )}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
        </button>
      </div>
    </div>
  );
}
