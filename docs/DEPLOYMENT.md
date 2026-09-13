# Live deployment

Reclaim has two explicit modes. With no `VITE_ESCROW_ADDRESS`, the UI is a labeled preview and moves no funds. With a deployed address, all receipts and actions come from Arc and ENSv2; there is no fixture fallback.

## 1. Deploy the Arc escrow

Install Foundry, copy `.env.example` to `.env`, fund the deployer on Arc Testnet, and set `DEPLOYER_PRIVATE_KEY` and `MERCHANT_ADDRESS` locally. The script uses Arc Testnet USDC at `0x3600000000000000000000000000000000000000` (ERC-20 interface, 6 decimals).

```bash
forge script contracts/script/DeployExecutableReceiptEscrow.s.sol:DeployExecutableReceiptEscrow \
  --rpc-url "$ARC_RPC_URL" --broadcast
```

Record the emitted contract address, deployment transaction, and deployment block. Never commit the deployer key.

## 2. Prepare the ENSv2 parent

On ENSv2 Sepolia, the team must control the name in `ENS_RECEIPT_PARENT` and its Permissioned Registry. Configure the server signer as the parent operator able to register `order-{id}` children and manage their configured Permissioned Resolver. The sync service deliberately refuses a child that resolves through a different resolver.

The current claim owner receives only exact-key permission for `receipt.customerNote`. The server retains authoritative record writes. On claim transfer the old exact-key grant is revoked and the new owner receives it. This does not authorize either customer to edit amount, status, deadlines, or other financial metadata.

## 3. Deploy the app and ENS sync endpoint on Vercel

Production uses one provider and one origin:

```text
GitHub
   ↓
Vercel
   ├── TanStack Start frontend
   └── POST /api/receipt-sync server function
```

The server route calls the shared `syncOrder()` implementation directly. It does not start a listener, keep process-local rate-limit state, trust browser-supplied financial fields, or require a separate backend. The standalone `npm run ens-sync` command remains available only for local debugging.

Import `ShivamSoni20/Reclaim` in Vercel, then open **Project → Settings → Environment Variables**. Set `NITRO_PRESET=vercel`; the existing Lovable wrapper already configures TanStack Start and Nitro, so do not add duplicate Vite plugins.

### Browser-safe variables

```env
VITE_ARC_RPC_URL=https://public-arc-testnet-rpc
VITE_ESCROW_ADDRESS=0x65cf0a527a6ac533ae4473d361ae182494da1537
VITE_ESCROW_DEPLOY_BLOCK=61892392
VITE_RECEIPT_PARENT=reclaimprotocol.eth
VITE_ENS_SEPOLIA_RPC_URL=https://public-sepolia-rpc
VITE_ENS_SYNC_URL=/api/receipt-sync
```

### Server-only variables

```env
ARC_RPC_URL=https://private-arc-testnet-rpc
ARC_ESCROW_ADDRESS=0x65cf0a527a6ac533ae4473d361ae182494da1537
ENS_SEPOLIA_RPC_URL=https://private-sepolia-rpc
ENS_SYNC_SIGNER_PRIVATE_KEY=0xServerSignerKey
ENS_RECEIPT_PARENT=reclaimprotocol.eth
ENS_PARENT_REGISTRY=0x3141dccd1288882ca27ccAE0aB4E3baDD9dEa7B5
ENS_PERMISSIONED_RESOLVER=0x75A7fb21f7a7bB84492149234e4bAb7c119f77C7
NITRO_PRESET=vercel
```

Never put private RPC URLs or private keys in `VITE_*` variables. Initially enable `ENS_SYNC_SIGNER_PRIVATE_KEY` only for the Vercel **Production** environment, not arbitrary Preview deployments.

The endpoint accepts only a positive `orderId` and an optional 32-byte `arcTxHash`:

```json
{ "orderId": "1", "arcTxHash": "0xoptionalConfirmedArcTransaction" }
```

It verifies the optional transaction, reads the configured Arc escrow as canonical state, creates or updates the deterministic ENS receipt through the shared synchronization core, and returns the real synchronization result. Requests larger than 2 KB, malformed JSON, invalid IDs, and invalid hashes are rejected. Repeating a sync is idempotent when Arc state and ENS records already match.

