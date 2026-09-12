# Executable Receipts

Design and build a premium, production-quality web3 application called Executable Receipts.

The product idea is:

“Your receipt is also the remote control for your purchase.”

Executable Receipts turns passive purchase receipts into interactive, permissioned objects.

After someone purchases something using USDC on Arc, they receive a human-readable ENSv2 receipt such as:

order-128.shop.alice.eth

The receipt displays the purchase state and allows authorized actions such as:

Cancel Order

Transfer Claim

Request Refund

Open Dispute

The UI must make this concept instantly understandable even to someone who knows very little about crypto.

Do NOT create a stereotypical dark crypto dashboard.

Create a sophisticated, highly polished light-mode financial/product interface inspired by the quality level of Stripe, Linear, Vercel, Mercury, Apple Wallet and modern fintech applications.

VISUAL DIRECTION

Use a clean light palette.

Primary background:

#F8FAFC

Main surface:

#FFFFFF

Alternative soft surface:

#F1F5F9

Primary text:

#0F172A

Secondary text:

#64748B

Borders:

#E2E8F0

Primary brand accent:

soft electric indigo / violet

Examples:

#635BFF
#7C6CFF

Success:

soft emerald

Warning:

warm amber

Danger:

muted coral/red

Avoid excessive gradients.

Use gradients only for subtle atmospheric backgrounds, receipt glows or hero illustrations.

The visual character should be:

premium;

minimal;

futuristic without being sci-fi;

financial;

trustworthy;

spacious;

refined;

slightly playful around the receipt metaphor.

Use generous whitespace.

Use large typography.

Use rounded corners around 14–20px.

Use extremely subtle shadows.

Use thin neutral borders.

Do not overload screens with cards.

Do not create glassmorphism everywhere.

Do not use neon cyberpunk aesthetics.

TYPOGRAPHY

Use:

Inter, Geist, or similarly clean sans-serif typography.

Hero headline:

64–76px desktop.

Strong tight tracking.

Dashboard headings:

28–36px.

Body:

15–17px.

Receipt values should occasionally use a mono font for:

ENS names;

wallet addresses;

transaction hashes;

contract addresses.

GLOBAL NAVIGATION

Desktop header:

Left:

Executable Receipts logo.

Design a simple logo consisting of a receipt-shaped outline with a small lightning/capability symbol.

Middle:

How it Works
Technology
Demo

Right:

GitHub

and primary CTA:

Launch App

Header should initially float over the page with lots of whitespace and become lightly bordered when scrolling.

LANDING PAGE

Create an impressive landing page with the following sections.

HERO

Add a small pill:

Built with ENSv2 × Arc

Large headline:

Receipts should do more than prove you paid.

Emphasize “do more” subtly with brand accent.

Supporting text:

Executable Receipts turn every purchase into a portable control surface for cancellations, refunds, transfers and disputes.

CTA buttons:

Primary:

Try the Demo

Secondary:

See How It Works

Under the text show small trust indicators:

USDC Settlement

Permissioned by ENSv2

Onchain on Arc

HERO VISUAL

This is extremely important.

On the right side of the hero, create a large floating digital receipt.

The receipt should look like a hybrid between an Apple Wallet pass, Stripe payment receipt and blockchain capability card.

Receipt:

EXECUTABLE RECEIPT

order-128.shop.alice.eth

Status pill:

● PAID

Product:

Arc One

Amount:

49.00 USDC

Merchant:

shop.alice.eth

Refund available:

12m 42s

Then three small capability buttons:

Cancel

Transfer

Refund

Below them:

Settlement verified on Arc

Use a tiny green verification indicator.

Behind the receipt add extremely subtle circular lines or connection paths suggesting that the receipt connects ENS identity to Arc settlement.

Do not make this look like a crypto trading card.

It should look like the next generation of a familiar digital receipt.

INTERACTIVE HERO BEHAVIOR

When the user hovers over the receipt:

lift it by 4–6 pixels;

increase shadow slightly;

softly illuminate the active capability buttons.

Optionally animate a small line:

Payment → Receipt → Capability

Do not create excessive motion.

PROBLEM SECTION

Headline:

Today's receipts are dead documents.

Subheading:

A receipt tells you what happened, but not what you can do next.

Create a beautiful before/after comparison.

LEFT:

Traditional Receipt

Proof ✓
Portable rights ×
Actions ×
Transferability ×

RIGHT:

Executable Receipt

Proof ✓
Portable rights ✓
Actions ✓
Transferability ✓

The Executable Receipt side should subtly feel alive and interactive.

HOW IT WORKS

Headline:

One purchase. One portable control surface.

Use three horizontally arranged steps.

01 — Pay

Icon: minimal USDC/payment symbol.

Text:

Pay with USDC on Arc. Funds enter programmable escrow.

02 — Receive

Icon: ENS/name symbol.

Text:

Receive a human-readable ENSv2 receipt for the purchase.

Example:

order-128.shop.alice.eth

03 — Execute

Icon: lightning/action symbol.

Text:

Use your receipt to cancel, transfer, refund or dispute.

Connect the three stages with a thin animated line.

