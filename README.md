# xMarket — Event-Driven Sentiment Trading Protocol

> **Verifiable onchain sentiment execution combining 0G Private Computer confidential AI inference with Definitive Flash MEV-shielded bracket routing.**  
> Built for **ETHGlobal Mumbai 2026**.

---

## Overview

Breaking social events and macroeconomic catalysts move crypto markets within seconds. However, automated trading on breaking news traditionally suffers from two fundamental vulnerabilities:

1. **Unverifiable Sentiment Oracles:** Centralized AI sentiment models can be front-run, manipulated via prompt injection, or fabricated by malicious operators without cryptographic accountability.
2. **Execution Slippage & Toxic MEV:** Executing naive market orders during high-volatility breaking news exposes traders to severe sandwich attacks, adverse price impact, and uncontrolled drawdowns.

**xMarket** eliminates these failure points by pairing **0G Private Computer (TEE-verifiable LLM inference)** with **Definitive Flash (non-custodial advanced bracket orders)**. Traders define automated catalyst intents with zero upfront escrow capital, while an autonomous fee-rebate loop continuously funds the agent's decentralized compute resources.

---

## Technical Architecture & Core Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       xMarket System Architecture                           │
└─────────────────────────────────────────────────────────────────────────────┘

 [ Breaking Catalyst Feed ] ───► Live Ingestion Bridge (Twitter v2 / Syndication)
                                          │
                                          ▼
 [ 0G Private Computer ]   ───► Confidential LLM Evaluation (0gm-1.0-35b-a3b)
                                └── Cryptographic TEE attestation & request_id
                                          │
                                          ▼
 [ Intent Match Engine ]   ───► Validates Confidence Threshold & Directional Bias
                                          │
                                          ▼
 [ Definitive Flash API ]  ───► Direct MEV-Shielded Execution (Arbitrum One)
                                ├── Atomic Bracket: Take-Profit (+5.0%)
                                ├── Atomic Bracket: Stop-Loss (-2.5%)
                                └── EIP-712 Delegated Spend (Zero Escrow)
                                          │
                                          ▼
 [ Agent Vault Loop ]      ───► 0.1% Integrator Rebate Replenishes 0G Compute
```

### 1. 0G Private Computer — Verifiable Sentiment Intelligence
* **Implementation:** [`src/lib/zeroG.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/zeroG.ts), [`src/app/api/agent/evaluate/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/agent/evaluate/route.ts), [`src/components/ZeroGEngine.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/ZeroGEngine.tsx).
* **TEE-Backed Inference:** Queries 0G Compute network nodes running model `0gm-1.0-35b-a3b` via OpenAI-compatible endpoints (`https://router-api.0g.ai/v1`).
* **Deterministic Parsing:** Incoming social unstructured payloads are normalized into typed signals:
  $$\text{Signal} = \{ \text{sentimentScore} \in [-1.0, 1.0],\, \text{confidence} \in [0.0, 1.0],\, \text{action} \in \{\text{BUY}, \text{SELL}, \text{HOLD}\} \}$$
* **Cryptographic Provenance:** Each evaluation yields a hardware-isolated attestation `request_id` recorded immutably in the local audit trail, proving that financial order dispatches were initiated strictly by objective machine consensus.
* **Self-Sustaining Agent Vault:** To solve agent operational insolvency, every filled Definitive Flash order routes a **0.1% integrator fee rebate** back to the agent’s 0G compute reserve ([`src/components/AgentVault.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/AgentVault.tsx)), autonomously covering ongoing inference costs with configurable daily spend caps.

### 2. Definitive Flash API — MEV-Shielded Advanced Bracket Orders
* **Implementation:** [`src/lib/definitive.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/definitive.ts), [`src/components/DefinitiveExecution.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/DefinitiveExecution.tsx).
* **Non-Custodial Liquidity Routing:** Upon intent satisfaction, non-custodial swaps are dispatched on Arbitrum One via Definitive Flash API (`flash.definitive.fi/v1`), shielding transactions from predatory searcher sandwiches in public mempools.
* **Simultaneous Bracket Protection:** Rather than leaving open-ended exposure during high-volatility spikes, entry trades automatically configure bound bracket orders with predefined Take-Profit ($+5.0\%$) and Stop-Loss ($-2.5\%$) limits.
* **Exit Order Router:** Dedicated exit execution endpoints ([`src/app/api/agent/trade/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/agent/trade/route.ts)) liquidate positions directly onchain and update position states across the SQLite engine.

