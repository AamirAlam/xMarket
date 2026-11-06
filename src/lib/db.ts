import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { EventPosition, AgentTradeRecord } from "@/types";
import { writeAgentIntentToArkiv, writeAgentTradeToArkiv } from "@/lib/arkiv";

const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "xmarket.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      eventName TEXT NOT NULL,
      targetHandle TEXT NOT NULL,
      persona TEXT,
      avatar TEXT,
      targetAsset TEXT NOT NULL,
      contraAsset TEXT NOT NULL,
      sizeUsdc REAL NOT NULL,
      entryPrice REAL NOT NULL,
      currentPrice REAL NOT NULL,
      side TEXT NOT NULL,
      pnlUsd REAL DEFAULT 0,
      pnlPct REAL DEFAULT 0,
      takeProfitPrice REAL NOT NULL,
      stopLossPrice REAL NOT NULL,
      takeProfitPct REAL NOT NULL,
      stopLossPct REAL NOT NULL,
      status TEXT NOT NULL,
      confidenceThreshold REAL NOT NULL,
      orderType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      txHash TEXT,
      explorerUrl TEXT,
      entryTxHash TEXT,
      entryExplorerUrl TEXT,
      exitTxHash TEXT,
      exitExplorerUrl TEXT,
      exitPrice REAL,
      settledAt TEXT,
      isSwept INTEGER DEFAULT 0,
      sweepTxHash TEXT,
      triggeredTweet TEXT,
      agentWallet TEXT,
      arkivEntityKey TEXT,
      arkivTxHash TEXT,
      arkivExpiresAt INTEGER,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      positionId TEXT NOT NULL,
      eventName TEXT NOT NULL,
      targetHandle TEXT NOT NULL,
      persona TEXT,
      avatar TEXT,
      targetAsset TEXT NOT NULL,
      contraAsset TEXT NOT NULL,
      tradeType TEXT NOT NULL,
      side TEXT NOT NULL,
      orderType TEXT NOT NULL,
      sizeUsdc REAL NOT NULL,
      price REAL NOT NULL,
      exitPrice REAL,
      pnlUsd REAL DEFAULT 0,
      pnlPct REAL DEFAULT 0,
      status TEXT NOT NULL,
      txHash TEXT NOT NULL,
      explorerUrl TEXT NOT NULL,
      agentWalletAddress TEXT,
      masterController TEXT,
      triggeredTweet TEXT,
      zeroGProofId TEXT,
      arkivEntityKey TEXT,
      arkivTxHash TEXT,
      arkivExpiresAt INTEGER,
      createdAt TEXT NOT NULL
    );
  `);

  // Safe runtime migrations for existing tables
  try { db.exec("ALTER TABLE positions ADD COLUMN arkivEntityKey TEXT;"); } catch {}
  try { db.exec("ALTER TABLE positions ADD COLUMN arkivTxHash TEXT;"); } catch {}
  try { db.exec("ALTER TABLE positions ADD COLUMN arkivExpiresAt INTEGER;"); } catch {}
  try { db.exec("ALTER TABLE trades ADD COLUMN arkivEntityKey TEXT;"); } catch {}
  try { db.exec("ALTER TABLE trades ADD COLUMN arkivTxHash TEXT;"); } catch {}
  try { db.exec("ALTER TABLE trades ADD COLUMN arkivExpiresAt INTEGER;"); } catch {}
}

export function getAllPositions(): EventPosition[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM positions ORDER BY createdAt DESC").all() as any[];
  return rows.map(mapRowToPosition);
}

export function syncTradesFromPositions() {
  const db = getDb();
  const positions = getAllPositions();

  const insertTradeStmt = db.prepare(`
    INSERT INTO trades (
      id, positionId, eventName, targetHandle, persona, avatar, targetAsset,
      contraAsset, tradeType, side, orderType, sizeUsdc, price, exitPrice,
      pnlUsd, pnlPct, status, txHash, explorerUrl, agentWalletAddress,
      masterController, triggeredTweet, zeroGProofId, arkivEntityKey,
      arkivTxHash, arkivExpiresAt, createdAt
    ) VALUES (
      @id, @positionId, @eventName, @targetHandle, @persona, @avatar, @targetAsset,
      @contraAsset, @tradeType, @side, @orderType, @sizeUsdc, @price, @exitPrice,
      @pnlUsd, @pnlPct, @status, @txHash, @explorerUrl, @agentWalletAddress,
      @masterController, @triggeredTweet, @zeroGProofId, @arkivEntityKey,
      @arkivTxHash, @arkivExpiresAt, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      price = excluded.price,
      exitPrice = excluded.exitPrice,
      pnlUsd = excluded.pnlUsd,
      pnlPct = excluded.pnlPct,
      txHash = excluded.txHash,
      explorerUrl = excluded.explorerUrl,
      triggeredTweet = excluded.triggeredTweet,
      arkivEntityKey = COALESCE(excluded.arkivEntityKey, trades.arkivEntityKey),
      arkivTxHash = COALESCE(excluded.arkivTxHash, trades.arkivTxHash),
      arkivExpiresAt = COALESCE(excluded.arkivExpiresAt, trades.arkivExpiresAt)
  `);

  for (const pos of positions) {
    // 1. If position has an Entry Execution (txHash or entryTxHash and status is not ARMED)
    const entryTx = pos.entryTxHash || pos.txHash;
    if (entryTx && pos.status !== "ARMED") {
      const entryTradeId = `trade-entry-${pos.id}`;
      insertTradeStmt.run({
        id: entryTradeId,
        positionId: pos.id,
        eventName: pos.eventName,
        targetHandle: pos.targetHandle,
        persona: pos.persona || null,
        avatar: pos.avatar || null,
        targetAsset: pos.targetAsset,
        contraAsset: pos.contraAsset,
        tradeType: "ENTRY_BUY",
        side: pos.side,
        orderType: pos.orderType || "BRACKET",
        sizeUsdc: pos.sizeUsdc,
        price: pos.entryPrice,
        exitPrice: pos.exitPrice || null,
        pnlUsd: pos.status === "OPEN" ? (pos.pnlUsd || 0) : 0,
        pnlPct: pos.status === "OPEN" ? (pos.pnlPct || 0) : 0,
        status: pos.status === "OPEN" ? "OPEN" : "FILLED",
        txHash: entryTx,
        explorerUrl: pos.entryExplorerUrl || pos.explorerUrl || `https://arbiscan.io/tx/${entryTx}`,
        agentWalletAddress: pos.agentWallet?.address || null,
        masterController: pos.agentWallet?.masterController || null,
        triggeredTweet: pos.triggeredTweet || null,
        zeroGProofId: null,
        arkivEntityKey: pos.arkivEntityKey && pos.arkivEntityKey.startsWith("0x") && !pos.arkivEntityKey.startsWith("0xarkiv_") ? pos.arkivEntityKey : null,
        arkivTxHash: pos.arkivTxHash || null,
        arkivExpiresAt: pos.arkivExpiresAt || null,
        createdAt: pos.createdAt,
      });
    }

    // 2. If position has an Exit Settlement Execution
    if (pos.exitTxHash) {
      const exitTradeId = `trade-exit-${pos.id}`;
      const exitType =
        pos.status === "PROFIT_TAKEN"
          ? "EXIT_TAKE_PROFIT"
          : pos.status === "STOPPED_OUT"
          ? "EXIT_STOP_LOSS"
          : "EXIT_SELL";

      insertTradeStmt.run({
        id: exitTradeId,
        positionId: pos.id,
        eventName: pos.eventName,
        targetHandle: pos.targetHandle,
        persona: pos.persona || null,
        avatar: pos.avatar || null,
        targetAsset: pos.targetAsset,
        contraAsset: pos.contraAsset,
        tradeType: exitType,
        side: pos.side === "LONG" ? "SHORT" : "LONG",
        orderType: "MARKET",
        sizeUsdc: Math.round((pos.sizeUsdc + (pos.pnlUsd || 0)) * 100) / 100,
        price: pos.exitPrice || pos.currentPrice,
        exitPrice: pos.exitPrice || pos.currentPrice,
        pnlUsd: pos.pnlUsd || 0,
        pnlPct: pos.pnlPct || 0,
        status: "SETTLED",
        txHash: pos.exitTxHash,
        explorerUrl: pos.exitExplorerUrl || `https://arbiscan.io/tx/${pos.exitTxHash}`,
        agentWalletAddress: pos.agentWallet?.address || null,
        masterController: pos.agentWallet?.masterController || null,
        triggeredTweet: pos.triggeredTweet || null,
        zeroGProofId: null,
        arkivEntityKey: pos.arkivEntityKey && pos.arkivEntityKey.startsWith("0x") && !pos.arkivEntityKey.startsWith("0xarkiv_") ? pos.arkivEntityKey : null,
        arkivTxHash: pos.arkivTxHash || null,
        arkivExpiresAt: pos.arkivExpiresAt || null,
        createdAt: pos.settledAt || pos.createdAt,
      });
    }

    // 3. If position was emergency swept
    if (pos.isSwept && pos.sweepTxHash) {
      const sweepTradeId = `trade-sweep-${pos.id}`;
      insertTradeStmt.run({
        id: sweepTradeId,
        positionId: pos.id,
        eventName: pos.eventName,
        targetHandle: pos.targetHandle,
        persona: pos.persona || null,
        avatar: pos.avatar || null,
        targetAsset: pos.targetAsset,
        contraAsset: pos.contraAsset,
        tradeType: "SWEEP",
        side: pos.side,
        orderType: "MARKET",
        sizeUsdc: pos.sizeUsdc,
        price: pos.entryPrice,
        exitPrice: null,
        pnlUsd: 0,
        pnlPct: 0,
        status: "SWEPT",
        txHash: pos.sweepTxHash,
        explorerUrl: `https://arbiscan.io/tx/${pos.sweepTxHash}`,
        agentWalletAddress: pos.agentWallet?.address || null,
        masterController: pos.agentWallet?.masterController || null,
        triggeredTweet: pos.triggeredTweet || null,
        zeroGProofId: null,
        arkivEntityKey: pos.arkivEntityKey && pos.arkivEntityKey.startsWith("0x") && !pos.arkivEntityKey.startsWith("0xarkiv_") ? pos.arkivEntityKey : null,
        arkivTxHash: pos.arkivTxHash || null,
        arkivExpiresAt: pos.arkivExpiresAt || null,
        createdAt: pos.settledAt || pos.createdAt,
      });
    }
  }
}

