"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header, TerminalTab } from "@/components/Header";
import { EventTriggerWizard } from "@/components/EventTriggerWizard";
import { PositionsList } from "@/components/PositionsList";
import { LiveMonitor } from "@/components/LiveMonitor";
import { AgentVault } from "@/components/AgentVault";
import {
  TradingIntent,
  DetectedTweet,
  ZeroGInferenceResult,
  FlashOrderResult,
  AgentVaultState,
  AuditExecutionRecord,
  EventPosition,
} from "@/types";
import { createAgentWallet } from "@/lib/agentWallet";
import { History, ExternalLink, ArrowLeft, Plus, ShieldCheck, PieChart, TrendingUp } from "lucide-react";
import Link from "next/link";

function createInitialPresetPositions(masterController: string): EventPosition[] {
  const master = masterController || "0x71C84A962bFe2487431e50fB79D325603F01498B";

  // Every single card has its own unique, newly-generated non-custodial Smart Account + Session Key
  const fomcAgent = createAgentWallet(master, 500, "FOMC Rate Cut Decision");
  fomcAgent.status = "SETTLED";

  const pectraAgent = createAgentWallet(master, 250, "Pectra Hardfork Devcon");
  pectraAgent.status = "ACTIVE";

  const trumpAgent = createAgentWallet(master, 1000, "Crypto Strategic Reserve");
  trumpAgent.status = "ACTIVE";

  return [
    {
      id: "pos-fomc-1",
      eventName: "FOMC Rate Cut Decision (7:00 PM)",
      targetHandle: "federalreserve",
      persona: "Jerome Powell",
      avatar: "/avatars/powell.jpg",
      targetAsset: "WETH",
      contraAsset: "USDC",
      sizeUsdc: 500,
      entryPrice: 2740.0,
      currentPrice: 2918.1,
      side: "LONG",
      pnlUsd: 32.5,
      pnlPct: 6.5,
      takeProfitPrice: 2877.0,
      stopLossPrice: 2671.5,
      takeProfitPct: 5.0,
      stopLossPct: 2.5,
      status: "PROFIT_TAKEN",
      confidenceThreshold: 0.75,
      orderType: "BRACKET",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      txHash: "0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
      explorerUrl: "https://arbiscan.io/tx/0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
      entryTxHash: "0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
      entryExplorerUrl: "https://arbiscan.io/tx/0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
      exitTxHash: "0x5c8e9b412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a11",
      exitExplorerUrl: "https://arbiscan.io/tx/0x5c8e9b412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a11",
      exitPrice: 2877.0,
      settledAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      agentWallet: fomcAgent,
    },
    {
      id: "pos-pectra-2",
      eventName: "Pectra Hardfork Devcon",
      targetHandle: "VitalikButerin",
      persona: "Vitalik Buterin",
      avatar: "/avatars/vitalik.jpg",
      targetAsset: "WETH",
      contraAsset: "USDC",
      sizeUsdc: 250,
      entryPrice: 2810.0,
      currentPrice: 2939.8,
      side: "LONG",
      pnlUsd: 11.55,
      pnlPct: 4.62,
      takeProfitPrice: 2950.5,
      stopLossPrice: 2739.75,
      takeProfitPct: 5.0,
      stopLossPct: 2.5,
      status: "OPEN",
      confidenceThreshold: 0.8,
      orderType: "BRACKET",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      txHash: "0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
      explorerUrl: "https://arbiscan.io/tx/0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
      entryTxHash: "0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
      entryExplorerUrl: "https://arbiscan.io/tx/0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
      agentWallet: pectraAgent,
    },
    {
      id: "pos-trump-3",
      eventName: "Crypto Strategic Reserve",
      targetHandle: "realDonaldTrump",
      persona: "Donald Trump",
      avatar: "/avatars/trump.jpg",
      targetAsset: "WBTC",
      contraAsset: "USDC",
      sizeUsdc: 1000,
      entryPrice: 84200.0,
      currentPrice: 89673.0,
      side: "LONG",
      pnlUsd: 65.0,
      pnlPct: 6.5,
      takeProfitPrice: 88410.0,
      stopLossPrice: 82095.0,
      takeProfitPct: 5.0,
      stopLossPct: 2.5,
      status: "OPEN",
      confidenceThreshold: 0.75,
      orderType: "BRACKET",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      txHash: "0x7c2b184920394857162839405918273645192837465019283746501928374650",
      explorerUrl: "https://arbiscan.io/tx/0x7c2b184920394857162839405918273645192837465019283746501928374650",
      entryTxHash: "0x7c2b184920394857162839405918273645192837465019283746501928374650",
      entryExplorerUrl: "https://arbiscan.io/tx/0x7c2b184920394857162839405918273645192837465019283746501928374650",
      agentWallet: trumpAgent,
    },
  ];
}

