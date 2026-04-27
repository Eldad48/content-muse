import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRecommendedContent,
  recordInteraction,
  toggleSave,
} from "@/lib/content";
import { bumpCategoryWeights } from "@/lib/preferences";
import { ContentWithCategories } from "@/types/database";
import { SwipeCard } from "@/components/SwipeCard";
import { TutorialOverlay, hasSeenTutorial } from "@/components/TutorialOverlay";
import { Button } from "@/components/ui/button";
import { Compass, User, BarChart3, LogIn, LogOut, Music2, Camera, Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentWithCategories[]>([]);
  const [index, setIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const viewedRef = useRef<Set<string>>(new Set());

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!authLoading && user && profile && profile.onboarding_completed === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  // Tutorial on first ever visit
  useEffect(() => {
    if (!authLoading && !hasSeenTutorial()) setShowTutorial(true);
  }, [authLoading]);

  // Load feed
  useEffect(() => {
    fetchRecommendedContent(user?.id)
      .then((data) => {
        setItems(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Record view for current item
  useEffect(() => {
    const current = items[index];
    if (!current || !user) return;
    if (viewedRef.current.has(current.id)) return;
    viewedRef.current.add(current.id);
    recordInteraction(user.id, current.id, "view").catch(() => {});
  }, [index, items, user]);

  const advance = () => setIndex((i) => Math.min(i + 1, items.length));

  const handleSwipeRight = async () => {
    const current = items[index];
    if (!current) return;
    if (user) {
      try {
        await recordInteraction(user.id, current.id, "like");
        await bumpCategoryWeights(
          user.id,
          current.categories.map((c) => c.id),
          0.5
        );
      } catch (e) {
        console.error(e);
      }
    }
    advance();
  };

  const handleSwipeLeft = async () => {
    const current = items[index];
    if (!current) return;
    if (user) {
      try {
        await recordInteraction(user.id, current.id, "skip");
        await bumpCategoryWeights(
          user.id,
          current.categories.map((c) => c.id),
          -0.25
        );
      } catch (e) {
        console.error(e);
      }
    }
    advance();
  };

  const handleSave = async () => {
    const current = items[index];
    if (!current) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const isNow = await toggleSave(user.id, current.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isNow) next.add(current.id);
        else next.delete(current.id);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Wheel / keyboard navigation (TikTok-like vertical scroll)
  useEffect(() => {
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheel < 600) return;
      if (Math.abs(e.deltaY) < 30) return;
      lastWheel = now;
      if (e.deltaY > 0) advance();
      else setIndex((i) => Math.max(0, i - 1));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") advance();
      else if (e.key === "ArrowUp") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") handleSwipeRight();
      else if (e.key === "ArrowLeft") handleSwipeLeft();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, index, user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-full max-h-[700px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  const current = items[index];
  const next = items[index + 1];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {showTutorial && <TutorialOverlay onDone={() => setShowTutorial(false)} />}

      {/* Top bar */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gradient">MediaRec</h1>
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/40 backdrop-blur"
          onClick={() => setMenuOpen((m) => !m)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Side menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute right-0 top-0 z-40 flex h-full w-72 flex-col gap-2 border-l border-border bg-card p-6 pt-20 shadow-2xl"
          >
            <Button variant="ghost" className="justify-start gap-3" onClick={() => { setMenuOpen(false); navigate("/explore"); }}>
              <Compass className="h-5 w-5" /> Explore
            </Button>
            {user && (
              <>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => { setMenuOpen(false); navigate("/profile"); }}>
                  <User className="h-5 w-5" /> Profile
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => { setMenuOpen(false); navigate("/analytics"); }}>
                  <BarChart3 className="h-5 w-5" /> Analytics
                </Button>
              </>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Reference</p>
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <Music2 className="h-5 w-5" /> TikTok
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <Camera className="h-5 w-5" /> Instagram
              </a>
            </div>

            <div className="mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => { setShowTutorial(true); setMenuOpen(false); }}
              >
                Show tutorial again
              </Button>
              {user ? (
                <Button variant="outline" className="mt-2 w-full justify-start gap-3" onClick={signOut}>
                  <LogOut className="h-5 w-5" /> Sign Out
                </Button>
              ) : (
                <Button className="mt-2 w-full justify-start gap-3" onClick={() => navigate("/auth")}>
                  <LogIn className="h-5 w-5" /> Sign In
                </Button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Card stack */}
      <div className="relative mx-auto h-full w-full max-w-md px-3 pb-3 pt-16">
        <div className="relative h-full w-full">
          {!current ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <Sparkle />
              <h2 className="text-2xl font-bold text-foreground">You're all caught up!</h2>
              <p className="text-muted-foreground">Come back later for more, or explore the library.</p>
              <Button onClick={() => { setIndex(0); }}>Restart feed</Button>
              <Button variant="outline" onClick={() => navigate("/explore")}>Explore library</Button>
            </div>
          ) : (
            <>
              {next && (
                <div className="absolute inset-0 scale-95 opacity-60">
                  <div className="h-full w-full overflow-hidden rounded-2xl bg-card">
                    {next.content_type === "video" ? (
                      <video
                        src={next.url}
                        poster={next.thumbnail_url ?? undefined}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={next.thumbnail_url || next.url}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              )}
              <SwipeCard
                key={current.id}
                content={current}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSave={handleSave}
                isSaved={savedIds.has(current.id)}
                active
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkle() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
      <span className="text-3xl">✨</span>
    </div>
  );
}
