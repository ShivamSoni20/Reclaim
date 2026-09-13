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

## Links pending lifecycle evidence

- Purchase/cancel/transfer transactions: pending real lifecycle test
- Receipt parent and sample receipt: pending controlled ENSv2 parent
- Repository: https://github.com/ShivamSoni20/Reclaim
- Live app: pending deployment credentials
- Demo video: pending recording

## Challenges and learning

The main architectural challenge is safely synchronizing two chains without treating mirrored ENS metadata as financial truth. Reclaim resolves this by always re-reading Arc server-side before ENS writes and client-side before rendering executable actions.

## Future work

Standardize the capability manifest across wallets and commerce platforms.
