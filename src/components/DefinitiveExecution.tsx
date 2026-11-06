"use client";

import React, { useState } from "react";
import { FlashOrderResult } from "@/types";
import { Zap, ExternalLink, ShieldCheck, TrendingUp, TrendingDown, Copy, Check } from "lucide-react";

interface DefinitiveExecutionProps {
  order: FlashOrderResult | null;
  skipReason?: string | null;
}

export function DefinitiveExecution({ order, skipReason }: DefinitiveExecutionProps) {
  const [copiedTx, setCopiedTx] = useState(false);

  const copyTx = () => {
    if (!order?.txHash) return;
    navigator.clipboard.writeText(order.txHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 1200);
  };

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* Header with Definitive Flash Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Definitive Flash API</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  MEV Protected
                </span>
              </div>
              <p className="text-xs text-slate-500">Non-custodial advanced bracket orders</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            Arbitrum / Base
          </span>
        </div>

        {/* Order Execution Status */}
        {order ? (
          <div className="space-y-4">
            {/* Status Badge & Order ID */}
            <div className="p-4 rounded-[22px] bg-blue-50/80 border border-blue-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  Bracket Order Filled
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500 font-semibold">
                Order: {order.orderId}
              </span>
            </div>

            {/* Target & Amount */}
            <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Settlement Chain:</span>
                <span className="font-bold text-slate-900">{order.targetChain}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Traded Position:</span>
                <span className="font-mono font-black text-blue-700 text-sm">{order.amount}</span>
              </div>
            </div>

            {/* Active Bracket Legs (Take Profit & Stop Loss) */}
            {order.bracket && (
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  Active Bracket Legs (Onchain Protection)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Take Profit Leg */}
                  <div className="p-3.5 rounded-[20px] border border-blue-200 bg-blue-50/60 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1 text-blue-900 font-bold text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Take-Profit (+{order.bracket.takeProfitPercentage}%)</span>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm">
                      ${order.bracket.estimatedTakeProfitPrice?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-blue-700 font-medium">Auto-exit with profit</div>
                  </div>

                  {/* Stop Loss Leg */}
                  <div className="p-3.5 rounded-[20px] border border-rose-200 bg-rose-50/60 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1 text-rose-800 font-bold text-[11px]">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Stop-Loss (-{order.bracket.stopLossPercentage}%)</span>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm">
                      ${order.bracket.estimatedStopLossPrice?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-rose-700/80 font-medium">Capital downside guard</div>
                  </div>
                </div>
              </div>
            )}

            {/* Onchain Tx Hash */}
            <div className="p-3.5 rounded-[20px] bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400 font-bold font-mono">TX:</span>
                <span className="font-mono text-slate-700 text-xs font-semibold truncate max-w-[200px]">
                  {order.txHash}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyTx}
                  className="px-2.5 py-1 rounded-[10px] bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition text-[11px] font-bold shadow-2xs"
                  title="Copy Tx Hash"
                >
                  {copiedTx ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href={order.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-[10px] bg-blue-50 border border-blue-200 text-blue-700 hover:text-blue-800 transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  title="View on Explorer"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Fee Rebate Notice */}
            <div className="p-3 rounded-[16px] bg-blue-50 border border-blue-200 flex items-center justify-between text-xs shadow-2xs">
              <span className="text-blue-800 font-bold">Definitive Integrator Rebate:</span>
              <span className="font-mono font-black text-blue-700">+${order.integratorFeeRebateUsd} USDC</span>
            </div>
          </div>
        ) : skipReason ? (
          <div className="p-5 rounded-[22px] border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Intent Guard Safeguarded Capital</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {skipReason}
            </p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-200/60 font-medium">
              No onchain order placed. Downside volatility avoided.
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
            <Zap className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Definitive Flash Execution Engine Armed</p>
            <p className="text-[11px] text-slate-400">
              When 0G sentiment passes threshold, non-custodial bracket orders settle via Flash API.
            </p>
          </div>
        )}

        {/* Definitive Callout */}
        <div className="p-3.5 rounded-[18px] border border-slate-200/80 bg-slate-50 text-xs text-slate-600 space-y-0.5">
          <span className="text-slate-900 font-bold block text-[11px]">Flash Execution Architecture:</span>
          <p className="text-slate-500 leading-normal text-[11px]">
            Eliminates raw swaps during breaking news volatility by wrapping every sentiment trade into an automated Take-Profit and Stop-Loss bracket.
          </p>
        </div>
      </div>
    </div>
  );
}
