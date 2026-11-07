# How xMarket Uses Arkiv

This document answers the **How You Use Arkiv (25%)** judging criteria for ETHGlobal Mumbai: demonstrating how our indexed filters, ownership controls, and native expiration fit our application, and detailing how every Arkiv feature directly changes what users see in the interface.

---

## 1. Do Filters, Ownership, and Expiration Fit What Our App Does?

### 1. The Fields We Filter On

Every indexed field in our Arkiv schema directly corresponds to a mission-critical workflow in our trading agent pipeline:

* **`status` (`ARMED`, `OPEN`, `SETTLED`, `REVOKED`)**:
  - The Live Monitor microservice polls Arkiv for all intents with `status = str('ARMED')` to determine which Twitter/X handles must be tracked in real-time.
  - The UI uses `status` to partition active trades from completed executions.
* **`targetAsset` (`WETH`, `WBTC`, `SOL`)**:
  - Allows users and autonomous liquidity providers to filter intents by risk exposure and collateral requirements.
* **`targetHandle` (`federalreserve`, `saylor`, `elonmusk`)**:
  - When a tweet arrives from `@saylor`, the agent queries Arkiv for intents indexed under `targetHandle = str('saylor')`. Only matching intents are evaluated by 0G, preventing wasted compute fees.
* **`masterController` (`addr`)**:
  - Allows connected user wallets to securely retrieve all their autonomous agent intents across any browser or device without a centralized backend login.

### 2. Who Can Edit Each Entity

Arkiv's wallet-based ownership model (`$owner`) enforces strict non-custodial boundaries:
* **Creation**: Created by the user's connected wallet or authorized session key during the 3-step wizard.
* **Modification (`patchEntity`)**: Only the user's master wallet (`$owner`) possesses the cryptographic authority to pause, update bracket stop-loss limits, or revoke an active intent.
* **Execution Lock**: Once an agent executes an order, the status transitions to `OPEN` and records the Arbitrum One `txHash`. This prevents double-spending or duplicate executions.

### 3. Expiration That Fits the Domain

In financial event trading, orders must be strictly time-bound:
* An intent to trade the **FOMC Rate Decision** is only valid during the FOMC meeting window. If the Fed meeting concludes with no announcement, the trade must NOT execute 3 weeks later on an unrelated tweet!
* In traditional Web2 architectures, developers must write complex cron jobs to expire stale orders.
* **With Arkiv**: We specify `ExpirationTime.fromDays(30)` (or minutes matching the event catalyst window). When the deadline passes, Arkiv nodes automatically expire the entity on-chain. Stale intents vanish from the index with zero risk of erroneous execution.

---

## 2. Does Each Arkiv Feature Change Something Users See?

**Yes. Arkiv is not a hidden backend log; it actively drives the user experience throughout the terminal:**

### Feature 1: The Arkiv Storage Panel & Query Playground
* In the top navigation bar, users can click the **Arkiv Storage** tab ([`src/components/ArkivStoragePanel.tsx`](../src/components/ArkivStoragePanel.tsx)).
* **What users see**:
  - Live connection status to the **Rabdi DB-Chain Testnet** (`Chain ID: 7794095`).
  - Real-time block height queried directly from the Arkiv RPC (`Block #310669+`).
  - An interactive SQL-like query console where users can run live queries like `exists(status)` or `category = str('documents')`.
  - Rich entity cards displaying entity keys, owner addresses, expiration block numbers, and raw typed attribute payloads with direct links to the Rabdi Explorer.

### Feature 2: Arkiv On-Chain Verification Pills on Position Cards
* In the **Positions** tab ([`src/components/PositionsList.tsx`](../src/components/PositionsList.tsx)), every deployed agent card displays a dedicated **Arkiv DB** verification badge.
* Clicking the badge opens the verifiable entity directly on the Arkiv Rabdi Explorer (`https://rabdi.explorer.arkiv.network/entity/{entityKey}`).

### Feature 3: Verifiable Trade History Badges
* In the **History** tab ([`src/components/TradesHistoryTable.tsx`](../src/components/TradesHistoryTable.tsx)), every real execution row includes an **Arkiv** button alongside the Arbiscan transaction explorer link.
* Users can verify both the Arbitrum One execution transaction AND the decentralized Arkiv DB-Chain audit record side by side.

### Feature 4: Cross-Device State Recovery
* Because agent intents live on Arkiv rather than in local browser storage, a user can connect their wallet from any laptop or mobile device, query Arkiv by their address (`masterController = addr(...)`), and instantly restore all their deployed trading agents.
