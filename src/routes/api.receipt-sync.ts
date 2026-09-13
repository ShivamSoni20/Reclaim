import { createFileRoute } from "@tanstack/react-router";
import type { Hash } from "viem";

const MAX_BODY_BYTES = 2_048;
const TRANSACTION_HASH = /^0x[0-9a-fA-F]{64}$/;
const SAFE_ERRORS = new Set([
  "Invalid orderId",
  "Invalid arcTxHash",
  "Malformed JSON",
  "Request body is too large",
  "Order does not exist in the configured escrow.",
  "Arc transaction is not a successful call to the configured escrow.",
  "Receipt resolves through an unexpected resolver.",
  "ENS transaction confirmed, but receipt records do not match Arc state.",
]);

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (
    SAFE_ERRORS.has(message) ||
    message.startsWith("Missing required server environment variable:")
  )
    return message;
  return "Synchronization failed";
}

export const Route = createFileRoute("/api/receipt-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const declaredLength = Number(request.headers.get("content-length") ?? 0);
          if (declaredLength > MAX_BODY_BYTES) throw new Error("Request body is too large");

          const body = await request.text();
          if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES)
            throw new Error("Request body is too large");

          let input: unknown;
          try {
            input = JSON.parse(body);
          } catch {
            throw new Error("Malformed JSON");
          }
          if (!input || typeof input !== "object" || Array.isArray(input))
            throw new Error("Malformed JSON");

          const { orderId: rawOrderId, arcTxHash: rawArcTxHash } = input as Record<string, unknown>;
          if (
            (typeof rawOrderId !== "string" && typeof rawOrderId !== "number") ||
            !/^\d+$/.test(String(rawOrderId))
          )
            throw new Error("Invalid orderId");
          const orderId = BigInt(rawOrderId);
          if (orderId < 1n) throw new Error("Invalid orderId");

          let arcTxHash: Hash | undefined;
          if (rawArcTxHash !== undefined) {
            if (typeof rawArcTxHash !== "string" || !TRANSACTION_HASH.test(rawArcTxHash))
              throw new Error("Invalid arcTxHash");
            arcTxHash = rawArcTxHash as Hash;
          }

          const { syncOrder } = await import("../../services/ens-sync/src/core.ts");
          return Response.json(await syncOrder(orderId, arcTxHash));
        } catch (error) {
          return Response.json(
            { code: "ENS_SYNC_FAILED", arcCanonical: true, error: safeError(error) },
            { status: 400 },
          );
        }
      },
    },
  },
});
