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
} from "lucide-react";

interface PositionsListProps {
  positions: EventPosition[];
  onClosePosition: (id: string) => void;
  onStartNewTrade?: () => void;
}

export function PositionsList({
  positions,
  onClosePosition,
  onStartNewTrade,
}: PositionsListProps) {
  const [selectedPosition, setSelectedPosition] = useState<EventPosition | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

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

                {/* Col 6: Right Action: View Button with Hero Page Header Background */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1 active:scale-95 cursor-pointer"
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

            {/* On-Chain Transaction & Settlement */}
            {selectedPosition.txHash && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">On-Chain Settlement (Arbitrum One)</span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="truncate max-w-[260px] text-slate-700 text-[11px] font-mono">
                    {selectedPosition.txHash}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyTx(selectedPosition.txHash!)}
                      className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition cursor-pointer"
                      title="Copy Tx Hash"
                    >
                      {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[1.75]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.75]" />}
                    </button>
                    {selectedPosition.explorerUrl && (
                      <a
                        href={selectedPosition.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-slate-200 rounded-md text-blue-600 transition"
                        title="View on Arbiscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5 stroke-[1.75]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedPosition.status !== "CLOSED" && selectedPosition.status !== "PROFIT_TAKEN" ? (
                <button
                  type="button"
                  onClick={() => {
                    onClosePosition(selectedPosition.id);
                    setSelectedPosition(null);
                  }}
                  className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs transition cursor-pointer"
                >
                  {selectedPosition.status === "ARMED" ? "Cancel Trigger Sentinel" : "Close Position Now"}
                </button>
              ) : (
                <div className="text-xs text-slate-400 font-normal">Position Settled</div>
              )}

              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-6 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