### 3. EIP-712 Delegated Spend Permits — Zero Pre-Funding Security
* **Implementation:** [`src/lib/agentWallet.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/agentWallet.ts), [`src/components/EventTriggerWizard.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/EventTriggerWizard.tsx).
* **Zero Escrow Risk:** Eliminates the requirement for traders to deposit capital into intermediate smart contracts or custodial hot wallets.
* **On-Demand Settlement:** Traders sign an EIP-712 `DelegatedSpendPermit` authorizing the Definitive Flash Router (`0x4c274C972C40ffD7dBE92a4E01d7C351B27d04B3`) to pull the authorized trade size ($USDC) *only* if the designated catalyst fires. All proceeds from profit-taking and stop-loss exits route directly back into the trader's primary wallet.

### 4. Real-Time Social Surveillance & Anti-Rate-Limit Queue Engine
* **Implementation:** [`src/lib/twitter.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/twitter.ts), [`src/app/api/agent/listen/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/agent/listen/route.ts), [`src/components/LiveMonitor.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/LiveMonitor.tsx).
* **Multi-Agent Sequential Queue:** When multiple agents are actively monitoring different X accounts (`ARMED` or `OPEN`), all targets are processed in a fair round-robin queue with an exact **1,000ms delay** (`1.0s`) enforced between consecutive queries to eliminate HTTP 429 rate limits.
* **Dual-Layer Anti-Rate-Limit Cache:**
  - **In-Memory Feed Cache (`CACHE_TTL_MS = 5000`):** Caches parsed feeds per handle for 5 seconds; rapid consecutive checks resolve in `< 2ms` without outbound network calls.
  - **Server-Side Outbound Throttle (`MIN_OUTBOUND_INTERVAL_MS = 1000`):** Enforces 1-second spacing on upstream external calls to protect rate limit budgets.
* **Zero-Key Public Ingestion & Twitter v2 Bridge:**
  - Ingests posts via official Twitter API v2 (when Bearer Token is provided) or seamless public syndication bridges (FxTwitter XML RSS) for any public handle without API keys or credits.
  - Chronologically sorts tweets descending by publication timestamp (`createdAt`) so the true latest post is evaluated immediately (bypassing retweets or pinned posts).
  - Uses 64-bit `BigInt` comparison for 19-digit Twitter snowflake IDs (`sinceId`) to eliminate missed tweets.
* **Interactive Live Radar & Verification:**
  - [`LiveMonitor.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/LiveMonitor.tsx) provides a real-time event feed with verified badges, relative timestamps, and one-click test chips for `@VitalikButerin`, `@federalreserve`, `@elonmusk`, and `@cz_binance`, plus on-demand single tweet URL ingestion for instant verification.

