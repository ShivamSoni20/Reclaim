# Executable Receipts

### An onchain receipt that can cancel, refund, transfer, or dispute the purchase it represents.

**Hackathon:** ETHOnline 2026  
**Primary tracks:** ENSv2 + Arc DeFi / Onchain Finance  
**MVP:** Consumer checkout + Arc USDC escrow + ENSv2 executable receipt  
**Core tagline:** **Your receipt is also the remote control for your purchase.**

---

# 1. Product Vision

Traditional receipts are passive.

They prove that a transaction happened, but once issued they do almost nothing.

The customer still needs to:

- visit the merchant's website;
- find an order page;
- contact support;
- locate a refund form;
- find a transfer mechanism;
- trust the merchant's internal database.

Executable Receipts turn the receipt itself into the control surface for the transaction.

After purchasing something with USDC on Arc, the customer receives a human-readable ENSv2 receipt such as:

`order-128.shop.alice.eth`

Opening the receipt reveals its current state and the actions the holder is authorized to perform.

Example:

```text
order-128.shop.alice.eth

Status             PAID
Amount             49 USDC
Merchant           shop.alice.eth
Settlement         Arc
Refund before      18:00 UTC

Available actions

[ Cancel Order ]
[ Transfer Claim ]
[ Request Refund ]
```

The receipt therefore becomes simultaneously:

1. proof of purchase;
2. purchase identity;
3. capability directory;
4. permission object;
5. order lifecycle interface.

---

# 2. Core Product Thesis

> Commerce should not require consumers to rediscover the application that created their transaction.

A portable receipt should tell the user:

**What happened?**

49 USDC was paid.

**Where is the money?**

Arc escrow contract.

**Who owns the claim?**

The current receipt holder.

**What can I do?**

Cancel, transfer, refund, dispute, or nothing depending on current state.

**Until when?**

The receipt contains the applicable expiry/deadline.

The important innovation is not merely putting receipts onchain.

The innovation is making **commercial rights discoverable and actionable through the receipt itself.**

---

# 3. Hackathon Fit

## ENSv2

ENSv2 is load-bearing rather than decorative.

Each purchase becomes a hierarchical ENSv2 subname:

```text
alice.eth
└── shop.alice.eth
    └── order-128.shop.alice.eth
```

The system uses:

- hierarchical registries;
- ENSv2 subnames;
- Permissioned Resolver;
- Enhanced Access Control;
- per-record permissions;
- expiry;
- transferable/non-transferable receipt ownership;
- lifecycle records;
- dynamic resolver updates.

ENSv2 supports hierarchical registries and granular Enhanced Access Control, including per-name and per-record permissions.

## Arc

Arc handles the financial transaction.

The system uses:

- Arc Testnet;
- USDC;
- conditional escrow;
- refund windows;
- settlement;
- cancel/refund flows;
- claim transfer;
- programmable payment state.

Arc's ETHOnline bounty specifically calls for meaningful Arc/USDC usage and programmable money flows including conditional payments and multi-step settlement.

---

# 4. Architecture Principle

The architecture must distinguish between:

### Financial truth

Stored in the **Arc smart contract**.

Examples:

```text
buyer
merchant
amount
status
refund deadline
claim owner
escrow balance
```

### Receipt/capability representation

Stored through **ENSv2 on Sepolia**.

Examples:

```text
receipt.status
receipt.amount
receipt.currency
receipt.chain
receipt.contract
receipt.orderId
receipt.refundBefore
receipt.transferable
receipt.actions
```

The ENS status is a synchronized representation.

The Arc contract remains the canonical source of truth for money.

This matters because ENSv2 is currently a Sepolia beta while Arc executes on its own chain.

---

# 5. Primary User

## Customer

Someone buying an item or service with USDC.

They want to:

- see their purchase;
- know whether funds are settled;
- cancel before fulfilment;
- request a refund;
- transfer the pickup/claim right;
- prove ownership without merchant-specific credentials.

## Merchant

A merchant selling through Executable Receipts.

They want:

- guaranteed onchain payment;
- programmable settlement;
- fewer support requests;
- verifiable claim ownership;
- explicit lifecycle rules.

