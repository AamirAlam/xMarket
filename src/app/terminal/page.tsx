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
import { History, ExternalLink, ArrowLeft, Plus, ShieldCheck, PieChart, TrendingUp, RefreshCw, Wallet, Coins, Check, Copy, Zap } from "lucide-react";
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
  const [pollCountdown, setPollCountdown] = useState<number>(5);
  const [lastTweetId, setLastTweetId] = useState<string>("");
  const [latestTweet, setLatestTweet] = useState<DetectedTweet | null>(null);
  const [monitoredTweets, setMonitoredTweets] = useState<DetectedTweet[]>([]);
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
    ethPriceUsd: 2248.50,
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

            // Load any existing triggered tweets for active positions into the live feed
            const existingTweets: DetectedTweet[] = [];
            data.positions.forEach((pos: EventPosition) => {
              if ((pos.status === "ARMED" || pos.status === "OPEN") && pos.triggeredTweet) {
                existingTweets.push({
                  id: `trig-${pos.id}`,
                  author: pos.targetHandle,
                  text: pos.triggeredTweet,
                  createdAt: pos.createdAt,
                  url: `https://x.com/${pos.targetHandle.replace("@", "")}`,
                });
              }
            });
            if (existingTweets.length > 0) {
              setMonitoredTweets(existingTweets);
            }
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

  // Keep live feed strictly limited to looking ("ARMED") and active ("OPEN") positions on the left side
  useEffect(() => {
    const activeHandles = new Set(
      positions
        .filter((p) => p.status === "ARMED" || p.status === "OPEN")
        .map((p) => p.targetHandle.toLowerCase().replace("@", "").trim())
    );
    setMonitoredTweets((prev) =>
      prev.filter((t) => activeHandles.has(t.author.toLowerCase().replace("@", "").trim()))
    );
  }, [positions]);

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

        // Strict guard: if an ARMED agent exists for this catalyst, ONLY evaluate if tweet was posted AFTER agent creation
        if (armedPos) {
          const tweetTime = new Date(tweet.createdAt).getTime();
          const agentCreationTime = new Date(armedPos.createdAt).getTime();
          if (tweetTime <= agentCreationTime) {
            console.log(
              `[Evaluation Skipped] Tweet from @${tweet.author} (${tweet.createdAt}) was published before trade ${armedPos.id} setup (${armedPos.createdAt}). Ignoring old tweet.`
            );
            setSkipReason(
              `Tweet published at ${new Date(tweet.createdAt).toLocaleTimeString()} is older than trade setup (${new Date(armedPos.createdAt).toLocaleTimeString()}). Only tweets published after trade setup trigger trades.`
            );
            return;
          }
        }

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
            const refPrice = armedPos.targetAsset === "WBTC" ? 76080.0 : armedPos.targetAsset === "SOL" ? 90.0 : armedPos.targetAsset === "ARB" ? 0.16 : 2248.5;

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
            setSkipReason("Sentiment verified. Ready to execute swap via 'Swap Now'.");
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

  // Smooth polling queue: strictly checks ONLY active or not started yet positions (never paused)
  useEffect(() => {
    let isCancelled = false;

    if (!isListening || !isPositionsLoaded) {
      setCurrentPollingHandle("");
      setQueueProgress({ current: 0, total: 0 });
      return;
    }

    const runPolling = async () => {
      while (!isCancelled && isListeningRef.current) {
        // 1. Only positions that are active ("OPEN") or not started yet ("ARMED")
        // STRICT REQUIREMENT: Do not fetch for Paused positions!
        const currentActivePositions = positionsRef.current.filter(
          (p) => p.status === "ARMED" || p.status === "OPEN"
        );
        const runningHandles = Array.from(
          new Set(
            currentActivePositions
              .map((p) => p.targetHandle.replace("@", "").trim())
              .filter(Boolean)
          )
        );

        if (runningHandles.length === 0) {
          // All positions are paused or closed, or no positions exist yet.
          // Strictly do not fetch tweets for any account.
          setCurrentPollingHandle("");
          setQueueProgress({ current: 0, total: 0 });
          for (let s = 3; s > 0; s--) {
            if (isCancelled || !isListeningRef.current) break;
            setPollCountdown(s);
            await new Promise((r) => setTimeout(r, 1000));
          }
          continue;
        }

        // 2. Process each running handle sequentially
        setQueueProgress({ current: 0, total: runningHandles.length });

        for (let i = 0; i < runningHandles.length; i++) {
          if (isCancelled || !isListeningRef.current) break;

          const handle = runningHandles[i];
          setCurrentPollingHandle(handle);
          setQueueProgress({ current: i + 1, total: runningHandles.length });

          const activeForHandle = currentActivePositions.filter(
            (p) => p.targetHandle.toLowerCase().replace("@", "").trim() === handle.toLowerCase()
          );
          const earliestCreatedAt =
            activeForHandle.length > 0
              ? activeForHandle.reduce(
                  (min, p) => (new Date(p.createdAt).getTime() < new Date(min).getTime() ? p.createdAt : min),
                  activeForHandle[0].createdAt
                )
              : undefined;

          let url = `/api/agent/listen?handle=${encodeURIComponent(handle)}`;
          const sinceId = lastTweetIdsRef.current[handle];
          if (sinceId) {
            url += `&sinceId=${encodeURIComponent(sinceId)}`;
          }
          if (earliestCreatedAt) {
            url += `&createdAfter=${encodeURIComponent(earliestCreatedAt)}`;
          }

          try {
            const headers: Record<string, string> = {};
            if (apiKeys.twitterToken) {
              headers["x-twitter-token"] = apiKeys.twitterToken;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();

            if (data.success && Array.isArray(data.tweets) && data.tweets.length > 0) {
              const minTime = earliestCreatedAt ? new Date(earliestCreatedAt).getTime() : 0;
              const validTweets = minTime > 0
                ? data.tweets.filter((t: DetectedTweet) => new Date(t.createdAt).getTime() > minTime)
                : data.tweets;

              if (validTweets.length > 0) {
                const freshTweet = validTweets[0];
                lastTweetIdsRef.current[handle] = freshTweet.id;
                setLastTweetId(freshTweet.id);
                setLatestTweet(freshTweet);

                setMonitoredTweets((prev) => {
                  const merged = [freshTweet, ...prev.filter((p) => p.id !== freshTweet.id)];
                  return merged.slice(0, 20);
                });

                await processTweetEvaluation(freshTweet);
              }
            }
          } catch (err) {
            console.warn(`Error polling handle @${handle}:`, err);
          }

          if (i < runningHandles.length - 1 && !isCancelled && isListeningRef.current) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (isCancelled || !isListeningRef.current) break;
        setCurrentPollingHandle("");

        // 3. Calm countdown between cycles (5 seconds)
        for (let s = 5; s > 0; s--) {
          if (isCancelled || !isListeningRef.current) break;
          setPollCountdown(s);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    };

    runPolling();

    return () => {
      isCancelled = true;
      setCurrentPollingHandle("");
    };
  }, [isListening, isPositionsLoaded, apiKeys.twitterToken, processTweetEvaluation]);

  // Fetch latest tweet from a specific person/handle end-to-end (for interactive test)
  const handleFetchTweetFromPerson = async (targetHandle: string) => {
    const clean = targetHandle.replace("@", "").trim();
    if (!clean) return;
    setIsInjecting(true);
    try {
      const activePositions = positionsRef.current.filter((p) => p.status === "ARMED" || p.status === "OPEN");
      const activeForHandle = activePositions.filter(
        (p) => p.targetHandle.toLowerCase().replace("@", "").trim() === clean.toLowerCase()
      );
      const agentCreatedAt =
        activeForHandle.length > 0
          ? activeForHandle.reduce(
              (min, p) => (new Date(p.createdAt).getTime() < new Date(min).getTime() ? p.createdAt : min),
              activeForHandle[0].createdAt
            )
          : undefined;

      let url = `/api/agent/listen?handle=${encodeURIComponent(clean)}`;
      if (agentCreatedAt) {
        url += `&createdAfter=${encodeURIComponent(agentCreatedAt)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.tweets && data.tweets.length > 0) {
        const validTweets = agentCreatedAt
          ? data.tweets.filter((t: DetectedTweet) => new Date(t.createdAt).getTime() > new Date(agentCreatedAt!).getTime())
          : data.tweets;

        if (validTweets.length > 0) {
          const freshTweet = validTweets[0];
          lastTweetIdsRef.current[clean] = freshTweet.id;
          setLastTweetId(freshTweet.id);
          setLatestTweet(freshTweet);
          setMonitoredTweets((prev) => [freshTweet, ...prev.filter((p) => p.id !== freshTweet.id)]);
          await processTweetEvaluation(freshTweet);
        } else {
          setSkipReason(
            agentCreatedAt
              ? `No new tweets from @${clean} posted after trade setup (${new Date(agentCreatedAt!).toLocaleTimeString()}).`
              : `No recent tweets from @${clean} found in the last 24 hours.`
          );
        }
      } else {
        setSkipReason(
          agentCreatedAt
            ? `No new tweets from @${clean} posted after trade setup (${new Date(agentCreatedAt!).toLocaleTimeString()}).`
            : `No recent tweets from @${clean} found in the last 24 hours.`
        );
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
        setMonitoredTweets((prev) => [freshTweet, ...prev.filter((p) => p.id !== freshTweet.id)]);
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
        setMonitoredTweets((prev) => [data.tweet, ...prev.filter((p) => p.id !== data.tweet.id)]);
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
                    onClosePosition={async (closedPos) => {
                      setPositions((prev) =>
                        prev.map((p) => (p.id === closedPos.id ? closedPos : p))
                      );
                      await persistPositionUpdate(closedPos);
                      loadTrades();
                      if (walletAddress) {
                        handleRefreshBalances(walletAddress);
                      }
                    }}
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
                    const activePositions = positions.filter((p) => p.status === "ARMED" || p.status === "OPEN");
                    const runningHandles = Array.from(
                      new Set(
                        activePositions
                          .map((p) => p.targetHandle.replace("@", "").trim())
                          .filter(Boolean)
                      )
                    );
                    const activeHandle = runningHandles.length > 0 ? runningHandles[0] : "";
                    const activeTrackedHandles = runningHandles;
                    const earliestAgentCreatedAt =
                      activePositions.length > 0
                        ? activePositions.reduce(
                            (min, p) => (new Date(p.createdAt).getTime() < new Date(min).getTime() ? p.createdAt : min),
                            activePositions[0].createdAt
                          )
                        : undefined;

                    return (
                      <LiveMonitor
                        handle={activeHandle}
                        isListening={isListening}
                        tweets={monitoredTweets}
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
                        agentCreatedAt={earliestAgentCreatedAt}
                        hasActiveAgents={activePositions.length > 0}
                        hasPausedAgents={positions.some((p) => p.status === "PAUSED")}
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
          <div className="space-y-6 animate-in fade-in duration-200 font-sans">
            {/* Real Onchain Wallet Overview */}
            <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-2xs shrink-0">
                    <Wallet className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Arbitrum Liquidity &amp; Net Worth</h3>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Arbitrum One
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Real on-chain balances and live trading allocations</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {walletAddress && (
                    <button
                      type="button"
                      disabled={isRefreshingPortfolio}
                      onClick={() => handleRefreshBalances()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer disabled:opacity-50"
                      title="Re-query Arbitrum RPC for current balances"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingPortfolio ? "animate-spin" : ""}`} />
                      <span>{isRefreshingPortfolio ? "Refreshing..." : "Refresh"}</span>
                    </button>
                  )}
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80 hidden sm:inline-block">
                    Chain ID 42161
                  </span>
                </div>
              </div>

              {walletAddress ? (
                <>
                  {/* Master Account Header */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Connected Funder Wallet</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm font-semibold text-slate-800">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={copyWalletAddress}
                          className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
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

                    <div className="sm:text-right">
                      <span className="text-xs text-slate-400 font-medium">Total Liquid Net Worth</span>
                      <div className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                        ${walletBalances.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Updated {walletBalances.lastUpdated || "just now"}
                      </span>
                    </div>
                  </div>

                  {/* Clean Assets Grid - Low Density & Minimal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Native ETH */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Ethereum</span>
                      <div className="text-xl font-bold text-slate-900">
                        {walletBalances.eth.toFixed(4)} ETH
                      </div>
                      <div className="text-xs text-slate-500">
                        ${(walletBalances.eth * walletBalances.ethPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Canonical USDC */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-xs text-slate-400 font-medium">USD Coin</span>
                      <div className="text-xl font-bold text-slate-900">
                        ${walletBalances.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500">
                        Available Collateral
                      </div>
                    </div>

                    {/* Active Capital in Trades */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Active in Trades</span>
                      <div className="text-xl font-bold text-slate-900">
                        ${positions.filter((p) => p.status === "ARMED" || p.status === "OPEN").reduce((a, b) => a + b.sizeUsdc, 0).toLocaleString()} USDC
                      </div>
                      <div className="text-xs text-slate-500">
                        {positions.filter((p) => p.status === "ARMED" || p.status === "OPEN").length} positions armed
                      </div>
                    </div>

                    {/* Realized PnL */}
                    {(() => {
                      const settled = positions.filter((p) => p.status === "PROFIT_TAKEN" || p.status === "STOPPED_OUT" || p.status === "CLOSED");
                      const realizedPnl = settled.reduce((a, b) => a + (b.pnlUsd || 0), 0);
                      const isPositive = realizedPnl >= 0;
                      return (
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                          <span className="text-xs text-slate-400 font-medium">Realized Performance</span>
                          <div className={`text-xl font-bold ${realizedPnl === 0 ? "text-slate-900" : isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {realizedPnl === 0 ? "$0.00" : `${isPositive ? "+" : ""}$${realizedPnl.toFixed(2)}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {settled.length} settled trades
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="py-12 px-6 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                    <Wallet className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-slate-900">No Web3 Wallet Connected</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Connect your Arbitrum wallet using the button in the top navigation to view your on-chain balances and trade allocations.
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>100% Non-Custodial • Zero Escrow Required</span>
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
