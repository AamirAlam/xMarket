# xMarket ⚡ Event-Driven Sentiment Trading Agent
> **Autonomous onchain intent trading powered by Verifiable 0G Private Computer inference & Definitive Flash Advanced Bracket Orders.**  
> Built for **ETHGlobal Mumbai 2026**.

---

## ⚙️ Core Protocol Architecture & Deep Integrations

### 1. 0G Private Computer (Verifiable TEE Inference & Self-Funding Fuel)
* **Verifiable LLM Sentiment Oracle**:
  * **Where it is used:** [`src/lib/zeroG.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/zeroG.ts), [`src/app/api/agent/evaluate/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/agent/evaluate/route.ts), and the terminal verification dashboard [`src/components/ZeroGEngine.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/ZeroGEngine.tsx).
  * **Why it is used:** Evaluates unstructured breaking social statements into strict structured economic signals (`sentimentScore`, `confidence`, `sentimentLabel`, `action`, `rationale`) via the 0G Compute OpenAI-compatible router (`0gm-1.0-35b-a3b`).
  * **Why 0G is essential:** Without 0G Private Computer, sentiment verifiability collapses. Traders lose cryptographic, TEE-backed hardware attestation that financial trades were initiated by objective decentralized AI rather than developer front-running, prompt injection, or fake signals. Each evaluation returns a verifiable cryptographic `request_id` displayed transparently in the execution audit logs.
* **Autonomous Self-Funding Compute Vault**:
  * **Where it is used:** [`src/components/AgentVault.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/AgentVault.tsx) and [`src/lib/definitive.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/definitive.ts).
  * **Why it is used:** Eliminates manual gas/compute top-ups. The agent earns a **0.1% integrator fee rebate** on every executed Definitive Flash trade, which automatically flows back into the agent's 0G compute balance to autonomously fuel future inference cycles with built-in daily spend caps.

### 2. Definitive Flash API (MEV-Shielded Execution & Advanced Bracket Orders)
* **Non-Custodial Trigger-to-Trade Routing**:
  * **Where it is used:** [`src/lib/definitive.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/definitive.ts), [`src/app/api/agent/evaluate/route.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/app/api/agent/evaluate/route.ts), and [`src/components/DefinitiveExecution.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/DefinitiveExecution.tsx).
  * **Why it is used:** When breaking catalysts occur, traditional DEX market orders suffer devastating MEV sandwich attacks and toxic slippage. Definitive Flash provides direct, MEV-shielded liquidity routing across Arbitrum One.
* **Automated Bracket Order Risk Management**:
  * **Where it is used:** [`src/components/PositionsList.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/PositionsList.tsx) and [`src/components/EventTriggerWizard.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/EventTriggerWizard.tsx).
  * **Why it is used:** Every sentiment trigger automatically wraps entry positions with atomic **Bracket Orders** (simultaneous **Take-Profit $+5.0\%$** and **Stop-Loss $-2.5\%$** targets), ensuring downside protection without requiring manual user intervention during market volatility.

### 3. EIP-712 Delegated Spend Permits (Zero Manual Pre-Funding)
* **Where it is used:** [`src/lib/agentWallet.ts`](file:///Users/aamir/Downloads/eth-mumbai/src/lib/agentWallet.ts) and [`src/components/EventTriggerWizard.tsx`](file:///Users/aamir/Downloads/eth-mumbai/src/components/EventTriggerWizard.tsx).
* **Why it is used:** Users never have to deposit funds into a vulnerable intermediate escrow contract. Capital remains 100% inside the user's connected wallet until an armed catalyst event actually fires. Definitive Flash Execution Router (`0x4c27...04B3`) then deducts the trade amount on-demand and returns exit proceeds directly back to the user's wallet.

---

## 🚀 The Live Demo Flow

xMarket is designed for **100% pure live testing**:
1. **Declare Trading Intent**: Choose catalyst event (e.g., *FOMC Rate Cut Decision*), target handle (e.g., `@federalreserve` or your personal handle), confidence threshold ($\ge 75\%$), and Bracket settings ($+5\%$ TP / $-2.5\%$ SL).
2. **Activate Live Radar**: The live sentinel streams the target timeline every 3 seconds.
3. **Emit Real Tweet**: Send a real tweet from your phone (or use the built-in Live Tweet Ingestion Drawer).
4. **Verifiable 0G Inference**: Within 3 seconds, 0G Private Computer evaluates Hawkish/Dovish polarity and returns a verifiable `request_id`.
5. **Definitive Flash Settlement**: If confidence meets the threshold, a non-custodial bracket order is dispatched onchain with live transaction hash and Stop-Loss/Take-Profit targets.
6. **Self-Sustaining Loop**: The trade rebate automatically credits the agent's 0G compute vault.

---

## 🛠️ Quickstart

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*Add your `ZERO_G_API_KEY` (from [pc.0g.ai](https://pc.0g.ai)) and `DEFINITIVE_FLASH_API_KEY` (from [flash.definitive.fi](https://flash.definitive.fi)).*  
*(Note: xMarket also includes an in-app **API Keys Modal** so you or reviewers can paste keys directly into the UI!)*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📊 Architecture

```
[ Twitter / X Live Stream ]
           │ (Tweet Ingestion)
           ▼
[ 0G Private Computer (router-api.0g.ai) ]  ──► Returns Verifiable TEE request_id & Polarity
           │
           ▼
[ Intent Evaluation Engine ]               ──► Checks Confidence >= Threshold & Direction
           │ (Matches Intent)
           ▼
[ Definitive Flash API (flash.definitive.fi) ]
     ├── MEV-Protected Non-Custodial Swap (Arbitrum One)
     ├── Upper Leg: Take-Profit Limit (+5%)
     └── Lower Leg: Stop-Loss Trigger (-2.5%)
           │
           ▼
[ 0G Compute Agent Vault ]                 ──► 0.1% Trade Rebate Credited for Future Inference
```

---

## 📄 License
MIT License • Built with ❤️ for ETHGlobal Mumbai
