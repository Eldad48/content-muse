import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronUp, Bookmark, Music2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mediarec_tutorial_seen";

export function hasSeenTutorial() {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEY, "true");
}

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to MediaRec",
    body: "A personalized feed that learns what you love. Let's show you the gestures.",
  },
  {
    icon: Heart,
    title: "Swipe right to LIKE",
    body: "Drag the card right (or tap the heart) to tell us you love it. We'll show more like it.",
  },
  {
    icon: X,
    title: "Swipe left to SKIP",
    body: "Drag the card left (or tap the X) to dismiss content you're not into.",
  },
  {
    icon: ChevronUp,
    title: "Scroll up for next",
    body: "Just want to keep scrolling? Swipe up like TikTok to jump to the next item.",
  },
  {
    icon: Bookmark,
    title: "Save & explore externally",
    body: "Bookmark for later, or tap the TikTok / Instagram icons to find related content.",
  },
];

export function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  const next = () => {
    if (step === steps.length - 1) {
      markTutorialSeen();
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    markTutorialSeen();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">{current.title}</h2>
          <p className="mb-6 text-muted-foreground">{current.body}</p>

          {/* progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={skip}>
              Skip
            </Button>
            <Button className="flex-1" onClick={next}>
              {step === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
