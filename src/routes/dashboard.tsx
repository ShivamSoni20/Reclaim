import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { ExecutableReceipt } from "@/components/receipt/ExecutableReceipt";
import { LogoMark } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyArcOrder, shortAddress, useReceipts, WALLET } from "@/lib/receipts";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { discoverOrdersForAccount, ESCROW_ADDRESS, LIVE_ENABLED } from "@/lib/web3";

export const Route = createFileRoute("/dashboard")({
  head: () => {
    const title = "Your Receipts — Executable Receipts";
    const description =
      "Every purchase you own and every right still available: cancel, transfer or refund straight from the receipt.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Dashboard,
});

const FILTERS = ["All", "Active", "Refundable", "Transferred", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-6 py-4 first:pl-0 sm:border-l sm:border-border sm:first:border-0">
      <p className="text-[28px] font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const receipts = useReceipts();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const wallet = useWallet();

  useEffect(() => {
    const escrowAddress = ESCROW_ADDRESS;
    if (!LIVE_ENABLED || !wallet.address || !escrowAddress) return;
    let active = true;
    void discoverOrdersForAccount(wallet.address)
      .then((found) => {
        if (!active) return;
        const parent = import.meta.env.VITE_RECEIPT_PARENT;
        if (!parent) throw new Error("VITE_RECEIPT_PARENT is required for live discovery.");
        found.forEach(({ orderId, txHash, order }) =>
          applyArcOrder(`order-${orderId}.${parent}`, {
            ...order,
            order: orderId,
            settlementContract: escrowAddress,
            txHash,
            arcVerified: true,
          }),
        );
      })
      .catch((error: unknown) =>
        toast.error("Could not discover Arc receipts", {
          description: error instanceof Error ? error.message : "Arc RPC log query failed.",
        }),
      );
    return () => {
      active = false;
    };
  }, [wallet.address]);

  const metrics = useMemo(() => {
    const activeValue = receipts
      .filter((r) => r.state === "PAID" || r.state === "FINALIZED")
      .reduce((sum, r) => sum + r.amount, 0);
    const refunded = receipts.reduce((sum, r) => sum + (r.refundedAmount ?? 0), 0);
    const transferable = receipts.filter((r) => r.state === "PAID" && r.transferable).length;
    return { count: receipts.length, activeValue, refunded, transferable };
  }, [receipts]);

  const visible = receipts.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || r.name.toLowerCase().includes(q) || r.merchant.toLowerCase().includes(q);
    const matchesFilter =
      filter === "All" ||
      (filter === "Active" && r.state === "PAID") ||
      (filter === "Refundable" && r.state === "PAID") ||
      (filter === "Transferred" &&
        r.claimOwner.toLowerCase() !== (wallet.address ?? WALLET).toLowerCase()) ||
      (filter === "Completed" && (r.state === "FINALIZED" || r.state === "CANCELLED"));
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="atmosphere min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1280px] px-6 pt-32 pb-28 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight">Your Receipts</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Every purchase you own and every right still available.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium shadow-soft">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              <span className="font-mono">{shortAddress(wallet.address ?? WALLET)}</span>
            </span>
            <span className="rounded-full border border-border bg-secondary px-3.5 py-2 text-xs font-medium text-muted-foreground">
              Arc
            </span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 border-y border-border sm:flex sm:items-center">
          <Metric value={String(metrics.count)} label="Receipts" />
          <Metric value={`${metrics.activeValue} USDC`} label="Active value" />
          <Metric value={`${metrics.refunded} USDC`} label="Refunded" />
          <Metric
            value={String(metrics.transferable)}
            label={metrics.transferable === 1 ? "Transferable claim" : "Transferable claims"}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipt or merchant"
              aria-label="Search receipt or merchant"
              className="rounded-full border-border bg-card pl-10"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter receipts"
            className="inline-flex overflow-x-auto rounded-full border border-border bg-card p-1 shadow-soft"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {visible.map((r) => (
              <ExecutableReceipt key={r.name} receipt={r} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center rounded-[20px] border border-dashed border-border bg-card/60 px-6 py-20 text-center">
            <LogoMark className="size-10 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold tracking-tight">
              No executable receipts yet.
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your programmable purchase rights will appear here.
            </p>
            <Button asChild className="mt-7 rounded-full">
              <Link to="/demo">Make Demo Purchase</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