export function getAllTrades(): AgentTradeRecord[] {
  const db = getDb();
  syncTradesFromPositions();
  const rows = db.prepare("SELECT * FROM trades ORDER BY createdAt DESC").all() as any[];
  return rows.map(mapRowToTrade);
}

export function saveTrade(trade: AgentTradeRecord): AgentTradeRecord {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO trades (
      id, positionId, eventName, targetHandle, persona, avatar, targetAsset,
      contraAsset, tradeType, side, orderType, sizeUsdc, price, exitPrice,
      pnlUsd, pnlPct, status, txHash, explorerUrl, agentWalletAddress,
      masterController, triggeredTweet, zeroGProofId, arkivEntityKey,
      arkivTxHash, arkivExpiresAt, createdAt
    ) VALUES (
      @id, @positionId, @eventName, @targetHandle, @persona, @avatar, @targetAsset,
      @contraAsset, @tradeType, @side, @orderType, @sizeUsdc, @price, @exitPrice,
      @pnlUsd, @pnlPct, @status, @txHash, @explorerUrl, @agentWalletAddress,
      @masterController, @triggeredTweet, @zeroGProofId, @arkivEntityKey,
      @arkivTxHash, @arkivExpiresAt, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      price = excluded.price,
      exitPrice = excluded.exitPrice,
      pnlUsd = excluded.pnlUsd,
      pnlPct = excluded.pnlPct,
      txHash = excluded.txHash,
      explorerUrl = excluded.explorerUrl,
      triggeredTweet = excluded.triggeredTweet,
      arkivEntityKey = COALESCE(excluded.arkivEntityKey, trades.arkivEntityKey),
      arkivTxHash = COALESCE(excluded.arkivTxHash, trades.arkivTxHash),
      arkivExpiresAt = COALESCE(excluded.arkivExpiresAt, trades.arkivExpiresAt)
  `);

  stmt.run({
    id: trade.id,
    positionId: trade.positionId,
    eventName: trade.eventName,
    targetHandle: trade.targetHandle,
    persona: trade.persona || null,
    avatar: trade.avatar || null,
    targetAsset: trade.targetAsset,
    contraAsset: trade.contraAsset,
    tradeType: trade.tradeType,
    side: trade.side,
    orderType: trade.orderType,
    sizeUsdc: trade.sizeUsdc,
    price: trade.price,
    exitPrice: trade.exitPrice != null ? trade.exitPrice : null,
    pnlUsd: trade.pnlUsd || 0,
    pnlPct: trade.pnlPct || 0,
    status: trade.status,
    txHash: trade.txHash,
    explorerUrl: trade.explorerUrl,
    agentWalletAddress: trade.agentWalletAddress || null,
    masterController: trade.masterController || null,
    triggeredTweet: trade.triggeredTweet || null,
    zeroGProofId: trade.zeroGProofId || null,
    arkivEntityKey: trade.arkivEntityKey || null,
    arkivTxHash: trade.arkivTxHash || null,
    arkivExpiresAt: trade.arkivExpiresAt || null,
    createdAt: trade.createdAt || new Date().toISOString(),
  });

  // Asynchronously mirror trade to Arkiv DB-Chain if not already committed
  if (!trade.arkivEntityKey) {
    writeAgentTradeToArkiv(trade).then((res) => {
      if (res.entityKey) {
        try {
          db.prepare(
            "UPDATE trades SET arkivEntityKey = ?, arkivTxHash = ?, arkivExpiresAt = ? WHERE id = ?"
          ).run(res.entityKey, res.txHash || null, Date.now() + 90 * 86400 * 1000, trade.id);
        } catch {}
      }
    });
  }

  return trade;
}

export function deletePosition(id: string): boolean {
  const db = getDb();
  const info = db.prepare("DELETE FROM positions WHERE id = ?").run(id);
  db.prepare("DELETE FROM trades WHERE positionId = ?").run(id);
  return info.changes > 0;
}

export function getPositionById(id: string): EventPosition | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM positions WHERE id = ?").get(id) as any;
  if (!row) return null;
  return mapRowToPosition(row);
}

export function getTradeById(id: string): AgentTradeRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM trades WHERE id = ?").get(id) as any;
  if (!row) return null;
  return mapRowToTrade(row);
}

export function updateArkivEntityForPosition(
  id: string,
  entityKey: string,
  txHash?: string | null,
  expiresAt?: number | string | null
): boolean {
  const db = getDb();
  const numericExpiresAt = expiresAt ? Number(expiresAt) : Date.now() + 30 * 86400 * 1000;
  const res = db
    .prepare(
      "UPDATE positions SET arkivEntityKey = ?, arkivTxHash = ?, arkivExpiresAt = ? WHERE id = ?"
    )
    .run(entityKey, txHash || null, numericExpiresAt, id);
  return res.changes > 0;
}

export function updateArkivEntityForTrade(
  id: string,
  entityKey: string,
  txHash?: string | null,
  expiresAt?: number | string | null
): boolean {
  const db = getDb();
  const numericExpiresAt = expiresAt ? Number(expiresAt) : Date.now() + 30 * 86400 * 1000;
  const res = db
    .prepare(
      "UPDATE trades SET arkivEntityKey = ?, arkivTxHash = ?, arkivExpiresAt = ? WHERE id = ?"
    )
    .run(entityKey, txHash || null, numericExpiresAt, id);
  return res.changes > 0;
}

export function savePosition(pos: EventPosition): EventPosition {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO positions (
      id, eventName, targetHandle, persona, avatar, targetAsset, contraAsset,
      sizeUsdc, entryPrice, currentPrice, side, pnlUsd, pnlPct,
      takeProfitPrice, stopLossPrice, takeProfitPct, stopLossPct,
      status, confidenceThreshold, orderType, createdAt,
      txHash, explorerUrl, entryTxHash, entryExplorerUrl,
      exitTxHash, exitExplorerUrl, exitPrice, settledAt,
      isSwept, sweepTxHash, triggeredTweet, agentWallet,
      arkivEntityKey, arkivTxHash, arkivExpiresAt, updatedAt
    ) VALUES (
      @id, @eventName, @targetHandle, @persona, @avatar, @targetAsset, @contraAsset,
      @sizeUsdc, @entryPrice, @currentPrice, @side, @pnlUsd, @pnlPct,
      @takeProfitPrice, @stopLossPrice, @takeProfitPct, @stopLossPct,
      @status, @confidenceThreshold, @orderType, @createdAt,
      @txHash, @explorerUrl, @entryTxHash, @entryExplorerUrl,
      @exitTxHash, @exitExplorerUrl, @exitPrice, @settledAt,
      @isSwept, @sweepTxHash, @triggeredTweet, @agentWallet,
      @arkivEntityKey, @arkivTxHash, @arkivExpiresAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      eventName = excluded.eventName,
      targetHandle = excluded.targetHandle,
      persona = excluded.persona,
      avatar = excluded.avatar,
      targetAsset = excluded.targetAsset,
      contraAsset = excluded.contraAsset,
      sizeUsdc = excluded.sizeUsdc,
      entryPrice = excluded.entryPrice,
      currentPrice = excluded.currentPrice,
      side = excluded.side,
      pnlUsd = excluded.pnlUsd,
      pnlPct = excluded.pnlPct,
      takeProfitPrice = excluded.takeProfitPrice,
      stopLossPrice = excluded.stopLossPrice,
      takeProfitPct = excluded.takeProfitPct,
      stopLossPct = excluded.stopLossPct,
      status = excluded.status,
      confidenceThreshold = excluded.confidenceThreshold,
      orderType = excluded.orderType,
      txHash = excluded.txHash,
      explorerUrl = excluded.explorerUrl,
      entryTxHash = excluded.entryTxHash,
      entryExplorerUrl = excluded.entryExplorerUrl,
      exitTxHash = excluded.exitTxHash,
      exitExplorerUrl = excluded.exitExplorerUrl,
      exitPrice = excluded.exitPrice,
      settledAt = excluded.settledAt,
      isSwept = excluded.isSwept,
      sweepTxHash = excluded.sweepTxHash,
      triggeredTweet = excluded.triggeredTweet,
      agentWallet = excluded.agentWallet,
      arkivEntityKey = COALESCE(excluded.arkivEntityKey, positions.arkivEntityKey),
      arkivTxHash = COALESCE(excluded.arkivTxHash, positions.arkivTxHash),
      arkivExpiresAt = COALESCE(excluded.arkivExpiresAt, positions.arkivExpiresAt),
      updatedAt = excluded.updatedAt
  `);

  stmt.run({
    id: pos.id,
    eventName: pos.eventName,
    targetHandle: pos.targetHandle,
    persona: pos.persona || null,
    avatar: pos.avatar || null,
    targetAsset: pos.targetAsset,
    contraAsset: pos.contraAsset,
    sizeUsdc: pos.sizeUsdc,
    entryPrice: pos.entryPrice,
    currentPrice: pos.currentPrice,
    side: pos.side,
    pnlUsd: pos.pnlUsd || 0,
    pnlPct: pos.pnlPct || 0,
    takeProfitPrice: pos.takeProfitPrice,
    stopLossPrice: pos.stopLossPrice,
    takeProfitPct: pos.takeProfitPct,
    stopLossPct: pos.stopLossPct,
    status: pos.status,
    confidenceThreshold: pos.confidenceThreshold,
    orderType: pos.orderType,
    createdAt: pos.createdAt || new Date().toISOString(),
    txHash: pos.txHash || null,
    explorerUrl: pos.explorerUrl || null,
    entryTxHash: pos.entryTxHash || null,
    entryExplorerUrl: pos.entryExplorerUrl || null,
    exitTxHash: pos.exitTxHash || null,
    exitExplorerUrl: pos.exitExplorerUrl || null,
    exitPrice: pos.exitPrice != null ? pos.exitPrice : null,
    settledAt: pos.settledAt || null,
    isSwept: pos.isSwept ? 1 : 0,
    sweepTxHash: pos.sweepTxHash || null,
    triggeredTweet: pos.triggeredTweet || null,
    agentWallet: pos.agentWallet ? JSON.stringify(pos.agentWallet) : null,
    arkivEntityKey: pos.arkivEntityKey || null,
    arkivTxHash: pos.arkivTxHash || null,
    arkivExpiresAt: pos.arkivExpiresAt || null,
    updatedAt: new Date().toISOString(),
  });

  // Asynchronously mirror new agent intent to Arkiv DB-Chain
  if (!pos.arkivEntityKey) {
    writeAgentIntentToArkiv(pos).then((res) => {
      if (res.entityKey) {
        try {
          db.prepare(
            "UPDATE positions SET arkivEntityKey = ?, arkivTxHash = ?, arkivExpiresAt = ? WHERE id = ?"
          ).run(res.entityKey, res.txHash || null, Date.now() + 30 * 86400 * 1000, pos.id);
        } catch {}
      }
    });
  }

  try {
    syncTradesFromPositions();
  } catch (e) {
    console.warn("Could not sync trades on savePosition:", e);
  }

  return pos;
}

