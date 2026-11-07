# Arkiv Developer Friction Report

This document answers the **Arkiv Feedback (25%)** criteria for ETHGlobal Mumbai: detailing what got in our way, what broke, how to reproduce it, and concrete recommendations for the Arkiv team to improve the developer experience.

---

## 1. What Broke & What Got in Our Way

### Friction Issue 1: `BigInt` Serialization in Next.js & Node.js API Routes

* **What happened**: When querying entities via `publicClient.query(...)`, Arkiv SDK entities return native JavaScript `bigint` types for system metadata fields (`$createdAt: 552n`, `$expiresAt: 7884552n`) and numeric attributes (`u64`, `u256`). When returning query results directly in standard Next.js / Express API route handlers (`NextResponse.json({ entities })`), Node.js immediately threw:
  ```
  TypeError: Do not know how to serialize a BigInt
  ```
* **What we expected**: Standard JSON-serializable responses or a built-in helper/method like `.toJSON()` on `QueryResult` or `Entity` that automatically converts BigInt values to string or number representations.
* **How to reproduce**:
  ```typescript
  import { createPublicClient } from "@arkiv-network/sdk";
  import { rabdi } from "@arkiv-network/sdk/chains";
  import { http } from "viem";

  const client = createPublicClient({ chain: rabdi({ accessKey: "" }), transport: http() });
  const result = await client.query("exists(status)", { limit: 1 });
  JSON.stringify(result.entities); // Throws TypeError: Do not know how to serialize a BigInt
  ```
* **Our Workaround**: We implemented a recursive `sanitizeBigInts(obj)` helper in [`src/lib/arkiv.ts`](../src/lib/arkiv.ts) that recursively casts BigInt values to string before serialization.
* **Suggested Improvement**: Add an optional `{ serializeBigInts: true }` option to `client.query()` or have the SDK provide an `entity.toJSON()` method.

---

### Friction Issue 2: Querying All Entities (`1=1` or `true` Parse Errors)

* **What happened**: When developers want to list the most recent entities without an attribute filter (analogous to `SELECT * FROM table LIMIT 10`), standard SQL conventions like `1 = 1` or boolean literals like `true` fail with parse errors:
  - `client.query("true")` &rarr; `Query rejected (parse, -32001): a reserved word cannot be used as an attribute name.`
  - `client.query("1 = 1")` &rarr; `Query rejected (parse, -32001): expected an attribute name.`
* **What we expected**: Either an empty string `""`, `"*"` or a dedicated helper like `matchAll()` to fetch entities without requiring a dummy attribute condition.
* **How to reproduce**: Run `client.query("1 = 1")` or `client.query("true")`.
* **Our Workaround**: We had to discover that `exists(status)` or `exists(attributeName)` works as a predicate filter for entities possessing that attribute.
* **Suggested Improvement**: Support `client.query()` without arguments or provide a `all()` / `matchAll()` query builder in `@arkiv-network/sdk/query`.

---

### Friction Issue 3: Missing Access Key Defaulting in `@arkiv-network/sdk/chains`

* **What happened**: Calling `rabdi()` without arguments throws:
  ```
  MissingAccessKeyError: Rabdi needs an Arkiv access key: pass it as rabdi({ accessKey }).
  ```
  Even though the public RPC endpoint works with `rabdi({ accessKey: "" })`, developers must know to explicitly pass an empty string `{ accessKey: "" }` to use the public endpoint.
* **What we expected**: Calling `rabdi()` with no arguments should default to `{ accessKey: "" }` with a console warning, rather than throwing an unhandled exception before the client is even created.
* **Suggested Improvement**: Default `options = { accessKey: "" }` in `rabdi(options = {})`.

---

### Friction Issue 4: Interactive Faucet Access During Hackathons

* **What happened**: When building automated CI/CD or containerized agent microservices at hackathons, funding an agent writer wallet requires logging in through a browser UI at `https://hub.arkiv.network/faucet`. When attempting to request gas via API (`POST /api/faucet`), it returns `{"error":"Unauthorized"}` because it requires cookie/session authentication.
* **What we expected**: A programmatic faucet endpoint using an access key or signed wallet challenge (e.g. `curl -X POST https://hub.arkiv.network/api/faucet -H "Authorization: Bearer <access_key>" -d '{"address": "0x..."}'`).
* **Suggested Improvement**: Provide an automated faucet API endpoint keyed by access keys or a CLI command like `npx arkiv faucet 0x...`.

---

### Friction Issue 5: Block Explorer UX on Unmined / Prospective Entity Keys

* **What happened**: When querying an entity key on `https://rabdi.explorer.arkiv.network/entity/{key}` before the transaction is mined or if an invalid prospective key is inspected, the explorer displays:
  ```
  No operations for entity 0x... were found in storage. Blocks scanned before entity keys were indexed may not be linked to their entity yet.
  ```
  This message led to developer confusion over whether the indexer was lagging behind block scanning versus the transaction simply not existing on-chain yet.
* **What we expected**: A distinct 404 state distinguishing between "Transaction not found on Rabdi" vs "Indexer sync in progress", with a search fallback checking the transaction hash on the EVM node.
* **Our Workaround**: We built an in-app **Arkiv Entity Inspector & Sync Modal** ([`src/components/ArkivEntityModal.tsx`](../src/components/ArkivEntityModal.tsx)) that validates key checksums client-side, allows one-click MetaMask broadcast directly on Rabdi testnet, and only routes out to the Rabdi Explorer once confirmed on-chain.
* **Suggested Improvement**: Clarify the explorer message: "Entity key not found in storage. Ensure your transaction was mined on Rabdi testnet (Chain ID 7794095)."

---

## 2. What We Loved About Arkiv

1. **Native Viem Integration**: The SDK feeling like a natural extension of `viem` made it intuitive to adopt immediately.
2. **First-Class Expiration (`ExpirationTime`)**: The fact that entities expire on-chain without smart contract keeper bots or cron jobs is a game-changer for autonomous trading agents.
3. **Structured Indexing**: Being able to tag attributes as `.indexed()` and query them with SQL-like predicates without spinning up a subgraph or indexer saved immense development time.