---

# 6. MVP Demo Scenario

The demo storefront sells one product.

### Product

**Arc One — Limited Edition Hardware Wallet Case**

Price:

**49 USDC**

Rules:

```text
Cancel period:       15 minutes
Refund request:      available before settlement
Claim transferable:  yes
Settlement:          after refund/cancel window
Network:             Arc
```

The actual product is irrelevant. It simply needs to make transferable pickup/claim rights understandable.

---

# 7. Golden User Flow

## Step 1 — Connect

Customer opens the storefront.

They connect an EVM wallet.

App detects whether Arc Testnet is configured.

If necessary:

`Switch to Arc`

---

## Step 2 — Purchase

Customer sees:

```text
Arc One
49 USDC

Your payment will remain in programmable escrow
until the settlement window closes.

[ Pay 49 USDC ]
```

The application calls the USDC ERC-20 interface on Arc.

For implementation consistency, use Arc's USDC ERC-20 interface rather than mixing the native 18-decimal representation with the 6-decimal ERC-20 representation. The documented Arc Testnet USDC address is:

`0x3600000000000000000000000000000000000000`

---

# 8. Order Creation

The Arc escrow contract creates:

```solidity
Order {
    uint256 id;
    address buyer;
    address merchant;
    address claimOwner;
    uint256 amount;
    uint64 createdAt;
    uint64 cancelBefore;
    uint64 refundBefore;
    OrderStatus status;
    bool transferable;
}
```

Initial state:

```text
status = PAID
claimOwner = buyer
amount = 49 USDC
```

Funds remain inside the escrow contract.

---

# 9. Receipt Creation

After the Arc purchase succeeds, the application creates an ENSv2 subname:

```text
order-128.shop.alice.eth
```

Receipt expiry can correspond to:

```text
order completion + archive period
```

The application's ENS synchronizer writes receipt metadata.

Example resolver records:

```text
receipt.version         = 1
receipt.type            = commerce
receipt.status          = paid
receipt.amount          = 49
receipt.currency        = USDC

receipt.chain           = arc
receipt.chainId         = 5042002
receipt.contract        = 0xESCROW...
receipt.orderId         = 128

receipt.merchant        = shop.alice.eth
receipt.createdAt       = 2026-09-12T...
receipt.cancelBefore    = ...
receipt.refundBefore    = ...

receipt.transferable    = true

receipt.action.cancel   = available
receipt.action.transfer = available
receipt.action.refund   = available
receipt.action.dispute  = unavailable
```

The frontend **must not hard-code the action availability for a receipt**.

It resolves the receipt and combines:

1. ENS capability records;
2. Arc contract state;
3. wallet identity;

to determine what controls to show.

---

# 10. Why ENS Is Necessary

Without ENS, the project becomes merely:

> an Arc escrow contract with an order dashboard.

That is not the product.

ENS creates the portable capability layer.

Anyone capable of resolving:

`order-128.shop.alice.eth`

can discover:

- what purchase it represents;
- where it settles;
- what contract controls it;
- who controls relevant records;
- what rights are available;
- when those rights expire.

The application should visibly demonstrate resolver reads during the hackathon demo.

---

# 11. ENSv2 Permission Model

Use a **managed subname registry** under the merchant namespace.

Example:

```text
shop.alice.eth
```

The merchant/application operates the order registry.

Receipt:

```text
order-128.shop.alice.eth
```

### Merchant-controlled records

Merchant or synchronizer controls:

```text
receipt.status
receipt.amount
receipt.contract
receipt.orderId
receipt.refundBefore
receipt.cancelBefore
receipt.actions
```

The customer must not be able to arbitrarily change these records.

### Customer permissions

Customer receives ownership/control appropriate for the receipt.

For transferable products:

grant receipt transfer capability.

For non-transferable products:

withhold transfer capability.

ENSv2's registry role configuration allows different transfer and management policies to be assigned during registration.

### Demonstration of Enhanced Access Control

Make this visible in the UI:

```text
Permissions

Customer
✓ Transfer claim
✓ Read receipt
✕ Change payment status
✕ Change amount

Merchant
✓ Update lifecycle
✓ Finalize settlement metadata
```

