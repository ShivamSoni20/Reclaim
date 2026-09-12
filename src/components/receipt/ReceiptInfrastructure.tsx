import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { shortAddress, type Receipt } from "@/lib/receipts";
import { cn } from "@/lib/utils";
import { ARC_CHAIN_ID, transactionUrl } from "@/lib/web3";

function Row({
  title,
  label,
  value,
  status,
  linkLabel,
  href,
}: {
  title: string;
  label: string;
  value: string;
  status: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1.5 truncate font-mono text-sm">{value}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          {status}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
        >
          {linkLabel}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

export function ReceiptInfrastructure({ receipt }: { receipt: Receipt }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border bg-card shadow-soft">
      <h2 className="px-6 pt-6 text-sm font-semibold tracking-tight">Verified Infrastructure</h2>
      <div className="mt-2 divide-y divide-border">
        <Row
          title="Arc"
          label="Settlement contract"
          value={shortAddress(receipt.settlementContract)}
          status={receipt.arcVerified ? "Verified" : "Preview"}
          linkLabel="View on Arc Explorer"
          href={transactionUrl(receipt.txHash)}
        />
        <Row
          title="ENSv2"
          label="Receipt"
          value={receipt.name}
          status={
            receipt.ensSynced ? "Synchronized" : receipt.ensResolved ? "Sync pending" : "Preview"
          }
          linkLabel="Inspect resolver"
          href={`https://app.ens.domains/${receipt.name}`}
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-t border-border px-6 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        View onchain details
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.dl
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-secondary/40 px-6 text-sm"
          >
            <div className="space-y-4 py-5">
              {[
                ["Chain", `${receipt.network} (chainId ${ARC_CHAIN_ID})`],
                ["Settlement contract", receipt.settlementContract],
                ["ENS resolver", receipt.ensResolver ?? "Not resolved"],
                ["Purchase transaction", receipt.txHash],
                ...(receipt.refundTxHash ? [["Refund transaction", receipt.refundTxHash]] : []),
                ["Token", "USDC · 6 decimals"],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[200px_1fr]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-[13px] break-all">{v}</dd>
                </div>
              ))}
            </div>
          </motion.dl>
        )}
      </AnimatePresence>
    </section>
  );
}
