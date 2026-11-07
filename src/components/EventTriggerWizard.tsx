"use client";

import React, { useState, useEffect } from "react";
import { TradingIntent, SentimentDirection, EventPosition, AgentWalletInfo } from "@/types";
import { createAgentWallet, requestMasterWalletDelegation, checkUsdcAllowance } from "@/lib/agentWallet";
import { fetchRealWalletBalances } from "@/lib/walletBalances";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  TrendingUp,
  Play,
  Check,
  Coins,
  Scale,
  Wallet,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface EventTriggerWizardProps {
  intent: TradingIntent;
  onChange: (updated: TradingIntent) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onDeployPosition?: (position: Omit<EventPosition, "id" | "createdAt">) => void;
  connectedWallet?: string;
  onConnectWallet?: () => void;
  onCancel?: () => void;
}

const PRESET_EVENTS = [
  {
    id: "powell",
    persona: "Jerome Powell",
    handle: "federalreserve",
    name: "FOMC Rate Cut Decision (7:00 PM)",
    avatar: "/avatars/powell.jpg",
    defaultDirection: "BULLISH_ONLY" as SentimentDirection,
    targetAsset: "WETH",
    description: "Monetary policy decisions, interest rate cuts & inflation remarks",
  },
  {
    id: "vitalik",
    persona: "Vitalik Buterin",
    handle: "VitalikButerin",
    name: "Pectra Hardfork Devcon",
    avatar: "/avatars/vitalik.jpg",
    defaultDirection: "BULLISH_ONLY" as SentimentDirection,
    targetAsset: "WETH",
    description: "Ethereum protocol roadmap, L1 scalability & ecosystem upgrades",
  },
  {
    id: "trump",
    persona: "Donald Trump",
    handle: "realDonaldTrump",
    name: "Crypto Strategic Reserve",
    avatar: "/avatars/trump.jpg",
    defaultDirection: "BULLISH_ONLY" as SentimentDirection,
    targetAsset: "WBTC",
    description: "US national bitcoin reserve declarations & trade policy catalysts",
  },
  {
    id: "elon",
    persona: "Elon Musk",
    handle: "elonmusk",
    name: "Tesla / xAI Catalyst",
    avatar: "/avatars/elon.jpg",
    defaultDirection: "ANY" as SentimentDirection,
    targetAsset: "SOL",
    description: "AI releases, autonomous robotics & technology momentum tweets",
  },
  {
    id: "saylor",
    persona: "Michael Saylor",
    handle: "saylor",
    name: "BTC Treasury Buy",
    avatar: "/avatars/saylor.jpg",
    defaultDirection: "BULLISH_ONLY" as SentimentDirection,
    targetAsset: "WBTC",
    description: "MicroStrategy corporate treasury bitcoin balance expansions",
  },
  {
    id: "custom",
    persona: "Custom Voice",
    handle: "custom",
    name: "Freeform Sentiment Sentinel",
    avatar: "",
    defaultDirection: "ANY" as SentimentDirection,
    targetAsset: "WETH",
    description: "Monitor any public account handle with automated 0G TEE analysis",
  },
];

const TOKEN_OPTIONS = [
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    price: 2840.50,
    tag: "Arbitrum Core",
    icon: "Ξ",
    color: "from-blue-500 to-indigo-600",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    price: 88250.00,
    tag: "Macro Reserve",
    icon: "₿",
    color: "from-amber-500 to-orange-600",
  },
  {
    symbol: "SOL",
    name: "Solana (via Flash)",
    price: 192.40,
    tag: "High Beta",
    icon: "◎",
    color: "from-purple-500 to-indigo-500",
  },
  {
    symbol: "ARB",
    name: "Arbitrum One",
    price: 1.15,
    tag: "L2 Ecosystem",
    icon: "◆",
    color: "from-sky-500 to-blue-600",
  },
];

const TOKEN_PRICES: Record<string, number> = {
  WETH: 2840.50,
  WBTC: 88250.00,
  SOL: 192.40,
  ARB: 1.15,
};

