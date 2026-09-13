import { syncOrder } from "../../services/ens-sync/src/core.ts";
const index = process.argv.indexOf("--order");
const value = index >= 0 ? process.argv[index + 1] : undefined;
if (!value || !/^\d+$/.test(value) || BigInt(value) < 1n)
  throw new Error("Usage: npm run ens:sync -- --order <positive-order-id>");
const result = await syncOrder(BigInt(value));
console.log(JSON.stringify(result, null, 2));