## 4. Build for Vercel

```bash
npm ci
npm run lint
NITRO_PRESET=vercel npm run build
```

Vercel natively supports the TanStack Start + Nitro output. `vercel.json` declares the `tanstack-start` framework; no custom output directory, rewrite, or second server is required. The dashboard discovers orders from `OrderCreated` and `ClaimTransferred` logs starting at `VITE_ESCROW_DEPLOY_BLOCK`. Receipt deep links resolve ENS pointers and then read canonical Arc state.

## 5. Verify before recording

```bash
forge fmt --check
forge build
forge test -vvv
node --experimental-strip-types --check services/ens-sync/src/server.ts
npm run lint
npm run build
```

Then execute purchase, cancel, claim-transfer, and refund-request flows with funded test wallets. Save every real transaction hash and the receipt name in `SUBMISSION.md`. If Arc succeeds while ENS is unavailable, the UI reports partial success and exposes **Retry ENS Sync**; never repeat the Arc financial action.

## Operational commands

```bash
npm run preflight
npm run ens:setup
npm run ens:sync -- --order 7
npm run ens:verify -- order-7.your-controlled-name.eth
```

`ens:sync` and the HTTP service call the same synchronization core. `ens:verify` independently resolves the receipt, reads Arc, and exits non-zero when the mirror differs. The ABI fragments are intentionally limited to the current ENSv2 Permissioned Registry registration, Permissioned Resolver text/multicall, and exact-key `authorizeTextRoles` APIs documented by ENS. Deployment addresses are never embedded: obtain the current Sepolia values from [ENSv2 deployments](https://docs.ens.domains/ensv2/) and provide them through server environment variables.

## Arc Testnet deployment

- Network: Arc Testnet (`5042002`)
- Escrow: [`0x65cf0a527a6ac533ae4473d361ae182494da1537`](https://testnet.arcscan.app/address/0x65cf0a527a6ac533ae4473d361ae182494da1537)
- Deployment transaction: [`0x6db3a02e7d986d20a337742632527b4100a8f2b92c1b548fc9fefd815111a322`](https://testnet.arcscan.app/tx/0x6db3a02e7d986d20a337742632527b4100a8f2b92c1b548fc9fefd815111a322)
- Deployment block: `61892392`
- Merchant: `0x620f495e239298490bE0117B4d0e836F71536B2b`
- Arc USDC: `0x3600000000000000000000000000000000000000`
- Product 1: `49 USDC` (`49000000` base units), transferable
- Cancel window: `900 seconds`
- Refund window: `900 seconds`

## Verified Arc lifecycle

Order `1` completed a real Arc Testnet `PAID → CANCELLED` lifecycle:

- Buyer: `0x585BF3aCe247892Ac5f70cE5c8c16bD2f5C89047`
- Approval: [`0x714c94255df962e756b8b0f67266cf0de3f576d1e048963a1ba131051d09a9b9`](https://testnet.arcscan.app/tx/0x714c94255df962e756b8b0f67266cf0de3f576d1e048963a1ba131051d09a9b9)
- Purchase: [`0x573690792e4b2245047e0105d184e61d792462b177031cb97076172af39200f7`](https://testnet.arcscan.app/tx/0x573690792e4b2245047e0105d184e61d792462b177031cb97076172af39200f7)
- Cancel: [`0x35e97f6888d76b65fcc17b752825b8b30cac88f55a447bf232570a7f89b2de9`](https://testnet.arcscan.app/tx/0x35e97f6888d76b65fcc17b752825b8b30cac88f55a447bf232570a7f89b2de9)
- Buyer USDC: `50000000 → 994065 → 49992537`
- Escrow USDC: `0 → 49000000 → 0`
- CI evidence: [GitHub Actions run 34758209101](https://github.com/ShivamSoni20/Reclaim/actions/runs/34758209101)

Arc gas is paid in USDC, accounting for the difference between the buyer's initial and final balances. No ENS transaction was part of this lifecycle run.
