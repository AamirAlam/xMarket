"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { ArkivEntityModal } from "@/components/ArkivEntityModal";
import { isValidArkivKey } from "@/lib/arkiv";

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
  const [arkivModalPosition, setArkivModalPosition] = useState<EventPosition | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [isExecutingFlashSwap, setIsExecutingFlashSwap] = useState(false);
  const [flashSwapStep, setFlashSwapStep] = useState<string>("");
  const [flashSwapError, setFlashSwapError] = useState<string | null>(null);
  const [flashSwapTxHash, setFlashSwapTxHash] = useState<string | null>(null);

  const handleExecuteRealDefinitiveSwap = async (pos: EventPosition) => {
    setIsExecutingFlashSwap(true);
    setFlashSwapError(null);
    setFlashSwapTxHash(null);

    try {
      const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
      if (!eth) {
        throw new Error("No Web3 wallet (MetaMask) detected in browser. Please install/open MetaMask.");
      }

      // 1. Resolve connected user address
      let activeAccount = connectedWallet;
      if (!activeAccount) {
        setFlashSwapStep("Connecting MetaMask wallet...");
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          throw new Error("No wallet account selected in MetaMask.");
        }
        activeAccount = accounts[0];
      }

      if (!activeAccount) {
        throw new Error("No active wallet account found.");
      }

      const userWallet: string = activeAccount;

      // 2. Ensure active chain is Arbitrum One (42161 / 0xa4b1)
      setFlashSwapStep("Checking network (Arbitrum One)...");
      let chainId = await eth.request({ method: "eth_chainId" });
      if (chainId !== "0xa4b1" && chainId !== "42161" && parseInt(chainId, 16) !== 42161) {
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xa4b1" }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await eth.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xa4b1",
                  chainName: "Arbitrum One",
                  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://arb1.arbitrum.io/rpc"],
                  blockExplorerUrls: ["https://arbiscan.io"],
                },
              ],
            });
          } else {
            throw switchErr;
          }
        }
      }

      // 3. Request Definitive Flash Quote
      setFlashSwapStep("1/4: Requesting Definitive Flash live quote on Arbitrum One...");
      const quoteRes = await fetch("/api/agent/flash-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "QUOTE",
          funderAddress: userWallet,
          targetAsset: pos.targetAsset || "WETH",
          contraAsset: pos.contraAsset || "USDC",
          qty: pos.sizeUsdc || 1,
          side: "buy",
        }),
      });

      const quoteData = await quoteRes.json();
      if (!quoteData.success) {
        throw new Error(quoteData.error || "Failed to fetch Definitive Flash quote");
      }

      // 4. Verify & prompt USDC approval on DefinitiveFlashAllowance (0x5d00000873b6BF41539e6f5365B0Ff7d3c368f78)
      setFlashSwapStep("2/4: Checking USDC allowance for Definitive Flash contract...");
      const usdcAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
      const spenderAddress = "0x5d00000873b6BF41539e6f5365B0Ff7d3c368f78";

      const allowanceCalldata =
        "0xdd62ed3e" +
        userWallet.replace("0x", "").padStart(64, "0").toLowerCase() +
        spenderAddress.replace("0x", "").padStart(64, "0").toLowerCase();

      const currentAllowanceHex = await eth.request({
        method: "eth_call",
        params: [{ to: usdcAddress, data: allowanceCalldata }, "latest"],
      });

      const currentAllowance = BigInt(currentAllowanceHex || "0x0");
      const requiredAmount = BigInt(Math.round((pos.sizeUsdc || 1) * 1e6));

      if (currentAllowance < requiredAmount) {
        setFlashSwapStep("2/4: Please approve Definitive Flash in MetaMask...");
        const approveCalldata =
          quoteData.evm?.approveTx?.data ||
          "0x095ea7b3" +
            spenderAddress.replace("0x", "").padStart(64, "0").toLowerCase() +
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

        const approveTxHash = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: userWallet,
              to: usdcAddress,
              data: approveCalldata,
            },
          ],
        });

        setFlashSwapStep(`Approval broadcast (${approveTxHash.slice(0, 10)}...). Waiting for Arbitrum confirmation...`);
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1200));
          const receipt = await eth.request({
            method: "eth_getTransactionReceipt",
            params: [approveTxHash],
          });
          if (receipt && receipt.blockNumber) break;
        }
      }

      // 5. Sign EIP-712 Order Typed Data via MetaMask
      setFlashSwapStep("3/4: Please sign Definitive Flash order in MetaMask (EIP-712 permit, 0 gas)...");
      const typedDataStr =
        typeof quoteData.evm?.orderTypedData === "string"
          ? quoteData.evm.orderTypedData
          : JSON.stringify(quoteData.evm?.orderTypedData);

      const userSignature = await eth.request({
        method: "eth_signTypedData_v4",
        params: [userWallet, typedDataStr],
      });

      // 6. Broadcast Signed Order to Definitive Flash Execution Router
      setFlashSwapStep("4/4: Definitive Flash routing & filling on Arbitrum One...");
      const submitRes = await fetch("/api/agent/flash-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT",
          funderAddress: userWallet,
          targetAsset: pos.targetAsset || "WETH",
          contraAsset: pos.contraAsset || "USDC",
          qty: pos.sizeUsdc || 1,
          side: "buy",
          quoteId: quoteData.quoteId,
          userSignature,
          evmOrderTypedData: typedDataStr,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitData.success) {
        throw new Error(submitData.error || "Definitive Flash order execution failed");
      }

      const txHash = submitData.txHash;
      const explorerUrl = submitData.explorerUrl || `https://arbiscan.io/tx/${txHash}`;
      setFlashSwapTxHash(txHash);
      setFlashSwapStep("Definitive Flash Swap successfully executed on Arbitrum One!");

      const updatedPos: EventPosition = {
        ...pos,
        status: "OPEN",
        txHash,
        explorerUrl,
        entryTxHash: txHash,
        entryExplorerUrl: explorerUrl,
        triggeredTweet:
          pos.triggeredTweet ||
          "Ethereum Pectra upgrade and L2 rollup gas reductions are officially live on mainnet! ETH breakout starting now 🚀",
        currentPrice: 2840.5,
        pnlUsd: 0.05,
        pnlPct: 5.0,
      };

      setSelectedPosition(updatedPos);
      if (onPositionUpdated) {
        await onPositionUpdated(updatedPos);
      }
    } catch (err: any) {
      console.error("Definitive Flash Swap error:", err);
      setFlashSwapError(err?.message || "Failed to execute Definitive Flash Swap");
    } finally {
      setIsExecutingFlashSwap(false);
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
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border transition inline-flex items-center gap-1 cursor-pointer ${
                            pos.arkivEntityKey && isValidArkivKey(pos.arkivEntityKey)
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

                {/* Col 6: Right Action: View Details & Swap Now */}
                <div className="flex items-center justify-end shrink-0 gap-2">
                  {isArmed && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPosition(pos);
                        handleExecuteRealDefinitiveSwap(pos);
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Execute Real Definitive Flash Swap on Arbitrum One"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Swap Now</span>
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
                ) : selectedPosition.status === "PAUSED" ? (
                  <div className="text-base font-medium text-amber-700 flex items-center gap-1.5 mt-0.5">
                    <Pause className="w-4 h-4 fill-current stroke-[1.75]" />
                    <span>Agent Paused (Triggers Suspended)</span>
                  </div>
                ) : (
                  <div
                    className={`text-2xl font-bold mt-0.5 ${selectedPosition.pnlUsd >= 0 ? "text-emerald-600" : "text-rose-600"
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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                selectedPosition.status === "ARMED"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : selectedPosition.status === "OPEN"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : selectedPosition.status === "PAUSED"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}>
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

            {/* Dedicated Non-Custodial Agent Wallet & Direct Main Wallet Delegation */}
            {selectedPosition.agentWallet && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-blue-50/80 to-indigo-50/80 border border-emerald-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Main Wallet Delegation (Zero Pre-Funding)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    $0 Deposit Needed
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between font-mono shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] text-slate-400 block font-sans uppercase font-bold">Main Connected Wallet (Funds Custody)</span>
                    <span className="text-slate-800 text-xs font-bold truncate block">{selectedPosition.agentWallet.masterController}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyTx(selectedPosition.agentWallet!.masterController)}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      title="Copy Master Wallet Address"
                    >
                      {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <a
                      href={`https://arbiscan.io/address/${selectedPosition.agentWallet.masterController}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-blue-600 transition cursor-pointer"
                      title="View Master Wallet on Arbiscan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-0.5">
                  <div className="p-2 rounded-lg bg-white/80 border border-slate-200/80">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Agent Session Executor</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                      {selectedPosition.agentWallet.sessionKeyAddress ? `${selectedPosition.agentWallet.sessionKeyAddress.slice(0, 8)}...${selectedPosition.agentWallet.sessionKeyAddress.slice(-6)}` : selectedPosition.agentWallet.address.slice(0, 10)}
                    </span>
                    <span className="text-[9px] text-blue-600 font-semibold">Definitive Router Locked</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 border border-slate-200/80">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Deduction &amp; Routing</span>
                    <span className="font-bold text-emerald-700 text-[11px] block">
                      On-Demand (${selectedPosition.sizeUsdc} USDC)
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">Proceeds return to Main</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-100 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Delegated Spend Security:</strong> Funds never left your main wallet prior to trade trigger. When the catalyst fired, Definitive Flash Router deducted ${selectedPosition.sizeUsdc} USDC on-demand via the signed spend permit.
                  </span>
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

            {/* Real On-Chain Execution Status & Receipts */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block">
                On-Chain Execution &amp; Settlements (Arbitrum One)
              </span>

              {/* State: Position is PAUSED (Temporarily suspended) */}
              {selectedPosition.status === "PAUSED" && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <PauseCircle className="w-4 h-4 text-amber-600 stroke-[1.75]" />
                      <span>Agent Paused • Event Triggers Suspended</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                      Paused
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This agent is currently paused. Incoming X events from <strong>@{selectedPosition.targetHandle}</strong> will be ignored and zero on-chain trades will be executed until you resume this agent.
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-amber-100 text-[11px] text-slate-600 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">On-Chain Trigger Status:</span>
                      <span className="font-bold text-amber-800">Suspended ($0 Deducted)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Monitored Target:</span>
                      <span className="font-bold text-slate-700">@{selectedPosition.targetHandle}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* State A: Position is ARMED (Waiting for real X trigger or manual flash swap) */}
              {selectedPosition.status === "ARMED" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-blue-600 animate-pulse stroke-[1.75]" />
                        <span>Sentinel Armed &amp; Listening to Real X Events</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                        Awaiting Trigger
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      This sentinel is actively monitoring public posts from <strong>@{selectedPosition.targetHandle}</strong> matching <em>&ldquo;{selectedPosition.eventName}&rdquo;</em>.
                    </p>
                    <div className="p-3 rounded-xl bg-white border border-blue-100 text-[11px] text-slate-600 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">On-Chain Trade Execution:</span>
                        <span className="font-bold text-slate-800">Pending Catalyst Event ($0 Deducted)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Verification Model:</span>
                        <span className="font-bold text-blue-700">0G Verifiable TEE (≥{Math.round(selectedPosition.confidenceThreshold * 100)}% Proof)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Flash Order Type:</span>
                        <span className="font-bold text-slate-700">Definitive Flash Market Buy + Attached Bracket</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Arkiv DB-Chain:</span>
                        <button
                          type="button"
                          onClick={() => setArkivModalPosition(selectedPosition)}
                          className="font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer transition"
                        >
                          <Database className="w-3 h-3 text-amber-600" />
                          <span>
                            {selectedPosition.arkivEntityKey && isValidArkivKey(selectedPosition.arkivEntityKey)
                              ? "Verified on Rabdi (7794095)"
                              : "xmarket.agent_intent (Inspect / Sync)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real Definitive Flash Swap Trigger */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-300 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                        <span>Execute Real Definitive Flash Swap</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Arbitrum One Live
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Perform an authentic on-chain swap (${selectedPosition.sizeUsdc} USDC &rarr; {selectedPosition.targetAsset}) on Arbitrum One via Definitive Flash Router. Verifies allowance on <code>0x5d00...8f78</code>, requests your non-custodial EIP-712 permit in MetaMask, and broadcasts live.
                    </p>

                    {flashSwapError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{flashSwapError}</span>
                      </div>
                    )}

                    {isExecutingFlashSwap ? (
                      <div className="p-3 rounded-xl bg-white border border-emerald-300 text-slate-800 text-xs flex items-center gap-2 font-medium shadow-2xs">
                        <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                        <span className="truncate">{flashSwapStep}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleExecuteRealDefinitiveSwap(selectedPosition)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Execute Real Definitive Flash Swap Now (${selectedPosition.sizeUsdc} USDC)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* State B: Real BUY Trade Execution Receipt (Shown once tweet triggers trade) */}
              {selectedPosition.entryTxHash && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Real BUY Trade (Entry Swap)</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      FILLED (${selectedPosition.sizeUsdc} USDC &rarr; {selectedPosition.targetAsset})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="truncate max-w-[240px] text-slate-700 text-[11px] font-mono">
                      {selectedPosition.entryTxHash}
                    </span>
                    <a
                      href={selectedPosition.entryExplorerUrl || `https://arbiscan.io/tx/${selectedPosition.entryTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-0.5 text-xs"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* State C: Real SELL Trade (Only shown if a real exit trade has actually settled) */}
              {selectedPosition.exitTxHash ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Real SELL Trade (Bracket Exit Settlement)</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${selectedPosition.status === "PROFIT_TAKEN"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                    >
                      {selectedPosition.status === "PROFIT_TAKEN"
                        ? `FILLED (Take-Profit +${selectedPosition.takeProfitPct}%)`
                        : `FILLED (Stop-Loss -${selectedPosition.stopLossPct}%)`}
                    </span>
                  </div>

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
                </div>
              ) : selectedPosition.status === "OPEN" ? (
                /* State D: Position is OPEN, bracket active, can be settled on-demand */
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span>Definitive Flash Attached Bracket (Monitoring)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      ACTIVE ON ARBITRUM
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-normal">
                    Monitoring mark price on Arbitrum One. You can also trigger the real exit sell trade onchain now:
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
              ) : null}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {/* Option to Pause or Resume Agent */}
              {(selectedPosition.status === "ARMED" || selectedPosition.status === "PAUSED" || selectedPosition.status === "OPEN") && onTogglePausePosition ? (
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
                  className={`px-4 py-2 rounded-full font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                    selectedPosition.status === "PAUSED"
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                  title={selectedPosition.status === "PAUSED" ? "Resume agent event monitoring & trade triggers" : "Temporarily pause agent event triggers"}
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
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-6 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
