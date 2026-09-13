import { createServer } from "node:http";
import type { Hash } from "viem";
import { createContext, syncOrder } from "./core.ts";

const context = createContext();
const recent = new Map<string, number>();
function log(event: string, fields: Record<string, unknown>) {
  console.log(
    JSON.stringify({ timestamp: new Date().toISOString(), service: "ens-sync", event, ...fields }),
  );
}

createServer(async (request, response) => {
  try {
    if (request.method !== "POST" || request.url !== "/api/receipt-sync") {
      response.writeHead(404).end();
      return;
    }
    const ip = request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    if ((recent.get(ip) ?? 0) > now - 2_000) {
      response
        .writeHead(429, { "content-type": "application/json" })
        .end(JSON.stringify({ code: "RATE_LIMITED", error: "Retry later" }));
      return;
    }
    recent.set(ip, now);
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 2048) throw new Error("Request too large");
    }
    const input = JSON.parse(body) as { orderId?: string | number; arcTxHash?: Hash };
    const orderId = BigInt(input.orderId ?? 0);
    if (orderId < 1n) throw new Error("Invalid orderId");
    const result = await syncOrder(orderId, input.arcTxHash, context);
    log("sync.complete", { ...result, arcTxHash: input.arcTxHash });
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Synchronization failed";
    log("sync.error", { message });
    response
      .writeHead(400, { "content-type": "application/json" })
      .end(JSON.stringify({ code: "ENS_SYNC_FAILED", arcCanonical: true, error: message }));
  }
}).listen(Number(process.env.ENS_SYNC_PORT ?? 8788), () =>
  log("server.ready", {
    port: Number(process.env.ENS_SYNC_PORT ?? 8788),
    signer: context.account.address,
  }),
);
