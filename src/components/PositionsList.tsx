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
  ChevronDown,
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
  onClosePosition?: (position: EventPosition) => Promise<void> | void;
  connectedWallet?: string;
  onPositionUpdated?: (position: EventPosition) => Promise<void> | void;
}

export function PositionsList({
  positions,
  onStartNewTrade,
  onExecuteExitSell,
  onEmergencySweep,
  onTogglePausePosition,
  onClosePosition,
  connectedWallet,
  onPositionUpdated,
}: PositionsListProps) {
  const [selectedPosition, setSelectedPosition] = useState<EventPosition | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const [arkivModalPosition, setArkivModalPosition] = useState<EventPosition | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [closingPosId, setClosingPosId] = useState<string | null>(null);

  // STRICT RULE: Only show waiting ("ARMED"), open ("OPEN"), and paused ("PAUSED") positions
  // Settled or closed positions (CLOSED, PROFIT_TAKEN, STOPPED_OUT) appear in transaction history
  const displayPositions = positions.filter(
    (p) => p.status === "ARMED" || p.status === "OPEN" || p.status === "PAUSED"
  );

  const handleClosePausedPosition = async (pos: EventPosition) => {
    setClosingPosId(pos.id);
    try {
      const closedPos: EventPosition = {
        ...pos,
        status: "CLOSED",
        settledAt: new Date().toISOString(),
      };

      // Record closing trade in SQLite so it appears in transaction history
      const closeTradeRecord = {
        id: `trade-close-${pos.id}-${Date.now()}`,
        positionId: pos.id,
        eventName: pos.eventName,
        targetHandle: pos.targetHandle,
        persona: pos.persona,
        avatar: pos.avatar,
        targetAsset: pos.targetAsset,
        contraAsset: pos.contraAsset,
        tradeType: pos.entryTxHash ? "EXIT_SELL" : "CLOSE",
        side: pos.side,
        orderType: pos.orderType || "BRACKET",
        sizeUsdc: pos.sizeUsdc,
        price: pos.currentPrice || pos.entryPrice,
        exitPrice: pos.currentPrice || pos.entryPrice,
        pnlUsd: pos.pnlUsd || 0,
        pnlPct: pos.pnlPct || 0,
        status: "CLOSED",
        txHash: pos.exitTxHash || pos.entryTxHash || pos.txHash || `0xclose_${Date.now()}`,
        explorerUrl: pos.exitExplorerUrl || pos.entryExplorerUrl || pos.explorerUrl || "https://arbiscan.io",
        agentWalletAddress: pos.agentWallet?.address,
        masterController: pos.agentWallet?.masterController,
        triggeredTweet: pos.triggeredTweet,
        createdAt: new Date().toISOString(),
      };

      try {
        await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trade: closeTradeRecord }),
        });
      } catch (err) {
        console.warn("Could not save closed trade to history:", err);
      }

      if (selectedPosition?.id === pos.id) {
        setSelectedPosition(null);
      }

      if (onClosePosition) {
        await onClosePosition(closedPos);
      } else if (onPositionUpdated) {
        await onPositionUpdated(closedPos);
      }
    } finally {
      setClosingPosId(null);
    }
  };

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
            {displayPositions.length}
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
      {displayPositions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-700">No positions open</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
            Click &ldquo;Start New Trade&rdquo; to set up your first trade.
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
          {displayPositions.map((pos) => {
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
                  </div>
                </div>

                {/* Col 2: Size & Side */}
                <div className="text-left sm:text-center min-w-[95px]">
                  <span className="text-[9px] text-slate-400 font-medium uppercase block sm:hidden">Size</span>
                  <div className="font-semibold text-slate-900 text-xs">
                    ${pos.sizeUsdc.toFixed(0)} USDC
                  </div>
                  <div className="text-[10px] font-semibold text-blue-600 mt-0.5">
                    {pos.side === "SHORT" ? "Short" : "Long"}
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
                      <span>waiting</span>
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

                {/* Col 6: Right Action: Close if Paused & View Details */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  {pos.status === "PAUSED" && (
                    <button
                      type="button"
                      disabled={closingPosId === pos.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosePausedPosition(pos);
                      }}
                      className="px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs border border-rose-200 transition flex items-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50 shadow-2xs"
                      title="Close position and remove from active list"
                    >
                      {closingPosId === pos.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5 stroke-[2]" />
                      )}
                      <span>Close</span>
                    </button>
                  )}
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

      {/* POSITION DETAIL MODAL (Aligned with App Theme & Dedicated Blue Action) */}
      {selectedPosition && (() => {
        const txHashToDisplay = selectedPosition.entryTxHash || selectedPosition.txHash || selectedPosition.exitTxHash;
        const txExplorerUrl = selectedPosition.entryExplorerUrl || selectedPosition.explorerUrl || (txHashToDisplay ? `https://arbiscan.io/tx/${txHashToDisplay}` : undefined);
        const targetAsset = selectedPosition.targetAsset || "WBTC";
        const contraAsset = selectedPosition.contraAsset || "USDC";
        const sizeUsdc = selectedPosition.sizeUsdc || 0;
        const entryPrice = selectedPosition.entryPrice || 0;
        const currentPrice = selectedPosition.currentPrice || entryPrice;
        const pnlUsd = selectedPosition.pnlUsd || 0;
        const pnlPct = selectedPosition.pnlPct || 0;
        const isPositivePnl = pnlUsd >= 0;

        const tokenQtyNum = entryPrice > 0 ? sizeUsdc / entryPrice : 0;
        const tokenQtyStr = entryPrice > 0
          ? tokenQtyNum < 0.0001
            ? `<0.0001`
            : tokenQtyNum < 0.01
            ? tokenQtyNum.toFixed(6)
            : tokenQtyNum.toLocaleString(undefined, { maximumFractionDigits: 4 })
          : "0.00";

        const targetGainUsd = ((sizeUsdc * (selectedPosition.takeProfitPct || 0)) / 100).toFixed(2);
        const maxRiskUsd = ((sizeUsdc * (selectedPosition.stopLossPct || 0)) / 100).toFixed(2);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {selectedPosition.avatar ? (
                      <img
                        src={selectedPosition.avatar}
                        alt={selectedPosition.persona || selectedPosition.targetHandle}
                        className="w-12 h-12 rounded-2xl object-cover object-top border border-slate-200/90 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                        ⚡
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-xs">
                      <ArbitrumBadgeIcon className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                        {targetAsset}/{contraAsset}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          selectedPosition.side === "SHORT"
                            ? "bg-rose-50 text-rose-700 border-rose-200/80"
                            : "bg-blue-50 text-blue-700 border-blue-200/80"
                        }`}
                      >
                        {selectedPosition.side === "SHORT" ? "Short" : "Long"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      {selectedPosition.persona || selectedPosition.eventName} • @{selectedPosition.targetHandle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                      selectedPosition.status === "OPEN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedPosition.status === "ARMED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : selectedPosition.status === "PAUSED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : selectedPosition.status === "STOPPED_OUT"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : selectedPosition.status === "PROFIT_TAKEN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedPosition.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPosition(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Top Hero Card: Realized PnL & Trade Amount (Exact layout & typography from theme) */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Realized PnL
                  </span>
                  {selectedPosition.status === "ARMED" ? (
                    <div className="text-lg font-bold text-blue-700 flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>Waiting for trigger</span>
                    </div>
                  ) : (
                    <div
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 tabular-nums ${
                        isPositivePnl ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositivePnl ? `+$${pnlUsd.toFixed(2)}` : `-$${Math.abs(pnlUsd).toFixed(2)}`}
                      <span className="text-sm sm:text-base font-semibold ml-1.5">
                        ({isPositivePnl ? `+${pnlPct.toFixed(2)}%` : `${pnlPct.toFixed(2)}%`})
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Trade Amount
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5 tabular-nums">
                    ${sizeUsdc.toFixed(2)} {contraAsset}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5 tabular-nums">
                    ≈ {tokenQtyStr} {targetAsset}
                  </div>
                </div>
              </div>

              {/* Trade Parameters Section Header */}
              <div className="flex items-center justify-between pt-0.5">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Trade Parameters</h4>
              </div>

              {/* 6-Card Grid: Trade Parameters (2 columns x 3 rows with consistent font & theme) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                {/* Card 1: TRADE PAIR */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Trade Pair
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                      {targetAsset}/{contraAsset}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      Arbitrum
                    </span>
                  </div>
                </div>

                {/* Card 2: TRADE AMOUNT */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Trade Amount
                  </span>
                  <div className="font-bold text-slate-900 text-sm sm:text-base tracking-tight mt-1 tabular-nums">
                    ${sizeUsdc.toFixed(2)} {contraAsset}
                  </div>
                </div>

                {/* Card 3: PURCHASED PRICE */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Purchased Price
                  </span>
                  <div className="font-bold text-slate-900 text-sm sm:text-base tracking-tight mt-1 tabular-nums">
                    {selectedPosition.status === "ARMED"
                      ? "Market on trigger"
                      : `$${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                </div>

                {/* Card 4: CURRENT MARK PRICE */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Current Mark Price
                  </span>
                  <div className="font-bold text-slate-900 text-sm sm:text-base tracking-tight mt-1 flex items-center gap-1 tabular-nums">
                    <span>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  </div>
                </div>

                {/* Card 5: TAKE-PROFIT LEG */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">
                      Take-Profit Leg
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      +{selectedPosition.takeProfitPct}%
                    </span>
                  </div>
                  <div className="font-extrabold text-emerald-800 text-base sm:text-lg tracking-tight mt-1 tabular-nums">
                    ${selectedPosition.takeProfitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 tabular-nums">
                    Target Gain: +${targetGainUsd}
                  </div>
                </div>

                {/* Card 6: STOP-LOSS LEG */}
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">
                      Stop-Loss Leg
                    </span>
                    <span className="text-xs font-bold text-rose-700 font-mono">
                      -{selectedPosition.stopLossPct}%
                    </span>
                  </div>
                  <div className="font-extrabold text-rose-800 text-base sm:text-lg tracking-tight mt-1 tabular-nums">
                    ${selectedPosition.stopLossPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5 tabular-nums">
                    Max Risk: -${maxRiskUsd}
                  </div>
                </div>
              </div>

              {/* Text-based button for Blockchain / Transaction Details */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowTxDetails(!showTxDetails)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer select-none py-1 group"
                >
                  <span>{showTxDetails ? "Hide Transaction Details" : "Transaction Details"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTxDetails ? "rotate-180" : ""}`} />
                </button>

                {showTxDetails && (
                  <div className="mt-2.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5 text-xs animate-in fade-in duration-150">
                    {/* Session contract details if present */}
                    {selectedPosition.agentWallet && (
                      <div className="pb-2.5 border-b border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Session Contract:</span>
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                            <span>
                              {selectedPosition.agentWallet.sessionKeyAddress
                                ? `${selectedPosition.agentWallet.sessionKeyAddress.slice(0, 6)}...${selectedPosition.agentWallet.sessionKeyAddress.slice(-4)}`
                                : `${selectedPosition.agentWallet.address.slice(0, 6)}...${selectedPosition.agentWallet.address.slice(-4)}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTx(selectedPosition.agentWallet!.sessionKeyAddress || selectedPosition.agentWallet!.address)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                              title="Copy Session Address"
                            >
                              {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <a
                              href={`https://arbiscan.io/address/${selectedPosition.agentWallet.sessionKeyAddress || selectedPosition.agentWallet.address}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-blue-600 hover:text-blue-800 transition"
                              title="View on Arbiscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Spender: <strong className="text-slate-800 font-mono">Definitive Flash Router</strong></span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Router Locked
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Transaction Hash */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Transaction Hash:</span>
                      {txHashToDisplay ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-800 font-semibold">
                            {`${txHashToDisplay.slice(0, 8)}...${txHashToDisplay.slice(-6)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTx(txHashToDisplay)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                            title="Copy Transaction Hash"
                          >
                            {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {txExplorerUrl && (
                            <a
                              href={txExplorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-blue-600 hover:text-blue-800 transition"
                              title="View on Arbiscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending Catalyst Trigger</span>
                      )}
                    </div>

                    {/* Funds Custody Wallet */}
                    {selectedPosition.agentWallet?.masterController && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Custody Wallet:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-800 font-semibold">
                            {`${selectedPosition.agentWallet.masterController.slice(0, 6)}...${selectedPosition.agentWallet.masterController.slice(-4)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTx(selectedPosition.agentWallet!.masterController)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                            title="Copy Wallet Address"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`https://arbiscan.io/address/${selectedPosition.agentWallet.masterController}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md text-blue-600 hover:text-blue-800 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 0G TEE Verification */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">0G TEE Proof:</span>
                      <span className="text-blue-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>≥ {Math.round(selectedPosition.confidenceThreshold * 100)}% Cryptographic Proof</span>
                      </span>
                    </div>

                    {/* Arkiv DB-Chain */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Arkiv DB-Chain:</span>
                      <button
                        type="button"
                        onClick={() => setArkivModalPosition(selectedPosition)}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Database className="w-3 h-3 text-amber-600" />
                        <span>
                          {selectedPosition.arkivEntityKey && isValidArkivKey(selectedPosition.arkivEntityKey)
                            ? "Verified on Arkiv DB-Chain"
                            : "xmarket.agent_intent (Inspect / Sync)"}
                        </span>
                      </button>
                    </div>

                    {/* Submitted Timestamp */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Opened / Submitted:</span>
                      <span className="text-slate-800 font-medium">
                        {formatSubmittedDate(selectedPosition.createdAt)}
                      </span>
                    </div>

                    {/* Triggered Tweet Quote */}
                    {selectedPosition.triggeredTweet && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Triggered Catalyst Tweet:</span>
                        <p className="text-slate-800 italic mt-0.5 text-xs font-normal">
                          &ldquo;{selectedPosition.triggeredTweet}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {/* State: Trade is OPEN - Primary Vibrant Blue Close Trade Button */}
                {selectedPosition.status === "OPEN" && onExecuteExitSell && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isSelling}
                      onClick={async () => {
                        setIsSelling(true);
                        try {
                          await onExecuteExitSell(selectedPosition, "MANUAL_MARKET");
                        } finally {
                          setIsSelling(false);
                        }
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSelling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Closing Trade on Arbitrum One...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white text-white" />
                          <span>Close Trade (Market Sell)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
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
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition cursor-pointer active:scale-95 disabled:opacity-60"
                      >
                        Take Profit Sell (+{selectedPosition.takeProfitPct}%)
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
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition cursor-pointer active:scale-95 disabled:opacity-60"
                      >
                        Stop Loss Sell (-{selectedPosition.stopLossPct}%)
                      </button>
                    </div>
                  </div>
                )}

                {/* State: Agent is ARMED or PAUSED - Primary Blue Resume / Pause Button */}
                {(selectedPosition.status === "ARMED" || selectedPosition.status === "PAUSED") && onTogglePausePosition && (
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
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {selectedPosition.status === "PAUSED" ? (
                      <>
                        <Play className="w-4 h-4 fill-white text-white" />
                        <span>{isTogglingPause ? "Resuming..." : "Resume Agent (Enable Triggers)"}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 fill-white text-white" />
                        <span>{isTogglingPause ? "Pausing..." : "Pause Agent (Suspend Triggers)"}</span>
                      </>
                    )}
                  </button>
                )}

                {/* State: Paused Position - Close and Remove Card to History */}
                {selectedPosition.status === "PAUSED" && (
                  <button
                    type="button"
                    disabled={closingPosId === selectedPosition.id}
                    onClick={() => handleClosePausedPosition(selectedPosition)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {closingPosId === selectedPosition.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Closing Position...</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Close Position (Move to History)</span>
                      </>
                    )}
                  </button>
                )}

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={() => setSelectedPosition(null)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm transition active:scale-[0.99] cursor-pointer text-center"
                >
                  Dismiss
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
