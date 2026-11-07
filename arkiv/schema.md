# Arkiv DB-Chain Schema Architecture

This document defines the schema definitions, indexed query fields, ownership models, and cryptographic expiration policies for **xMarket** entities deployed on the Arkiv **Rabdi DB-Chain Testnet** (`Chain ID: 7794095`).

---

## 1. Overview of Entities

xMarket utilizes Arkiv as an Ethereum-aligned decentralized database to replace fragile centralized databases (like Postgres) for autonomous agent coordination. Two primary entity types live on Arkiv:

1. **`xmarket.agent_intent`**: Ephemeral agent trading intentions, event catalyst monitoring parameters, and session-key delegations.
2. **`xmarket.agent_trade`**: Cryptographic on-chain trade executions, Definitive Flash bracket fills, and 0G TEE sentiment audit trails.

---

## 2. Entity 1: `xmarket.agent_intent`

Represents an autonomous trading intent created by a user or agent. The entity stores the catalyst target, asset pair, trade sizing, and bracket order parameters.

### Schema Definition (`@arkiv-network/sdk`)

```typescript
import { defineSchema, str, addr, dec } from "@arkiv-network/sdk";

export const AgentIntentSchema = defineSchema("xmarket.agent_intent", {
  positionId: str().indexed(),
  eventName: str().indexed(),
  targetHandle: str().indexed(),
  persona: str(),
  avatar: str(),
  targetAsset: str().indexed(),
  contraAsset: str(),
  sizeUsdc: dec().indexed(),
  entryPrice: dec(),
  currentPrice: dec(),
  side: str().indexed(),
  pnlUsd: dec(),
  pnlPct: dec(),
  status: str().indexed(),
  confidenceThreshold: dec(),
  orderType: str(),
  takeProfitPct: dec(),
  stopLossPct: dec(),
  agentWalletAddress: addr().indexed(),
  masterController: addr().indexed(),
  triggeredTweet: str(),
  txHash: str(),
  createdAt: str(),
});
```

### Fields and Indexing

| Field | Type | Indexed | Purpose |
| :--- | :--- | :--- | :--- |
| `positionId` | `str` | **Yes** | Unique identifier for position tracking |
| `eventName` | `str` | **Yes** | Catalyst event name (e.g. FOMC Decision, Treasury Buy) |
| `targetHandle` | `str` | **Yes** | X/Twitter handle monitored by agent (e.g. `federalreserve`, `saylor`) |
| `persona` | `str` | No | Public figure/speaker associated with catalyst |
| `avatar` | `str` | No | Display avatar URI |
| `targetAsset` | `str` | **Yes** | Asset symbol to trade (`WETH`, `WBTC`, `SOL`) |
| `contraAsset` | `str` | No | Settlement token (`USDC`) |
| `sizeUsdc` | `dec` | **Yes** | Maximum allocated capital in USDC |
| `entryPrice` | `dec` | No | Benchmark reference entry price |
| `currentPrice` | `dec` | No | Real-time market mark price |
| `side` | `str` | **Yes** | Trade direction (`LONG` or `SHORT`) |
| `pnlUsd` | `dec` | No | Real-time unrealized or realized profit/loss ($) |
| `pnlPct` | `dec` | No | Profit/loss percentage (%) |
| `status` | `str` | **Yes** | Intent state (`ARMED`, `OPEN`, `SETTLED`, `REVOKED`) |
| `confidenceThreshold` | `dec` | No | Minimum 0G TEE sentiment confidence score (0.00 – 1.00) |
| `orderType` | `str` | No | Execution structure (`BRACKET`, `MARKET`, `LIMIT`) |
| `takeProfitPct` | `dec` | No | Automatic profit-taking threshold |
| `stopLossPct` | `dec` | No | Automatic stop-loss limit |
| `agentWalletAddress`| `addr` | **Yes** | Non-custodial ERC-4337 smart account delegated to this intent |
| `masterController` | `addr` | **Yes** | User's master funder wallet with 100% custody |
| `triggeredTweet` | `str` | No | Actual tweet catalyst payload that triggered execution |
| `txHash` | `str` | No | Arbitrum One transaction hash on execution |
| `createdAt` | `str` | No | ISO timestamp of creation |

### Ownership & Permissions
- **Owner**: The user's connected master wallet (`$owner = masterController`).
- **Creator**: The agent deployer or authorized session key.
- **Mutations**: Only the owner wallet can patch status (e.g., to `REVOKED` or `PAUSED`) or re-delegate session keys.

