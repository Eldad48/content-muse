import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCategories, fetchContentWithCategories, recordInteraction } from "@/lib/content";
import { saveCategoryPreferences, bumpCategoryWeights, completeOnboarding } from "@/lib/preferences";
import { Category, ContentWithCategories } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Step = "categories" | "swipes" | "done";

export default function Onboarding() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [samples, setSamples] = useState<ContentWithCategories[]>([]);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const MIN_SELECT = 5;

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.onboarding_completed) navigate("/");
  }, [profile, navigate]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const goToSwipes = async () => {
    if (!user || selected.size < MIN_SELECT) return;
    setSaving(true);
    try {
      await saveCategoryPreferences(user.id, Array.from(selected));
      const all = await fetchContentWithCategories();
      // Prioritize content matching selected categories
      const ranked = all
        .map((c) => ({
          c,
          score:
            c.categories.filter((cat) => selected.has(cat.id)).length * 10 +
            (c.content_type === "video" ? 3 : 1) +
            Math.random(),
        }))
        .sort((a, b) => b.score - a.score)
        .filter((x) => x.score > 1)
        .slice(0, 12)
        .map((x) => x.c);
      setSamples(ranked.length > 0 ? ranked : all.slice(0, 12));
      setStep("swipes");
    } catch (e) {
      console.error(e);
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (!user || sampleIdx >= samples.length) return;
    const item = samples[sampleIdx];
    try {
      await recordInteraction(user.id, item.id, liked ? "like" : "skip");
      const cats = item.categories.map((c) => c.id);
      await bumpCategoryWeights(user.id, cats, liked ? 1 : -0.5);
    } catch (e) {
      console.error(e);
    }
    if (sampleIdx + 1 >= samples.length) {
      finish();
    } else {
      setSampleIdx((i) => i + 1);
    }
  };

  const finish = async () => {
    if (!user) return;
    try {
      await completeOnboarding(user.id);
      toast.success("All set! Enjoy your feed.");
      navigate("/", { replace: true });
      // Force reload so AuthContext refetches profile
      setTimeout(() => window.location.reload(), 100);
    } catch (e) {
      console.error(e);
      navigate("/");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2 pt-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Let's personalize your feed</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === "categories" && (
            <motion.div
              key="cat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="mb-4 text-muted-foreground">
                Pick at least {MIN_SELECT} interests across any aspect of life — the more you choose, the sharper your feed.
              </p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search interests (e.g. anime, fitness, space...)"
                className="mb-4 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filtered.map((c) => {
                  const isOn = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        isOn
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      {isOn && (
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="mb-1 text-2xl">{c.icon || "🎬"}</div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      {c.description && (
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {c.description}
                        </div>
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No interests match "{search}"
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 p-4 backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                  <Badge variant={selected.size >= MIN_SELECT ? "default" : "secondary"}>
                    {selected.size} selected {selected.size < MIN_SELECT && `(min ${MIN_SELECT})`}
                  </Badge>
                  <Button
                    onClick={goToSwipes}
                    disabled={selected.size < MIN_SELECT || saving}
                    size="lg"
                  >
                    {saving ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "swipes" && samples[sampleIdx] && (
            <motion.div
              key="swipe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-2 text-muted-foreground">
                Quick taste test — swipe through {samples.length} items so we can fine-tune.
              </p>
              <div className="mb-4 text-sm text-muted-foreground">
                {sampleIdx + 1} / {samples.length}
              </div>

              <div className="relative mx-auto h-[480px] w-full max-w-sm">
                <AnimatePresence>
                  <motion.div
                    key={samples[sampleIdx].id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 overflow-hidden rounded-2xl bg-card shadow-xl"
                  >
                    {samples[sampleIdx].content_type === "video" ? (
                      <video
                        src={samples[sampleIdx].url}
                        poster={samples[sampleIdx].thumbnail_url ?? undefined}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={samples[sampleIdx].thumbnail_url || samples[sampleIdx].url}
                        alt={samples[sampleIdx].title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="mb-2 text-xl font-bold text-foreground">
                        {samples[sampleIdx].title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {samples[sampleIdx].categories.slice(0, 3).map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex justify-center gap-6">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleSwipe(false)}
                >
                  <X className="h-8 w-8" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleSwipe(true)}
                >
                  <Heart className="h-8 w-8" />
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Button variant="ghost" size="sm" onClick={finish}>
                  Skip and finish
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