This will make the ENS integration much easier for judges to understand.

---

# 12. Arc Smart Contract

Contract:

`ExecutableReceiptEscrow.sol`

Use Solidity + Foundry.

## State

```solidity
enum OrderStatus {
    NONE,
    PAID,
    REFUND_REQUESTED,
    CANCELLED,
    REFUNDED,
    FINALIZED,
    DISPUTED
}
```

## Required functions

```solidity
purchase(
    uint256 productId
)
```

Transfers USDC from the buyer into escrow.

Creates order.

---

```solidity
cancel(
    uint256 orderId
)
```

Requirements:

```text
caller == buyer or claimOwner
status == PAID
block.timestamp < cancelBefore
```

Effects:

```text
status → CANCELLED
USDC → buyer
```

---

```solidity
requestRefund(
    uint256 orderId
)
```

Requirements:

```text
caller == claimOwner
status == PAID
before refund deadline
```

Effects:

```text
status → REFUND_REQUESTED
```

---

```solidity
approveRefund(
    uint256 orderId
)
```

Merchant approves.

Effects:

```text
status → REFUNDED
USDC → original payer
```

---

```solidity
transferClaim(
    uint256 orderId,
    address newOwner
)
```

Requirements:

```text
caller == claimOwner
transferable == true
status allows transfer
```

Effects:

```text
claimOwner → newOwner
```

---

```solidity
finalize(
    uint256 orderId
)
```

Requirements:

```text
refund window expired
status == PAID
```

Effects:

```text
status → FINALIZED
USDC → merchant
```

---

```solidity
getOrder(
    uint256 orderId
)
```

Returns complete order state.

---

```solidity
getAvailableActions(
    uint256 orderId,
    address actor
)
```

Returns action availability.

Possible representation:

```solidity
uint8 actionBitmap;
```

Example:

```text
bit 0 = cancel
bit 1 = transfer
bit 2 = refund
bit 3 = dispute
```

---

# 13. Contract Events

Emit:

```solidity
event OrderCreated(...)
event OrderCancelled(...)
event RefundRequested(...)
event RefundApproved(...)
event ClaimTransferred(...)
event OrderFinalized(...)
event DisputeOpened(...)
```

The ENS synchronizer listens to these events.

---

# 14. ENS Synchronizer

Create a lightweight TypeScript service.

Purpose:

```text
Arc event
    ↓
read authoritative order
    ↓
derive capability state
    ↓
update ENSv2 resolver
```

Example:

```text
OrderCancelled(128)
       ↓
receipt.status = cancelled
receipt.action.cancel = unavailable
receipt.action.refund = unavailable
receipt.action.transfer = unavailable
```

For the hackathon MVP, this does not need distributed infrastructure.

Implement it either as:

- Next.js server route invoked after successful transactions; or
- lightweight Node event watcher.

After an action completes, also refetch Arc state directly before writing ENS.

---

# 15. Cross-Chain State UX

Because the payment and receipt exist on different networks, expose synchronization instead of hiding it.

Receipt UI:

```text
Settlement
● Arc verified

Receipt
● ENS synced
```

During an update:

```text
1. Cancelling purchase on Arc...
✓ Payment cancelled

2. Updating executable receipt...
✓ ENS receipt updated
```

This transforms an architectural limitation into a convincing demonstration of composability.

---

# 16. Receipt Action Engine

This should be one of the project's strongest technical features.

When somebody visits:

`/receipt/order-128.shop.alice.eth`

the application:

### 1. Resolves ENS

Retrieve:

```text
chainId
contract
orderId
capability records
```

### 2. Reads Arc

Call:

```text
getOrder(128)
```

### 3. Reads permissions

Determine:

```text
connected wallet
claimOwner
ENS ownership/roles
```

### 4. Computes actions

Example:

```text
status = PAID
claimOwner = connected wallet
cancelBefore > now
transferable = true
```

Render:

```text
Cancel Order
Transfer Claim
Request Refund
```

After cancellation:

```text
status = CANCELLED
```

Render:

```text
No actions available
49 USDC refunded
```

