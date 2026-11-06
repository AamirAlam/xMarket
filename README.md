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

### 4. Local Persistence & Onchain State Sync
* **Implementation:** [`src/lib/db.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/db.ts), [`src/app/api/positions/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/positions/route.ts).
* **High-Performance SQLite Store:** Armed strategies, executed positions, PnL records, and transaction hashes persist in an embedded SQLite database (`data/xmarket.db`) operating in WAL mode.
* **Real-Time Balance Tracker:** [`src/components/WalletButton.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/WalletButton.tsx) batches RPC queries against Arbitrum One (`arb1.arbitrum.io/rpc`) for native ETH and canonical USDC (`0xaf88...5831`), computing real-time net worth in USD.

---

## End-to-End Execution Pipeline

The trading pipeline operates as a deterministic, six-stage state machine:

1. **Intent Declaration & Risk Parameterization**  
   The trader selects a target catalyst source (e.g. Jerome Powell / FOMC, Vitalik Buterin, Elon Musk, or a custom X handle), selects the target asset (`WETH`, `WBTC`, `SOL`, `ARB`), sets confidence thresholds ($\ge 75\%$), and specifies Take-Profit / Stop-Loss percentage brackets.

2. **Autonomous Surveillance & Stream Ingestion**  
   The live radar continuously monitors target handles via Twitter API v2 endpoints or zero-key fallback syndication bridges. Reviewers and operators can also inject direct tweet URLs or trigger synthetic breaking event statements directly from the live terminal.

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

## License
MIT License • Engineered for **ETHGlobal Mumbai 2026**.