INTERACTIVE ARCHITECTURE SECTION

Create an elegant architecture visualization.

Customer

↓

49 USDC

↓

Arc Escrow

↓

ENSv2 Receipt

↓

Available Rights

Branch into:

Cancel
Transfer
Refund
Dispute

Keep the diagram visually simple and understandable.

Allow users to hover over:

Arc Escrow

and display:

Financial source of truth

Hover over:

ENSv2 Receipt

and display:

Portable identity + permissions + capabilities

PORTABLE RIGHTS SECTION

Headline:

The purchase can leave the merchant's app.

Explain that a user only needs the receipt name.

Show a large ENS search input:

order-128.shop.alice.eth

Button:

Resolve Receipt

Show an animated resolution result underneath:

Merchant
Amount
Network
Status
Claim Owner
Available Actions

This should visually demonstrate why ENS matters.

DEMO PRODUCT SECTION

Add a compact storefront demonstration.

Product card:

Arc One

Limited Edition Hardware Wallet Case

Price:

49 USDC

Small labels:

Refundable

Transferable Claim

Arc Settlement

CTA:

Buy with 49 USDC

Include high-quality abstract product imagery rather than generic crypto artwork.

DASHBOARD

Create /dashboard.

Dashboard should feel like a modern fintech wallet, not an admin panel.

Desktop structure:

Top navigation.

Main page max width approximately 1280px.

Header:

Your Receipts

Subheading:

Every purchase you own and every right still available.

Right side:

wallet chip:

0x72A4...91B2

network:

Arc

DASHBOARD METRICS

Create four minimal metric blocks in one row:

3
Receipts

98 USDC
Active value

49 USDC
Refunded

1
Transferable claim

Do not give every metric a giant bordered card.

Use subtle separators and whitespace.

RECEIPT FILTERS

Search input:

Search receipt or merchant

Filters:

All
Active
Refundable
Transferred
Completed

Use clean segmented controls.

ACTIVE RECEIPT

Create a large premium receipt card.

Top:

ARC ONE

Status:

● PAID

ENS name:

order-128.shop.alice.eth

Amount:

49.00 USDC

Metadata:

Purchased 3 minutes ago

Merchant:

shop.alice.eth

Progress/lifecycle:

Purchased ●──────────── Settlement

Show:

Refund window closes in 12m 42s

Actions:

Primary:

Open Receipt

Small secondary capability indicators:

Cancel available

Transfer available

Refund available

CANCELLED RECEIPT

Second receipt:

order-127.shop.alice.eth

Status:

CANCELLED

Amount:

49 USDC

Use subdued styling.

Display:

✓ 49 USDC refunded

CTA:

View Receipt

RECEIPT DETAIL EXPERIENCE

When user opens the active receipt, show either a dedicated page or large dashboard panel.

Header:

EXECUTABLE RECEIPT

order-128.shop.alice.eth

Copy icon beside ENS name.

Status:

● PAID

Large amount:

49.00 USDC

Small text:

Held in programmable settlement on Arc.

RECEIPT LIFECYCLE

Show an elegant horizontal lifecycle:

Purchase

●

↓

Current state

then later:

Settlement

Include a live countdown:

Settlement in 12:42

RECEIPT INFORMATION

Use a structured two-column data section:

Merchant

shop.alice.eth

Claim Owner

0x72A4...91B2

Settlement Network

Arc

Order

#128

Refund Before

Sep 12 · 18:00 UTC

Transferable

Yes

AVAILABLE ACTIONS

This should be the visual centerpiece.

Heading:

Available actions

Supporting text:

These rights are attached to this receipt and change automatically with its lifecycle.

Create three premium horizontal action cards.

CANCEL ORDER

Icon: × inside subtle circle.

Description:

Cancel before settlement and receive your full 49 USDC.

Secondary:

Available for 12m 42s.

Button:

Cancel Order

Use muted red only on hover or confirmation.

TRANSFER CLAIM

Icon: directional arrows.

Description:

Give another wallet the right to collect or receive this purchase.

Button:

Transfer Claim

REQUEST REFUND

Icon: reverse arrow / USDC symbol.

Description:

Create an onchain request to return the purchase amount.

Button:

Request Refund

PERMISSIONS PANEL

Create a collapsible panel:

Receipt Permissions

When expanded:

Customer

✓ View receipt
✓ Transfer claim
✓ Request refund
× Change amount
× Change settlement state

Merchant

✓ Update lifecycle
✓ Finalize settlement

At bottom:

Powered by ENSv2 Enhanced Access Control

This panel should make the sponsor integration obvious without polluting the consumer experience.

INFRASTRUCTURE PANEL

Add a compact:

Verified Infrastructure

section.

Two rows.

Arc

Settlement contract

0x85d...Ae91

status:

● Verified

Link:

View on Arc Explorer ↗

ENSv2

Receipt

order-128.shop.alice.eth

status:

● Resolved

Link:

Inspect resolver ↗

CANCEL FLOW

Clicking Cancel Order should open a beautiful confirmation modal.

Headline:

Cancel this purchase?

Body:

