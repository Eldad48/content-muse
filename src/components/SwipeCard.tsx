import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, X, Bookmark, Eye, Music2, Camera, Share2, Youtube, Twitter, MessageCircle, Image as ImageIcon } from "lucide-react";
import { ContentWithCategories } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SwipeCardProps {
  content: ContentWithCategories;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  active?: boolean;
}

export function SwipeCard({
  content,
  onSwipeLeft,
  onSwipeRight,
  onSave,
  isSaved,
  active = true,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 120;
    if (info.offset.x > threshold) onSwipeRight();
    else if (info.offset.x < -threshold) onSwipeLeft();
  };

  const query = encodeURIComponent(content.title);
  const tag = encodeURIComponent(content.title.replace(/\s+/g, ""));
  const socials = [
    { name: "TikTok", icon: Music2, url: `https://www.tiktok.com/search?q=${query}` },
    { name: "Instagram", icon: Camera, url: `https://www.instagram.com/explore/tags/${tag}/` },
    { name: "YouTube", icon: Youtube, url: `https://www.youtube.com/results?search_query=${query}` },
    { name: "X / Twitter", icon: Twitter, url: `https://twitter.com/search?q=${query}` },
    { name: "Reddit", icon: MessageCircle, url: `https://www.reddit.com/search/?q=${query}` },
    { name: "Pinterest", icon: ImageIcon, url: `https://www.pinterest.com/search/pins/?q=${query}` },
  ];

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Media */}
        {content.content_type === "video" ? (
          <video
            src={content.url}
            poster={content.thumbnail_url ?? undefined}
            className="h-full w-full object-cover"
            autoPlay={active}
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={content.thumbnail_url || content.url}
            alt={content.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-background/40" />

        {/* LIKE / NOPE stamps */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-10 rotate-[-15deg] rounded-lg border-4 border-primary px-4 py-2 text-3xl font-extrabold text-primary"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute right-6 top-10 rotate-[15deg] rounded-lg border-4 border-destructive px-4 py-2 text-3xl font-extrabold text-destructive"
        >
          NOPE
        </motion.div>

        {/* Right action rail */}
        <div className="absolute bottom-32 right-3 flex flex-col items-center gap-4">
          <button
            onClick={onSave}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-background/60 backdrop-blur transition hover:bg-background/80"
            aria-label="Save"
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-background/60 backdrop-blur transition hover:bg-background/80"
                aria-label="Find on socials"
              >
                <Share2 className="h-6 w-6 text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="end" className="w-56 p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Find references on
              </p>
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <s.icon className="h-4 w-4" /> {s.name}
                </a>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pr-20">
          <h2 className="mb-1 text-2xl font-bold text-foreground">{content.title}</h2>
          {content.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{content.description}</p>
          )}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {content.categories.slice(0, 3).map((c) => (
              <Badge key={c.id} variant="secondary" className="text-xs">
                {c.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {content.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {content.like_count}
            </span>
          </div>
        </div>

        {/* Bottom action buttons */}
        {active && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
            <Button
              size="icon"
              variant="outline"
              className="h-14 w-14 rounded-full border-2 border-destructive bg-background/80 text-destructive backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
              onClick={onSwipeLeft}
            >
              <X className="h-7 w-7" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-14 w-14 rounded-full border-2 border-primary bg-background/80 text-primary backdrop-blur hover:bg-primary hover:text-primary-foreground"
              onClick={onSwipeRight}
            >
              <Heart className="h-7 w-7" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
