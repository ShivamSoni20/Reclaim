import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TransactionProgress({
  title,
  subtitle,
  steps,
  stepDuration = 1100,
  onComplete,
}: {
  title: string;
  subtitle?: string;
  steps: string[];
  stepDuration?: number;
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= steps.length) {
      const id = setTimeout(() => onComplete?.(), 500);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setIndex((i) => i + 1), stepDuration);
    return () => clearTimeout(id);
  }, [index, steps.length, stepDuration, onComplete]);

  return (
    <section
      aria-live="polite"
      className="mx-auto w-full max-w-xl rounded-[18px] border border-border bg-card p-8 text-center shadow-soft"
    >
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}

      <ol className="mt-8 space-y-1 text-left">
        <AnimatePresence initial={false}>
          {steps.slice(0, index + 1).map((step, i) => {
            const done = i < index;
            return (
              <motion.li
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
                  done ? "text-muted-foreground" : "bg-secondary/70 font-medium text-foreground",
                )}
              >
                {done ? (
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
                )}
                {step}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </section>
  );
}