This is the "executable" behavior.

---

# 17. Customer Dashboard

Route:

`/dashboard`

Header:

```text
Executable Receipts

Overview | Receipts | Activity
```

Primary stats:

```text
3 Receipts
98 USDC Active
49 USDC Refunded
1 Transferable Claim
```

Receipt cards:

```text
ARC ONE
order-128.shop.alice.eth

49 USDC
Paid

Refund available for 12m 42s

[ Open Receipt ]
```

Another:

```text
ARC ONE
order-127.shop.alice.eth

49 USDC
Cancelled

Refunded
✓ 49 USDC returned

[ View Receipt ]
```

---

# 18. Receipt Detail Page

This is the hero experience.

URL:

`/receipt/order-128.shop.alice.eth`

Top section:

```text
EXECUTABLE RECEIPT

order-128.shop.alice.eth

● PAID

49.00 USDC
```

Then show a lifecycle:

```text
Purchased ━━━━━●━━━ Settlement
               ↑
              now
```

Information:

```text
Merchant          shop.alice.eth
Settlement        Arc
Claim owner       0x23F...91A
Refund before     Sep 12, 18:00 UTC
```

Then:

## Available actions

Large cards:

```text
Cancel Order
Receive your 49 USDC immediately.
Available for 12m 42s.

[ Cancel Order ]
```

```text
Transfer Claim
Give another wallet the right to collect this purchase.

[ Transfer ]
```

```text
Request Refund
Create an onchain refund request.

[ Request Refund ]
```

At bottom:

```text
Verified infrastructure

Arc settlement
0x34...

ENSv2 receipt
order-128.shop.alice.eth

[ View Arc transaction ]
[ View ENS records ]
```

---

# 19. Transaction Confirmation UX

Do not use generic wallet-only interaction.

Before cancellation:

```text
Cancel purchase?

49 USDC will be returned to:
0x72...41B

This permanently closes this receipt.

[ Keep Order ] [ Cancel & Refund ]
```

Processing:

```text
Cancelling order

✓ Arc transaction confirmed
  Refund: 49 USDC

● Updating ENS receipt
```

Success:

```text
Order cancelled

49 USDC returned.

Your executable receipt has been updated.

order-128.shop.alice.eth

[ View Receipt ]
```

---

# 20. Landing Page

The landing page should sell the conceptual breakthrough before explaining infrastructure.

## Hero

Small badge:

`Built with ENSv2 × Arc`

Headline:

# Receipts should do more than prove you paid.

Subheadline:

**Executable Receipts turn every purchase receipt into a portable control surface for cancellations, refunds, transfers and disputes.**

Primary CTA:

`Try the Demo`

Secondary:

`See How It Works`

Hero visual:

A beautiful digital receipt floating beside action controls:

```text
order-128.shop.alice.eth

49.00 USDC

PAID

Cancel
Transfer
Refund
```

---

# 21. Landing Page — Problem

Headline:

## Today's receipts are dead documents.

Visual progression:

```text
Traditional receipt

✓ Proof
✕ Rights
✕ Actions
✕ Portability


Executable receipt

✓ Proof
✓ Rights
✓ Actions
✓ Portability
```

---

# 22. Landing Page — How It Works

Three large steps.

### 01 PAY

Purchase with USDC on Arc.

### 02 RECEIVE

Receive a portable ENSv2 order identity.

### 03 EXECUTE

Cancel, refund or transfer directly from the receipt.

Architecture graphic:

```text
Customer
   │
   ▼
49 USDC
   │
   ▼
Arc Escrow
   │
   ├──────────── Settlement
   │
   ▼
ENSv2 Receipt
   │
   ▼
order-128.shop.alice.eth
   │
   ├── Cancel
   ├── Transfer
   ├── Refund
   └── Dispute
```

---

# 23. MVP Scope

## P0 — Must ship

Build only:

- one merchant;
- one product;
- wallet connection;
- 49 USDC checkout;
- Arc escrow;
- purchase;
- cancellation;
- automatic refund;
- finalization;
- claim transfer;
- ENSv2 receipt generation;
- ENS resolver records;
- receipt detail page;
- customer dashboard;
- live state updates;
- Arc Explorer links;
- ENS permission visualization.

