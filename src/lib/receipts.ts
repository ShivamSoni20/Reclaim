import { useSyncExternalStore } from "react";
import { LIVE_ENABLED } from "./web3";

export type ReceiptState = "PAID" | "REFUND_REQUESTED" | "CANCELLED" | "REFUNDED" | "FINALIZED";

export interface Receipt {
  /** ENSv2 receipt name, e.g. order-128.shop.alice.eth */
  name: string;
  order: number;
  product: string;
  description: string;
  /** USDC amount */
  amount: number;
  merchant: string;
  buyer: string;
  claimOwner: string;
  actionBitmap?: number;
  state: ReceiptState;
  purchasedAt: number;
  /** epoch ms after which immediate cancellation is no longer possible */
  cancelDeadline: number;
  /** epoch ms after which a refund can no longer be requested */
  refundDeadline: number;
  transferable: boolean;
  network: string;
  settlementContract: string;
  txHash: string;
  refundTxHash?: string;
  refundedAmount?: number;
  arcVerified?: boolean;
  ensResolved?: boolean;
  ensSynced?: boolean;
  ensResolver?: string;
}

export const WALLET = "0x72A4f1B0c3De5a91C4b77A0913f8e2Cd449891B2";
export const SETTLEMENT_CONTRACT = "0x85d3F0a17bC4d2E6098aa70eD41b9c2F3b17Ae91";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const CANCEL_WINDOW_MS = 12 * 60_000 + 42_000;

function seed(): Receipt[] {
  const now = Date.now();
  return [
    {
      name: "order-128.shop.alice.eth",
      order: 128,
      product: "Arc One",
      description: "Limited Edition Hardware Wallet Case",
      amount: 49,
      merchant: "shop.alice.eth",
      buyer: WALLET,
      claimOwner: WALLET,
      state: "PAID",
      purchasedAt: now - 3 * 60_000,
      cancelDeadline: now + CANCEL_WINDOW_MS,
      refundDeadline: now + CANCEL_WINDOW_MS,
      transferable: true,
      network: "Arc",
      settlementContract: SETTLEMENT_CONTRACT,
      txHash: "0x9f21c0b7ae4415d3d0a2b6e7f5c81d9a3e4b7c60a1f28d34be90a7c5d612f8b4",
    },
    {
      name: "order-127.shop.alice.eth",
      order: 127,
      product: "Arc One",
      description: "Limited Edition Hardware Wallet Case",
      amount: 49,
      merchant: "shop.alice.eth",
      buyer: WALLET,
      claimOwner: WALLET,
      state: "CANCELLED",
      purchasedAt: now - 4 * 24 * 60 * 60_000,
      cancelDeadline: now - 4 * 24 * 60 * 60_000 + CANCEL_WINDOW_MS,
      refundDeadline: now - 4 * 24 * 60 * 60_000 + CANCEL_WINDOW_MS,
      transferable: false,
      network: "Arc",
      settlementContract: SETTLEMENT_CONTRACT,
      txHash: "0x41d8ba62c07e9f3a55b0ce1d7f2a48903c6e5b7218af40d9c3e6b15a78d02fc3",
      refundTxHash: "0x77ac30e5b1946d28fa0c7b53e19d4a6802f5c3ab7e1d69042fb8ce35719a0d2e",
      refundedAmount: 49,
    },
    {
      name: "order-126.shop.alice.eth",
      order: 126,
      product: "Arc Field Kit",
      description: "Travel accessory bundle",
      amount: 49,
      merchant: "shop.alice.eth",
      buyer: WALLET,
      claimOwner: WALLET,
      state: "FINALIZED",
      purchasedAt: now - 11 * 24 * 60 * 60_000,
      cancelDeadline: now - 11 * 24 * 60 * 60_000 + CANCEL_WINDOW_MS,
      refundDeadline: now - 11 * 24 * 60 * 60_000 + CANCEL_WINDOW_MS,
      transferable: false,
      network: "Arc",
      settlementContract: SETTLEMENT_CONTRACT,
      txHash: "0x2b60f4c9a71de835047cb9126ea3f5d8071c4be29f3a6d05c817ba49e0d3712f",
    },
  ];
}

let receipts: Receipt[] = LIVE_ENABLED ? [] : seed();
const listeners = new Set<() => void>();

function emit() {
  receipts = [...receipts];
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return receipts;
}

