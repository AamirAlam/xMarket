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
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">0G Self-Paying Agent Vault</h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Autonomous Fuel
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Integrator trade rebates automatically fund ongoing 0G inference bills
            </p>
          </div>
        </div>

        {/* Health status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Agent Autonomy:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isHealthy
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
            {isHealthy ? "Fully Self-Funded" : "Low Compute Balance"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* 0G Compute Balance */}
        <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">0G Compute Balance</div>
          <div className="text-2xl font-black text-blue-700">
            ${vault.zeroGComputeBalanceUsd.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Available for TEE runs</div>
        </div>

        {/* Trade Fees Rebated */}
        <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rebates Earned</div>
          <div className="text-2xl font-black text-blue-700 flex items-center gap-1">
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
            +${vault.creditsEarnedFromTradesUsd.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">From Flash trades</div>
        </div>

        {/* Inferences Paid */}
        <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Inferences Funded</div>
          <div className="text-2xl font-black text-slate-900">
            {vault.inferencesRunCount}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">~$0.003 / request</div>
        </div>

        {/* Spend Cap Guard */}
        <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Daily Spend Cap</div>
          <div className="text-2xl font-black text-slate-800">
            ${vault.dailySpendCapUsd.toFixed(2)}
          </div>
          <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Cap Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
