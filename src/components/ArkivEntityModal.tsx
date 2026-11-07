"use client";

import React, { useState } from "react";
import { EventPosition, AgentTradeRecord } from "@/types";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Database,
  RefreshCw,
  Clock,
  Key,
  AlertTriangle,
  Flame,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { isValidArkivKey } from "@/lib/arkiv";

interface ArkivEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: EventPosition | null;
  trade?: AgentTradeRecord | null;
  onSyncSuccess?: (entityKey: string, txHash?: string, expiresAt?: string) => void;
  onNavigateToTerminalArkiv?: () => void;
}

export function ArkivEntityModal({
  isOpen,
  onClose,
  position,
  trade,
  onSyncSuccess,
  onNavigateToTerminalArkiv,
}: ArkivEntityModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen || (!position && !trade)) return null;

  const entityKey = position?.arkivEntityKey || trade?.arkivEntityKey || null;
  const txHash = position?.arkivTxHash || trade?.arkivTxHash || null;
  const isConfirmedOnChain = isValidArkivKey(entityKey);

  const schemaName = position ? "xmarket.agent_intent" : "xmarket.agent_trade";
  const entityId = position?.id || trade?.id || "";
  const eventName = position?.eventName || trade?.eventName || "";
  const targetAsset = position?.targetAsset || trade?.targetAsset || "ETH";
  const contraAsset = position?.contraAsset || trade?.contraAsset || "USDC";
  const side = position?.side || trade?.side || "LONG";
  const sizeUsdc = position?.sizeUsdc || trade?.sizeUsdc || 0;
  const status = position?.status || trade?.status || "ARMED";
  const agentWallet =
    position?.agentWallet?.address ||
    trade?.agentWalletAddress ||
    "0x666aaB9c94bE79AbA5bf033a393A705156AD5060";
  const masterWallet =
    position?.agentWallet?.masterController ||
    trade?.masterController ||
    agentWallet;

  const entityPayload = position
    ? {
        positionId: position.id,
        eventName: position.eventName,
        targetHandle: position.targetHandle.replace("@", "").trim(),
        targetAsset: position.targetAsset,
        contraAsset: position.contraAsset,
        sizeUsdc: position.sizeUsdc.toString(),
        entryPrice: position.entryPrice.toString(),
        currentPrice: (position.currentPrice || position.entryPrice).toString(),
        side: position.side,
        orderType: position.orderType || "BRACKET",
        pnlUsd: (position.pnlUsd || 0).toString(),
        pnlPct: (position.pnlPct || 0).toString(),
        status: position.status,
        confidenceThreshold: position.confidenceThreshold.toString(),
        takeProfitPct: position.takeProfitPct.toString(),
        stopLossPct: position.stopLossPct.toString(),
        agentWalletAddress: agentWallet,
        masterController: masterWallet,
        triggeredTweet: position.triggeredTweet || "",
        createdAt: position.createdAt,
      }
    : {
        tradeId: trade?.id,
        positionId: trade?.positionId,
        eventName: trade?.eventName,
        targetHandle: trade?.targetHandle?.replace("@", "").trim(),
        targetAsset: trade?.targetAsset,
        contraAsset: trade?.contraAsset,
        tradeType: trade?.tradeType,
        side: trade?.side,
        orderType: trade?.orderType || "BRACKET",
        sizeUsdc: trade?.sizeUsdc?.toString(),
        price: trade?.price?.toString(),
        status: trade?.status,
        txHash: trade?.txHash,
        agentWalletAddress: agentWallet,
        masterController: masterWallet,
        createdAt: trade?.createdAt,
      };

  const handleCopy = (text: string, type: "key" | "tx" | "json") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === "tx") {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleSyncToArkiv = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus("Contacting Arkiv Rabdi DB-Chain RPC...");

    try {
      // 1. Try server-side broadcast endpoint first
      const res = await fetch("/api/arkiv/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: position ? position.id : undefined,
          tradeId: trade ? trade.id : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.entityKey) {
        setSyncStatus("✓ Entity successfully mined on Rabdi DB-Chain!");
        if (onSyncSuccess) {
          onSyncSuccess(data.entityKey, data.txHash, data.expiresAt);
        }
        return;
      }

      // 2. If server wallet is unfunded or not set, prompt MetaMask to switch to Rabdi testnet
      const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
      if (!eth) {
        throw new Error(
          data.error ||
            "Server writer wallet unfunded and MetaMask wallet is not installed. Please get testnet tGLM from the faucet."
        );
      }

      setSyncStatus("Prompting MetaMask network switch to Arkiv Rabdi Testnet...");

      // Ensure chain is Rabdi testnet (7794095 / 0x76edaf)
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x76edaf" }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x76edaf",
                chainName: "Arkiv Rabdi Testnet",
                nativeCurrency: { name: "Testnet GLM", symbol: "tGLM", decimals: 18 },
                rpcUrls: ["https://rpc.rabdi.db-chain.testnet.arkiv.network"],
                blockExplorerUrls: ["https://rabdi.explorer.arkiv.network"],
              },
            ],
          });
        } else {
          throw switchErr;
        }
      }

      // Check balance / account
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No connected account in MetaMask.");
      }

      const balanceHex = await eth.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      const balance = BigInt(balanceHex || "0x0");

      if (balance === BigInt(0)) {
        throw new Error(
          `Your wallet ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} has 0 tGLM on Rabdi testnet. Please claim free tGLM from https://hub.arkiv.network/faucet first.`
        );
      }

      setSyncStatus("Broadcasting entity transaction to Rabdi DB-Chain...");

      // Write transaction via SDK client
      const { createWalletClient, custom } = await import("viem");
      const { rabdi } = await import("@arkiv-network/sdk/chains");
      const { createWalletClient: createArkivWallet, ExpirationTime } = await import("@arkiv-network/sdk");
      const { AgentIntentSchema, AgentTradeSchema } = await import("@/lib/arkiv");

      const arkivClient = createArkivWallet({
        account: accounts[0],
        chain: rabdi({ accessKey: "" }),
        transport: custom(eth),
      });

      const schema = position ? AgentIntentSchema : AgentTradeSchema;
      const result = await arkivClient.createEntity(
        schema as any,
        entityPayload as any,
        { expiration: ExpirationTime.fromDays(30) }
      );

      // Save on-chain result to SQLite
      await fetch("/api/arkiv/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: position ? position.id : undefined,
          tradeId: trade ? trade.id : undefined,
          entityKey: result.entityKey,
          txHash: result.txHash,
          expiresAt: result.expiresAt ? result.expiresAt.toString() : undefined,
        }),
      });

      setSyncStatus("✓ Entity successfully confirmed on Rabdi DB-Chain!");
      if (onSyncSuccess) {
        onSyncSuccess(result.entityKey, result.txHash, result.expiresAt?.toString());
      }
    } catch (err: any) {
      console.error("Arkiv sync error:", err);
      setSyncError(err?.message || "Failed to broadcast entity to Arkiv DB-Chain");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Arkiv DB-Chain
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Rabdi Testnet (7794095)
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <span>{schemaName}</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Box */}
          {isConfirmedOnChain ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Verified on Rabdi DB-Chain
                </span>
                <a
                  href={`https://rabdi.explorer.arkiv.network/entity/${entityKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  <span>Open in Arkiv Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Key className="w-3 h-3 text-emerald-600" /> Entity Key:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>
                      {entityKey?.slice(0, 10)}...{entityKey?.slice(-8)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(entityKey || "", "key")}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Copy entity key"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {txHash && (
                  <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Tx Hash:
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <a
                        href={`https://rabdi.explorer.arkiv.network/tx/${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline"
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(txHash || "", "tx")}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-900 text-sm">
                    Ephemeral Agent State — Ready for Rabdi DB-Chain
                  </div>
                  <p className="text-amber-800/90 leading-relaxed">
                    This intent is currently saved in local coordinator storage. Arkiv is an Ethereum-aligned
                    database where entities live on-chain, are owned by your wallet, and expire automatically after 30 days.
                    Writing this entity to Rabdi testnet requires a micro-fee in testnet <span className="font-bold">tGLM</span>.
                  </p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncToArkiv}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Broadcasting..." : "Broadcast to Rabdi DB-Chain"}</span>
                </button>

                <a
                  href="https://hub.arkiv.network/faucet"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium text-xs transition inline-flex items-center gap-1"
                >
                  <span>Claim Free tGLM Faucet</span>
                  <ExternalLink className="w-3 h-3 text-amber-600" />
                </a>

                {onNavigateToTerminalArkiv && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTerminalArkiv();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition inline-flex items-center gap-1"
                  >
                    <span>Arkiv SQL Explorer</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>

              {syncStatus && (
                <div className="mt-2.5 p-2 rounded-lg bg-white/90 border border-amber-200 text-[11px] font-mono text-amber-900 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{syncStatus}</span>
                </div>
              )}

              {syncError && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}
            </div>
          )}

          {/* Structured Attributes Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Entity Indexed Attributes
              </span>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(entityPayload, null, 2), "json")}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Event / Market</span>
                <span className="font-semibold text-slate-900 truncate block">{eventName}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Asset Pair</span>
                <span className="font-semibold text-slate-900">{targetAsset} / {contraAsset}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Strategy Side</span>
                <span className="font-semibold text-blue-600">{side} BRACKET</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Allocation</span>
                <span className="font-semibold text-slate-900">${sizeUsdc} USDC</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Lifecycle Status</span>
                <span className="font-semibold text-emerald-700">{status}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-mono block flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-500" /> Arkiv Expiration
                </span>
                <span className="font-semibold text-slate-900">30 Days (Block TTL)</span>
              </div>
            </div>

            {/* Wallet Ownership */}
            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Agent Wallet:</span>
                <span className="text-slate-800 font-bold">{agentWallet}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold font-mono">
                Cryptographic Owner
              </span>
            </div>
          </div>

          {/* ETHGlobal Mumbai Track Compliance Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>🧩 ETHGlobal Mumbai — Build on Arkiv (from scratch) Track</span>
            </div>
            <p>
              Autonomous agents coordinate through ephemeral entities with SQL-like queryable attributes and
              cryptographic ownership. Each entity automatically expires when its trading deadline is reached.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <a
            href="https://rabdi.explorer.arkiv.network"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <span>Rabdi Block Explorer</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