export function useReceipts(): Receipt[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useReceipt(name: string): Receipt | undefined {
  return useReceipts().find((r) => r.name === name);
}

export function getReceipt(name: string) {
  return receipts.find((r) => r.name === name);
}

function update(name: string, patch: Partial<Receipt>) {
  receipts = receipts.map((r) => (r.name === name ? { ...r, ...patch } : r));
  emit();
}

export function applyArcOrder(name: string, patch: Partial<Receipt>) {
  const existing = getReceipt(name);
  if (existing) {
    update(name, patch);
    return;
  }
  const order = Number(name.match(/order-(\d+)/)?.[1]);
  if (!Number.isFinite(order)) return;
  const receipt: Receipt = {
    name,
    order,
    product: "Arc One",
    description: "Limited Edition Hardware Wallet Case",
    amount: 0,
    merchant: "Unknown",
    buyer: WALLET,
    claimOwner: WALLET,
    state: "PAID",
    purchasedAt: Date.now(),
    cancelDeadline: Date.now(),
    refundDeadline: Date.now(),
    transferable: false,
    network: "Arc Testnet",
    settlementContract: import.meta.env.VITE_ESCROW_ADDRESS || SETTLEMENT_CONTRACT,
    txHash: "",
    ...patch,
  };
  receipts = [receipt, ...receipts];
  emit();
}

export function cancelReceipt(name: string, refundTxHash?: string) {
  const r = getReceipt(name);
  if (!r) return;
  update(name, {
    state: "CANCELLED",
    refundedAmount: r.amount,
    transferable: false,
    refundTxHash: refundTxHash ?? randomHash(),
  });
}

export function markRefundRequested(name: string, txHash?: string) {
  update(name, txHash ? { state: "REFUND_REQUESTED", txHash } : { state: "REFUND_REQUESTED" });
}

export function transferClaim(name: string, newOwner: string) {
  update(name, { claimOwner: newOwner });
}

/** Demo purchase: re-mints order-128 as a fresh PAID receipt. */
export function makeDemoPurchase(): Receipt {
  const now = Date.now();
  const base = seed()[0] as Receipt;
  const fresh: Receipt = {
    ...base,
    purchasedAt: now,
    cancelDeadline: now + CANCEL_WINDOW_MS,
    refundDeadline: now + CANCEL_WINDOW_MS,
    txHash: randomHash(),
  };
  receipts = [fresh, ...receipts.filter((r) => r.name !== fresh.name)];
  emit();
  return fresh;
}

export function addLivePurchase(input: {
  orderId: bigint;
  buyer: string;
  merchant: string;
  amount: number;
  cancelBefore: number;
  refundBefore: number;
  transferable: boolean;
  txHash: string;
}): Receipt {
  const parent = import.meta.env.VITE_RECEIPT_PARENT;
  if (!parent) throw new Error("VITE_RECEIPT_PARENT is required in live mode.");
  const receipt: Receipt = {
    name: `order-${input.orderId}.${parent}`,
    order: Number(input.orderId),
    product: "Arc One",
    description: "Limited Edition Hardware Wallet Case",
    amount: input.amount,
    merchant: input.merchant,
    buyer: input.buyer,
    claimOwner: input.buyer,
    state: "PAID",
    purchasedAt: Date.now(),
    cancelDeadline: input.cancelBefore,
    refundDeadline: input.refundBefore,
    transferable: input.transferable,
    network: "Arc Testnet",
    settlementContract: import.meta.env.VITE_ESCROW_ADDRESS || SETTLEMENT_CONTRACT,
    txHash: input.txHash,
  };
  receipts = [receipt, ...receipts.filter((item) => item.name !== receipt.name)];
  emit();
  return receipt;
}

export function randomHash() {
  const chars = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function canCancel(r: Receipt, now = Date.now()) {
  return r.actionBitmap === undefined
    ? r.state === "PAID" && now < r.cancelDeadline
    : (r.actionBitmap & 1) !== 0;
}

export function canRefund(r: Receipt) {
  return r.actionBitmap === undefined ? r.state === "PAID" : (r.actionBitmap & 4) !== 0;
}

export function canTransfer(r: Receipt) {
  return r.actionBitmap === undefined
    ? r.state === "PAID" && r.transferable
    : (r.actionBitmap & 2) !== 0;
}

export function formatUsdc(amount: number, decimals = 2) {
  return amount.toFixed(decimals);
}

export function formatDeadline(ts: number) {
  return (
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    })
      .format(new Date(ts))
      .replace(",", " ·") + " UTC"
  );
}

export function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