## P1 — Strong addition

If core functionality works:

- refund request;
- merchant refund approval;
- receipt transfer;
- activity history;
- merchant console;
- transaction animations;
- resolver inspection panel.

## P2 — Do not block submission

Stretch:

- disputes;
- arbitrator;
- physical QR receipts;
- email receipts;
- CCTP;
- multi-merchant onboarding;
- SDK;
- receipt wallet integration;
- mobile app;
- AI.

Do **not** add AI unless the complete commerce flow already works.

The novelty is executable commerce rights, not AI.

---

# 24. Technical Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
wagmi
viem
TanStack Query
```

## Arc

```text
Solidity
Foundry
OpenZeppelin
Arc Testnet
USDC ERC-20 interface
```

Arc Testnet:

```text
Chain ID: 5042002
USDC: 0x3600000000000000000000000000000000000000
```

## ENS

```text
ENSv2 Sepolia
Permissioned Registry
Permissioned Resolver
Enhanced Access Control
Universal Resolver
```

ENSv2's current documented deployment is Sepolia beta.

## Backend

Keep backend minimal:

```text
Next.js server functions
+
Arc → ENS synchronization worker
```

A traditional database is optional.

For the hackathon, blockchain state should drive the demo.

---

# 25. Repository Structure

```text
executable-receipts/

apps/
  web/
    app/
      page.tsx
      shop/
      dashboard/
      receipt/[name]/
    components/
    hooks/
    lib/
      arc/
      ens/
      receipts/

contracts/
  src/
    ExecutableReceiptEscrow.sol
  test/
    ExecutableReceiptEscrow.t.sol
  script/
    Deploy.s.sol

services/
  receipt-sync/
    src/
      watcher.ts
      deriveCapabilities.ts
      updateResolver.ts

packages/
  shared/
    receipt-schema.ts
    chains.ts
    abi.ts

docs/
  architecture.md
  ens-permissions.md
  demo-script.md
```

---

# 26. Core Tests

### Purchase

Verify:

```text
buyer balance decreases by 49 USDC
escrow increases by 49 USDC
order status = PAID
claimOwner = buyer
```

### Cancel

Verify:

```text
only authorized holder can cancel
cannot cancel after deadline
status becomes CANCELLED
49 USDC returned
merchant receives nothing
```

### Double cancellation

Must revert.

### Finalize

Verify:

```text
cannot finalize before deadline
can finalize afterward
funds sent to merchant
status = FINALIZED
```

### Transfer

Verify:

```text
only claimOwner can transfer
new claim owner receives rights
old claim owner loses rights
non-transferable orders reject transfer
```

### Refund

Verify:

```text
request only during eligible state
merchant approval returns funds
refund cannot occur twice
```

---

# 27. Security Requirements

Use:

- checks-effects-interactions;
- `ReentrancyGuard`;
- explicit access control;
- safe ERC-20 transfers;
- order-specific authorization;
- deadline validation;
- state-machine validation.

Never trust resolver metadata to move money.

Before every financial operation, the Arc contract independently checks:

```text
msg.sender
order state
deadline
claim ownership
```

ENS metadata tells applications what capabilities exist.

Arc enforces financial consequences.

---

# 28. Critical Arc USDC Detail

Arc exposes the same underlying USDC balance through native and ERC-20 interfaces, but they have different precision conventions.

For application payment logic, use the ERC-20 interface with **6 decimals** consistently. Arc's documentation explicitly recommends relying on the ERC-20 interface for application balances and transfers to avoid decimal handling mistakes.

---

# 29. No Hard-Coded Demo Data

This is important for ENS judging.

The receipt page must actually:

```text
resolve ENS
↓
read resolver values
↓
read Arc contract
↓
derive controls
```

Do not create:

```javascript
const receipt = {
  status: "paid",
  amount: 49,
};
```

for the judge-facing flow.

The ENS bounty specifically requires a functional demo rather than hard-coded ENS behavior.

---

# 30. Architecture Diagram

```text
                         ┌───────────────────────┐
                         │       Customer        │
                         │       EVM Wallet      │
                         └───────────┬───────────┘
                                     │
                              Pay 49 USDC
                                     │
                                     ▼
                     ┌───────────────────────────┐
                     │          ARC              │
                     │                           │
                     │ ExecutableReceiptEscrow   │
                     │                           │
                     │ orderId: 128              │
                     │ amount: 49 USDC           │
                     │ state: PAID               │
                     │ claimOwner: Alice         │
                     └─────────────┬─────────────┘
                                   │
                              Order event
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Receipt Synchronizer    │
                     └─────────────┬─────────────┘
                                   │
                              update records
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │      ENSv2 / Sepolia      │
                     │                           │
                     │ order-128.shop.alice.eth  │
                     │                           │
                     │ status = paid             │
                     │ amount = 49               │
                     │ contract = 0x...          │
                     │ orderId = 128             │
                     │ cancel = available        │
                     └─────────────┬─────────────┘
                                   │
                                resolve
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │    Receipt Interface      │
                     │                           │
                     │ [ Cancel ]                │
                     │ [ Transfer ]              │
                     │ [ Refund ]                │
                     └─────────────┬─────────────┘
                                   │
                              Arc transaction
                                   │
                                   └──────► Escrow
