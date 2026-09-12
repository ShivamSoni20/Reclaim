import { createPublicClient, http, isAddress, type Address } from "viem";
import { normalize } from "viem/ens";
import { sepolia } from "viem/chains";
import { ARC_CHAIN_ID } from "./web3";

export const RECEIPT_KEYS = [
  "receipt.version",
  "receipt.type",
  "receipt.status",
  "receipt.amount",
  "receipt.currency",
  "receipt.chainId",
  "receipt.contract",
  "receipt.orderId",
  "receipt.merchant",
  "receipt.claimOwner",
  "receipt.createdAt",
  "receipt.cancelBefore",
  "receipt.refundBefore",
  "receipt.transferable",
  "receipt.action.cancel",
  "receipt.action.transfer",
  "receipt.action.refund",
  "receipt.customerNote",
] as const;

export type ReceiptRecords = Record<(typeof RECEIPT_KEYS)[number], string>;
const client = createPublicClient({
  chain: sepolia,
  transport: http(import.meta.env.VITE_ENS_SEPOLIA_RPC_URL),
});

export async function resolveReceiptName(input: string) {
  const name = normalize(input);
  const resolver = await client.getEnsResolver({ name });
  if (!resolver) throw new Error("This ENSv2 receipt does not resolve on Sepolia.");
  const values = await Promise.all(RECEIPT_KEYS.map((key) => client.getEnsText({ name, key })));
  const records = Object.fromEntries(
    RECEIPT_KEYS.map((key, index) => [key, values[index] ?? ""]),
  ) as ReceiptRecords;
  const chainId = Number(records["receipt.chainId"]);
  const orderId = Number(records["receipt.orderId"]);
  const contract = records["receipt.contract"];
  if (chainId !== ARC_CHAIN_ID) throw new Error(`Unsupported receipt chain ${chainId}.`);
  if (!Number.isSafeInteger(orderId) || orderId < 1)
    throw new Error("Receipt has an invalid orderId record.");
  if (!isAddress(contract)) throw new Error("Receipt has an invalid escrow contract record.");
  return { name, resolver, records, chainId, orderId, contract: contract as Address };
}

export function recordsMatchArc(
  records: ReceiptRecords,
  order: { state: string; amount: number; claimOwner: string },
) {
  return (
    records["receipt.status"].toUpperCase() === order.state &&
    Number(records["receipt.amount"]) === order.amount &&
    records["receipt.claimOwner"].toLowerCase() === order.claimOwner.toLowerCase()
  );
}
