import { getAddress } from "viem";
import {
  createContext,
  deriveRecords,
  readCanonicalOrder,
  readReceiptRecords,
  RECEIPT_KEYS,
} from "../../services/ens-sync/src/core.ts";
const input = process.argv[2];
if (!input) throw new Error("Usage: npm run ens:verify -- <receipt-name>");
const context = createContext();
const name = input.toLowerCase();
const resolver = await context.ens.getEnsResolver({ name });
if (!resolver) throw new Error(`Receipt ${name} does not resolve on ENSv2 Sepolia.`);
const records = await readReceiptRecords(context, name);
if (Number(records["receipt.chainId"]) !== 5_042_002)
  throw new Error("Receipt points to an unsupported chain.");
if (getAddress(records["receipt.contract"]) !== context.config.escrow)
  throw new Error("Receipt points to a different escrow.");
const orderId = BigInt(records["receipt.orderId"]);
const order = await readCanonicalOrder(context, orderId);
const desired = deriveRecords(context, orderId, order);
const mismatches = RECEIPT_KEYS.filter((key) => records[key] !== desired[key]);
console.log(
  JSON.stringify(
    {
      receiptName: name,
      resolver,
      version: records["receipt.version"],
      type: records["receipt.type"],
      chainId: records["receipt.chainId"],
      escrowContract: records["receipt.contract"],
      orderId: records["receipt.orderId"],
      status: records["receipt.status"],
      amount: records["receipt.amount"],
      currency: records["receipt.currency"],
      merchant: records["receipt.merchant"],
      claimOwner: records["receipt.claimOwner"],
      cancelDeadline: records["receipt.cancelBefore"],
      refundDeadline: records["receipt.refundBefore"],
      transferable: records["receipt.transferable"],
      cancelCapability: records["receipt.action.cancel"],
      transferCapability: records["receipt.action.transfer"],
      refundCapability: records["receipt.action.refund"],
      customerNoteDelegateExpected: order.claimOwner,
      arcCanonicalState: desired["receipt.status"],
      ensArcMatch: mismatches.length === 0 ? "YES" : "NO",
      mismatches,
      eacVerification:
        "Role changes are verified by successful Permissioned Resolver transaction receipt; no unsupported read ABI is assumed.",
    },
    null,
    2,
  ),
);
if (mismatches.length) process.exitCode = 2;
