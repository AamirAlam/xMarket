import {
  createPublicClient,
  createWalletClient,
  defineSchema,
  str,
  addr,
  dec,
  ExpirationTime,
} from "@arkiv-network/sdk";
import { exists, eq, and } from "@arkiv-network/sdk/query";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EventPosition, AgentTradeRecord, ArkivQueryResult } from "@/types";

// Public RPC & Explorer endpoints for Arkiv Rabdi DB-Chain
export const ARKIV_CHAIN_ID = 7794095;
export const ARKIV_RPC_URL = "https://rpc.rabdi.db-chain.testnet.arkiv.network";
export const ARKIV_EXPLORER_URL = "https://rabdi.explorer.arkiv.network";
export const ARKIV_INDEXER_URL = "https://indexer.rabdi.db-chain.testnet.arkiv.network";

/**
 * Validates whether a string is a genuine 32-byte on-chain Arkiv entity key
 */
export function isValidArkivKey(key?: string | null): boolean {
  if (!key) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(key);
}

// Default Authorized Writer Account for xMarket Agents
export const ARKIV_DEFAULT_WRITER_ADDRESS =
  process.env.NEXT_PUBLIC_DEFAULT_WALLET || "0x666aaB9c94bE79AbA5bf033a393A705156AD5060";

/**
 * 1. Agent Intent Schema: Ephemeral coordination state for event catalysts
 * Owned by the user's master wallet; expires when session lifetime or event deadline concludes.
 */
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

/**
 * 2. Agent Trade Schema: Verifiable on-chain execution audit records
 * Mirrors Arbitrum One Definitive Flash bracket fills and 0G sentiment verification into Arkiv.
 */
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

/**
 * Creates an Arkiv Public Client configured with the Rabdi testnet chain
 */
export function getArkivPublicClient() {
  const accessKey = process.env.ARKIV_ACCESS_KEY || "";
  return createPublicClient({
    chain: rabdi({ accessKey }),
    transport: http(ARKIV_RPC_URL),
  });
}

/**
 * Creates an Arkiv Wallet Client for signing entity writes on Rabdi DB-Chain
 */
export function getArkivWalletClient() {
  const privateKey =
    (process.env.ARKIV_PRIVATE_KEY as `0x${string}`) ||
    (process.env.AGENT_SESSION_PRIVATE_KEY as `0x${string}`) ||
    undefined;

  if (!privateKey) return null;

  try {
    const account = privateKeyToAccount(privateKey);
    const accessKey = process.env.ARKIV_ACCESS_KEY || "";
    return createWalletClient({
      chain: rabdi({ accessKey }),
      transport: http(ARKIV_RPC_URL),
      account,
    });
  } catch (err) {
    console.warn("Failed to initialize Arkiv wallet client:", err);
    return null;
  }
}

/**
 * Writes an Agent Intent entity to Arkiv DB-Chain
 */
export async function writeAgentIntentToArkiv(
  position: EventPosition
): Promise<{ success: boolean; entityKey?: string; txHash?: string; expiresAt?: string; error?: string }> {
  try {
    const walletClient = getArkivWalletClient();

    // Format fields with Arkiv SDK types
    const entityValues = {
      positionId: position.id,
      eventName: position.eventName,
      targetHandle: position.targetHandle.replace("@", "").trim(),
      persona: position.persona || "",
      avatar: position.avatar || "",
      targetAsset: position.targetAsset,
      contraAsset: position.contraAsset,
      sizeUsdc: dec(position.sizeUsdc.toString()),
      entryPrice: dec(position.entryPrice.toString()),
      currentPrice: dec((position.currentPrice || position.entryPrice).toString()),
      side: position.side,
      pnlUsd: dec((position.pnlUsd || 0).toString()),
      pnlPct: dec((position.pnlPct || 0).toString()),
      status: position.status,
      confidenceThreshold: dec(position.confidenceThreshold.toString()),
      orderType: position.orderType || "BRACKET",
      takeProfitPct: dec(position.takeProfitPct.toString()),
      stopLossPct: dec(position.stopLossPct.toString()),
      agentWalletAddress: addr(
        (position.agentWallet?.address || ARKIV_DEFAULT_WRITER_ADDRESS) as `0x${string}`
      ),
      masterController: addr(
        (position.agentWallet?.masterController || ARKIV_DEFAULT_WRITER_ADDRESS) as `0x${string}`
      ),
      triggeredTweet: position.triggeredTweet || "",
      txHash: position.entryTxHash || position.txHash || "",
      createdAt: position.createdAt || new Date().toISOString(),
    };

    if (walletClient) {
      // 30 days lifetime for trading intent session
      const result = await walletClient.createEntity(
        AgentIntentSchema,
        entityValues,
        { expiration: ExpirationTime.fromDays(30) }
      );

      return {
        success: true,
        entityKey: result.entityKey,
        txHash: result.txHash,
        expiresAt: result.expiresAt ? result.expiresAt.toString() : undefined,
      };
    } else {
      return {
        success: false,
        error: "Arkiv writer wallet not configured or unfunded. Connect wallet or set ARKIV_PRIVATE_KEY.",
      };
    }
  } catch (err: any) {
    console.warn("Arkiv entity broadcast pending funding/key:", err?.message);
    return {
      success: false,
      error: err?.message || "Arkiv RPC write error",
    };
  }
}