function mapRowToTrade(row: any): AgentTradeRecord {
  return {
    id: row.id,
    positionId: row.positionId,
    eventName: row.eventName,
    targetHandle: row.targetHandle,
    persona: row.persona || undefined,
    avatar: row.avatar || undefined,
    targetAsset: row.targetAsset,
    contraAsset: row.contraAsset,
    tradeType: row.tradeType,
    side: row.side,
    orderType: row.orderType,
    sizeUsdc: row.sizeUsdc,
    price: row.price,
    exitPrice: row.exitPrice != null ? row.exitPrice : undefined,
    pnlUsd: row.pnlUsd != null ? row.pnlUsd : undefined,
    pnlPct: row.pnlPct != null ? row.pnlPct : undefined,
    status: row.status,
    txHash: row.txHash,
    explorerUrl: row.explorerUrl,
    agentWalletAddress: row.agentWalletAddress || undefined,
    masterController: row.masterController || undefined,
    triggeredTweet: row.triggeredTweet || undefined,
    zeroGProofId: row.zeroGProofId || undefined,
    arkivEntityKey: row.arkivEntityKey || undefined,
    arkivTxHash: row.arkivTxHash || undefined,
    arkivExpiresAt: row.arkivExpiresAt || undefined,
    createdAt: row.createdAt,
  };
}