Your purchase will be cancelled and 49 USDC will be returned to:

0x72A4...91B2

Information block:

Amount returned
49 USDC

Receipt
order-128.shop.alice.eth

Buttons:

Keep Order

and primary/destructive:

Cancel & Refund

Do not use alarming bright-red styling.

Use calm fintech confirmation UX.

TRANSACTION PROGRESS

After confirmation show a centered transaction state panel.

Heading:

Cancelling order

Timeline:

● Submitting transaction to Arc

then:

✓ Arc transaction confirmed

Subtext:

49 USDC refund executed

then:

● Updating executable receipt

then:

✓ ENS receipt synchronized

Use subtle animated transitions.

SUCCESS STATE

Replace the receipt status dynamically.

Status:

CANCELLED

Display a prominent positive state:

✓ 49 USDC returned

Subtext:

The payment has been refunded and the receipt's purchase rights are now closed.

ENS:

order-128.shop.alice.eth

Available Actions:

No actions available

Show previous actions disabled or remove them entirely.

Below:

View Arc transaction ↗

Inspect updated ENS receipt ↗

TRANSFER FLOW

When clicking Transfer Claim:

Modal:

Transfer purchase claim

Input:

Wallet address or ENS name

Example:

bob.eth or 0x...

Explain:

The recipient will become the new holder of the pickup/purchase claim.

Show:

Current holder

→

New holder

CTA:

Transfer Claim

After success visually update Claim Owner.

RESPONSIVE DESIGN

Desktop should feel highly cinematic and spacious.

Tablet should maintain receipt visual hierarchy.

Mobile should resemble a premium wallet application.

On mobile:

receipt actions become full-width;

metrics become horizontally scrollable or 2×2;

receipt data becomes one-column;

navigation becomes compact;

primary actions remain thumb-friendly.

MICROINTERACTIONS

Use Framer Motion or equivalent for:

receipt card lift;

lifecycle state changes;

transaction progress;

number/value transitions;

subtle capability appearance/disappearance;

success confirmation;

modal transitions.

Motion should remain under approximately 300ms for most UI events.

No unnecessary bouncing.

EMPTY STATES

If no receipts exist:

Illustration of a minimal blank digital receipt.

Headline:

No executable receipts yet.

Text:

Your programmable purchase rights will appear here.

CTA:

Make Demo Purchase

LOADING STATES

Never show generic spinners everywhere.

Use skeletons for receipt content.

For blockchain operations show explicit stages:

Connecting wallet

Reading ENS receipt

Reading Arc settlement

Preparing transaction

Waiting for confirmation

Synchronizing receipt

ERROR STATES

Use human-readable errors.

For wrong network:

Switch to Arc to continue

For an expired cancellation:

The cancellation window has closed.

For unauthorized wallet:

This wallet does not hold the cancellation right.

For synchronization delays:

Payment updated. Receipt synchronization is still in progress.

Never expose raw RPC errors as the primary user message.

WEB3 UX REQUIREMENTS

Hide unnecessary blockchain complexity.

A normal user should mainly see:

purchase;

receipt;

amount;

rights;

action;

confirmation.

Put technical information inside expandable:

View onchain details

sections.

Do not force the user to understand:

RPCs;

chain IDs;

resolver contracts;

calldata;

transaction internals.

These should remain available for technical judges.

TECHNICAL FRONTEND REQUIREMENTS

Use:

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
wagmi
viem

Build reusable components:

ExecutableReceipt

ReceiptStatus

ReceiptActions

ReceiptLifecycle

ReceiptPermissions

ReceiptInfrastructure

TransactionProgress

WalletButton

UsdcAmount

EnsName

Use accessible semantic HTML.

Maintain WCAG-friendly contrast.

Use keyboard-accessible dialogs.

Create proper hover/focus/pressed states.

DEMO MODE

The app should support a judge-friendly sequence:

Visit landing page.

Click Try Demo.

Open product.

Connect wallet.

Purchase for 49 USDC.

Display transaction success.

Generate order-128.shop.alice.eth.

Redirect to receipt.

Show Cancel / Transfer / Refund.

Open Permission panel.

Cancel.

Show Arc transaction processing.

Show ENS synchronization.

Change receipt from PAID to CANCELLED.

Show 49 USDC refunded.

Remove executable capabilities.

This sequence must feel extremely polished and visually obvious during screen sharing.

FINAL DESIGN PRINCIPLE

The UI should make users think:

“Of course receipts should work like this.”

The design should not sell blockchain.

It should sell control over purchases.

Arc and ENSv2 should appear as trustworthy infrastructure underneath a consumer experience rather than dominating the experience.

The most memorable visual element should always be the live executable receipt itself.

This project was built with [Lovable](https://lovable.dev).

## Working implementation

The repository now includes a real Arc Testnet integration and the Solidity escrow in `contracts/src/ExecutableReceiptEscrow.sol`. Configure the deployed contract to enable live mode; without it, the interface stays in an explicitly labeled preview mode.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for contract deployment, Arc configuration, ENSv2 synchronization requirements and verification commands.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/668fe576-2827-4a75-9b52-e24f744ccfe6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
