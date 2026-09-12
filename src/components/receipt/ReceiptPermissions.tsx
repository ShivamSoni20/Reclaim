import { Check, ChevronDown, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const customer = [
  { label: "View receipt", allowed: true },
  { label: "Transfer claim", allowed: true },
  { label: "Request refund", allowed: true },
  { label: "Change amount", allowed: false },
  { label: "Change settlement state", allowed: false },
];

const merchant = [
  { label: "Update lifecycle", allowed: true },
  { label: "Finalize settlement", allowed: true },
];

function Row({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {allowed ? (
        <Check className="size-4 text-success" aria-hidden />
      ) : (
        <X className="size-4 text-muted-foreground" aria-hidden />
      )}
      <span className={cn(allowed ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}

export function ReceiptPermissions() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border bg-card shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          <span>
            <span className="block text-sm font-semibold">Receipt Permissions</span>
            <span className="block text-sm text-muted-foreground">
              Who can do what with this receipt
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid gap-8 border-t border-border px-6 py-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Customer
                </p>
                <ul className="mt-4 space-y-3">
                  {customer.map((p) => (
                    <Row key={p.label} {...p} />
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Merchant
                </p>
                <ul className="mt-4 space-y-3">
                  {merchant.map((p) => (
                    <Row key={p.label} {...p} />
                  ))}
                </ul>
              </div>
            </div>
            <p className="border-t border-border bg-secondary/50 px-6 py-3.5 text-xs text-muted-foreground">
              Powered by ENSv2 Enhanced Access Control
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
