import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  BadgeCheck,
  Check,
  Gavel,
  RotateCcw,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Logo } from "@/components/site/Logo";
import { ExecutableReceipt } from "@/components/receipt/ExecutableReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { shortAddress, useReceipts } from "@/lib/receipts";
import { cn } from "@/lib/utils";
import productImage from "@/assets/arc-one.jpg";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Executable Receipts — Your receipt is the remote control for your purchase";
    const description =
      "Executable Receipts turn every purchase into a portable control surface for cancellations, refunds, transfers and disputes. USDC on Arc, named with ENSv2.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Landing,
});

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
      )}
      <h2 className="text-balance-tight mt-4 text-[34px] leading-[1.1] font-semibold sm:text-[42px]">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-[17px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Hero() {
  const receipt = useReceipts()[0];

  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(55% 50% at 72% 18%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%), radial-gradient(40% 40% at 5% 0%, color-mix(in oklab, var(--success) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium shadow-soft">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            Built with ENSv2 × Arc
          </span>

          <h1 className="text-balance-tight mt-7 text-[46px] leading-[1.03] font-semibold sm:text-[64px] lg:text-[72px]">
            Receipts should <span className="text-primary">do more</span> than prove you paid.
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Executable Receipts turn every purchase into a portable control surface for
            cancellations, refunds, transfers and disputes.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full shadow-soft">
              <Link to="/demo">Try the Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-card">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {["USDC Settlement", "Permissioned by ENSv2", "Onchain on Arc"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <BadgeCheck className="size-4 text-success" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <svg
            viewBox="0 0 500 500"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary/12"
            aria-hidden
          >
            <circle cx="250" cy="250" r="130" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="250" cy="250" r="190" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="250" cy="250" r="245" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M60 250H440" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
          </svg>
          {receipt && <ExecutableReceipt receipt={receipt} variant="hero" />}
          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>Payment</span>
            <span className="h-px w-8 bg-border" aria-hidden />
            <span className="font-medium text-foreground">Receipt</span>
            <span className="h-px w-8 bg-border" aria-hidden />
            <span>Capability</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const rows = ["Proof", "Portable rights", "Actions", "Transferability"];

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
      <SectionHeading
        eyebrow="The problem"
        title="Today's receipts are dead documents."
        subtitle="A receipt tells you what happened, but not what you can do next."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[18px] border border-border bg-secondary/50 p-8">
          <h3 className="text-lg font-semibold tracking-tight text-muted-foreground">
            Traditional Receipt
          </h3>
          <ul className="mt-6 space-y-4">
            {rows.map((r, i) => (
              <li
                key={r}
                className="flex items-center justify-between border-b border-border pb-4 text-sm last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{r}</span>
                {i === 0 ? (
                  <Check className="size-4 text-muted-foreground" aria-hidden />
                ) : (
                  <X className="size-4 text-muted-foreground" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-[18px] border border-primary/20 bg-card p-8 shadow-soft"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Zap className="size-4 text-primary" aria-hidden />
            Executable Receipt
          </h3>
          <ul className="mt-6 space-y-4">
            {rows.map((r) => (
              <li
                key={r}
                className="flex items-center justify-between border-b border-border pb-4 text-sm last:border-0 last:pb-0"
              >
                <span>{r}</span>
                <Check className="size-4 text-success" aria-hidden />
              </li>
            ))}
          </ul>
          <p className="mt-7 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">
            Still a receipt. Now also a remote control.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Pay",
      icon: Wallet,
      text: "Pay with USDC on Arc. Funds enter programmable escrow.",
    },
    {
      n: "02",
      title: "Receive",
      icon: BadgeCheck,
      text: "Receive a human-readable ENSv2 receipt for the purchase.",
      mono: "order-128.shop.alice.eth",
    },
    {
      n: "03",
      title: "Execute",
      icon: Zap,
      text: "Use your receipt to cancel, transfer, refund or dispute.",
    },
  ];

  return (
    <section id="how-it-works" className="border-y border-border bg-card/60">
      <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="One purchase. One portable control surface."
        />

        <div className="relative mt-14">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute top-6 right-0 left-0 hidden h-px origin-left bg-border lg:block"
            aria-hidden
          />
          <ol className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-soft">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <p className="mt-6 font-mono text-xs text-muted-foreground">
                  {s.n} — {s.title}
                </p>
                <p className="mt-3 max-w-sm text-[17px] leading-relaxed">{s.text}</p>
                {s.mono && (
                  <p className="mt-4 inline-block rounded-lg border border-border bg-secondary/70 px-3 py-2 font-mono text-[13px]">
                    {s.mono}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function LiveReceipt() {
  const receipt = useReceipts()[0];
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  function resolve() {
    setState("loading");
    setTimeout(() => setState("done"), 900);
  }

  const rows: [string, string][] = receipt
    ? [
        ["Merchant", receipt.merchant],
        ["Amount", `${receipt.amount}.00 USDC`],
        ["Network", receipt.network],
        ["Status", receipt.state],
        ["Claim Owner", shortAddress(receipt.claimOwner)],
        ["Available Actions", receipt.state === "PAID" ? "Cancel · Transfer · Refund" : "None"],
      ]
    : [];

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
      <SectionHeading
        eyebrow="Live executable receipt"
        title="The purchase can leave the merchant's app."
        subtitle="All anyone needs is the receipt name. Resolve it and the purchase, its state and its remaining rights come with it."
      />

      <div className="mt-12 rounded-[20px] border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            defaultValue="order-128.shop.alice.eth"
            aria-label="Receipt name"
            className="h-12 rounded-full border-border bg-secondary/60 px-5 font-mono text-[15px]"
            readOnly
          />
          <Button size="lg" className="h-12 rounded-full px-7" onClick={resolve}>
            Resolve Receipt
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </motion.div>
          )}

          {state === "done" && (
            <motion.dl
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="mt-8 grid gap-x-10 sm:grid-cols-2"
            >
              {rows.map(([k, v], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center justify-between gap-4 border-b border-border py-4"
                >
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </motion.div>
              ))}
            </motion.dl>
          )}
        </AnimatePresence>

        {state === "done" && receipt && (
          <Button asChild variant="link" className="mt-6 px-0 text-primary">
            <Link to="/receipt/$name" params={{ name: receipt.name }}>
              Open the executable receipt →
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Architecture() {
  const [hover, setHover] = useState<string | null>(null);

  const nodes = [
    { id: "customer", label: "Customer", note: null },
    { id: "usdc", label: "49 USDC", note: null },
    { id: "arc", label: "Arc Escrow", note: "Financial source of truth" },
    {
      id: "ens",
      label: "ENSv2 Receipt",
      note: "Portable identity + permissions + capabilities",
    },
  ];

  const rights = [
    { label: "Cancel", icon: X, soon: false },
    { label: "Transfer", icon: ArrowLeftRight, soon: false },
    { label: "Refund", icon: RotateCcw, soon: false },
    { label: "Dispute", icon: Gavel, soon: true },
  ];

  return (
    <section id="architecture" className="border-y border-border bg-card/60">
      <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
        <SectionHeading
          eyebrow="Technology"
          title="Money settles on Arc. Rights live on ENSv2."
          subtitle="Hover the infrastructure to see what each layer is responsible for."
        />

        <div className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3">
          {nodes.map((n) => (
            <div key={n.id} className="flex w-full flex-col items-center gap-3">
              <div
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "w-full rounded-[16px] border border-border bg-card px-6 py-4 text-center shadow-soft transition-colors",
                  n.note && "cursor-default hover:border-primary/40",
                )}
              >
                <p className={cn("font-medium", n.id === "usdc" && "font-mono text-sm")}>
                  {n.label}
                </p>
                <AnimatePresence>
                  {n.note && hover === n.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden text-sm text-primary"
                    >
                      {n.note}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <span className="h-6 w-px bg-border" aria-hidden />
            </div>
          ))}

          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Available rights
          </p>

          <ul className="mt-4 grid w-full grid-cols-2 gap-3">
            {rights.map((r) => (
              <li
                key={r.label}
                className={cn(
                  "flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm",
                  r.soon
                    ? "border-dashed border-border bg-transparent text-muted-foreground"
                    : "border-primary/20 bg-primary/5 text-primary",
                )}
              >
                <r.icon className="size-4" aria-hidden />
                {r.label}
                {r.soon && <span className="ml-auto text-[10px] uppercase">soon</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Storefront() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
      <SectionHeading
        eyebrow="Demo storefront"
        title="Buy something. Then watch the receipt work."
      />

      <div className="mt-12 grid items-center gap-10 rounded-[20px] border border-border bg-card p-8 shadow-soft sm:p-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[16px] bg-secondary">
          <img
            src={productImage}
            alt="Arc One limited edition hardware wallet case"
            width={1024}
            height={1024}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-3xl font-semibold tracking-tight">Arc One</h3>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Limited Edition Hardware Wallet Case
          </p>
          <p className="mt-8 text-4xl font-semibold tracking-tight">
            49 <span className="text-lg font-medium text-muted-foreground">USDC</span>
          </p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {["Refundable", "Transferable Claim", "Arc Settlement"].map((l) => (
              <li
                key={l}
                className="rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {l}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-9 w-full rounded-full">
            <Link to="/demo">Buy with 49 USDC</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-28 text-center lg:px-8">
        <h2 className="text-balance-tight mx-auto max-w-3xl text-[36px] leading-[1.1] font-semibold sm:text-[48px]">
          Your receipt is also the remote control for your purchase.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] text-muted-foreground">
          See the whole thing end to end: buy, receive an ENSv2 receipt, then cancel it and watch
          the refund settle on Arc.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full shadow-soft">
            <Link to="/demo">Try the Demo</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full bg-card">
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-10 lg:px-8">
        <Logo />
        <p className="text-sm text-muted-foreground">
          USDC settlement on Arc · Named and permissioned with ENSv2
        </p>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveReceipt />
        <Architecture />
        <Storefront />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