### Expiration Policy
- **Lifetime**: `ExpirationTime.fromDays(30)` (or matched directly to the catalyst deadline / session key expiration).
- **Why it expires**: Trading intents are ephemeral coordination states. Once the catalyst window (such as a Fed meeting or earnings call) passes or the position settles, the intent is no longer active. Arkiv automatically expires and cleans up the entity on-chain without requiring manual database tombstoning or centralized garbage collection.

---

## 3. Entity 2: `xmarket.agent_trade`

Represents an immutable, cryptographically verifiable trade execution record when an agent fires a Definitive Flash bracket order on Arbitrum One.

### Schema Definition (`@arkiv-network/sdk`)

```typescript
import { defineSchema, str, addr, dec } from "@arkiv-network/sdk";

export const AgentTradeSchema = defineSchema("xmarket.agent_trade", {
  tradeId: str().indexed(),
  positionId: str().indexed(),
  eventName: str().indexed(),
  targetHandle: str().indexed(),
  targetAsset: str().indexed(),
  contraAsset: str(),
  tradeType: str().indexed(),
  side: str().indexed(),
  orderType: str(),
  sizeUsdc: dec(),
  price: dec(),
  exitPrice: dec(),
  pnlUsd: dec(),
  pnlPct: dec(),
  status: str().indexed(),
  txHash: str().indexed(),
  explorerUrl: str(),
  agentWalletAddress: addr().indexed(),
  masterController: addr().indexed(),
  triggeredTweet: str(),
  createdAt: str(),
});
```

### Fields and Indexing

| Field | Type | Indexed | Purpose |
| :--- | :--- | :--- | :--- |
| `tradeId` | `str` | **Yes** | Unique trade execution ID |
| `positionId` | `str` | **Yes** | Reference to originating `agent_intent` |
| `eventName` | `str` | **Yes** | Catalyst event name |
| `targetHandle` | `str` | **Yes** | Catalyst handle |
| `targetAsset` | `str` | **Yes** | Asset symbol traded |
| `contraAsset` | `str` | No | Collateral currency (`USDC`) |
| `tradeType` | `str` | **Yes** | `ENTRY_BUY`, `EXIT_TAKE_PROFIT`, `EXIT_STOP_LOSS`, `EXIT_SELL`, `SWEEP` |
| `side` | `str` | **Yes** | `LONG` or `SHORT` |
| `orderType` | `str` | No | Order type (`BRACKET`, `MARKET`) |
| `sizeUsdc` | `dec` | No | Trade volume in USDC |
| `price` | `dec` | No | Execution price on Arbitrum One |
| `exitPrice` | `dec` | No | Settlement exit price |
| `pnlUsd` | `dec` | No | Realized profit or loss in USD |
| `pnlPct` | `dec` | No | Realized return percentage |
| `status` | `str` | **Yes** | `FILLED`, `SETTLED`, `OPEN`, `SWEPT` |
| `txHash` | `str` | **Yes** | Arbitrum One transaction hash |
| `explorerUrl` | `str` | No | Arbiscan block explorer link |
| `agentWalletAddress`| `addr` | **Yes** | ERC-4337 smart account that executed the flash order |
| `masterController` | `addr` | **Yes** | Master funder wallet |
| `triggeredTweet` | `str` | No | Verified sentiment catalyst text |
| `createdAt` | `str` | No | Timestamp of execution |

### Ownership & Expiration
- **Owner**: Master funder wallet (`$owner = masterController`).
- **Lifetime**: `ExpirationTime.fromDays(90)` for audit verification window.
- **Mutations**: Read-only after final settlement on Arbitrum One.

---

## 4. Example Queries

### A. Query Active Armed Intents
```typescript
const client = getArkivPublicClient();
const armedIntents = await client.query(
  and(eq("status", str("ARMED")), eq("targetAsset", str("WETH"))),
  { limit: 20 }
);
```

### B. Query User's Trades by Master Controller
```typescript
const userTrades = await client.query(
  eq("masterController", addr("0x666aaB9c94bE79AbA5bf033a393A705156AD5060")),
  { limit: 50 }
);
```

### C. Raw String Query Syntax
```bash
curl -X POST https://rpc.rabdi.db-chain.testnet.arkiv.network \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "arkiv_query",
    "params": ["status = str(\x27ARMED\x27)", {"limit": 10}],
    "id": 1
  }'
```