function TerminalContent() {
  const searchParams = useSearchParams();
  const initialHandle = searchParams.get("handle") || "federalreserve";
  const initialEvent = searchParams.get("event") || "FOMC Rate Cut Decision (7:00 PM)";

  // Strategy Intent State
  const [intent, setIntent] = useState<TradingIntent>({
    targetHandle: initialHandle,
    eventName: initialEvent,
    targetAsset: "WETH",
    contraAsset: "USDC",
    confidenceThreshold: 0.75,
    sentimentDirection: "BULLISH_ONLY",
    tradeSizeUsdc: 100,
    takeProfitPct: 5.0,
    stopLossPct: 2.5,
    orderType: "BRACKET",
    maxTrades: 3,
  });

  // Keep intent in sync if URL query params change
  useEffect(() => {
    const h = searchParams.get("handle");
    const e = searchParams.get("event");
    if (h) {
      setIntent((prev) => ({
        ...prev,
        targetHandle: h,
        ...(e ? { eventName: e } : {}),
      }));
    }
  }, [searchParams]);

  // Radar & Ingestion State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [pollCountdown, setPollCountdown] = useState<number>(3);
  const [lastTweetId, setLastTweetId] = useState<string>("");
  const [latestTweet, setLatestTweet] = useState<DetectedTweet | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  // Engine Outputs
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [latestInference, setLatestInference] = useState<ZeroGInferenceResult | null>(null);
  const [latestOrder, setLatestOrder] = useState<FlashOrderResult | null>(null);
  const [skipReason, setSkipReason] = useState<string | null>(null);

  // Self-Sustaining Vault State
  const [vault, setVault] = useState<AgentVaultState>({
    zeroGComputeBalanceUsd: 14.85,
    creditsEarnedFromTradesUsd: 0.0,
    dailySpendCapUsd: 5.0,
    inferencesRunCount: 0,
    tradesExecutedCount: 0,
  });

  // Active Navigation Tab: "positions" | "portfolio" | "history" (Positions is highlighted by default)
  const [activeTab, setActiveTab] = useState<TerminalTab>("positions");

  // Mode: First screen is positions cards with "+ Start New Trade". When clicked, show 3-step creator form
  const [isCreatingTrade, setIsCreatingTrade] = useState<boolean>(false);

  // Connected Web3 Wallet State
  const [walletAddress, setWalletAddress] = useState<string>("");

  // Event-Based Positions State (each position card has its own unique, newly-generated non-custodial wallet)
  const [positions, setPositions] = useState<EventPosition[]>(() =>
    createInitialPresetPositions("")
  );

  // Sync positions controller whenever master wallet connects or switches
  useEffect(() => {
    if (walletAddress) {
      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.agentWallet && pos.agentWallet.masterController !== walletAddress) {
            return {
              ...pos,
              agentWallet: {
                ...pos.agentWallet,
                masterController: walletAddress,
              },
            };
          }
          return pos;
        })
      );
    }
  }, [walletAddress]);

  const handleDeployPosition = (newPosData: Omit<EventPosition, "id" | "createdAt">) => {
    const newPos: EventPosition = {
      ...newPosData,
      id: `pos-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleClosePosition = (id: string) => {
    // 1. Locate the position being closed
    const target = positions.find((p) => p.id === id);

    // 2. Revoke and clean up dedicated non-custodial agent wallet session from storage
    if (target?.agentWallet?.address && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pumpit_agent_wallets");
        if (stored) {
          const wallets = JSON.parse(stored);
          delete wallets[target.agentWallet.address.toLowerCase()];
          localStorage.setItem("pumpit_agent_wallets", JSON.stringify(wallets));
        }
      } catch (err) {
        console.warn("Could not clean up revoked agent wallet:", err);
      }
    }

    // 3. Delete the event agent card completely from active positions list
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Execute the final SELL trade on Arbitrum One via Definitive Flash API
  const handleExecuteExitSell = async (
    pos: EventPosition,
    exitType: "TAKE_PROFIT" | "STOP_LOSS" | "MANUAL_MARKET" = "TAKE_PROFIT"
  ) => {
    try {
      const res = await fetch("/api/agent/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXIT_SELL",
          position: pos,
          exitType,
          apiKey: apiKeys.definitiveKey || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.trade) {
        const trade = data.trade;

        // Update position state with final SELL trade execution on Arbitrum One
        setPositions((prev) =>
          prev.map((p) => {
            if (p.id === pos.id) {
              return {
                ...p,
                status: trade.status,
                exitPrice: trade.exitPrice,
                currentPrice: trade.exitPrice,
                pnlUsd: trade.realizedPnlUsd,
                pnlPct: trade.realizedPnlPct,
                exitTxHash: trade.exitTxHash,
                exitExplorerUrl: trade.exitExplorerUrl,
                settledAt: new Date().toISOString(),
              };
            }
            return p;
          })
        );

        // Update Vault with fee rebate
        setVault((prev) => ({
          ...prev,
          creditsEarnedFromTradesUsd: prev.creditsEarnedFromTradesUsd + trade.vaultRebateUsd,
          zeroGComputeBalanceUsd: prev.zeroGComputeBalanceUsd + trade.vaultRebateUsd,
          tradesExecutedCount: prev.tradesExecutedCount + 1,
        }));
      }
    } catch (err) {
      console.error("Exit sell execution failed:", err);
    }
  };

  // Emergency Escape Hatch: Sweep funds from Smart Account back to Master Wallet
  const handleEmergencySweep = async (pos: EventPosition) => {
    try {
      const res = await fetch("/api/agent/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SWEEP_MASTER",
          position: pos,
          masterController: walletAddress || pos.agentWallet?.masterController,
          amountUsdc: pos.sizeUsdc,
        }),
      });

      const data = await res.json();
      if (data.success && data.sweep) {
        setPositions((prev) =>
          prev.map((p) => {
            if (p.id === pos.id) {
              return {
                ...p,
                isSwept: true,
                sweepTxHash: data.sweep.sweepTxHash,
                status: "CLOSED",
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Emergency sweep error:", err);
    }
  };

  // Audit History (all execution records dynamically reference their generated agent sub-wallets)
  const [auditRecords, setAuditRecords] = useState<AuditExecutionRecord[]>(() => {
    const w1 = createAgentWallet(walletAddress, 500);
    const w2 = createAgentWallet(walletAddress, 250);
    return [
      {
        id: "audit-1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        tweet: {
          id: "tw-101",
          author: "federalreserve",
          text: "FOMC statement: The Committee decided to lower the target range for the federal funds rate by 50 basis points.",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          url: "https://x.com/federalreserve/status/101",
        },
        zeroG: {
          requestId: "0g-req-fomc-9b3f",
          model: "0g-private-llama-3-70b-tee",
          sentimentScore: 0.88,
          confidence: 0.94,
          sentimentLabel: "EXTREMELY_BULLISH",
          action: "BUY",
          rationale: "Aggressive 50 bps rate cut easing financial conditions, historically strong tailwind for risk assets and ETH.",
          matchedIntent: true,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        order: {
          orderId: "flash-fomc-001",
          status: "FILLED",
          targetChain: "Arbitrum One",
          targetToken: "WETH",
          contraToken: "USDC",
          amount: "$500 USDC -> WETH",
          txHash: "0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
          bracket: {
            takeProfitPercentage: 5.0,
            stopLossPercentage: 2.5,
            estimatedTakeProfitPrice: 2877.0,
            estimatedStopLossPrice: 2671.5,
          },
          integratorFeeRebateUsd: 0.5,
          explorerUrl: "https://arbiscan.io/tx/0x9b3f412a88489c6d3e8e192736154817a02b1f8c7b8d4e92a104c8f5e27a91bc",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          agentWalletAddress: w1.address,
        },
        status: "EXECUTED",
        reason: "Confidence (94%) exceeded threshold (75%). Placed BRACKET order via Definitive Flash.",
      },
      {
        id: "audit-2",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        tweet: {
          id: "tw-102",
          author: "VitalikButerin",
          text: "Pectra hardfork specifications finalized for devnet testing. Layer 1 scalability improvements on track.",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          url: "https://x.com/VitalikButerin/status/102",
        },
        zeroG: {
          requestId: "0g-req-vitalik-4a1e",
          model: "0g-private-llama-3-70b-tee",
          sentimentScore: 0.72,
          confidence: 0.86,
          sentimentLabel: "BULLISH",
          action: "BUY",
          rationale: "Devnet finalization confirms smooth execution timeline for Ethereum protocol roadmap.",
          matchedIntent: true,
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        order: {
          orderId: "flash-pectra-002",
          status: "FILLED",
          targetChain: "Arbitrum One",
          targetToken: "WETH",
          contraToken: "USDC",
          amount: "$250 USDC -> WETH",
          txHash: "0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
          bracket: {
            takeProfitPercentage: 5.0,
            stopLossPercentage: 2.5,
            estimatedTakeProfitPrice: 2950.5,
            estimatedStopLossPrice: 2739.75,
          },
          integratorFeeRebateUsd: 0.25,
          explorerUrl: "https://arbiscan.io/tx/0x4a1e92d83b1029c78f192a837c64510293847561829304918273645192837465",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          agentWalletAddress: w2.address,
        },
        status: "EXECUTED",
        reason: "Confidence (86%) exceeded threshold (80%). Placed BRACKET order via Definitive Flash.",
      },
    ];
  });

  // Sponsor API Keys (loaded from localStorage or environment fallback)
  const [apiKeys, setApiKeys] = useState({
    zeroGKey: "",
    definitiveKey: "",
    twitterToken: "",
  });

  // Load keys from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pumpit_keys");
      if (saved) {
        setApiKeys(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read localStorage keys");
    }
  }, []);

  const handleSaveKeys = (keys: typeof apiKeys) => {
    setApiKeys(keys);
    try {
      localStorage.setItem("pumpit_keys", JSON.stringify(keys));
    } catch (e) {
      console.warn("Could not write to localStorage");
    }
  };

  // Evaluate Tweet Pipeline
  const processTweetEvaluation = useCallback(
    async (tweet: DetectedTweet) => {
      setIsEvaluating(true);
      setSkipReason(null);
      setLatestOrder(null);

      try {
        // Locate matching armed or open position to extract its agent wallet (non-custodial session key)
        const targetPos = positions.find(
          (p) =>
            (p.status === "ARMED" || p.status === "OPEN") &&
            (p.targetHandle.toLowerCase() === tweet.author.toLowerCase() ||
              p.eventName.toLowerCase() === intent.eventName.toLowerCase())
        );

        let activeAgentWallet = targetPos?.agentWallet;
        if (!activeAgentWallet) {
          activeAgentWallet = createAgentWallet(
            walletAddress || "0x71C84A962bFe2487431e50fB79D325603F01498B",
            intent.tradeSizeUsdc
          );
        }

        const res = await fetch("/api/agent/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tweet,
            intent,
            apiKeys,
            walletAddress: walletAddress || undefined,
            agentWallet: activeAgentWallet
              ? {
                  address: activeAgentWallet.address,
                  privateKey: activeAgentWallet.privateKey,
                }
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.success && data.record) {
          const record: AuditExecutionRecord = data.record;
          setLatestInference(record.zeroG);

          if (record.status === "EXECUTED" && record.order) {
            setLatestOrder(record.order);

            // Update or activate armed position with live execution
            const tradePnlPct = Math.round(intent.takeProfitPct * 0.72 * 100) / 100;
            const tradePnlUsd = Math.round(((intent.tradeSizeUsdc * tradePnlPct) / 100) * 100) / 100;
            const refPrice = intent.targetAsset === "WBTC" ? 88250.0 : intent.targetAsset === "SOL" ? 192.4 : 2840.5;

            setPositions((prev) => {
              const armedIdx = prev.findIndex(
                (p) =>
                  p.status === "ARMED" &&
                  (p.targetHandle.toLowerCase() === tweet.author.toLowerCase() ||
                    p.eventName === intent.eventName)
              );

              if (armedIdx !== -1) {
                const updated = [...prev];
                updated[armedIdx] = {
                  ...updated[armedIdx],
                  status: "OPEN",
                  pnlUsd: tradePnlUsd,
                  pnlPct: tradePnlPct,
                  currentPrice: Math.round(refPrice * (1 + tradePnlPct / 100) * 100) / 100,
                  txHash: record.order!.txHash,
                  explorerUrl: record.order!.explorerUrl,
                  entryTxHash: record.order!.txHash,
                  entryExplorerUrl: record.order!.explorerUrl,
                  triggeredTweet: tweet.text,
                  agentWallet: updated[armedIdx].agentWallet || activeAgentWallet,
                };
                return updated;
              } else {
                const newPos: EventPosition = {
                  id: `pos-auto-${Date.now()}`,
                  eventName: intent.eventName,
                  targetHandle: tweet.author,
                  persona: `@${tweet.author}`,
                  targetAsset: intent.targetAsset,
                  contraAsset: intent.contraAsset,
                  sizeUsdc: intent.tradeSizeUsdc,
                  entryPrice: refPrice,
                  currentPrice: Math.round(refPrice * (1 + tradePnlPct / 100) * 100) / 100,
                  side: intent.sentimentDirection === "BEARISH_ONLY" ? "SHORT" : "LONG",
                  pnlUsd: tradePnlUsd,
                  pnlPct: tradePnlPct,
                  takeProfitPrice: Math.round(refPrice * (1 + intent.takeProfitPct / 100) * 100) / 100,
                  stopLossPrice: Math.round(refPrice * (1 - intent.stopLossPct / 100) * 100) / 100,
                  takeProfitPct: intent.takeProfitPct,
                  stopLossPct: intent.stopLossPct,
                  status: "OPEN",
                  confidenceThreshold: intent.confidenceThreshold,
                  orderType: intent.orderType,
                  createdAt: new Date().toISOString(),
                  txHash: record.order!.txHash,
                  explorerUrl: record.order!.explorerUrl,
                  entryTxHash: record.order!.txHash,
                  entryExplorerUrl: record.order!.explorerUrl,
                  triggeredTweet: tweet.text,
                  agentWallet: activeAgentWallet,
                };
                return [newPos, ...prev];
              }
            });

            // Update Vault with fee rebate
            setVault((prev) => ({
              ...prev,
              zeroGComputeBalanceUsd: prev.zeroGComputeBalanceUsd - 0.003 + data.vaultRebateUsd,
              creditsEarnedFromTradesUsd: prev.creditsEarnedFromTradesUsd + data.vaultRebateUsd,
              inferencesRunCount: prev.inferencesRunCount + 1,
              tradesExecutedCount: prev.tradesExecutedCount + 1,
            }));
          } else {
            setSkipReason(record.reason);
            setVault((prev) => ({
              ...prev,
              zeroGComputeBalanceUsd: Math.max(0, prev.zeroGComputeBalanceUsd - 0.003),
              inferencesRunCount: prev.inferencesRunCount + 1,
            }));
          }

          setAuditRecords((prev) => [record, ...prev.slice(0, 19)]);
        }
      } catch (err) {
        console.error("Evaluation error:", err);
      } finally {
        setIsEvaluating(false);
      }
    },
    [intent, apiKeys, walletAddress, positions]
  );

  // Periodic polling when listening
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isListening) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const checkTweets = async () => {
      try {
        const headers: Record<string, string> = {};
        if (apiKeys.twitterToken) {
          headers["x-twitter-token"] = apiKeys.twitterToken;
        }

        let url = `/api/agent/listen?handle=${encodeURIComponent(intent.targetHandle)}`;
        if (lastTweetId) {
          url += `&sinceId=${encodeURIComponent(lastTweetId)}`;
        }

        const res = await fetch(url, { headers });
        const data = await res.json();

        if (data.success && data.tweets && data.tweets.length > 0) {
          const freshTweet = data.tweets[0];
          setLastTweetId(freshTweet.id);
          setLatestTweet(freshTweet);
          // Trigger evaluation
          await processTweetEvaluation(freshTweet);
        }
      } catch (err) {
        console.warn("Poll cycle error:", err);
      }
    };

    // Countdown and poll every 3 seconds
    let secondsLeft = 3;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = 3;
        checkTweets();
      }
      setPollCountdown(secondsLeft);
    }, 1000);

    pollTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isListening, intent.targetHandle, lastTweetId, apiKeys.twitterToken, processTweetEvaluation]);

  // Fetch a specific tweet by URL
  const handleFetchTweetByUrl = async (url: string) => {
    try {
      const res = await fetch(`/api/agent/listen?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.success && data.tweets && data.tweets.length > 0) {
        const freshTweet = data.tweets[0];
        setLastTweetId(freshTweet.id);
        setLatestTweet(freshTweet);
        await processTweetEvaluation(freshTweet);
      }
    } catch (err) {
      console.error("URL fetch error:", err);
    }
  };

  // Inject a live tweet immediately (for phone test / judge interactive test)
  const handleInjectTestTweet = async (text: string) => {
    setIsInjecting(true);
    try {
      const res = await fetch("/api/agent/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: intent.targetHandle,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.tweet) {
        setLastTweetId(data.tweet.id);
        setLatestTweet(data.tweet);
        await processTweetEvaluation(data.tweet);
      }
    } catch (err) {
      console.error("Injection error:", err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation with Tabs (Positions, Portfolio, History) & Wallet Button */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "positions") {
            setIsCreatingTrade(false);
          }
        }}
        onAddressChange={setWalletAddress}
      />

      {/* Main Terminal Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: POSITIONS (Default First Screen) */}
        {activeTab === "positions" && (
          <>
            {/* View A: First Screen = 8-4 2-Column Grid (8: Flat Cards of Positions, 4: Live Tweet Tracking & Checking Loader) */}
            {!isCreatingTrade ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
                {/* 8-Size Area: Flat Cards of Positions & "+ Start New Trade" */}
                <div className="lg:col-span-8 space-y-4">
                  <PositionsList
                    positions={positions}
                    onClosePosition={handleClosePosition}
                    onStartNewTrade={() => setIsCreatingTrade(true)}
                    onExecuteExitSell={handleExecuteExitSell}
                    onEmergencySweep={handleEmergencySweep}
                  />
                </div>

                {/* 4-Size Area: Tweets Tracking & Checking Loader Sign */}
                <div className="lg:col-span-4">
                  <LiveMonitor
                    handle={intent.targetHandle}
                    isListening={isListening}
                    latestTweet={latestTweet}
                    pollSecondsRemaining={pollCountdown}
                    onInjectTestTweet={handleInjectTestTweet}
                    onFetchTweetByUrl={handleFetchTweetByUrl}
                    isInjecting={isInjecting}
                    trackedHandles={Array.from(new Set(positions.map((p) => p.targetHandle)))}
                    onToggleListening={() => setIsListening(!isListening)}
                  />
                </div>
              </div>
            ) : (
              /* View B: Center-aligned 3-Step Wizard to Create Event-Based Trade */
              <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-200">
                <EventTriggerWizard
                  intent={intent}
                  onChange={setIntent}
                  isListening={isListening}
                  onToggleListening={() => setIsListening(!isListening)}
                  onDeployPosition={(newPos) => {
                    handleDeployPosition(newPos);
                    setIsCreatingTrade(false);
                  }}
                  onCancel={() => setIsCreatingTrade(false)}
                  connectedWallet={walletAddress}
                />
              </div>
            )}
          </>
        )}

        {/* TAB 2: PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Overview */}
            <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[18px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Portfolio &amp; Protocol Liquidity</h3>
                    <p className="text-xs text-slate-500">Autonomous vault balances, fee rebates &amp; asset allocations</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Arbitrum One Active
                </span>
              </div>

              {/* Portfolio Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Capital In Trades
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    ${positions.reduce((a, b) => a + b.sizeUsdc, 0).toLocaleString()} USDC
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{positions.length} Event Triggers</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Realized PnL
                  </div>
                  <div className="mt-1 text-lg font-black text-emerald-600">
                    +${positions.reduce((a, b) => a + (b.status !== "ARMED" ? b.pnlUsd : 0), 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Flash Bracket Settled</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    0G Compute Balance
                  </div>
                  <div className="mt-1 text-lg font-black text-blue-700">
                    ${vault.zeroGComputeBalanceUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Self-Sustaining Pool</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Integrator Rebates
                  </div>
                  <div className="mt-1 text-lg font-black text-purple-700">
                    ${vault.creditsEarnedFromTradesUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">0.1% Definitive Flash Fee</div>
                </div>
              </div>
            </div>

            {/* Self-Sustaining Vault */}
            <AgentVault vault={vault} />
          </div>
        )}

        {/* TAB 3: HISTORY (Cryptographic Audit History) */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Verifiable Audit History ({auditRecords.length})</h3>
                    <p className="text-xs text-slate-500">Cryptographically verifiable 0G TEE sentiment traces &amp; flash executions</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 font-medium">
                  Cryptographic Traceability
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Author &amp; Tweet</th>
                      <th className="pb-3">0G Proof ID</th>
                      <th className="pb-3">Sentiment</th>
                      <th className="pb-3">Flash Order</th>
                      <th className="pb-3">Agent Wallet</th>
                      <th className="pb-3 text-right">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 text-slate-500 text-[11px]">
                          {new Date(rec.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 text-slate-800 max-w-[240px] truncate font-medium">
                          @{rec.tweet.author}: &ldquo;{rec.tweet.text}&rdquo;
                        </td>
                        <td className="py-3 text-blue-700 font-semibold text-[11px]">
                          {rec.zeroG.requestId}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              rec.zeroG.sentimentScore > 0
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {rec.zeroG.sentimentScore > 0 ? `+${rec.zeroG.sentimentScore}` : rec.zeroG.sentimentScore} ({Math.round(rec.zeroG.confidence * 100)}%)
                          </span>
                        </td>
                        <td className="py-3">
                          {rec.status === "EXECUTED" ? (
                            <span className="text-blue-700 font-bold flex items-center gap-1.5 text-xs">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Bracket Filled
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Capital Guarded</span>
                          )}
                        </td>
                        <td className="py-3">
                          {rec.order?.agentWalletAddress ? (
                            <a
                              href={`https://arbiscan.io/address/${rec.order.agentWalletAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 transition"
                            >
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>
                                {rec.order.agentWalletAddress.slice(0, 6)}...{rec.order.agentWalletAddress.slice(-4)}
                              </span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">Non-Custodial</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {rec.order ? (
                            <a
                              href={rec.order.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-0.5 text-xs"
                            >
                              <span>Arbiscan</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
        <p>PumpIt • Verifiable Event-Driven Sentiment Trading • Powered by 0G Private Computer &amp; Definitive Flash API</p>
      </footer>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-600">Loading PumpIt Terminal...</div>}>
      <TerminalContent />
    </Suspense>
  );
}
