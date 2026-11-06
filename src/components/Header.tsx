"use client";

import React from "react";
import Link from "next/link";
import { PumpItLogo } from "./PumpItLogo";
import { WalletButton } from "./WalletButton";
import { TrendingUp, PieChart, History } from "lucide-react";

export type TerminalTab = "positions" | "portfolio" | "history";

interface HeaderProps {
  onAddressChange?: (address: string) => void;
  activeTab?: TerminalTab;
  onTabChange?: (tab: TerminalTab) => void;
}

export function Header({
  onAddressChange,
  activeTab = "positions",
  onTabChange,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Name with Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs text-blue-600 shrink-0">
            <PumpItLogo className="w-4.5 h-4.5" size={18} />
          </div>
          <span className="font-bold text-xl sm:text-2xl tracking-tight text-slate-900 font-sans hover:opacity-90 transition">
            x<span className="text-blue-600">Market</span>
          </span>
        </Link>

        {/* Center: Tabs - Positions, Portfolio, History */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => onTabChange?.("positions")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "positions"
                ? "bg-white text-blue-600 shadow-xs ring-1 ring-slate-200/60 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Positions</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("portfolio")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "portfolio"
                ? "bg-white text-blue-600 shadow-xs ring-1 ring-slate-200/60 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Portfolio</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("history")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-blue-600 shadow-xs ring-1 ring-slate-200/60 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Right: Wallet Connection Button */}
        <div className="flex items-center shrink-0">
          <WalletButton onAddressChange={onAddressChange} />
        </div>
      </div>
    </header>
  );
}
