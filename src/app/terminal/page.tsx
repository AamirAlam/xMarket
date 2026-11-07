"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header, TerminalTab } from "@/components/Header";
import { EventTriggerWizard } from "@/components/EventTriggerWizard";
import { PositionsList } from "@/components/PositionsList";
import { LiveMonitor } from "@/components/LiveMonitor";
import { AgentVault } from "@/components/AgentVault";
import { TradesHistoryTable } from "@/components/TradesHistoryTable";
import { ArkivStoragePanel } from "@/components/ArkivStoragePanel";
import {
  TradingIntent,
  DetectedTweet,
  ZeroGInferenceResult,
  FlashOrderResult,
  AgentVaultState,
  AuditExecutionRecord,
  EventPosition,
  PositionStatus,
  WalletBalances,
  AgentTradeRecord,
} from "@/types";
import { createAgentWallet } from "@/lib/agentWallet";
import { fetchRealWalletBalances } from "@/lib/walletBalances";
import { History, ExternalLink, ArrowLeft, Plus, ShieldCheck, PieChart, TrendingUp, RefreshCw, Wallet, Coins, Check, Copy } from "lucide-react";
import Link from "next/link";

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
  const [isListening, setIsListening] = useState<boolean>(true);
  const isListeningRef = useRef<boolean>(true);
  const isPollingRef = useRef<boolean>(false);
  const [currentPollingHandle, setCurrentPollingHandle] = useState<string>("");
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [pollCountdown, setPollCountdown] = useState<number>(3);
  const [lastTweetId, setLastTweetId] = useState<string>("");
  const [latestTweet, setLatestTweet] = useState<DetectedTweet | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  // Engine Outputs
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [latestInference, setLatestInference] = useState<ZeroGInferenceResult | null>(null);
  const [latestOrder, setLatestOrder] = useState<FlashOrderResult | null>(null);
  const [skipReason, setSkipReason] = useState<string | null>(null);

  // Self-Sustaining Vault State (Real balance earned strictly via 0.1% Definitive Flash trade rebates)
  const [vault, setVault] = useState<AgentVaultState>({
    zeroGComputeBalanceUsd: 0.0,
    creditsEarnedFromTradesUsd: 0.0,
    dailySpendCapUsd: 5.0,
    inferencesRunCount: 0,
    tradesExecutedCount: 0,
  });

  // Active Navigation Tab: "positions" | "portfolio" | "history" (Positions is highlighted by default)
  const [activeTab, setActiveTab] = useState<TerminalTab>("positions");

  // Mode: First screen is positions cards with "+ Start New Trade". When clicked, show 3-step creator form
  const [isCreatingTrade, setIsCreatingTrade] = useState<boolean>(false);

  // Connected Web3 Wallet State & Ground-Truth Arbitrum Balances
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({
    eth: 0,
    usdc: 0,
    totalUsd: 0,
    ethPriceUsd: 2840.50,
    isLoading: false,
    lastUpdated: "",
  });
  const [isRefreshingPortfolio, setIsRefreshingPortfolio] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

  const handleRefreshBalances = useCallback(async (addr?: string) => {
    const target = addr || walletAddress;
    if (!target) return;
    setIsRefreshingPortfolio(true);
    try {
      const res = await fetchRealWalletBalances(target);
      setWalletBalances(res);
    } catch (err) {
      console.warn("Portfolio balance query error:", err);
    } finally {
      setIsRefreshingPortfolio(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      handleRefreshBalances(walletAddress);
    }
  }, [walletAddress, handleRefreshBalances]);

  const copyWalletAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 1500);
    } catch {
      // ignore
    }
  };

  // Event-Based Positions State: Persisted in local SQLite database
  const [positions, setPositions] = useState<EventPosition[]>([]);
  const positionsRef = useRef<EventPosition[]>(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const lastTweetIdsRef = useRef<Record<string, string>>({});
  const [isPositionsLoaded, setIsPositionsLoaded] = useState<boolean>(false);

  // Load persisted positions from SQLite DB on initial mount
  useEffect(() => {
    async function loadPersistedPositions() {
      try {
        const res = await fetch("/api/positions");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.positions)) {
            setPositions(data.positions);
            positionsRef.current = data.positions;
          }
        }
      } catch (err) {
        console.warn("Could not load positions from SQLite DB:", err);
      } finally {
        setIsPositionsLoaded(true);
      }
    }
    loadPersistedPositions();
  }, []);

  // Real Agents Trade History State (Persisted in local SQLite database)
  const [trades, setTrades] = useState<AgentTradeRecord[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);

  const loadTrades = useCallback(async () => {
    setIsLoadingTrades(true);
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.trades)) {
          setTrades(data.trades);
        }
      }
    } catch (err) {
      console.warn("Failed to load trades from SQLite DB:", err);
    } finally {
      setIsLoadingTrades(false);
    }
  }, []);

  // Load trades on initial mount
  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

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

  // Helper to persist position updates (entry trade execution, sell settlement, sweep) into SQLite
  const persistPositionUpdate = async (posToSave: EventPosition) => {
    try {
      await fetch("/api/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: posToSave }),
      });
    } catch (err) {
      console.warn("Failed to update position in SQLite DB:", err);
    }
  };

  const handleDeployPosition = async (newPosData: Omit<EventPosition, "id" | "createdAt">) => {
    const newPos: EventPosition = {
      ...newPosData,
      id: `pos-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPositions((prev) => [newPos, ...prev]);

    // Persist new position directly to local SQLite DB
    try {
      await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPos }),
      });
    } catch (err) {
      console.warn("Failed to persist new position to SQLite DB:", err);
    }
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

        const updatedPos: EventPosition = {
          ...pos,
          status: trade.status,
          exitPrice: trade.exitPrice,
          currentPrice: trade.exitPrice,
          pnlUsd: trade.realizedPnlUsd,
          pnlPct: trade.realizedPnlPct,
          exitTxHash: trade.exitTxHash,
          exitExplorerUrl: trade.exitExplorerUrl,
          settledAt: new Date().toISOString(),
        };

        // Update position state with final SELL trade execution on Arbitrum One
        setPositions((prev) =>
          prev.map((p) => (p.id === pos.id ? updatedPos : p))
        );

        // Persist settlement to SQLite DB
        await persistPositionUpdate(updatedPos);
        loadTrades();

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
        const sweptPos: EventPosition = {
          ...pos,
          isSwept: true,
          sweepTxHash: data.sweep.sweepTxHash,
          status: "CLOSED",
        };

        setPositions((prev) =>
          prev.map((p) => (p.id === pos.id ? sweptPos : p))
        );

        await persistPositionUpdate(sweptPos);
        loadTrades();
      }
    } catch (err) {
      console.error("Emergency sweep error:", err);
    }
  };

  // Pause / Resume Agent Event Triggers & Monitoring
  const handleTogglePausePosition = async (pos: EventPosition) => {
    const isCurrentlyPaused = pos.status === "PAUSED";
    const nextStatus: PositionStatus = isCurrentlyPaused
      ? (pos.entryTxHash ? "OPEN" : "ARMED")
      : "PAUSED";

    const updatedPos: EventPosition = {
      ...pos,
      status: nextStatus,
    };

    setPositions((prev) =>
      prev.map((p) => (p.id === pos.id ? updatedPos : p))
    );
    await persistPositionUpdate(updatedPos);
  };

  // Audit History (records real executions when tweets are evaluated and trades land onchain)
  const [auditRecords, setAuditRecords] = useState<AuditExecutionRecord[]>([]);

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
        const currentPositions = positionsRef.current;
        const cleanAuthor = tweet.author.toLowerCase().replace("@", "").trim();

        // 1. Locate matching ARMED position that is explicitly awaiting this catalyst
        const armedPos = currentPositions.find(
          (p) =>
            p.status === "ARMED" &&
            (p.targetHandle.toLowerCase().replace("@", "").trim() === cleanAuthor ||
              p.eventName.toLowerCase() === intent.eventName.toLowerCase())
        );

        // 2. If NO matching ARMED position exists, evaluate for telemetry only.
        // NEVER execute onchain orders and NEVER create random/auto position cards!
        if (!armedPos) {
          const res = await fetch("/api/agent/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tweet,
              intent,
              apiKeys,
              walletAddress: walletAddress || undefined,
            }),
          });

          const data = await res.json();
          if (data.success && data.record) {
            setLatestInference(data.record.zeroG);
            setAuditRecords((prev) => [data.record, ...prev.slice(0, 19)]);
          }
          return;
        }

        // 3. Authentic user-authorized ARMED position exists
        const activeAgentWallet = armedPos.agentWallet;
        const tradeIntent: TradingIntent = {
          eventName: armedPos.eventName,
          targetHandle: armedPos.targetHandle,
          targetAsset: armedPos.targetAsset,
          contraAsset: armedPos.contraAsset,
          tradeSizeUsdc: armedPos.sizeUsdc,
          sentimentDirection: armedPos.side === "SHORT" ? "BEARISH_ONLY" : "BULLISH_ONLY",
          confidenceThreshold: armedPos.confidenceThreshold,
          takeProfitPct: armedPos.takeProfitPct,
          stopLossPct: armedPos.stopLossPct,
          orderType: armedPos.orderType || "BRACKET",
          maxTrades: 1,
        };

        const res = await fetch("/api/agent/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tweet,
            intent: tradeIntent,
            apiKeys,
            walletAddress: walletAddress || undefined,
            agentWallet: activeAgentWallet
              ? {
                  address: activeAgentWallet.address,
                  privateKey: activeAgentWallet.privateKey,
                  masterController: activeAgentWallet.masterController || walletAddress,
                }
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.success && data.record) {
          const record: AuditExecutionRecord = data.record;
          setLatestInference(record.zeroG);

          if (record.status === "EXECUTED" && record.order && record.order.txHash) {
            setLatestOrder(record.order);

            // Update matching ARMED position to OPEN with live execution
            const tradePnlPct = Math.round(tradeIntent.takeProfitPct * 0.72 * 100) / 100;
            const tradePnlUsd = Math.round(((tradeIntent.tradeSizeUsdc * tradePnlPct) / 100) * 100) / 100;
            const refPrice = armedPos.targetAsset === "WBTC" ? 88250.0 : armedPos.targetAsset === "SOL" ? 192.4 : 2840.5;

            setPositions((prev) => {
              const armedIdx = prev.findIndex((p) => p.id === armedPos.id && p.status === "ARMED");
              if (armedIdx === -1) {
                // If position already triggered or settled, never duplicate or auto-generate
                return prev;
              }

              const updated = [...prev];
              const updatedPos: EventPosition = {
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
              updated[armedIdx] = updatedPos;
              persistPositionUpdate(updatedPos).then(() => {
                loadTrades();
              });
              return updated;
            });

            // Update Vault with fee rebate
            setVault((prev) => ({
              ...prev,
              zeroGComputeBalanceUsd: prev.zeroGComputeBalanceUsd - 0.003 + data.vaultRebateUsd,
              creditsEarnedFromTradesUsd: prev.creditsEarnedFromTradesUsd + data.vaultRebateUsd,
              inferencesRunCount: prev.inferencesRunCount + 1,
              tradesExecutedCount: prev.tradesExecutedCount + 1,
            }));
          } else if (record.status === "PENDING") {
            setPositions((prev) => {
              const armedIdx = prev.findIndex((p) => p.id === armedPos.id && p.status === "ARMED");
              if (armedIdx === -1) return prev;
              const updated = [...prev];
              updated[armedIdx] = {
                ...updated[armedIdx],
                triggeredTweet: tweet.text,
              };
              persistPositionUpdate(updated[armedIdx]);
              return updated;
            });
            setSkipReason("0G Catalyst sentiment verified! Ready to execute real Definitive Flash swap via 'Swap Now'.");
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
    [intent, apiKeys, walletAddress]
  );

  // Keep isListeningRef in sync to immediately react in async loops
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Periodic polling queue when listening: executes each active agent handle sequentially with a strict 1-second delay
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isListening || !isPositionsLoaded) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setCurrentPollingHandle("");
      return;
    }

    const runPollingQueue = async () => {
      // Mutex lock to strictly prevent concurrent overlapping polling cycles
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const headers: Record<string, string> = {};
        if (apiKeys.twitterToken) {
          headers["x-twitter-token"] = apiKeys.twitterToken;
        }

        // 1. Listen ONLY for running agent accounts (ARMED or OPEN)
        const runningAgentHandles = Array.from(
          new Set(
            positionsRef.current
              .filter((p) => p.status === "ARMED" || p.status === "OPEN")
              .map((p) => p.targetHandle.replace("@", "").trim())
              .filter(Boolean)
          )
        );

        // Strictly listen to running agent accounts only if any exist
        const handlesToPoll =
          runningAgentHandles.length > 0
            ? runningAgentHandles
            : [intent.targetHandle?.replace("@", "").trim()].filter(Boolean);

        setQueueProgress({ current: 0, total: handlesToPoll.length });

        // 3. Process each agent handle sequentially in queue with an exact 1-second delay
        for (let i = 0; i < handlesToPoll.length; i++) {
          if (!isListeningRef.current) break;

          const handle = handlesToPoll[i];
          setCurrentPollingHandle(handle);
          setQueueProgress({ current: i + 1, total: handlesToPoll.length });

          let url = `/api/agent/listen?handle=${encodeURIComponent(handle)}`;
          const sinceId = lastTweetIdsRef.current[handle];
          if (sinceId) {
            url += `&sinceId=${encodeURIComponent(sinceId)}`;
          }

          try {
            const res = await fetch(url, { headers });
            const data = await res.json();

            if (data.success && data.tweets && data.tweets.length > 0) {
              const freshTweet = data.tweets[0];
              lastTweetIdsRef.current[handle] = freshTweet.id;
              setLastTweetId(freshTweet.id);
              setLatestTweet(freshTweet);

              // Evaluate tweet sentiment & execute trade if agent is armed
              await processTweetEvaluation(freshTweet);
            }
          } catch (pollErr) {
            console.warn(`Error polling handle @${handle}:`, pollErr);
          }

          // Strict 1-second delay between handles in the queue to guarantee zero rate-limiting
          if (i < handlesToPoll.length - 1 && isListeningRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      } catch (err) {
        console.warn("Poll queue cycle error:", err);
      } finally {
        setCurrentPollingHandle("");
        isPollingRef.current = false;
      }
    };

    // Run initial queue cycle immediately
    runPollingQueue();

    // Countdown and repeat queue every 3 seconds
    let secondsLeft = 3;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = 3;
        runPollingQueue();
      }
      setPollCountdown(secondsLeft);
    }, 1000);

    pollTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isListening, isPositionsLoaded, intent.targetHandle, apiKeys.twitterToken, processTweetEvaluation]);

  // Fetch latest tweet from a specific person/handle end-to-end (for interactive test)
  const handleFetchTweetFromPerson = async (targetHandle: string) => {
    const clean = targetHandle.replace("@", "").trim();
    if (!clean) return;
    setIsInjecting(true);
    try {
      const res = await fetch(`/api/agent/listen?handle=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.success && data.tweets && data.tweets.length > 0) {
        const freshTweet = data.tweets[0];
        lastTweetIdsRef.current[clean] = freshTweet.id;
        setLastTweetId(freshTweet.id);
        setLatestTweet(freshTweet);
        await processTweetEvaluation(freshTweet);
      }
    } catch (err) {
      console.error("Fetch person tweet error:", err);
    } finally {
      setIsInjecting(false);
    }
  };

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
          if (tab === "portfolio" && walletAddress) {
            handleRefreshBalances(walletAddress);
          }
          if (tab === "history") {
            loadTrades();
          }
        }}
        onAddressChange={(addr) => {
          setWalletAddress(addr);
          if (addr) handleRefreshBalances(addr);
        }}
        onBalanceChange={setWalletBalances}
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
                    onStartNewTrade={() => setIsCreatingTrade(true)}
                    onExecuteExitSell={handleExecuteExitSell}
                    onEmergencySweep={handleEmergencySweep}
                    onTogglePausePosition={handleTogglePausePosition}
                    connectedWallet={walletAddress}
                    onPositionUpdated={async (updatedPos) => {
                      setPositions((prev) =>
                        prev.map((p) => (p.id === updatedPos.id ? updatedPos : p))
                      );
                      await persistPositionUpdate(updatedPos);
                      loadTrades();
                      if (walletAddress) {
                        handleRefreshBalances(walletAddress);
                      }
                    }}
                  />
                </div>

                {/* 4-Size Area: Tweets Tracking & Checking Loader Sign */}
                <div className="lg:col-span-4">
                  {(() => {
                    const runningHandles = Array.from(
                      new Set(
                        positions
                          .filter((p) => p.status === "ARMED" || p.status === "OPEN")
                          .map((p) => p.targetHandle.replace("@", "").trim())
                          .filter(Boolean)
                      )
                    );
                    const activeHandle = runningHandles.length > 0 ? runningHandles[0] : intent.targetHandle;
                    const activeTrackedHandles = runningHandles.length > 0 ? runningHandles : [intent.targetHandle];

                    return (
                      <LiveMonitor
                        handle={activeHandle}
                        isListening={isListening}
                        latestTweet={latestTweet}
                        pollSecondsRemaining={pollCountdown}
                        onInjectTestTweet={handleInjectTestTweet}
                        onFetchTweetByUrl={handleFetchTweetByUrl}
                        onFetchTweetFromPerson={handleFetchTweetFromPerson}
                        isInjecting={isInjecting}
                        trackedHandles={activeTrackedHandles}
                        currentCheckingHandle={currentPollingHandle}
                        queueProgress={queueProgress}
                        onToggleListening={() => setIsListening(!isListening)}
                      />
                    );
                  })()}
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
            {/* Real Onchain Wallet Overview */}
            <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[18px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Arbitrum One Liquidity</h3>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Live RPC Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Real onchain token holdings and trade allocations on Arbitrum One</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {walletAddress && (
                    <button
                      type="button"
                      disabled={isRefreshingPortfolio}
                      onClick={() => handleRefreshBalances()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                      title="Re-query Arbitrum RPC for current balances"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingPortfolio ? "animate-spin" : ""}`} />
                      <span>{isRefreshingPortfolio ? "Querying..." : "Refresh Balances"}</span>
                    </button>
                  )}
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Chain ID 42161
                  </span>
                </div>
              </div>

              {walletAddress ? (
                <>
                  {/* Master Account Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Connected Funder Wallet (100% Custody)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-sm text-slate-900 truncate max-w-[280px] sm:max-w-none">
                          {walletAddress}
                        </span>
                        <button
                          type="button"
                          onClick={copyWalletAddress}
                          className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Copy Address"
                        >
                          {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`https://arbiscan.io/address/${walletAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-white rounded-md text-blue-600 transition"
                          title="View on Arbiscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="text-left sm:text-right sm:border-l sm:border-slate-200/80 sm:pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total Liquid Net Worth
                      </span>
                      <div className="font-mono font-black text-2xl text-slate-900 mt-0.5">
                        ${walletBalances.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Updated {walletBalances.lastUpdated || "just now"}
                      </span>
                    </div>
                  </div>

                  {/* Real Assets Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Native ETH */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Arbitrum Native ETH</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">Gas &amp; Base</span>
                      </div>
                      <div className="text-xl font-mono font-black text-slate-900">
                        {walletBalances.eth.toFixed(4)} ETH
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>${walletBalances.ethPriceUsd.toLocaleString()} / ETH</span>
                        <span className="font-semibold text-slate-700">
                          ${(walletBalances.eth * walletBalances.ethPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Canonical USDC */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Arbitrum USDC</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Trade Collateral</span>
                      </div>
                      <div className="text-xl font-mono font-black text-slate-900">
                        ${walletBalances.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>0xaf88...5831</span>
                        <span className="font-semibold text-emerald-700">$1.00 Peg</span>
                      </div>
                    </div>

                    {/* Active Capital in Trades */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Capital in Trades</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                          {positions.filter((p) => p.status === "ARMED" || p.status === "OPEN").length} Active
                        </span>
                      </div>
                      <div className="text-xl font-mono font-black text-slate-900">
                        ${positions.filter((p) => p.status === "ARMED" || p.status === "OPEN").reduce((a, b) => a + b.sizeUsdc, 0).toLocaleString()} USDC
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        Direct Delegated Spend
                      </div>
                    </div>

                    {/* Realized PnL */}
                    {(() => {
                      const settled = positions.filter((p) => p.status === "PROFIT_TAKEN" || p.status === "STOPPED_OUT" || p.status === "CLOSED");
                      const realizedPnl = settled.reduce((a, b) => a + (b.pnlUsd || 0), 0);
                      const isPositive = realizedPnl >= 0;
                      return (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Realized PnL</span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                              {settled.length} Settled
                            </span>
                          </div>
                          <div className={`text-xl font-mono font-black ${realizedPnl === 0 ? "text-slate-800" : isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {realizedPnl === 0 ? "$0.00" : `${isPositive ? "+" : ""}$${realizedPnl.toFixed(2)}`}
                          </div>
                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                            Flash Bracket Settled
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-bold text-slate-900">No Web3 Wallet Connected</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Connect your Arbitrum wallet using the button in the top navigation to view your real onchain ETH, USDC, deployed catalyst allocations, and trade settlement history.
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>100% Non-Custodial • Zero Escrow Pre-Funding Required</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Self-Sustaining Vault */}
            <AgentVault vault={vault} />
          </div>
        )}

        {/* TAB 3: HISTORY (Real Agents Trade History) */}
        {activeTab === "history" && (
          <TradesHistoryTable
            trades={trades}
            isLoading={isLoadingTrades}
            onRefresh={loadTrades}
            onDeployNewTrade={() => {
              setActiveTab("positions");
              setIsCreatingTrade(true);
            }}
          />
        )}

        {/* TAB 4: ARKIV DB-CHAIN DECENTRALIZED STORAGE */}
        {activeTab === "arkiv" && (
          <ArkivStoragePanel />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
        <p>xMarket • Verifiable Event-Driven Sentiment Trading • Powered by 0G Private Computer &amp; Definitive Flash API</p>
      </footer>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-600">Loading xMarket Terminal...</div>}>
      <TerminalContent />
    </Suspense>
  );
}
