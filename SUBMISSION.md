# ETHGlobal submission draft

## Project name

Reclaim

## One-liner

A receipt that can cancel, refund or transfer the purchase it represents.

## Short description

Reclaim turns purchases into portable executable receipts. Pay USDC into programmable escrow on Arc and receive a human-readable ENSv2 receipt that identifies the order, exposes its remaining rights and lets the authorized holder exercise them outside the merchant application.

## Problem

Receipts are passive proof. Customers must return to a merchant database to discover deadlines, transfer a pickup right or request their money back.

## Solution

Each purchase becomes a capability-bearing ENS name. Resolving it discovers the canonical Arc escrow and order. Arc enforces all financial authorization; ENSv2 supplies portable identity, metadata and tightly scoped permissions.

## ENSv2 usage

ENSv2 Sepolia hierarchical receipt subnames use actual Universal Resolver text reads. A Permissioned Resolver stores deterministic `receipt.*` records. EAC delegates only `receipt.customerNote` to the current claim owner; lifecycle records remain controlled by the sync service. Transfer synchronization revokes the old delegation and grants the new holder.

## Arc usage

Real Arc ERC-20 USDC funds a conditional escrow. `purchase`, `cancel`, `requestRefund`, `approveRefund`, `transferClaim`, and `finalize` form the lifecycle. `getAvailableActions` derives caller-specific rights.

## Stack

Solidity, Foundry, TypeScript, React, TanStack Start, viem, Tailwind and ENSv2 Sepolia.

## Arc Testnet deployment

- Network / chain ID: Arc Testnet / `5042002`
- Escrow: [`0x65cf0a527a6ac533ae4473d361ae182494da1537`](https://testnet.arcscan.app/address/0x65cf0a527a6ac533ae4473d361ae182494da1537)
- Deployment transaction: [`0x6db3a02e7d986d20a337742632527b4100a8f2b92c1b548fc9fefd815111a322`](https://testnet.arcscan.app/tx/0x6db3a02e7d986d20a337742632527b4100a8f2b92c1b548fc9fefd815111a322)
- Deployment block: `61892392`
- Merchant: `0x620f495e239298490bE0117B4d0e836F71536B2b`
- Arc USDC: `0x3600000000000000000000000000000000000000`
- Product 1: `49 USDC` / `49000000` base units
- Transferable: `true`
- Cancel window: `900 seconds`
- Refund window: `900 seconds`

## Verified Arc lifecycle evidence

A real Arc Testnet lifecycle completed successfully for order `1`:

- Buyer: `0x585BF3aCe247892Ac5f70cE5c8c16bD2f5C89047`
- Approval transaction: [`0x714c94255df962e756b8b0f67266cf0de3f576d1e048963a1ba131051d09a9b9`](https://testnet.arcscan.app/tx/0x714c94255df962e756b8b0f67266cf0de3f576d1e048963a1ba131051d09a9b9)
- Purchase transaction: [`0x573690792e4b2245047e0105d184e61d792462b177031cb97076172af39200f7`](https://testnet.arcscan.app/tx/0x573690792e4b2245047e0105d184e61d792462b177031cb97076172af39200f7)
- Cancel transaction: [`0x35e97f6888d76b65fcc17b752825b8b30cac88f55a447bf232570a7f89b2de9`](https://testnet.arcscan.app/tx/0x35e97f6888d76b65fcc17b752825b8b30cac88f55a447bf232570a7f89b2de9)
- Confirmed state transition: `PAID → CANCELLED`
- Buyer USDC: `50000000` before, `994065` after purchase, `49992537` after cancel
- Escrow USDC: `49000000` after purchase, `0` after cancel
- GitHub Actions evidence: [run 34758209101](https://github.com/ShivamSoni20/Reclaim/actions/runs/34758209101)

The final buyer balance is lower than the initial balance because Arc charges gas in USDC. The escrow returned the exact `49000000` purchase amount.

## Links pending ENS evidence

- Receipt parent and sample receipt: pending controlled ENSv2 parent
- Repository: https://github.com/ShivamSoni20/Reclaim
- Live app: pending deployment credentials
- Demo video: pending recording

## Challenges and learning

The main architectural challenge is safely synchronizing two chains without treating mirrored ENS metadata as financial truth. Reclaim resolves this by always re-reading Arc server-side before ENS writes and client-side before rendering executable actions.

## Future work

Standardize the capability manifest across wallets and commerce platforms.
