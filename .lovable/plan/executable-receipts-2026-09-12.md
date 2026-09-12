# Executable Receipts

A premium, light-mode web app built around one idea: your receipt is also the remote control for your purchase. The receipt detail page is the centerpiece of the product.

## 1. Receipt detail page — the centerpiece

Route: `/receipt/$name`, e.g. `/receipt/order-128.shop.alice.eth`. Highest level of visual and interaction polish in the app.

Contents:

- Header "EXECUTABLE RECEIPT", ENS name in mono with a copy button.
- Lifecycle state pill: PAID / CANCELLED / REFUNDED / FINALIZED.
- Large amount 49.00 USDC, "Held in programmable settlement on Arc."
- Structured two-column information: merchant `shop.alice.eth`, claim owner `0x72A4...91B2`, settlement network Arc, order #128, refund before Sep 12 · 18:00 UTC, transferable yes.
- Live countdown to the cancel/refund deadline ("Settlement in 12:42").
- Horizontal lifecycle timeline: Purchase → current state → Settlement.
- Available Actions section as the visual focus: three horizontal cards — Cancel Order, Transfer Claim, Request Refund — each with icon, plain-language description and state-aware availability.
- Collapsible Receipt Permissions panel (customer vs merchant rights, "Powered by ENSv2 Enhanced Access Control").
- Verified Infrastructure: Arc settlement contract `0x85d...Ae91` ● Verified with explorer link, and ENSv2 receipt ● Resolved with resolver link.
- Expandable "View onchain details" holding chain IDs, resolver, calldata and tx hashes for technical judges.

### Cancel interaction (fully designed demo path)

PAID → Cancel Order → calm confirmation modal ("Cancel this purchase?", amount returned, destination wallet, Keep Order / Cancel & Refund) → transaction progress panel with explicit stages:

```text
● Submitting to Arc
✓ Arc transaction confirmed
✓ 49 USDC refunded
● Updating ENS receipt
✓ ENS receipt synchronized
```

→ success state: status flips to CANCELLED, prominent "✓ 49 USDC returned", executable capabilities disappear ("No actions available"), links to the Arc transaction and the updated ENS receipt.

### Transfer Claim interaction

Modal with wallet address / ENS name input (`bob.eth` or `0x...`), explanation of what the recipient gains, current holder → new holder preview, then the claim owner field updates in place on success.

Dispute stays visible in the architecture diagram as a future capability; no dispute workflow is built for the MVP.

## 2. Landing page (`/`)

Sequence: Hero → Problem → How It Works → Live Executable Receipt → Architecture → Demo Storefront → Final CTA.

- Floating header (transparent, hairline border on scroll): logo (receipt outline + lightning mark), How it Works / Technology / Demo, GitHub, "Launch App".
- Hero: "Built with ENSv2 × Arc" pill, headline "Receipts should do more than prove you paid." with "do more" in brand accent, supporting copy, Try the Demo / See How It Works, trust indicators (USDC Settlement, Permissioned by ENSv2, Onchain on Arc), and the floating receipt card on the right with live countdown, capability buttons, "Settlement verified on Arc" and faint circular connection paths behind it. Hover lifts it 5px, deepens the shadow and illuminates capabilities.
- Problem: "Today's receipts are dead documents." with a before/after comparison; the executable side feels alive.
- How It Works: 01 Pay / 02 Receive / 03 Execute joined by a thin animated line.
- Live Executable Receipt: an interactive section where visitors resolve `order-128.shop.alice.eth` and see merchant, amount, network, status, claim owner and available actions animate in — plus a direct link into the real receipt page.
- Architecture: Customer → 49 USDC → Arc Escrow → ENSv2 Receipt → Cancel / Transfer / Refund / Dispute (Dispute marked "coming soon"), with hover explanations on Arc Escrow and ENSv2 Receipt.
- Demo Storefront: Arc One product card with abstract generated imagery, Refundable / Transferable Claim / Arc Settlement labels, "Buy with 49 USDC".
- Final CTA driving into the demo.

## 3. Demo flow (`/demo`)

Product view → wallet connect → purchase with staged progress → receipt `order-128.shop.alice.eth` generated → redirect straight to the receipt page.

## 4. Dashboard (`/dashboard`)

- "Your Receipts" header with wallet chip `0x72A4...91B2` and Arc network chip.
- Four borderless metrics separated by whitespace: 3 receipts, 98 USDC active value, 49 USDC refunded, 1 transferable claim.
- Search plus segmented filters (All / Active / Refundable / Transferred / Completed).
- Receipt cards styled as premium Apple-Wallet-style passes, not SaaS cards: perforated edge detail, mono ENS name, status pill, lifecycle bar, countdown, and explicit executable-rights chips — Cancel available, Refund available, Transferable. Cancelled receipt (order-127) rendered subdued with "✓ 49 USDC refunded".
- Empty state with blank-receipt illustration and "Make Demo Purchase".

## 5. Design system

- Tokens in `src/styles.css` (oklch): background #F8FAFC, surface #FFFFFF, soft surface #F1F5F9, text #0F172A / #64748B, border #E2E8F0, brand #635BFF with #7C6CFF glow, emerald success, amber warning, muted coral danger.
- Inter for UI, mono face for ENS names, addresses and hashes, loaded via `<link>` in the root route.
- Radii 14–20px, hairline borders, very soft shadows, generous whitespace, hero headline 64–76px.
- Responsive: cinematic desktop, wallet-like mobile with full-width actions and 2×2 metrics.

## 6. Technical notes

- The project runs on TanStack Start (React 19 + TypeScript + Vite), not Next.js — file-based routes under `src/routes`, so the receipt page is `src/routes/receipt.$name.tsx`. Everything else in the requested stack applies: Tailwind v4, shadcn/ui, Framer Motion (`motion`), wagmi + viem types/helpers.
- Reusable components: `ExecutableReceipt`, `ReceiptStatus`, `ReceiptActions`, `ReceiptLifecycle`, `ReceiptPermissions`, `ReceiptInfrastructure`, `TransactionProgress`, `WalletButton`, `UsdcAmount`, `EnsName`.
- Receipt state lives in a typed client-side demo store so the judge sequence (buy → receipt → cancel → refunded → CANCELLED) runs deterministically end to end, with the same interfaces a real Arc/ENSv2 backend would fill. No live contracts are deployed as part of this build.
- Skeletons instead of spinners; explicit blockchain stages; human-readable errors for wrong network, expired cancellation window, unauthorized wallet, and sync delay.
- Accessible: semantic HTML, keyboard-navigable dialogs, visible focus states, WCAG-friendly contrast.
- Per-route `head()` metadata on landing, demo, dashboard and receipt pages.

## Open item

Wallet connection is simulated in demo mode by default (instant and reliable on stage). Say the word if you'd rather wire a real wallet connector against an Arc testnet instead.
