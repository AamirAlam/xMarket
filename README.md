# PumpIt ⚡ Event-Driven Sentiment Trading Agent
> **Autonomous onchain intent trading powered by Verifiable 0G Private Computer inference & Definitive Flash Advanced Bracket Orders.**  
> Built for **ETHGlobal Mumbai 2026**.

---

## 🏆 Bounty Tracks Targeted

### 1. 0G Labs ($7,000 Total Target)
* **`Build with 0G Private Computer` ($5,000)**:
  * Verifiable LLM sentiment inference via the 0G Compute OpenAI-compatible router API (`https://router-api.0g.ai/v1`).
  * Yields cryptographic `request_id`s in the main user flow.
  * **What breaks if 0G is removed?**  
    *Without 0G Private Computer, sentiment verifiability collapses: traders lose cryptographic, TEE-backed proof that financial trades were initiated by objective AI analysis rather than developer front-running, prompt injection, or hallucinated signals.*
* **`Agents That Pay for Themselves` ($2,000)**:
  * The agent earns a **0.1% integrator fee rebate** on every filled Definitive Flash bracket order.
  * Fees flow directly back into the agent’s 0G compute deposit balance to autonomously pay for future inference bills.
  * Built-in **daily spend cap** and **graceful degradation** without requiring manual human top-ups.

### 2. Definitive ($5,000 Total Target)
* **`Best Use of Flash Advanced Orders in a Social App` ($2,500)**:
  * Non-custodial trade execution triggered by live social signals using Definitive Flash API (`flash.definitive.fi/v1`).
* **`Most Creative Use of Flash Advanced Orders` ($2,500)**:
  * Eliminates raw market swaps during high-volatility breaking news events.
  * Wraps every sentiment signal into an automated **Bracket Order** (simultaneous **Take-Profit $+5.0\%$** and **Stop-Loss $-2.5\%$**) with MEV protection on Arbitrum/Base.

---

## 🚀 The Live Demo Flow

PumpIt is designed for **100% pure live testing**:
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
*(Note: IntentiX also includes an in-app **API Keys Modal** so you or judges can paste keys directly into the UI!)*

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
