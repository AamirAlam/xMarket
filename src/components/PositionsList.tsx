"use client";

import React, { useState, useEffect } from "react";
import { EventPosition, PositionStatus } from "@/types";
import {
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Radio,
  ArrowUpRight,
  Plus,
  X,
  Copy,
  Check,
  Wallet,
  Trash2,
  Pause,
  Play,
  PauseCircle,
  Zap,
  RefreshCw,
  AlertCircle,
  Database,
  ArrowDown,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { ArkivEntityModal } from "@/components/ArkivEntityModal";
import { isValidArkivKey } from "@/lib/arkiv";

function ArbitrumBadgeIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 1.5L2.5 7v10L12 22.5l9.5-5.5V7L12 1.5z"
        fill="#28A0F0"
      />
      <path
        d="M12.03 6.22l-5.4 8.52h2.63l1.39-2.2 2.6 4.09h2.63l-3.85-6.03 1.68-2.65-1.68-1.73z"
        fill="#FFFFFF"
      />
      <path
        d="M15.15 14.74h2.63l-1.68-2.65-1.39 2.2.44.45z"
        fill="#96BEDC"
      />
    </svg>
  );
}

function UsdcTokenIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#2775CA" />
      <circle cx="20" cy="20" r="16.5" stroke="#7BAAE0" strokeWidth="1.2" strokeOpacity="0.4" />
      <path
        d="M21.75 17.25c0-2.25-1.38-3-4-3.38-1.88-.25-2.25-.75-2.25-1.63 0-.88.75-1.5 2.13-1.5 1.38 0 2.13.5 2.5 1.38.13.25.38.38.63.25l1.38-.75c.25-.13.25-.38.13-.63-.63-1.38-2-2.25-3.88-2.5v-1.75c0-.25-.25-.5-.5-.5h-1.25c-.25 0-.5.25-.5.5v1.63c-2.13.38-3.5 1.75-3.5 3.5 0 2.25 1.38 3.13 4 3.5 1.88.38 2.25.75 2.25 1.75 0 1-1 1.63-2.38 1.63-1.75 0-2.63-.75-3-1.75-.13-.25-.38-.38-.63-.25l-1.5.75c-.25.13-.25.38-.13.63.63 1.63 2.25 2.63 4.5 2.88v1.75c0 .25.25.5.5.5h1.25c.25 0 .5-.25.5-.5v-1.75c2.13-.38 3.63-1.75 3.63-3.63z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function WbtcTokenIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="20" cy="20" r="16.5" fill="#F7931A" />
      <path
        d="M26.5 17.6c.32-1.92-1.18-2.95-3.17-3.64l.65-2.6-1.58-.4-.63 2.53c-.42-.1-.85-.2-1.27-.3l.64-2.56-1.58-.39-.65 2.6c-.35-.08-.69-.16-1.02-.24l.01-.03-2.19-.55-.42 1.7s1.17.27 1.15.28c.64.16.76.59.74.93l-.74 2.98c.05.01.1.03.16.05-.05-.02-.11-.03-.16-.05l-1.04 4.19c-.08.19-.27.49-.72.38.02.03-1.15-.28-1.15-.28l-.79 1.82 2.06.51c.38.1.76.19 1.14.28l-.66 2.65 1.58.4.65-2.61c.43.12.85.22 1.26.32l-.64 2.58 1.58.4.66-2.64c2.7.51 4.74.3 5.59-2.14.69-1.96-.04-3.09-1.45-3.83 1.03-.24 1.8-.92 2.01-2.31zm-3.6 5.05c-.5 1.97-3.81.9-4.88.64l.87-3.49c1.07.27 4.52.8 4.01 2.85zm.5-5.08c-.45 1.8-3.21.89-4.11.66l.79-3.17c.9.23 3.79.65 3.32 2.51z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function WethTokenIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#627EEA" />
      <g fill="#FFFFFF" fillOpacity="0.95">
        <path d="M20 7l-7 11.6 7 4.2 7-4.2L20 7z" />
        <path d="M20 7v15.8l7-4.2L20 7z" fillOpacity="0.8" />
        <path d="M20 24.3l-7-4.2 7 9.9 7-9.9-7 4.2z" />
        <path d="M20 24.3v9.9l7-9.9-7-4.2z" fillOpacity="0.8" />
      </g>
    </svg>
  );
}

function ArbTokenIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#28A0F0" />
      <path
        d="M20 9l-9 14.5h4.4l2.3-3.7 4.3 6.9h4.4l-6.4-10.2 2.8-4.5-2.8-3z"
        fill="#FFFFFF"
      />
      <path
        d="M25.2 23.5h4.4l-2.8-4.5-2.3 3.7.7.8z"
        fill="#96BEDC"
      />
    </svg>
  );
}

function SolTokenIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#141416" />
      <path
        d="M13 24.5l2.2-2.2c.2-.2.5-.3.8-.3h10.3c.5 0 .8.6.5.9l-2.2 2.2c-.2.2-.5.3-.8.3H13.5c-.5 0-.8-.6-.5-.9zm0-6.7l2.2-2.2c.2-.2.5-.3.8-.3h10.3c.5 0 .8.6.5.9l-2.2 2.2c-.2.2-.5.3-.8.3H13.5c-.5 0-.8-.6-.5-.9zm14-4.6l-2.2-2.2c-.2-.2-.5-.3-.8-.3H13.7c-.5 0-.8.6-.5.9l2.2 2.2c.2.2.5.3.8.3h10.3c.5 0 .8-.6.5-.9z"
        fill="url(#sol_grad)"
      />
      <defs>
        <linearGradient id="sol_grad" x1="13" y1="10" x2="27" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TokenIcon({ symbol, size = 44, hasChainBadge = true }: { symbol: string; size?: number; hasChainBadge?: boolean }) {
  const sym = (symbol || "").toUpperCase();
  let iconNode;

  if (sym.includes("USDC")) {
    iconNode = <UsdcTokenIcon size={size} />;
  } else if (sym.includes("BTC")) {
    iconNode = <WbtcTokenIcon size={size} />;
  } else if (sym.includes("ETH")) {
    iconNode = <WethTokenIcon size={size} />;
  } else if (sym.includes("ARB")) {
    iconNode = <ArbTokenIcon size={size} />;
  } else if (sym.includes("SOL")) {
    iconNode = <SolTokenIcon size={size} />;
  } else {
    iconNode = (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs"
      >
        {sym.slice(0, 3)}
      </div>
    );
  }

  return (
    <div className="relative inline-flex shrink-0">
      {iconNode}
      {hasChainBadge && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-xs">
          <ArbitrumBadgeIcon className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}

function SwapHeaderBadge({ avatar, persona, handle }: { avatar?: string; persona?: string; handle?: string }) {
  return (
    <div className="relative shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={persona || handle}
          className="w-11 h-11 rounded-full object-cover object-top border border-slate-200 shadow-xs"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
          <RefreshCw className="w-5 h-5 text-white stroke-[2]" />
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-xs">
        <ArbitrumBadgeIcon className="w-2.5 h-2.5" />
      </div>
    </div>
  );
}

function formatSubmittedDate(dateStr?: string) {
  if (!dateStr) return "November 7, 2026 7:40 AM";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

interface PositionsListProps {
  positions: EventPosition[];
  onStartNewTrade?: () => void;
  onExecuteExitSell?: (position: EventPosition, exitType?: "TAKE_PROFIT" | "STOP_LOSS" | "MANUAL_MARKET") => Promise<void>;
  onEmergencySweep?: (position: EventPosition) => Promise<void>;
  onTogglePausePosition?: (position: EventPosition) => Promise<void> | void;
  connectedWallet?: string;
  onPositionUpdated?: (position: EventPosition) => Promise<void> | void;
}

export function PositionsList({
  positions,
  onStartNewTrade,
  onExecuteExitSell,
  onEmergencySweep,
  onTogglePausePosition,
  connectedWallet,
  onPositionUpdated,
}: PositionsListProps) {
  const [selectedPosition, setSelectedPosition] = useState<EventPosition | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [arkivModalPosition, setArkivModalPosition] = useState<EventPosition | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);





  const handleCopyTx = async (tx: string) => {
    try {
      await navigator.clipboard.writeText(tx);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Heading: Positions & "+ Start New Trade" Button (Outside of Card) */}
      <div className="flex items-center justify-between px-0.5 py-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Positions</h3>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/80">
            {positions.length}
          </span>
        </div>

        {onStartNewTrade && (
          <button
            type="button"
            onClick={onStartNewTrade}
            className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Start New Trade</span>
          </button>
        )}
      </div>

      {/* Flat Cards Like Table Format */}
      {positions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-700">No positions open</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
            Click &ldquo;Start New Trade&rdquo; to deploy your first event sentinel.
          </p>
          {onStartNewTrade && (
            <button
              type="button"
              onClick={onStartNewTrade}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Start New Trade</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {positions.map((pos) => {
            const isArmed = pos.status === "ARMED";
            const isProfitable = pos.pnlUsd >= 0;

            return (
              <div
                key={pos.id}
                className="rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Col 1: Catalyst & Event */}
                <div className="flex items-center gap-3 min-w-[210px] max-w-[260px]">
                  {pos.avatar ? (
                    <img
                      src={pos.avatar}
                      alt={pos.persona || pos.targetHandle}
                      className="w-10 h-10 rounded-xl object-cover object-top border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-medium text-xs shrink-0">
                      ⚡
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-xs truncate leading-tight">
                      {pos.eventName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-normal">@{pos.targetHandle}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-600 font-medium">{pos.targetAsset}</span>
                    </div>
                    {pos.agentWallet && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-blue-600 font-medium flex items-center gap-0.5">
                          <Wallet className="w-2.5 h-2.5" />
                          Agent:
                        </span>
                        <span>{pos.agentWallet.address.slice(0, 6)}...{pos.agentWallet.address.slice(-4)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setArkivModalPosition(pos);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border transition inline-flex items-center gap-1 cursor-pointer ${pos.arkivEntityKey && isValidArkivKey(pos.arkivEntityKey)
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            }`}
                          title="View / Sync Agent Intent on Arkiv DB-Chain"
                        >
                          <Database className="w-2.5 h-2.5 text-amber-600" />
                          <span>Arkiv DB</span>
                          {pos.arkivEntityKey && isValidArkivKey(pos.arkivEntityKey) ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2: Size & Side */}
                <div className="text-left sm:text-center min-w-[95px]">
                  <span className="text-[9px] text-slate-400 font-medium uppercase block sm:hidden">Size</span>
                  <div className="font-semibold text-slate-900 text-xs">
                    ${pos.sizeUsdc.toFixed(0)} USDC
                  </div>
                  <div className="text-[10px] font-semibold text-blue-600 mt-0.5">
                    {pos.side} BRACKET
                  </div>
                </div>

                {/* Col 3: Entry -> Mark Price */}
                <div className="text-left sm:text-center min-w-[110px]">
                  <span className="text-[9px] text-slate-400 font-medium uppercase block sm:hidden">Entry &rarr; Mark</span>
                  {isArmed ? (
                    <span className="text-[11px] text-slate-400 font-normal italic">Market on trigger</span>
                  ) : (
                    <div>
                      <div className="text-slate-400 text-[10px] font-normal">
                        ${pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-slate-900 font-semibold text-xs flex items-center justify-start sm:justify-center gap-0.5">
                        <span>${pos.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[1.75]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 4: Bracket Limits */}
                <div className="text-left sm:text-center min-w-[100px] text-[10px]">
                  <span className="text-[9px] text-slate-400 font-medium uppercase block sm:hidden">Bracket</span>
                  <div className="text-emerald-700 font-medium">
                    TP: +{pos.takeProfitPct}%
                  </div>
                  <div className="text-rose-600 font-normal">
                    SL: -{pos.stopLossPct}%
                  </div>
                </div>

                {/* Col 5: Live PnL */}
                <div className="text-left sm:text-right min-w-[105px]">
                  <span className="text-[9px] text-slate-400 font-medium uppercase block sm:hidden">Live PnL</span>
                  {pos.status === "ARMED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <span>Armed</span>
                    </span>
                  ) : pos.status === "PAUSED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      <span>Paused</span>
                    </span>
                  ) : (
                    <div>
                      <div
                        className={`font-semibold text-xs ${isProfitable ? "text-emerald-600" : "text-rose-600"
                          }`}
                      >
                        {isProfitable ? `+$${pos.pnlUsd.toFixed(2)}` : `-$${Math.abs(pos.pnlUsd).toFixed(2)}`}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${isProfitable ? "text-emerald-600" : "text-rose-600"
                          }`}
                      >
                        ({isProfitable ? `+${pos.pnlPct.toFixed(1)}%` : `${pos.pnlPct.toFixed(1)}%`})
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 6: Right Action: View Details */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVERY DETAIL OF POSITION MODAL (Uniswap Reference UI) */}
      {selectedPosition && (() => {
        const txHashToDisplay = selectedPosition.entryTxHash || selectedPosition.txHash || selectedPosition.exitTxHash;
        const txExplorerUrl = selectedPosition.entryExplorerUrl || selectedPosition.explorerUrl || (txHashToDisplay ? `https://arbiscan.io/tx/${txHashToDisplay}` : undefined);
        const tokenAmountNum = selectedPosition.entryPrice > 0 ? selectedPosition.sizeUsdc / selectedPosition.entryPrice : 0;
        const tokenAmountStr = selectedPosition.entryPrice > 0
          ? (tokenAmountNum < 0.001
              ? `<0.001 ${selectedPosition.targetAsset}`
              : `${tokenAmountNum.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${selectedPosition.targetAsset}`)
          : `0.00 ${selectedPosition.targetAsset}`;
        const outputUsdVal = (selectedPosition.sizeUsdc + (selectedPosition.pnlUsd || 0)).toFixed(2);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-3">
                  <SwapHeaderBadge
                    avatar={selectedPosition.avatar}
                    persona={selectedPosition.persona}
                    handle={selectedPosition.targetHandle}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                      {selectedPosition.status === "OPEN"
                        ? "Swapped"
                        : selectedPosition.status === "ARMED"
                        ? "Sentinel Armed"
                        : selectedPosition.status === "PAUSED"
                        ? "Agent Paused"
                        : selectedPosition.status === "PROFIT_TAKEN"
                        ? "Take-Profit Filled"
                        : selectedPosition.status === "STOPPED_OUT"
                        ? "Stop-Loss Filled"
                        : selectedPosition.eventName}
                    </h3>
                    <div className="text-xs text-slate-500 font-normal mt-0.5">
                      {formatSubmittedDate(selectedPosition.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title={showDetails ? "Collapse Details" : "Expand Details"}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPosition(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Input Token Card (USDC) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00a3ff]">
                  <ArbitrumBadgeIcon className="w-3.5 h-3.5" />
                  <span>Arbitrum</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                      {selectedPosition.sizeUsdc.toFixed(2)} {selectedPosition.contraAsset || "USDC"}
                    </div>
                    <div className="text-sm font-normal text-slate-500 mt-0.5">
                      ${selectedPosition.sizeUsdc.toFixed(2)}
                    </div>
                  </div>
                  <TokenIcon symbol={selectedPosition.contraAsset || "USDC"} size={44} />
                </div>
              </div>

              {/* Indented Down Arrow */}
              <div className="py-0.5 pl-3 text-slate-400">
                <ArrowDown className="w-4 h-4 stroke-[2.25]" />
              </div>

              {/* Output Token Card (Target Token) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00a3ff]">
                  <ArbitrumBadgeIcon className="w-3.5 h-3.5" />
                  <span>Arbitrum</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                      {tokenAmountStr}
                    </div>
                    <div className="text-sm font-normal text-slate-500 mt-0.5">
                      ${outputUsdVal}
                    </div>
                  </div>
                  <TokenIcon symbol={selectedPosition.targetAsset} size={44} />
                </div>
              </div>

              {/* PnL & Flash Bracket Targets Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Realized PnL</span>
                  {selectedPosition.status === "ARMED" ? (
                    <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mt-0.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse stroke-[1.75]" />
                      <span>Sentinel Armed (Monitoring)</span>
                    </div>
                  ) : selectedPosition.status === "PAUSED" ? (
                    <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mt-0.5">
                      <Pause className="w-3.5 h-3.5 fill-current stroke-[1.75]" />
                      <span>Agent Paused</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-base font-bold ${selectedPosition.pnlUsd >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {selectedPosition.pnlUsd >= 0 ? `+$${selectedPosition.pnlUsd.toFixed(2)}` : `-$${Math.abs(selectedPosition.pnlUsd).toFixed(2)}`}
                      </span>
                      <span className={`text-xs font-semibold ${selectedPosition.pnlPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        ({selectedPosition.pnlPct >= 0 ? `+${selectedPosition.pnlPct.toFixed(2)}%` : `${selectedPosition.pnlPct.toFixed(2)}%`})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    TP +{selectedPosition.takeProfitPct}%
                  </span>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    SL -{selectedPosition.stopLossPct}%
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedPosition.status === "OPEN"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedPosition.status === "ARMED"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : selectedPosition.status === "PAUSED"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}>
                    {selectedPosition.status}
                  </span>
                </div>
              </div>

              {/* Show more ↕ / Show less ↕ Toggle */}
              <div className="flex items-center justify-center pt-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition cursor-pointer py-1"
                >
                  <span>{showDetails ? "Show less" : "Show more"}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Uniswap-style Minimalist Details List */}
              {showDetails && (
                <div className="space-y-3 pt-2 border-t border-slate-100 text-sm animate-in fade-in duration-150">
                  {/* Network Cost */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Network cost</span>
                    <span className="text-slate-900 font-medium flex items-center gap-1.5">
                      <ArbitrumBadgeIcon className="w-3.5 h-3.5" />
                      <span>$0.02</span>
                    </span>
                  </div>

                  {/* Transaction */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Transaction</span>
                    {txHashToDisplay ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-slate-900">
                          {`${txHashToDisplay.slice(0, 6)}...${txHashToDisplay.slice(-4)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTx(txHashToDisplay)}
                          className="text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                          title="Copy Transaction Hash"
                        >
                          {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {txExplorerUrl && (
                          <a
                            href={txExplorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition p-0.5"
                            title="View on Arbiscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">Pending Trigger</span>
                    )}
                  </div>

                  {/* Submitted On */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Submitted on</span>
                    <span className="text-slate-900 font-medium">
                      {formatSubmittedDate(selectedPosition.createdAt)}
                    </span>
                  </div>

                  {/* Catalyst Event */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Catalyst</span>
                    <span className="text-slate-900 font-medium">
                      {selectedPosition.eventName} (@{selectedPosition.targetHandle})
                    </span>
                  </div>

                  {/* Entry / Mark Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Mark Price</span>
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      <span>${selectedPosition.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                    </span>
                  </div>

                  {/* Execution Side */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Execution Side</span>
                    <span className="text-blue-600 font-medium">
                      {selectedPosition.side} BRACKET (Definitive Flash)
                    </span>
                  </div>

                  {/* Take-Profit Target */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Take-Profit Leg</span>
                    <span className="text-emerald-600 font-medium">
                      +{selectedPosition.takeProfitPct}% (${selectedPosition.takeProfitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                    </span>
                  </div>

                  {/* Stop-Loss Target */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Stop-Loss Leg</span>
                    <span className="text-rose-600 font-medium">
                      -{selectedPosition.stopLossPct}% (${selectedPosition.stopLossPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                    </span>
                  </div>

                  {/* Custody (Main Connected Wallet) */}
                  {selectedPosition.agentWallet?.masterController && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-normal">Custody (Funds Owner)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-slate-900">
                          {`${selectedPosition.agentWallet.masterController.slice(0, 6)}...${selectedPosition.agentWallet.masterController.slice(-4)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTx(selectedPosition.agentWallet!.masterController)}
                          className="text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                          title="Copy Wallet Address"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://arbiscan.io/address/${selectedPosition.agentWallet.masterController}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition p-0.5"
                          title="View on Arbiscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Agent Session Executor */}
                  {selectedPosition.agentWallet && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-normal">Session Executor</span>
                      <span className="font-mono text-sm text-slate-700 flex items-center gap-1.5">
                        <span>
                          {selectedPosition.agentWallet.sessionKeyAddress
                            ? `${selectedPosition.agentWallet.sessionKeyAddress.slice(0, 6)}...${selectedPosition.agentWallet.sessionKeyAddress.slice(-4)}`
                            : selectedPosition.agentWallet.address.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-sans font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                          Router Locked
                        </span>
                      </span>
                    </div>
                  )}

                  {/* 0G TEE Verification */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">0G Verification</span>
                    <span className="text-blue-700 font-medium flex items-center gap-1 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>≥ {Math.round(selectedPosition.confidenceThreshold * 100)}% Proof (0G Private TEE)</span>
                    </span>
                  </div>

                  {/* Arkiv DB-Chain */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Arkiv DB-Chain</span>
                    <button
                      type="button"
                      onClick={() => setArkivModalPosition(selectedPosition)}
                      className="text-amber-700 hover:text-amber-900 font-medium text-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <Database className="w-3 h-3 text-amber-600" />
                      <span>
                        {selectedPosition.arkivEntityKey && isValidArkivKey(selectedPosition.arkivEntityKey)
                          ? "Verified on Rabdi (7794095)"
                          : "xmarket.agent_intent (Inspect)"}
                      </span>
                    </button>
                  </div>

                  {/* Triggered Tweet */}
                  {selectedPosition.triggeredTweet && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mt-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Triggered Post:</span>
                      <p className="text-slate-700 italic mt-0.5">
                        &ldquo;{selectedPosition.triggeredTweet}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Exit Sell or Pause / Resume */}
              {selectedPosition.status === "OPEN" && onExecuteExitSell && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSelling}
                    onClick={async () => {
                      setIsSelling(true);
                      try {
                        await onExecuteExitSell(selectedPosition, "TAKE_PROFIT");
                      } finally {
                        setIsSelling(false);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {isSelling ? "Executing Sell..." : `Take-Profit Sell (+${selectedPosition.takeProfitPct}%)`}
                  </button>
                  <button
                    type="button"
                    disabled={isSelling}
                    onClick={async () => {
                      setIsSelling(true);
                      try {
                        await onExecuteExitSell(selectedPosition, "STOP_LOSS");
                      } finally {
                        setIsSelling(false);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    Stop-Loss Sell
                  </button>
                </div>
              )}

              {(selectedPosition.status === "ARMED" || selectedPosition.status === "PAUSED") && onTogglePausePosition && (
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isTogglingPause}
                    onClick={async () => {
                      setIsTogglingPause(true);
                      try {
                        await onTogglePausePosition(selectedPosition);
                        setSelectedPosition((prev) => {
                          if (!prev) return null;
                          const isCurrentlyPaused = prev.status === "PAUSED";
                          const nextStatus: PositionStatus = isCurrentlyPaused
                            ? (prev.entryTxHash ? "OPEN" : "ARMED")
                            : "PAUSED";
                          return { ...prev, status: nextStatus };
                        });
                      } finally {
                        setIsTogglingPause(false);
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                      selectedPosition.status === "PAUSED"
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                    }`}
                  >
                    {selectedPosition.status === "PAUSED" ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isTogglingPause ? "Resuming..." : "Resume Agent"}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>{isTogglingPause ? "Pausing..." : "Pause Agent"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bottom Full-Width Close Button (Uniswap Reference style) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedPosition(null)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-900 font-semibold text-base transition-colors duration-150 cursor-pointer active:scale-[0.99] text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Arkiv Entity Inspector & Sync Modal */}
      {arkivModalPosition && (
        <ArkivEntityModal
          isOpen={!!arkivModalPosition}
          onClose={() => setArkivModalPosition(null)}
          position={arkivModalPosition}
          onSyncSuccess={(entityKey, txHash, expiresAt) => {
            const updated = {
              ...arkivModalPosition,
              arkivEntityKey: entityKey,
              arkivTxHash: txHash,
              arkivExpiresAt: expiresAt ? Number(expiresAt) : undefined,
            };
            setArkivModalPosition(updated);
            if (selectedPosition && selectedPosition.id === updated.id) {
              setSelectedPosition(updated);
            }
            if (onPositionUpdated) {
              onPositionUpdated(updated);
            }
          }}
        />
      )}
    </div>
  );
}
