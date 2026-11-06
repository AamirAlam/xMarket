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
  DollarSign,
  Layers,
  Radio,
  Database,
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
    setTimeout(() => setCopiedKey(null), 1500);
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Real Trades Executed */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Real Agent Executions
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{trades.length}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Arbitrum One
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous on-chain trades</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Cumulative Traded Volume */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Total Traded Volume
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${totalVolumeUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">USDC collateral allocated</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Net Realized / Active PnL */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Net Performance
            </span>
            <div
              className={`text-2xl font-black font-mono flex items-center gap-1 ${
                totalRealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {totalRealizedPnl >= 0 ? "+" : ""}
              ${totalRealizedPnl.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500">Combined PnL across executions</p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              totalRealizedPnl >= 0
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-rose-50 text-rose-600 border-rose-100"
            }`}
          >
            {totalRealizedPnl >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Card 4: Execution Architecture */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Execution Security
            </span>
            <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-600 fill-current" />
              <span>Definitive Flash</span>
            </div>
            <p className="text-[11px] text-slate-500">MEV Protected • 0G TEE Traces</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Real Agents Trade History ({filteredTrades.length})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  Live On-Chain
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cryptographically executed Arbitrum One trades triggered by 0G verified catalysts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-white text-blue-600 shadow-2xs"
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
                    ? "bg-white text-blue-600 shadow-2xs"
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
                    ? "bg-white text-blue-600 shadow-2xs"
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                title="Refresh real trade history from database"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search trades by catalyst, Twitter handle, persona, token, or Tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Trades Table */}
        {filteredTrades.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Agent / Catalyst</th>
                  <th className="py-3.5 px-4">Action &amp; Pair</th>
                  <th className="py-3.5 px-4">Size &amp; Order</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">PnL</th>
                  <th className="py-3.5 px-4">Smart Account</th>
                  <th className="py-3.5 px-4 text-right">On-Chain Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs bg-white">
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
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{formattedDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{formattedTime}</div>
                      </td>

                      {/* 2. Agent / Catalyst */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          {t.avatar ? (
                            <Image
                              src={t.avatar}
                              alt={t.persona || t.targetHandle}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                              {(t.persona || t.targetHandle).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {t.persona || t.eventName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <span>@{t.targetHandle.replace("@", "")}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 truncate">{t.eventName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Triggered Tweet Preview if available */}
                        {t.triggeredTweet && (
                          <div
                            className="mt-1.5 text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 truncate"
                            title={t.triggeredTweet}
                          >
                            &ldquo;{t.triggeredTweet}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* 3. Action & Pair */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mb-1">
                          {t.tradeType === "ENTRY_BUY" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              ENTRY BUY
                            </span>
                          )}
                          {t.tradeType === "EXIT_TAKE_PROFIT" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <TrendingUp className="w-2.5 h-2.5" />
                              TAKE PROFIT
                            </span>
                          )}
                          {t.tradeType === "EXIT_STOP_LOSS" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                              <TrendingDown className="w-2.5 h-2.5" />
                              STOP LOSS
                            </span>
                          )}
                          {t.tradeType === "EXIT_SELL" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              SETTLED EXIT
                            </span>
                          )}
                          {t.tradeType === "SWEEP" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              SWEEP
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              t.side === "LONG"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {t.side}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 font-mono text-[11px]">
                          {t.targetAsset}/{t.contraAsset}
                        </div>
                      </td>

                      {/* 4. Size & Order */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          ${t.sizeUsdc.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {t.orderType} Flash Order
                        </div>
                      </td>

                      {/* 5. Executed Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-900">
                          ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {t.exitPrice && t.exitPrice !== t.price && (
                          <div className="text-[10px] text-slate-400">
                            Exit: ${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* 6. PnL */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.pnlUsd !== undefined && (t.status === "OPEN" || t.status === "SETTLED") ? (
                          <div
                            className={`inline-flex items-center gap-1 font-bold font-mono text-xs px-2 py-0.5 rounded-md ${
                              t.pnlUsd >= 0
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {t.pnlUsd >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {t.pnlUsd >= 0 ? "+" : ""}${t.pnlUsd.toFixed(2)} ({t.pnlPct ? (t.pnlPct >= 0 ? `+${t.pnlPct}%` : `${t.pnlPct}%`) : "0%"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* 7. Smart Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.agentWalletAddress ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://arbiscan.io/address/${t.agentWalletAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 transition"
                            >
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>
                                {t.agentWalletAddress.slice(0, 6)}...{t.agentWalletAddress.slice(-4)}
                              </span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(t.agentWalletAddress!, `addr-${t.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
                              title="Copy smart account address"
                            >
                              {copiedKey === `addr-${t.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Non-Custodial</span>
                        )}
                      </td>

                      {/* 8. On-Chain Tx & Explorer */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setArkivModalTrade(t)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] border transition shadow-2xs cursor-pointer ${
                              t.arkivEntityKey && isValidArkivKey(t.arkivEntityKey)
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                            title="Inspect / Sync Trade Entity on Arkiv DB-Chain"
                          >
                            <Database className="w-2.5 h-2.5 text-amber-600" />
                            <span>Arkiv</span>
                            {t.arkivEntityKey && isValidArkivKey(t.arkivEntityKey) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </button>
                          <a
                            href={t.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition shadow-2xs"
                          >
                            <span>Arbiscan</span>
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(t.txHash, `tx-${t.id}`)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
                            title="Copy transaction hash"
                          >
                            {copiedKey === `tx-${t.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {t.txHash.slice(0, 8)}...{t.txHash.slice(-6)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-14 px-6 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <History className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                {searchQuery || filterType !== "ALL"
                  ? "No matching trade executions found"
                  : "No Real Agent Trades Executed Yet"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery || filterType !== "ALL"
                  ? "Try resetting your search query or filters to see all recorded on-chain trades."
                  : "Deploy an event trading agent or wait for 0G sentiment verification to fire. All executed trades on Arbitrum One will appear here permanently with cryptographic proofs."}
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

      {/* Arkiv Entity Inspector & Sync Modal */}
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
