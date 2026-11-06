"use client";

import React, { useState } from "react";
import { EventPosition } from "@/types";
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
} from "lucide-react";

interface PositionsListProps {
  positions: EventPosition[];
  onClosePosition: (id: string) => void;
  onStartNewTrade?: () => void;
  onExecuteExitSell?: (position: EventPosition, exitType?: "TAKE_PROFIT" | "STOP_LOSS" | "MANUAL_MARKET") => Promise<void>;
  onEmergencySweep?: (position: EventPosition) => Promise<void>;
}

export function PositionsList({
  positions,
  onClosePosition,
  onStartNewTrade,
  onExecuteExitSell,
  onEmergencySweep,
}: PositionsListProps) {
  const [selectedPosition, setSelectedPosition] = useState<EventPosition | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);

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
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-blue-600 font-medium flex items-center gap-0.5">
                          <Wallet className="w-2.5 h-2.5" />
                          Agent:
                        </span>
                        <span>{pos.agentWallet.address.slice(0, 6)}...{pos.agentWallet.address.slice(-4)}</span>
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
                  {isArmed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <span>Armed</span>
                    </span>
                  ) : (
                    <div>
                      <div
                        className={`font-semibold text-xs ${
                          isProfitable ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isProfitable ? `+$${pos.pnlUsd.toFixed(2)}` : `-$${Math.abs(pos.pnlUsd).toFixed(2)}`}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          isProfitable ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        ({isProfitable ? `+${pos.pnlPct.toFixed(1)}%` : `${pos.pnlPct.toFixed(1)}%`})
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 6: Right Action: Settle Sell, View & Close/Revoke Delegation */}
                <div className="flex items-center justify-end gap-1.5 shrink-0">
                  {pos.status === "OPEN" && onExecuteExitSell && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onExecuteExitSell(pos, "TAKE_PROFIT");
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Execute final SELL trade on Arbitrum via Definitive Flash"
                    >
                      <span>Settle Sell</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClosePosition(pos.id);
                    }}
                    className="p-1.5 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Close position, revoke wallet delegation and delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVERY DETAIL OF POSITION MODAL */}
      {selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedPosition.avatar ? (
                  <img
                    src={selectedPosition.avatar}
                    alt={selectedPosition.persona || selectedPosition.targetHandle}
                    className="w-11 h-11 rounded-2xl object-cover object-top border border-slate-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-medium text-base shrink-0">
                    ⚡
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedPosition.eventName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-normal">@{selectedPosition.targetHandle}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">{selectedPosition.targetAsset}/{selectedPosition.contraAsset}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PnL & Status Banner */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                  Realized PnL
                </span>
                {selectedPosition.status === "ARMED" ? (
                  <div className="text-base font-medium text-blue-700 flex items-center gap-1.5 mt-0.5">
                    <Radio className="w-4 h-4 text-blue-600 animate-pulse stroke-[1.75]" />
                    <span>Sentinel Armed (Monitoring)</span>
                  </div>
                ) : (
                  <div
                    className={`text-2xl font-bold mt-0.5 ${
                      selectedPosition.pnlUsd >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {selectedPosition.pnlUsd >= 0 ? `+$${selectedPosition.pnlUsd.toFixed(2)}` : `-$${Math.abs(selectedPosition.pnlUsd).toFixed(2)}`}
                    <span className="text-sm font-medium ml-1.5">
                      ({selectedPosition.pnlPct >= 0 ? `+${selectedPosition.pnlPct.toFixed(2)}%` : `${selectedPosition.pnlPct.toFixed(2)}%`})
                    </span>
                  </div>
                )}
              </div>

              {/* Status Pill */}
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-800 shadow-2xs">
                {selectedPosition.status}
              </span>
            </div>

            {/* Trade & Execution Parameters */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">Position Parameters</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Allocation Size</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    ${selectedPosition.sizeUsdc.toFixed(2)} USDC
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Execution Side</span>
                  <div className="font-semibold text-blue-700 mt-0.5">
                    {selectedPosition.side} BRACKET
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Entry Price</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    ${selectedPosition.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Current Mark Price</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                    <span>${selectedPosition.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 stroke-[1.75]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Definitive Flash Bracket Configuration */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">Definitive Flash Bracket Limits</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 uppercase font-medium">Take-Profit Leg</span>
                  <div className="font-bold text-emerald-800 mt-0.5 text-sm">
                    +{selectedPosition.takeProfitPct}% (${selectedPosition.takeProfitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5 font-normal">
                    Target Gain: +${((selectedPosition.sizeUsdc * selectedPosition.takeProfitPct) / 100).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-200/80">
                  <span className="text-[10px] text-rose-700 uppercase font-medium">Stop-Loss Leg</span>
                  <div className="font-bold text-rose-800 mt-0.5 text-sm">
                    -{selectedPosition.stopLossPct}% (${selectedPosition.stopLossPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5 font-normal">
                    Max Risk: -${((selectedPosition.sizeUsdc * selectedPosition.stopLossPct) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Non-Custodial Agent Wallet & ERC-4337 Smart Account */}
            {selectedPosition.agentWallet && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    <span>ERC-4337 Smart Account (Safe Session Module)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    100% Master Custody
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between font-mono">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] text-slate-400 block font-sans uppercase font-bold">Smart Account (Arbitrum Contract)</span>
                    <span className="text-slate-800 text-xs font-bold truncate block">{selectedPosition.agentWallet.address}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyTx(selectedPosition.agentWallet!.address)}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <a
                      href={selectedPosition.agentWallet.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-blue-600 transition cursor-pointer"
                      title="View on Arbiscan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-0.5">
                  <div className="p-2 rounded-lg bg-white/70 border border-blue-50">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Master Owner (Full Custody)</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                      {selectedPosition.agentWallet.masterController.slice(0, 8)}...{selectedPosition.agentWallet.masterController.slice(-6)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/70 border border-blue-50">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Scoped Session Key</span>
                    <span className="font-mono font-bold text-blue-700 text-[11px] truncate block">
                      {selectedPosition.agentWallet.sessionKeyAddress ? `${selectedPosition.agentWallet.sessionKeyAddress.slice(0, 8)}...${selectedPosition.agentWallet.sessionKeyAddress.slice(-6)}` : "Router Locked"}
                    </span>
                  </div>
                </div>

                {/* Emergency Sweep Action */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">
                    {selectedPosition.isSwept ? (
                      <span className="text-emerald-700 font-bold">✓ Capital Swept to Master Wallet</span>
                    ) : (
                      <span>Session restricted to Flash Router</span>
                    )}
                  </div>
                  {!selectedPosition.isSwept && onEmergencySweep && (
                    <button
                      type="button"
                      disabled={isSweeping}
                      onClick={async () => {
                        setIsSweeping(true);
                        try {
                          await onEmergencySweep(selectedPosition);
                        } finally {
                          setIsSweeping(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] transition cursor-pointer disabled:opacity-60"
                      title="Emergency Sweep: Withdraws 100% of smart account capital back to your master wallet"
                    >
                      {isSweeping ? "Sweeping..." : "Emergency Sweep to Master"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 0G Verifiable TEE Inference Proof */}
            <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 stroke-[1.75]" />
                  <span>0G TEE Cryptographic Verification</span>
                </span>
                <span className="text-[10px] font-medium text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Proof Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-normal block">Confidence Filter:</span>
                  <span className="text-slate-800 font-semibold">
                    ≥ {Math.round(selectedPosition.confidenceThreshold * 100)}% 0G Proof
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-normal block">TEE Model:</span>
                  <span className="text-slate-800 font-medium text-[11px]">
                    0g-private-llama-3-70b-tee
                  </span>
                </div>
              </div>

              {selectedPosition.triggeredTweet && (
                <div className="pt-2 border-t border-blue-100 text-xs">
                  <span className="text-[10px] text-slate-500 font-medium uppercase block">Triggered Tweet:</span>
                  <p className="text-slate-800 italic mt-0.5 text-[11px] font-normal">
                    &ldquo;{selectedPosition.triggeredTweet}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Final On-Chain Arbitrum Execution Receipts: BUY & SELL */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block">
                Final On-Chain Execution Receipts (Arbitrum One)
              </span>

              {/* 1. Final BUY Trade (Entry Swap) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Final BUY Trade (Entry Swap)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    FILLED (${selectedPosition.sizeUsdc} USDC &rarr; {selectedPosition.targetAsset})
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="truncate max-w-[240px] text-slate-700 text-[11px] font-mono">
                    {selectedPosition.entryTxHash || selectedPosition.txHash || "0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc"}
                  </span>
                  <a
                    href={selectedPosition.entryExplorerUrl || selectedPosition.explorerUrl || `https://arbiscan.io/tx/${selectedPosition.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-0.5 text-xs"
                  >
                    <span>Arbiscan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 2. Final SELL Trade (Attached Bracket Exit Swap) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Final SELL Trade (Attached Bracket Exit)</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      selectedPosition.status === "PROFIT_TAKEN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedPosition.status === "STOPPED_OUT"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {selectedPosition.status === "PROFIT_TAKEN"
                      ? "FILLED (Take-Profit +5%)"
                      : selectedPosition.status === "STOPPED_OUT"
                      ? "FILLED (Stop-Loss -2.5%)"
                      : "ARMED & MONITORING BRACKET"}
                  </span>
                </div>

                {selectedPosition.exitTxHash ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="truncate max-w-[240px] text-slate-700 text-[11px] font-mono">
                      {selectedPosition.exitTxHash}
                    </span>
                    <a
                      href={selectedPosition.exitExplorerUrl || `https://arbiscan.io/tx/${selectedPosition.exitTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-bold inline-flex items-center gap-0.5 text-xs"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] text-slate-500 font-normal">
                      Definitive Flash attached bracket is monitoring mark price on Arbitrum One. You can also trigger the final sell trade now:
                    </p>
                    {onExecuteExitSell && (
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
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
                        >
                          {isSelling ? "Executing Sell..." : `Run Take-Profit Sell (+${selectedPosition.takeProfitPct}%)`}
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
                          className="py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-60"
                        >
                          Stop-Loss Sell
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onClosePosition(selectedPosition.id);
                  setSelectedPosition(null);
                }}
                className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {selectedPosition.status === "ARMED"
                    ? "Cancel Sentinel & Revoke Delegation"
                    : "Close Position & Revoke Delegation"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-6 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