function mapRowToPosition(row: any): EventPosition {
  return {
    id: row.id,
    eventName: row.eventName,
    targetHandle: row.targetHandle,
    persona: row.persona || undefined,
    avatar: row.avatar || undefined,
    targetAsset: row.targetAsset,
    contraAsset: row.contraAsset,
    sizeUsdc: row.sizeUsdc,
    entryPrice: row.entryPrice,
    currentPrice: row.currentPrice,
    side: row.side,
    pnlUsd: row.pnlUsd,
    pnlPct: row.pnlPct,
    takeProfitPrice: row.takeProfitPrice,
    stopLossPrice: row.stopLossPrice,
    takeProfitPct: row.takeProfitPct,
    stopLossPct: row.stopLossPct,
    status: row.status,
    confidenceThreshold: row.confidenceThreshold,
    orderType: row.orderType,
    createdAt: row.createdAt,
    txHash: row.txHash || undefined,
    explorerUrl: row.explorerUrl || undefined,
    entryTxHash: row.entryTxHash || undefined,
    entryExplorerUrl: row.entryExplorerUrl || undefined,
    exitTxHash: row.exitTxHash || undefined,
    exitExplorerUrl: row.exitExplorerUrl || undefined,
    exitPrice: row.exitPrice != null ? row.exitPrice : undefined,
    settledAt: row.settledAt || undefined,
    isSwept: row.isSwept === 1,
    sweepTxHash: row.sweepTxHash || undefined,
    triggeredTweet: row.triggeredTweet || undefined,
    agentWallet: row.agentWallet ? JSON.parse(row.agentWallet) : undefined,
    arkivEntityKey: row.arkivEntityKey || undefined,
    arkivTxHash: row.arkivTxHash || undefined,
    arkivExpiresAt: row.arkivExpiresAt || undefined,
  };
}

