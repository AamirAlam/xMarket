# Why Arkiv? Architecture & Storage Rationale

This document answers the **Why Arkiv (25%)** judging criteria for ETHGlobal Mumbai: comparing Arkiv against centralized databases (Postgres / MongoDB) and explaining what data was intentionally kept off Arkiv.

---

## 1. If You Swapped Arkiv for Postgres, What Would Users Lose?

If xMarket swapped Arkiv for a traditional relational database (Postgres, MongoDB, DynamoDB, Supabase), our users would immediately lose four foundational Web3 guarantees:

### 1. Wallet-Owned Cryptographic Sovereignty
* **In Postgres**: Every trading intent, bracket parameter, and smart account policy is a row in a centralized AWS RDS database owned by the platform operator. If our servers are subpoenaed, compromised, or go offline, the user has zero ability to prove, export, or revoke their trading intents.
* **On Arkiv**: Every `xmarket.agent_intent` is an on-chain entity whose `$owner` is the user's master Ethereum wallet. The user owns their data as sovereign property. No centralized admin can alter, frontrun, or tamper with an active intent without a valid signature from the owner's private key.

### 2. Native Ephemeral Expiration Without Fragile Keeper Infrastructure
* **In Postgres**: To expire intents after a catalyst deadline (e.g. 30 minutes after an FOMC announcement), developers must build, monitor, and maintain background cron jobs, Celery workers, or serverless scheduled functions. If that cron infrastructure crashes, stale intents remain armed and vulnerable to delayed execution.
* **On Arkiv**: Entities support native on-chain lifetime expiration (`ExpirationTime.fromDays(30)` or `fromMinutes(60)`). Arkiv DB-chain nodes automatically expire and purge stale intents from the queryable index at `$expiresAt`. The database garbage-collects itself natively on-chain without any backend servers.

### 3. Permissionless Multi-Agent Interoperability
* **In Postgres**: If an external autonomous agent or MEV searcher wants to execute on a user's intent, the platform operator must build private REST APIs, issue API keys, and manage rate limits.
* **On Arkiv**: Any external relayer, MEV searcher, or autonomous agent in the world can connect to the public Arkiv RPC (`https://rpc.rabdi.db-chain.testnet.arkiv.network`) and query eligible armed intents using standard SQL-like filters:
  ```typescript
  const openIntents = await client.query(
    and(eq("status", str("ARMED")), eq("targetAsset", str("WETH")))
  );
  ```
  The relayer can evaluate the catalyst, trigger the Definitive Flash order on Arbitrum One on behalf of the user, and collect a decentralized execution fee rebate. Arkiv transforms our private database into an open, decentralized execution market.

### 4. Censorship Resistance & Verifiable Auditability
* **In Postgres**: A dishonest database administrator can secretly inspect user limit orders and bracket thresholds, frontrun their trades, or selectively silence specific users.
* **On Arkiv**: Intent state changes are backed by verifiable transaction receipts on the Rabdi DB-Chain, providing complete cryptographic traceability.

---

## 2. What Did You Keep Off Arkiv, and Why?

Arkiv is an Ethereum-aligned database where entities and attributes are publicly indexed. To adhere to strict security best practices and prevent state bloat, we deliberately kept the following off Arkiv:

### 1. Agent Session Private Keys (Kept Client-Side)
* **What**: The ephemeral session private key authorized to pull delegated funds from the master wallet.
* **Why**: Arkiv entities are publicly queryable. Storing a private key on-chain would compromise user funds. The ephemeral private key remains strictly in browser memory (`sessionStorage`) and signs orders locally.

### 2. Transient High-Frequency Tweet Ingestion Buffers (Kept in Memory)
* **What**: The hundreds of raw tweets scanned every few seconds from target accounts (e.g. routine retweets or greetings).
* **Why**: Storing non-catalyst social media spam on Arkiv would create unnecessary state bloat and waste gas. Only authenticated user **Intents** and verified on-chain **Trade Executions** are written to Arkiv.

### 3. API Secrets & Third-Party Credentials (Kept in Local Environment)
* **What**: 0G Private Computer API tokens, Twitter bearer tokens, and Alchemy RPC keys.
* **Why**: API secrets must never be committed to decentralized public storage. Users configure their own keys locally via [`src/components/ApiKeyModal.tsx`](../src/components/ApiKeyModal.tsx), stored safely in browser `localStorage`.
