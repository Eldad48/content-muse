import { ContentWithCategories } from "@/types/database";
import { ContentCard } from "./ContentCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface ContentRowProps {
  title: string;
  content: ContentWithCategories[];
  onLike?: (contentId: string) => void;
  onSave?: (contentId: string) => void;
  likedIds?: Set<string>;
  savedIds?: Set<string>;
  showReason?: boolean;
  getReasonForContent?: (content: ContentWithCategories) => string | undefined;
}

export function ContentRow({
  title,
  content,
  onLike,
  onSave,
  likedIds = new Set(),
  savedIds = new Set(),
  showReason = false,
  getReasonForContent,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (content.length === 0) return null;

  return (
    <div className="relative">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      
      <div className="group relative">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Content row */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
        >
          {content.map((item) => (
            <div key={item.id} className="w-64 flex-shrink-0">
              <ContentCard
                content={item}
                onLike={() => onLike?.(item.id)}
                onSave={() => onSave?.(item.id)}
                isLiked={likedIds.has(item.id)}
                isSaved={savedIds.has(item.id)}
                showReason={showReason}
                reason={getReasonForContent?.(item)}
              />
            </div>
          ))}
        </div>

        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