```

---

# 31. Judge Demo

Keep the core demonstration extremely short.

### Scene 1

Show storefront.

Say:

> “Receipts today are passive proof. We made them executable.”

### Scene 2

Buy product.

```text
49 USDC → Arc escrow
```

### Scene 3

Show generated receipt:

`order-128.shop.alice.eth`

Explain:

> “The purchase now has a portable ENSv2 identity.”

### Scene 4

Open receipt.

Show resolver-backed:

```text
PAID
49 USDC
Cancel
Transfer
Refund
```

### Scene 5

Open the technical drawer and briefly show:

```text
Arc Contract
Order #128
ENS Resolver
Customer permissions
```

### Scene 6

Click:

`Cancel Order`

Wallet signs Arc transaction.

### Scene 7

Show:

```text
Arc status
PAID → CANCELLED

49 USDC
REFUNDED
```

### Scene 8

Resolver synchronizes.

The screen changes to:

```text
CANCELLED

49 USDC returned

No actions available.
```

Final line:

> **“Your receipt isn't evidence of what you bought. It's the interface to what you bought.”**

---

# 32. Submission Positioning

Do not describe this as:

> “NFT receipts.”

Do not describe it as:

> “ENS receipts.”

Do not describe it as:

> “an escrow dApp.”

Position it as:

> **A portable capability layer for commerce.**

The receipt exposes limited commercial rights that survive outside the merchant application.

Today:

```text
receipt → proof
```

Executable Receipts:

```text
receipt → proof + identity + rights + actions
```

---

# 33. Success Criteria

The hackathon MVP succeeds when a judge can independently observe:

1. 49 USDC leave the customer wallet on Arc.
2. Funds remain in an actual escrow smart contract.
3. An ENSv2 receipt is generated dynamically.
4. Resolver records contain actual purchase data.
5. The connected holder has explicit ENSv2 permissions.
6. Receipt controls are generated from real state.
7. Cancel performs an actual Arc transaction.
8. 49 USDC returns to the customer.
9. Arc state changes to `CANCELLED`.
10. ENS receipt changes to `cancelled`.
11. Previously available capabilities disappear.

If these eleven steps work reliably, **stop adding features and polish the demo.**

---

# 34. Future Vision

Executable Receipts could eventually become a commerce primitive used by:

- ecommerce;
- event tickets;
- reservations;
- warranties;
- subscriptions;
- marketplace orders;
- deposits;
- rental agreements;
- digital goods;
- physical pickup rights.

A wallet could recognize an executable receipt without knowing which merchant created it.

Imagine opening a wallet and seeing:

```text
Your Purchases

Apple
Return available · 8 days

Airbnb
Transfer guest · available

ETHGlobal
Ticket transfer · available

Amazon
Refund requested
```

The customer would no longer need a different order-management system for every merchant.

That is the larger thesis:

> **Standardize the rights attached to commerce, not merely the payment.**