export function EventTriggerWizard({
  intent,
  onChange,
  isListening,
  onToggleListening,
  onDeployPosition,
  connectedWallet,
  onCancel,
}: EventTriggerWizardProps) {
  // 3 distinct steps: 1 = Event Trigger, 2 = Token Selection & Configuration, 3 = Preview & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);

  // Track single selected preset ID (only 1 person can be selected at a time; if custom selected, other selections are removed)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const matched = PRESET_EVENTS.find(
      (p) =>
        p.id !== "custom" &&
        p.handle.toLowerCase() === intent.targetHandle.toLowerCase().replace("@", "")
    );
    return matched ? matched.id : "powell";
  });

  const handlePresetSelect = (preset: typeof PRESET_EVENTS[0]) => {
    setSelectedPresetId(preset.id);
    if (preset.id === "custom") {
      // If custom selected, remove all other preset selections and clear input values
      onChange({
        ...intent,
        targetHandle: "",
        eventName: "",
        sentimentDirection: preset.defaultDirection,
        targetAsset: preset.targetAsset,
      });
    } else {
      onChange({
        ...intent,
        eventName: preset.name,
        targetHandle: preset.handle,
        sentimentDirection: preset.defaultDirection,
        targetAsset: preset.targetAsset,
      });
    }
  };

  const handleHandleChange = (val: string) => {
    const clean = val.replace("@", "").toLowerCase();
    const matched = PRESET_EVENTS.find(
      (p) => p.id !== "custom" && p.handle.toLowerCase() === clean
    );
    setSelectedPresetId(matched ? matched.id : "custom");
    onChange({ ...intent, targetHandle: val });
  };

  const handleEventNameChange = (val: string) => {
    onChange({ ...intent, eventName: val });
  };

  // Active persona matching current single selection
  const activePreset =
    PRESET_EVENTS.find((p) => p.id === selectedPresetId) || PRESET_EVENTS[0];

  const currentRefPrice = TOKEN_PRICES[intent.targetAsset] || 2840.50;
  const estimatedTpPrice = Math.round(currentRefPrice * (1 + intent.takeProfitPct / 100) * 100) / 100;
  const estimatedSlPrice = Math.round(currentRefPrice * (1 - intent.stopLossPct / 100) * 100) / 100;
  const potentialProfitUsd = Math.round(((intent.tradeSizeUsdc * intent.takeProfitPct) / 100) * 100) / 100;
  const potentialLossUsd = Math.round(((intent.tradeSizeUsdc * intent.stopLossPct) / 100) * 100) / 100;
  const estTokenQuantity = (intent.tradeSizeUsdc / currentRefPrice).toFixed(
    intent.targetAsset === "WBTC" ? 5 : intent.targetAsset === "WETH" ? 4 : 2
  );
  const riskRewardRatio = (intent.takeProfitPct / Math.max(0.1, intent.stopLossPct)).toFixed(1);

  // Generate dedicated non-custodial Agent Wallet for this event position (strictly unique per card)
  const [agentWallet, setAgentWallet] = useState<AgentWalletInfo>(() =>
    createAgentWallet(connectedWallet || "0x71C84A962bFe2487431e50fB79D325603F01498B", intent.tradeSizeUsdc)
  );
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [isSigningDelegation, setIsSigningDelegation] = useState<boolean>(false);
  const [delegationStep, setDelegationStep] = useState<string>("");
  const [signingError, setSigningError] = useState<string | null>(null);
  const [forceReapprove, setForceReapprove] = useState<boolean>(false);
  const [allowanceInfo, setAllowanceInfo] = useState<{
    allowance: bigint;
    formatted: string;
    isPreApproved: boolean;
  } | null>(null);
  const [walletBalances, setWalletBalances] = useState<{
    usdc: number;
    eth: number;
  } | null>(null);

  // Query real onchain balances and USDC allowance for connected wallet on Arbitrum One
  useEffect(() => {
    if (!connectedWallet) return;
    let isMounted = true;

    fetchRealWalletBalances(connectedWallet).then((b) => {
      if (isMounted) {
        setWalletBalances({ usdc: b.usdc, eth: b.eth });
        // Auto-scale default trade size if user's real USDC balance is low (e.g. $3.41)
        if (b.usdc > 0 && intent.tradeSizeUsdc > b.usdc) {
          onChange({
            ...intent,
            tradeSizeUsdc: b.usdc >= 1 ? 1.0 : Math.max(0.1, Math.round(b.usdc * 10) / 10),
          });
        }
      }
    });

    checkUsdcAllowance(connectedWallet, intent.tradeSizeUsdc).then((res) => {
      if (isMounted) {
        setAllowanceInfo(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [connectedWallet, intent.tradeSizeUsdc]);

  // Allow generating a new unique agent wallet on demand
  const handleRegenerateAgentWallet = () => {
    const freshWallet = createAgentWallet(
      connectedWallet || "0x71C84A962bFe2487431e50fB79D325603F01498B",
      intent.tradeSizeUsdc
    );
    setAgentWallet(freshWallet);
    setSigningError(null);
  };

  // Sync allocation when trade size changes or connected wallet connects
  useEffect(() => {
    setAgentWallet((prev) => ({
      ...prev,
      allocatedBudgetUsdc: intent.tradeSizeUsdc,
      masterController: connectedWallet || prev.masterController,
    }));
  }, [intent.tradeSizeUsdc, connectedWallet]);

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSigningError(null);
    setIsSigningDelegation(true);
    setDelegationStep("1/2: Checking network & wallet connection...");

    try {
      const master = connectedWallet || "0x71C84A962bFe2487431e50fB79D325603F01498B";

      // Request cryptographic session key delegation and pre-approve Definitive Flash allowance
      const { signature, activeMaster } = await requestMasterWalletDelegation({
        masterController: master,
        agentWalletAddress: agentWallet.address,
        sessionKeyAddress: agentWallet.sessionKeyAddress,
        eventName: intent.eventName || `${intent.targetHandle} Catalyst`,
        targetHandle: intent.targetHandle.replace("@", ""),
        allocatedBudgetUsdc: intent.tradeSizeUsdc,
        sessionExpiry: agentWallet.sessionExpiry || Math.floor(Date.now() / 1000) + 86400 * 30,
        forceReapprove,
        onStepProgress: (step) => setDelegationStep(step),
      });

      const effectiveMaster = activeMaster || master;

      const authorizedAgentWallet: AgentWalletInfo = {
        ...agentWallet,
        masterController: effectiveMaster,
        delegationSignature: signature,
        status: "ARMED",
      };

      setAgentWallet(authorizedAgentWallet);

      // Deploy position with its dedicated, non-custodial Agent Wallet
      onDeployPosition?.({
        eventName: intent.eventName || `${intent.targetHandle} Catalyst`,
        targetHandle: intent.targetHandle.replace("@", ""),
        persona: activePreset.persona !== "Custom Voice" ? activePreset.persona : `@${intent.targetHandle}`,
        avatar: activePreset.avatar || undefined,
        targetAsset: intent.targetAsset,
        contraAsset: intent.contraAsset || "USDC",
        sizeUsdc: intent.tradeSizeUsdc,
        entryPrice: currentRefPrice,
        currentPrice: currentRefPrice,
        side: intent.sentimentDirection === "BEARISH_ONLY" ? "SHORT" : "LONG",
        pnlUsd: 0,
        pnlPct: 0,
        takeProfitPrice: estimatedTpPrice,
        stopLossPrice: estimatedSlPrice,
        takeProfitPct: intent.takeProfitPct,
        stopLossPct: intent.stopLossPct,
        status: "ARMED",
        confidenceThreshold: intent.confidenceThreshold,
        orderType: intent.orderType || "BRACKET",
        agentWallet: authorizedAgentWallet,
        explorerUrl: authorizedAgentWallet.explorerUrl,
      });

      // Automatically activate live tweet listening radar if disabled
      if (!isListening) {
        onToggleListening();
      }

      setJustSubmitted(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setJustSubmitted(false);
        setCurrentStep(1);
      }, 1200);
    } catch (err: any) {
      console.warn("Session delegation rejected or error:", err);
      setSigningError(err?.message || "Signature request was rejected in your wallet. Please sign to authorize the agent sub-wallet.");
      setIsSubmitting(false);
    } finally {
      setIsSigningDelegation(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
      {/* Center-Aligned Step Heading */}
      <div className="relative pb-4 border-b border-slate-100 text-center">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute left-0 top-0.5 w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
            title="Back to Positions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-mono font-bold text-blue-700">
          <span>Step {currentStep} of 3</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mt-1.5">
          {currentStep === 1 && "Selection of Event Trigger"}
          {currentStep === 2 && "Token Selection & Configuration"}
          {currentStep === 3 && "Preview & Submit"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentStep === 1 && "Select the market catalyst event or public account that will trigger your sentinel trade."}
          {currentStep === 2 && "Select which token to trade, position size, trigger sentiment, and bracket boundaries."}
          {currentStep === 3 && "Review all parameters of your event-driven trade before arming the sentinel."}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SELECTION OF EVENT TRIGGER */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Preset Catalyst Event Triggers Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Track Influencer</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_EVENTS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-2xl text-left border text-xs transition relative flex items-start gap-3 group cursor-pointer ${isSelected
                      ? "border-blue-500 bg-blue-50/90 text-blue-950 font-medium shadow-xs ring-1 ring-blue-500/30"
                      : "border-slate-200/90 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    {preset.avatar ? (
                      <img
                        src={preset.avatar}
                        alt={preset.persona}
                        className="w-10 h-10 rounded-xl object-cover object-top border border-slate-200 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0 font-bold text-sm">
                        ⚡
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {preset.persona}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-blue-600 font-mono truncate font-medium">
                        @{preset.handle}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                        {preset.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Twitter Handle & Catalyst Topic Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Target Twitter Handle Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Account Handle to Monitor</span>
                <span className="text-[10px] text-slate-400 font-mono">Public X Account</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm font-semibold">@</span>
                <input
                  type="text"
                  value={intent.targetHandle.replace("@", "")}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder="e.g. federalreserve, VitalikButerin"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-8 pr-4 py-2 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            {/* Event Catalyst Topic */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Event / Catalyst Topic</label>
              <input
                type="text"
                value={intent.eventName}
                onChange={(e) => handleEventNameChange(e.target.value)}
                placeholder="e.g. FOMC Rate Cut Decision, Pectra Upgrade"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>


          {/* Step 1 Next Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: TOKEN SELECTION AND CONFIGURATION (2 COLUMNS) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 2-Column Grid: Left (Token Selection & Amount) | Right (Sentiment & Bracket Controls) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Token Selection & Amount */}
            <div className="space-y-5">
              {/* Target Token Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Token</span>
                  <span className="text-[10px] text-slate-400 font-mono">Arbitrum One</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TOKEN_OPTIONS.map((token) => {
                    const isSelected = intent.targetAsset === token.symbol;
                    return (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => onChange({ ...intent, targetAsset: token.symbol })}
                        className={`p-3 rounded-2xl text-left border transition cursor-pointer relative ${isSelected
                          ? "border-blue-500 bg-blue-50/90 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/30"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-white hover:border-slate-300"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shadow-2xs">
                            {token.icon}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </div>
                        <div className="font-extrabold text-xs text-slate-900 mt-2">{token.symbol}</div>
                        <div className="text-[11px] text-slate-600 font-mono font-medium">${token.price.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{token.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Position Size (Amount in USDC) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Trade Amount (USDC)</label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Est: <strong className="text-slate-800">~{estTokenQuantity} {intent.targetAsset}</strong>
                  </span>
                </div>

                {/* Real Wallet Balance Indicator */}
                {walletBalances && (
                  <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 font-medium">Arbitrum Balance:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ${walletBalances.usdc.toFixed(2)} USDC • {walletBalances.eth.toFixed(4)} ETH
                    </span>
                  </div>
                )}

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5">
                  {(walletBalances && walletBalances.usdc <= 10
                    ? [1, 2, 3, Math.floor(walletBalances.usdc)]
                    : [1, 5, 10, 25, 50, 100]
                  )
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onChange({ ...intent, tradeSizeUsdc: amt })}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${intent.tradeSizeUsdc === amt
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-2xs ring-1 ring-blue-500/20"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                          }`}
                      >
                        ${amt}
                      </button>
                    ))}
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm font-semibold">$</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    max="100000"
                    value={intent.tradeSizeUsdc}
                    onChange={(e) => onChange({ ...intent, tradeSizeUsdc: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-8 pr-16 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">USDC</span>
                </div>
              </div>
            </div>

            {/* Right Column: Sentiment Direction & Bracket Controls */}
            <div className="space-y-4 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between">
              {/* Trigger Sentiment Condition */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Trigger Sentiment Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "BULLISH_ONLY", label: "Bullish Only", sub: "Buy on good" },
                    { id: "BEARISH_ONLY", label: "Bearish Only", sub: "Short on drop" },
                    { id: "ANY", label: "Adaptive", sub: "Auto direction" },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => onChange({ ...intent, sentimentDirection: dir.id as SentimentDirection })}
                      className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${intent.sentimentDirection === dir.id
                        ? "border-blue-500 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      <div className="font-bold text-[11px] truncate">{dir.label}</div>
                      <div className="text-[9px] text-slate-400 truncate">{dir.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 0G Verifiable Confidence Threshold Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">0G Verifiable Confidence</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">
                    ≥ {Math.round(intent.confidenceThreshold * 100)}% Proof
                  </span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.05"
                  value={intent.confidenceThreshold}
                  onChange={(e) => onChange({ ...intent, confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>50%</span>
                  <span className="font-semibold text-slate-600">75% (Recommended)</span>
                  <span>95% (Strict TEE)</span>
                </div>
              </div>

              {/* Definitive Flash Bracket Configuration (Take-Profit & Stop-Loss) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Definitive Flash Bracket</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Non-Custodial
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {/* Take-Profit */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-700 font-bold text-[11px]">Take-Profit</span>
                      <span className="font-mono text-emerald-700 font-bold text-[11px]">+{intent.takeProfitPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="15.0"
                      step="0.5"
                      value={intent.takeProfitPct}
                      onChange={(e) => onChange({ ...intent, takeProfitPct: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>${estimatedTpPrice.toLocaleString()}</span>
                      <span className="text-emerald-600 font-bold">+${potentialProfitUsd}</span>
                    </div>
                  </div>

                  {/* Stop-Loss */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-700 font-bold text-[11px]">Stop-Loss</span>
                      <span className="font-mono text-rose-700 font-bold text-[11px]">-{intent.stopLossPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.5"
                      value={intent.stopLossPct}
                      onChange={(e) => onChange({ ...intent, stopLossPct: parseFloat(e.target.value) })}
                      className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>${estimatedSlPrice.toLocaleString()}</span>
                      <span className="text-rose-600 font-bold">-${potentialLossUsd}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 Navigation Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-3 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: PREVIEW AND SUBMIT BUTTON */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Full Structured Preview Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4 shadow-2xs">
            {/* Catalyst Summary Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Event Trigger Catalyst
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Arbitrum One Flash
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activePreset.avatar ? (
                <img
                  src={activePreset.avatar}
                  alt={activePreset.persona}
                  className="w-11 h-11 rounded-2xl object-cover object-top border border-slate-200 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                  ⚡
                </div>
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {intent.eventName || `${intent.targetHandle} Catalyst`}
                </div>
                <div className="text-xs text-blue-600 font-mono font-medium">
                  Listening to @{intent.targetHandle.replace("@", "")}
                </div>
              </div>
            </div>

            {/* Config Specs 4-Box Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Token &amp; Size</div>
                <div className="font-extrabold text-slate-900 font-mono text-sm mt-0.5">
                  ${intent.tradeSizeUsdc} USDC
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  &rarr; ~{estTokenQuantity} {intent.targetAsset}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sentiment &amp; Proof</div>
                <div className="font-bold text-blue-700 text-xs mt-0.5">
                  {intent.sentimentDirection.replace("_ONLY", "")}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  ≥ {Math.round(intent.confidenceThreshold * 100)}% 0G TEE Proof
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Take-Profit Leg</div>
                <div className="font-bold text-emerald-700 font-mono text-xs mt-0.5">
                  +{intent.takeProfitPct}% (${estimatedTpPrice.toLocaleString()})
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                  +${potentialProfitUsd} USDC Profit
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">Stop-Loss Leg</div>
                <div className="font-bold text-rose-600 font-mono text-xs mt-0.5">
                  -{intent.stopLossPct}% (${estimatedSlPrice.toLocaleString()})
                </div>
                <div className="text-[10px] text-rose-600 mt-0.5 font-semibold">
                  -${potentialLossUsd} USDC Max Risk
                </div>
              </div>
            </div>

            {/* Risk / Reward & Non-Custodial Verification */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-medium text-[11px] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Risk / Reward Ratio</span>
                </span>
                <span className="font-mono font-bold text-blue-700">{riskRewardRatio}:1 R:R</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-medium text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Settlement Security</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">0G TEE + Definitive Flash Bracket</span>
              </div>
            </div>

            {/* Zero Manual Funding / Direct Main Wallet Deduction Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>Zero Pre-Funding Required</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                        Direct Main Wallet Deduction
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      No manual deposits needed • Capital deducted on-demand when trade fires
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>$0 Deposit Needed</span>
                  </span>
                </div>
              </div>

              {/* Deduction & Routing Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Manual Pre-Funding</span>
                  <div className="font-mono font-black text-emerald-700 text-sm mt-0.5">$0.00</div>
                  <span className="text-[9px] text-slate-500">Zero transfers</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Capital Custody</span>
                  <div className="font-mono font-bold text-slate-900 text-xs mt-0.5 truncate">
                    {connectedWallet ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}` : "Connected EOA"}
                  </div>
                  <span className="text-[9px] text-emerald-600 font-semibold">100% in Main Wallet</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Deduction Method</span>
                  <div className="font-bold text-blue-700 text-xs mt-0.5">Flash JIT Pull</div>
                  <span className="text-[9px] text-slate-500">Only on Catalyst</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Exit Proceeds</span>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5">Direct to Main</div>
                  <span className="text-[9px] text-slate-500">No withdrawal step</span>
                </div>
              </div>

              {/* Dedicated Agent Identity & Session Key Details */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="p-3 rounded-xl bg-white/95 border border-blue-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-blue-600" />
                      <span>Dedicated Agent Session Contract (Arbitrum One)</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                      {agentWallet.address}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(agentWallet.address);
                        setCopiedWallet(true);
                        setTimeout(() => setCopiedWallet(false), 2000);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={agentWallet.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-blue-600 transition cursor-pointer"
                      title="View Agent on Arbiscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-blue-50 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Scoped Session Authorization</span>
                    <span className="font-mono text-slate-700 text-xs font-semibold">
                      Allowed Spender: Definitive Flash Router (0x5d00...8f78) • Max ${intent.tradeSizeUsdc} USDC
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold">
                    Router Locked
                  </span>
                </div>
              </div>

              {/* 2-Step Authorization Status Breakdown */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>2-Step Non-Custodial Authorization (Arbitrum One)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    MetaMask Flow
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Step 1: USDC Allowance */}
                  <div className="p-2.5 rounded-xl border bg-slate-50/70 border-slate-200/80 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">
                          1
                        </span>
                        <span>Definitive Flash Router USDC Allowance</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-5.5">
                        Permits <code>0x5d00...8f78</code> to pull USDC on demand when a catalyst fires.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {allowanceInfo?.isPreApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Pre-Approved ({allowanceInfo.formatted})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <span>MetaMask Tx 1 Required</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Test/Force Re-Approve Option */}
                  {allowanceInfo?.isPreApproved && (
                    <div className="flex items-center justify-between px-2 pt-0.5 text-[11px]">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={forceReapprove}
                          onChange={(e) => setForceReapprove(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-medium text-[11px]">
                          Force on-chain approval transaction (prompts Popup #1)
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                    </div>
                  )}

                  {/* Step 2: Session Delegation Permit */}
                  <div className="p-2.5 rounded-xl border bg-slate-50/70 border-slate-200/80 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                          2
                        </span>
                        <span>EIP-712 Session Key Delegation Permit</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-5.5">
                        Gasless cryptographic signature authorizing the agent to evaluate tweets &amp; trigger trades.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <span>{allowanceInfo?.isPreApproved && !forceReapprove ? "1 MetaMask Popup" : "Popup 2 of 2"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-normal pl-0.5">
                  {allowanceInfo?.isPreApproved && !forceReapprove ? (
                    <span>
                      💡 <strong>Notice:</strong> Your connected wallet already has an onchain USDC allowance granted to Definitive Flash. MetaMask will prompt <strong>only 1 signature popup</strong> (the EIP-712 Session Permit). Check the box above if you want to test the approval transaction explicitly.
                    </span>
                  ) : (
                    <span>
                      💡 <strong>Notice:</strong> MetaMask will prompt <strong>2 sequential popups</strong>: (1) USDC router approval on Arbitrum One, then (2) EIP-712 Session Permit signature.
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-600 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-100/80 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Non-Custodial Guarantee:</strong> Your USDC stays inside your connected MetaMask wallet. You do not need to send gas or deposit capital. The agent holds an EIP-712 spend permit capped at exactly ${intent.tradeSizeUsdc} USDC that triggers exclusively when the social catalyst conditions are verified onchain.
                </span>
              </div>
            </div>
          </div>

          {/* Signing Error Alert */}
          {signingError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{signingError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSigningError(null)}
                className="text-rose-600 hover:text-rose-900 font-bold text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Submission Success Alert */}
          {justSubmitted && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Session Key Authorized! Event Agent Deployed with Dedicated Sub-Wallet.</span>
            </div>
          )}

          {/* Step 3 Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* Primary Submit Button */}
            <div className="flex-1 flex flex-col gap-1">
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting || isSigningDelegation}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isSigningDelegation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{delegationStep || "Awaiting MetaMask Permissions Setup..."}</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Arming Delegated Event Sentinel...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Sign Spend Delegation &amp; Arm Agent ($0 Deposit Needed)</span>
                  </>
                )}
              </button>
              <div className="text-[10px] text-center text-slate-500 font-medium">
                Funds stay in your main wallet • Deducted on-demand only if catalyst executes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
