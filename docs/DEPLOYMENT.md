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

## 3. Configure the ENS sync service

All values below are server-only. `ENS_SYNC_SIGNER_PRIVATE_KEY` must never use a `VITE_` prefix.

```env
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_ESCROW_ADDRESS=0x65cf0a527a6ac533ae4473d361ae182494da1537
ENS_SEPOLIA_RPC_URL=https://your-sepolia-rpc
ENS_SYNC_SIGNER_PRIVATE_KEY=0xServerSignerKey
ENS_RECEIPT_PARENT=shop.your-controlled-name.eth
ENS_PARENT_REGISTRY=0xCurrentPermissionedRegistry
ENS_PERMISSIONED_RESOLVER=0xCurrentPermissionedResolver
ENS_SYNC_PORT=8788
```

Run:

```bash
npm run ens-sync
```

The service accepts `POST /api/receipt-sync` with only:

```json
{ "orderId": 1, "arcTxHash": "0xoptionalConfirmedArcTransaction" }
```

It verifies the optional transaction targets the configured escrow, reads canonical order state directly from Arc, creates/resolves the deterministic child, derives every record, migrates the exact-key EAC grant, waits for the ENS transaction, and returns the real ENS transaction hash. It rate-limits callers and rejects bodies above 2 KB. Repeating a sync is safe.

Expose this service over HTTPS and either reverse-proxy `/api/receipt-sync` or set an absolute `VITE_ENS_SYNC_URL`.

## 4. Configure and build the app

```env
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ESCROW_ADDRESS=0x65cf0a527a6ac533ae4473d361ae182494da1537
VITE_ESCROW_DEPLOY_BLOCK=61892392
VITE_RECEIPT_PARENT=shop.your-controlled-name.eth
VITE_ENS_SEPOLIA_RPC_URL=https://your-sepolia-rpc
VITE_ENS_SYNC_URL=https://your-server.example/api/receipt-sync
```

```bash
npm ci
npm run lint
npm run build
```

The dashboard discovers orders from `OrderCreated` and `ClaimTransferred` logs starting at `VITE_ESCROW_DEPLOY_BLOCK`. A receipt deep link resolves its contract and order pointer through ENSv2, then loads Arc canonical state.

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