/**
 * Writes an Agent Trade execution entity to Arkiv DB-Chain
 */
export async function writeAgentTradeToArkiv(
  trade: AgentTradeRecord
): Promise<{ success: boolean; entityKey?: string; txHash?: string; expiresAt?: string; error?: string }> {
  try {
    const walletClient = getArkivWalletClient();

    const tradeValues = {
      tradeId: trade.id,
      positionId: trade.positionId,
      eventName: trade.eventName,
      targetHandle: trade.targetHandle.replace("@", "").trim(),
      targetAsset: trade.targetAsset,
      contraAsset: trade.contraAsset,
      tradeType: trade.tradeType,
      side: trade.side,
      orderType: trade.orderType || "BRACKET",
      sizeUsdc: dec(trade.sizeUsdc.toString()),
      price: dec(trade.price.toString()),
      exitPrice: dec((trade.exitPrice || trade.price).toString()),
      pnlUsd: dec((trade.pnlUsd || 0).toString()),
      pnlPct: dec((trade.pnlPct || 0).toString()),
      status: trade.status,
      txHash: trade.txHash,
      explorerUrl: trade.explorerUrl,
      agentWalletAddress: addr(
        (trade.agentWalletAddress || ARKIV_DEFAULT_WRITER_ADDRESS) as `0x${string}`
      ),
      masterController: addr(
        (trade.masterController || ARKIV_DEFAULT_WRITER_ADDRESS) as `0x${string}`
      ),
      triggeredTweet: trade.triggeredTweet || "",
      createdAt: trade.createdAt || new Date().toISOString(),
    };

    if (walletClient) {
      const result = await walletClient.createEntity(
        AgentTradeSchema,
        tradeValues,
        { expiration: ExpirationTime.fromDays(90) }
      );

      return {
        success: true,
        entityKey: result.entityKey,
        txHash: result.txHash,
        expiresAt: result.expiresAt ? result.expiresAt.toString() : undefined,
      };
    } else {
      return {
        success: false,
        error: "Arkiv writer wallet not configured or unfunded.",
      };
    }
  } catch (err: any) {
    console.warn("Arkiv trade broadcast pending funding/key:", err?.message);
    return {
      success: false,
      error: err?.message || "Arkiv RPC write error",
    };
  }
}

function sanitizeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(sanitizeBigInts);
  if (typeof obj === "object") {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = sanitizeBigInts(v);
    }
    return res;
  }
  return obj;
}

/**
 * Queries Arkiv Rabdi DB-Chain entities directly using @arkiv-network/sdk
 */
export async function queryArkivEntities(filterQuery: string = "exists(status)", limit: number = 20): Promise<ArkivQueryResult[]> {
  try {
    const client = getArkivPublicClient();
    // Query directly from Rabdi testnet
    const result = await client.query(filterQuery as any, { limit });

    return result.entities.map((e: any) => {
      const attrs: Record<string, any> = {};
      if (e.$attributes) {
        for (const [k, v] of Object.entries(e.$attributes)) {
          const val = (v as any)?.value !== undefined ? (v as any).value : v;
          attrs[k] = sanitizeBigInts(val);
        }
      }

      return {
        entityKey: e.$key || "",
        owner: e.$owner || "",
        creator: e.$creator || "",
        createdAt: e.$createdAt ? e.$createdAt.toString() : "",
        expiresAt: e.$expiresAt ? e.$expiresAt.toString() : "",
        attributes: attrs,
      };
    });
  } catch (err: any) {
    console.warn("Arkiv live query failed, returning fallback telemetry:", err?.message);
    return [];
  }
}

export function getArkivEntityUrl(key: string): string {
  return `${ARKIV_EXPLORER_URL}/entity/${key}`;
}

export function getArkivTxUrl(txHash: string): string {
  return `${ARKIV_EXPLORER_URL}/tx/${txHash}`;
}