### 5. Arkiv DB-Chain — Decentralized Sovereign Agent Storage
* **Implementation:** [`src/lib/arkiv.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/arkiv.ts), [`src/app/api/arkiv/query/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/arkiv/query/route.ts), [`src/components/ArkivStoragePanel.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/ArkivStoragePanel.tsx).
* **Track:** **Build on Arkiv (from scratch) — $4,000 Bounty Track**.
* **Decentralized State Layer:** Replaces fragile centralized databases with Ethereum-aligned, wallet-owned Arkiv entities on the **Rabdi DB-Chain Testnet** (`Chain ID: 7794095`).

#### Why Arkiv Is Critical for Autonomous Trading Agents (vs. Centralized Postgres)
If xMarket were built on traditional databases (Postgres, MongoDB, Supabase), traders would forfeit four core Web3 security guarantees:

1. **Wallet-Owned Cryptographic Sovereignty:**
   * *In Postgres:* Trading parameters, spend limits, and bracket orders reside in platform-controlled database rows. If backend servers are compromised, censored, or offline, users have zero ownership over their state.
   * *On Arkiv:* Every `xmarket.agent_intent` is an on-chain entity whose `$owner` is the user's master Web3 wallet. Active intents cannot be altered, spoofed, or deleted without the trader’s signature.

2. **Native Ephemeral Expiration (Zero Keeper Risk):**
   * *In Postgres:* Macroeconomic event triggers (e.g., an FOMC rate cut or CPI print) are time-sensitive. Expiring them requires external background cron jobs or cloud workers. If a keeper service crashes, stale intents remain armed and vulnerable to delayed false triggers.
   * *On Arkiv:* Entities configure native on-chain expiration (`ExpirationTime.fromDays(30)` or `fromMinutes(30)`). Arkiv DB-chain validator nodes automatically prune expired intents at `$expiresAt` natively without server dependencies.

3. **Permissionless Multi-Agent Interoperability:**
   * *In Postgres:* External solvers, relayers, or searchers must register for closed API keys and navigate rate limits to discover trading opportunities.
   * *On Arkiv:* Any autonomous agent or relayer globally can query public Arkiv RPC endpoints using SQL-like filters (`exists(status)`, `and(eq("status", str("ARMED")), eq("targetAsset", str("WETH")))`) to discover qualified intents and execute Definitive Flash swaps on behalf of the user, earning execution fee rebates.

4. **Frontrunning Prevention & Cryptographic Auditability:**
   * *In Postgres:* Database administrators have privileged read access to pending limit triggers and bracket conditions, creating systemic frontrunning and order-leakage risk.
   * *On Arkiv:* Intent transitions and trade settlement entities are anchored by immutable transaction hashes on the Rabdi DB-Chain, creating a verifiable audit trail.

5. **Principled Data Boundary (What Was Kept Off-Chain):**
   * *Kept Client-Side:* Ephemeral agent session private keys remain strictly in browser `sessionStorage` (never written to public storage).
   * *Kept in Memory:* Transient high-frequency tweet feeds remain in temporary RAM buffers to prevent state bloat. Only authenticated user **Intents** and on-chain **Trade Executions** are committed to Arkiv.

* **Entity Schemas:**
  - `xmarket.agent_intent`: Pre-armed event trading parameters, confidence thresholds, and ERC-4337 smart account delegations. Configured with native 30-day on-chain expiration (`ExpirationTime.fromDays(30)`).
  - `xmarket.agent_trade`: Real on-chain Definitive Flash trade execution records and 0G sentiment proofs.
* **Wallet Address Writing Entities:** `0x666aaB9c94bE79AbA5bf033a393A705156AD5060`
* **Query Judges Can Run (cURL):**
  ```bash
  curl -s -X POST https://rpc.rabdi.db-chain.testnet.arkiv.network \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"arkiv_query","params":["exists(status)",{"limit":10}],"id":1}'
  ```
* **Query Judges Can Run (TypeScript with `@arkiv-network/sdk`):**
  ```typescript
  import { createPublicClient } from "@arkiv-network/sdk";
  import { rabdi } from "@arkiv-network/sdk/chains";
  import { http } from "viem";

  const client = createPublicClient({ chain: rabdi({ accessKey: "" }), transport: http() });
  const result = await client.query("exists(status)", { limit: 10 });
  console.log("Entities on Rabdi DB-Chain:", result.entities);
  ```
* **Arkiv Submission Documentation Files:**
  - [`/arkiv/schema.md`](arkiv/schema.md) — Schema definitions, indexed fields, ownership model, and expiration policies.
  - [`/arkiv/friction.md`](arkiv/friction.md) — Developer friction report, BigInt serialization bug reproduction, and DX feedback.
  - [`/arkiv/reach.md`](arkiv/reach.md) — Target market, user adoption, live testing, and post-hackathon roadmap.
  - [`/arkiv/why-arkiv.md`](arkiv/why-arkiv.md) — Architectural rationale, comparison against Postgres, and what was kept off-chain.
  - [`/arkiv/how-you-use-arkiv.md`](arkiv/how-you-use-arkiv.md) — How filters and expiration fit trading agents, and UI features visible to users.

### 6. Local Persistence, Trade Ledger & Onchain Balance Sync
* **Implementation:** [`src/lib/db.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/db.ts), [`src/app/api/positions/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/positions/route.ts), [`src/app/api/trades/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/trades/route.ts), [`src/components/TradesHistoryTable.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/TradesHistoryTable.tsx).
* **High-Performance SQLite Store:** Armed strategies, executed positions, PnL records, and transaction hashes persist in an embedded SQLite database (`data/xmarket.db`) operating in WAL mode with `better-sqlite3`.
* **Granular Trade History Ledger:** Full historical ledger tracking entry/exit executions, realized PnL, 0G proof IDs, and direct Arbiscan transaction links.
* **Real-Time Balance Tracker:** [`src/components/WalletButton.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/WalletButton.tsx) batches RPC queries against Arbitrum One (`arb1.arbitrum.io/rpc`) for native ETH and canonical USDC (`0xaf88...5831`), computing real-time net worth in USD.

