"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { AgentTradeRecord } from "@/types";
import {
  History,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Zap,
  Copy,
  Check,
  Search,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Database,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ArkivEntityModal } from "@/components/ArkivEntityModal";
import { isValidArkivKey } from "@/lib/arkiv";

interface TradesHistoryTableProps {
  trades: AgentTradeRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDeployNewTrade?: () => void;
}

export function TradesHistoryTable({
  trades,
  isLoading = false,
  onRefresh,
  onDeployNewTrade,
}: TradesHistoryTableProps) {
  const [filterType, setFilterType] = useState<"ALL" | "ENTRY" | "EXIT">("ALL");
  const [selectedAsset, setSelectedAsset] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [arkivModalTrade, setArkivModalTrade] = useState<AgentTradeRecord | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Type filter
      if (filterType === "ENTRY" && trade.tradeType !== "ENTRY_BUY") return false;
      if (
        filterType === "EXIT" &&
        trade.tradeType !== "EXIT_TAKE_PROFIT" &&
        trade.tradeType !== "EXIT_STOP_LOSS" &&
        trade.tradeType !== "EXIT_SELL" &&
        trade.tradeType !== "CLOSE" &&
        trade.tradeType !== "SWEEP"
      ) {
        return false;
      }

      // Asset filter
      if (selectedAsset !== "ALL" && trade.targetAsset !== selectedAsset) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEvent = trade.eventName.toLowerCase().includes(q);
        const matchesHandle = trade.targetHandle.toLowerCase().includes(q);
        const matchesPersona = trade.persona?.toLowerCase().includes(q) ?? false;
        const matchesAsset = trade.targetAsset.toLowerCase().includes(q);
        const matchesTx = trade.txHash.toLowerCase().includes(q);
        const matchesWallet = trade.agentWalletAddress?.toLowerCase().includes(q) ?? false;
        const matchesTweet = trade.triggeredTweet?.toLowerCase().includes(q) ?? false;

        if (
          !matchesEvent &&
          !matchesHandle &&
          !matchesPersona &&
          !matchesAsset &&
          !matchesTx &&
          !matchesWallet &&
          !matchesTweet
        ) {
          return false;
        }
      }

      return true;
    });
  }, [trades, filterType, selectedAsset, searchQuery]);

  // Aggregate stats
  const totalVolumeUsdc = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.sizeUsdc || 0), 0);
  }, [trades]);

  const totalRealizedPnl = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  }, [trades]);

  const availableAssets = useMemo(() => {
    const set = new Set(trades.map((t) => t.targetAsset));
    return Array.from(set);
  }, [trades]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Minimal Metric Strip - Clean Inter Typography & Low Density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Trades */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Total Executions</span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{trades.length}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
              Arbitrum One
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Autonomous agent orders</div>
        </div>

        {/* Metric 2: Traded Volume */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Total Traded Volume</span>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            ${totalVolumeUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">USDC collateral deployed</div>
        </div>

        {/* Metric 3: Net Realized PnL */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Net Realized PnL</span>
          <div className={`text-2xl font-bold tracking-tight flex items-center gap-1 ${
            totalRealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}>
            <span>{totalRealizedPnl >= 0 ? "+" : ""}${totalRealizedPnl.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-slate-400">Across settled bracket exits</div>
        </div>

        {/* Metric 4: Execution Architecture */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Execution Engine</span>
          <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
            <Zap className="w-4 h-4 text-blue-600 fill-current" />
            <span>Definitive Flash</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MEV Protected • 0G TEE</span>
          </div>
        </div>
      </div>

      {/* 2. Main Table Card */}
      <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        {/* Controls Bar: Title + Segmented Filters + Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Trade Executions
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredTrades.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified on-chain executions and bracket order fills
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Minimal Segmented Filter Pills */}
            <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({trades.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("ENTRY")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === "ENTRY"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Entries
              </button>
              <button
                type="button"
                onClick={() => setFilterType("EXIT")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === "EXIT"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Settlements
              </button>
            </div>

            {/* Asset Dropdown if multiple */}
            {availableAssets.length > 1 && (
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Assets</option>
                {availableAssets.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh trade history"
                className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by catalyst, handle, token, or Tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Trades Table - Spacious, Low Density & Inter Typography */}
        {filteredTrades.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Catalyst &amp; Agent</th>
                  <th className="py-3 px-4">Action &amp; Pair</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Realized PnL</th>
                  <th className="py-3 px-4 text-right">Verification &amp; Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTrades.map((t) => {
                  const dateObj = new Date(t.createdAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* 1. Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{formattedDate}</div>
                        <div className="text-[11px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* 2. Catalyst & Agent */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          {t.avatar ? (
                            <Image
                              src={t.avatar}
                              alt={t.persona || t.targetHandle}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200/80 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                              {(t.persona || t.targetHandle).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate" title={t.triggeredTweet || undefined}>
                              {t.persona || t.eventName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              @{t.targetHandle.replace("@", "")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Action & Pair */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {t.tradeType === "ENTRY_BUY" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              BUY
                            </span>
                          )}
                          {t.tradeType === "EXIT_TAKE_PROFIT" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <TrendingUp className="w-2.5 h-2.5" />
                              TAKE PROFIT
                            </span>
                          )}
                          {t.tradeType === "EXIT_STOP_LOSS" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                              <TrendingDown className="w-2.5 h-2.5" />
                              STOP LOSS
                            </span>
                          )}
                          {(t.tradeType === "EXIT_SELL" || t.tradeType === "CLOSE") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {t.tradeType === "CLOSE" ? "CLOSED" : "EXIT"}
                            </span>
                          )}
                          {t.tradeType === "SWEEP" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              SWEEP
                            </span>
                          )}

                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            t.side === "LONG"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {t.side}
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 text-xs">
                          {t.targetAsset}/{t.contraAsset}
                        </div>
                      </td>

                      {/* 4. Size */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          ${t.sizeUsdc.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.orderType}
                        </div>
                      </td>

                      {/* 5. Executed Price */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {t.exitPrice && t.exitPrice !== t.price && (
                          <div className="text-[11px] text-slate-400">
                            Exit: ${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* 6. Realized PnL */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {t.pnlUsd !== undefined && (t.status === "OPEN" || t.status === "SETTLED") ? (
                          <div className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full border ${
                            t.pnlUsd >= 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-rose-50 text-rose-700 border-rose-200/80"
                          }`}>
                            {t.pnlUsd >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {t.pnlUsd >= 0 ? "+" : ""}${t.pnlUsd.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* 7. Verification & Hash */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Arkiv DB Pill */}
                          <button
                            type="button"
                            onClick={() => setArkivModalTrade(t)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs border transition shadow-2xs cursor-pointer ${
                              t.arkivEntityKey && isValidArkivKey(t.arkivEntityKey)
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80"
                            }`}
                            title="Inspect on Arkiv DB-Chain"
                          >
                            <Database className="w-3 h-3 text-amber-600" />
                            <span>Arkiv</span>
                            {t.arkivEntityKey && isValidArkivKey(t.arkivEntityKey) ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>

                          {/* Arbiscan Link */}
                          <a
                            href={t.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 transition"
                            title="View on Arbiscan"
                          >
                            <span>Arbiscan</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>

                          {/* Copy Hash */}
                          <button
                            type="button"
                            onClick={() => handleCopy(t.txHash, `tx-${t.id}`)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
                            title="Copy Tx Hash"
                          >
                            {copiedKey === `tx-${t.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {t.txHash.startsWith("0x")
                            ? `${t.txHash.slice(0, 8)}...${t.txHash.slice(-6)}`
                            : t.txHash.length > 22
                            ? `${t.txHash.slice(0, 18)}...`
                            : t.txHash}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Clean Minimal Empty State */
          <div className="py-14 px-6 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <History className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                {searchQuery || filterType !== "ALL"
                  ? "No matching trade executions"
                  : "No Trade Executions Yet"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery || filterType !== "ALL"
                  ? "Try clearing your search query or switching filters to see all recorded executions."
                  : "Deploy an event trading agent from the Positions tab. When catalysts occur, verified executions on Arbitrum One will appear here."}
              </p>
            </div>

            {searchQuery || filterType !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("ALL");
                  setSelectedAsset("ALL");
                }}
                className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : onDeployNewTrade ? (
              <button
                type="button"
                onClick={onDeployNewTrade}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Deploy New Event Agent</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Arkiv Entity Inspector Modal */}
      {arkivModalTrade && (
        <ArkivEntityModal
          isOpen={!!arkivModalTrade}
          onClose={() => setArkivModalTrade(null)}
          trade={arkivModalTrade}
          onSyncSuccess={(entityKey, txHash, expiresAt) => {
            setArkivModalTrade({
              ...arkivModalTrade,
              arkivEntityKey: entityKey,
              arkivTxHash: txHash,
              arkivExpiresAt: expiresAt ? Number(expiresAt) : undefined,
            });
            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </div>
  );
}
