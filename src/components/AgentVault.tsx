"use client";

import React from "react";
import { AgentVaultState } from "@/types";
import { Coins, ArrowDownLeft, ShieldCheck, BatteryCharging } from "lucide-react";

interface AgentVaultProps {
  vault: AgentVaultState;
}

export function AgentVault({ vault }: AgentVaultProps) {
  const isHealthy = vault.zeroGComputeBalanceUsd > 1.0;

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-2xs shrink-0">
            <Coins className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">0G Agent Vault</h4>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                Self-Paying
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trade rebates automatically subsidize continuous 0G private inference
            </p>
          </div>
        </div>

        {/* Health status */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isHealthy
                ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
                : "border-amber-200/80 bg-amber-50 text-amber-800"
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isHealthy ? "Self-Funded Active" : "Low Compute Balance"}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* 0G Compute Balance */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
          <div className="text-xs text-slate-400 font-medium">0G Compute Balance</div>
          <div className="text-xl font-bold text-blue-600">
            ${vault.zeroGComputeBalanceUsd.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 font-normal">Available TEE credits</div>
        </div>

        {/* Trade Fees Rebated */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Rebates Earned</div>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-1">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            +${vault.creditsEarnedFromTradesUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-normal">From Flash trades</div>
        </div>

        {/* Inferences Paid */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Inferences Funded</div>
          <div className="text-xl font-bold text-slate-900">
            {vault.inferencesRunCount}
          </div>
          <div className="text-[11px] text-slate-500 font-normal">0G verifications run</div>
        </div>

        {/* Spend Cap Guard */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Daily Spend Cap</div>
          <div className="text-xl font-bold text-slate-800">
            ${vault.dailySpendCapUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-normal">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Cap Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