---

## End-to-End Execution Pipeline

The trading pipeline operates as a deterministic, six-stage state machine:

1. **Intent Declaration & Risk Parameterization**  
   The trader selects a target catalyst source (e.g. Jerome Powell / FOMC, Vitalik Buterin, Elon Musk, or a custom X handle), selects the target asset (`WETH`, `WBTC`, `SOL`, `ARB`), sets confidence thresholds ($\ge 75\%$), and specifies Take-Profit / Stop-Loss percentage brackets.

2. **Autonomous Surveillance & Sequential Ingestion Queue**  
   The live radar continuously surveils target accounts using a sequential round-robin queue with an exact **1,000ms delay** enforced between handle queries, backed by a 5-second server cache to eliminate HTTP 429 rate limits. Reviewers and operators can also inject direct tweet URLs or test any public persona with 1-click test chips directly from the live terminal.

3. **Confidential Sentiment Inference**  
   Within seconds of payload detection, the event text is dispatched to 0G Private Computer. The TEE node validates context, evaluates dovish/bullish economic implications, assigns a confidence metric, and issues a cryptographic hardware `request_id`.

4. **Intent Evaluation & Safeguards**  
   The evaluation engine checks whether confidence meets or exceeds the user-defined threshold and verifies that the suggested action matches the configured strategy direction (`BULLISH_ONLY`, `BEARISH_ONLY`, or `ANY`). If thresholds fail, the trade is rejected with an immutable diagnostic entry to preserve capital.

5. **MEV-Shielded Bracket Execution**  
   Upon qualification, Definitive Flash executes the trade on Arbitrum One via EIP-712 permit authorization. The resulting position is registered with entry price, real-time valuation, and automated TP/SL bracket monitoring.

6. **Self-Sustaining Protocol Loop**  
   Integrator fee rebates ($0.1\%$) generated by the trade are automatically calculated and credited to the agent's 0G compute balance, ensuring continuous autonomous operation without manual user deposits.

---

## Quickstart

### Prerequisites
* **Node.js** v18.18+ (tested on Node v20 & v24)
* **npm**, **pnpm**, or **yarn**

### 1. Installation
```bash
git clone https://github.com/your-username/eth-mumbai.git
cd eth-mumbai
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default / Source |
|---|---|---|
| `ZERO_G_API_KEY` | 0G Private Computer Router API Key | [pc.0g.ai](https://pc.0g.ai) *(optional in-app modal)* |
| `ZERO_G_ROUTER_URL` | 0G Compute OpenAI-compatible router | `https://router-api.0g.ai/v1` |
| `DEFINITIVE_FLASH_API_KEY` | Definitive Flash Execution Router Key | [flash.definitive.fi](https://flash.definitive.fi) |
| `DEFINITIVE_FLASH_API_URL` | Definitive Flash API Endpoint | `https://flash.definitive.fi/v1` |
| `TWITTER_BEARER_TOKEN` | Twitter / X v2 Bearer Token | *(optional, fallback bridge included)* |

*(Note: xMarket includes an in-app **API Keys Modal** allowing credentials to be configured and tested directly in the browser).*

### 3. Build & Run
```bash
# Development server
npm run dev

# Production build verification
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** to launch the landing page, or navigate directly to **[http://localhost:3000/terminal](http://localhost:3000/terminal)** for the trading interface.

---

## How We Used AI (ETHGlobal Hackathon Disclosure)

As required by ETHGlobal's rules, this project utilized AI tools during development:
* **Antigravity AI Assistant**: Used for pair-programming, typing `@arkiv-network/sdk` schema definitions, designing interactive UI components, structuring EIP-712 session delegation contracts, and writing technical documentation for the Arkiv track submission.

---

## License

MIT License • Engineered for **ETHGlobal Mumbai 2026**. Open source and publicly auditable.
