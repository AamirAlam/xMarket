"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArkivQueryResult } from "@/types";
import {
  Database,
  ExternalLink,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Cpu,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  Compass,
  BookOpen,
  Zap,
  Info,
  TrendingUp,
  Tag,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface ArkivStoragePanelProps {
  onClose?: () => void;
}

// Format expiration block to human-friendly time and status
function formatExpiration(expiresAt?: string, currentBlock?: string) {
  if (!expiresAt || expiresAt === "Never" || expiresAt === "0") {
    return { label: "Permanent", status: "permanent" as const, subtext: "No expiration set" };
  }
  const expBlock = parseInt(expiresAt, 10);
  if (isNaN(expBlock)) {
    return { label: `Block #${expiresAt}`, status: "unknown" as const, subtext: "Block TTL" };
  }
  const curBlock = currentBlock ? parseInt(currentBlock, 10) : 0;
  if (curBlock > 0) {
    const diff = expBlock - curBlock;
    if (diff <= 0) {
      return {
        label: `Block #${expBlock.toLocaleString()}`,
        status: "expired" as const,
        subtext: "Expired on-chain",
        blocksRemaining: diff,
      };
    }
    // Arkiv Rabdi testnet block time is ~1.5s
    const seconds = Math.round(diff * 1.5);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let timeStr = "";
    if (days > 0) timeStr = `~${days}d ${hours}h left`;
    else if (hours > 0) timeStr = `~${hours}h left`;
    else timeStr = `~${minutes}m left`;

    return {
      label: `Block #${expBlock.toLocaleString()}`,
      status: "active" as const,
      subtext: timeStr,
      blocksRemaining: diff,
    };
  }
  return { label: `Block #${expBlock.toLocaleString()}`, status: "active" as const, subtext: "Block TTL" };
}

// Classify entity type and synthesize human-friendly titles & descriptions
function classifyEntity(item: ArkivQueryResult) {
  const attrs = item.attributes || {};
  const isIntent = Boolean(attrs.eventName || attrs.positionId || attrs.targetHandle);
  const isTrade = Boolean(attrs.tradeId || (attrs.tradeType && attrs.price));
  const isDocument = attrs.category === "documents" || Boolean(attrs.title || attrs.summary);

  let type: "intent" | "trade" | "document" | "generic" = "generic";
  let title = "Decentralized Entity";
  let description = "";
  let badge = "Entity";
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";

  if (isTrade) {
    type = "trade";
    badge = "Trade Execution";
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    title = attrs.eventName ? `${attrs.eventName} Execution` : `Trade: ${attrs.targetAsset || "Asset"}`;
    description = `Automated ${attrs.side || "BUY"} fill of $${attrs.sizeUsdc || 0} USDC on ${attrs.targetAsset || "ETH"} via Definitive Flash on Arbitrum One.`;
  } else if (isIntent) {
    type = "intent";
    badge = "Agent Intent";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200/80";
    title = attrs.eventName || `Intent: ${attrs.targetAsset || "ETH"}`;
    description = attrs.targetHandle
      ? `Event trade trigger watching @${attrs.targetHandle} to execute ${attrs.side || "LONG"} on ${attrs.targetAsset || "WETH"} with $${attrs.sizeUsdc || 0} USDC allocation.`
      : `Decentralized trading intent configured for ${attrs.targetAsset || "ETH"}.`;
  } else if (isDocument) {
    type = "document";
    const cat = attrs.category ? attrs.category.charAt(0).toUpperCase() + attrs.category.slice(1) : "Document";
    badge = cat;
    badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    title = attrs.title || "On-Chain Knowledge Entity";
    description = attrs.summary || (attrs.source ? `Document source: ${attrs.source}` : "Decentralized data entity stored on Rabdi DB-Chain.");
  } else {
    title = item.entityKey ? `Entity ${item.entityKey.slice(0, 10)}...${item.entityKey.slice(-6)}` : "Decentralized Record";
    description = "Decentralized state entity with cryptographic ownership on Rabdi DB-Chain.";
  }

  return { type, title, description, badge, badgeColor, isIntent, isTrade, isDocument };
}

export function ArkivStoragePanel({ onClose }: ArkivStoragePanelProps) {
  const [queryExpr, setQueryExpr] = useState<string>("exists(status)");
  const [entities, setEntities] = useState<ArkivQueryResult[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Human-Friendly UI state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAdvancedQuery, setShowAdvancedQuery] = useState<boolean>(false);
  const [activeFilterId, setActiveFilterId] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandedHexBlobs, setExpandedHexBlobs] = useState<Record<string, boolean>>({});
  const [showEducationalCards, setShowEducationalCards] = useState<boolean>(true);

  const runQuery = useCallback(async (exprToRun?: string) => {
    const q = exprToRun !== undefined ? exprToRun : queryExpr;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/arkiv/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 20 }),
      });
      const data = await res.json();
      if (data.success) {
        setEntities(data.entities || []);
        if (data.blockNumber) setBlockNumber(data.blockNumber);
      } else {
        setErrorMsg(data.error || "Arkiv query execution error");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to contact Arkiv Rabdi node");
    } finally {
      setIsLoading(false);
    }
  }, [queryExpr]);

  useEffect(() => {
    runQuery("exists(status)");
  }, [runQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleCardExpand = (entityKey: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [entityKey]: !prev[entityKey],
    }));
  };

  const toggleHexExpand = (key: string) => {
    setExpandedHexBlobs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const sampleFilters = [
    {
      id: "all",
      label: "All Records",
      icon: Layers,
      expr: "exists(status)",
      description: "All live entities on Arkiv DB-Chain",
    },
    {
      id: "intents",
      label: "Trading Intents",
      icon: Zap,
      expr: "exists(eventName)",
      description: "Autonomous agent execution intents",
    },
    {
      id: "documents",
      label: "Knowledge & Docs",
      icon: BookOpen,
      expr: "category = str('documents')",
      description: "Indexed documentation & tokenomics",
    },
    {
      id: "published",
      label: "Published",
      icon: Check,
      expr: "status = str('published')",
      description: "Entities in active published state",
    },
    {
      id: "priority",
      label: "High Priority",
      icon: Sparkles,
      expr: "priority >= u64(0)",
      description: "Ranked priority coordination records",
    },
  ];

  const handleSelectFilter = (filter: typeof sampleFilters[0]) => {
    setActiveFilterId(filter.id);
    setQueryExpr(filter.expr);
    runQuery(filter.expr);
  };

  // Human-Friendly instant client-side filter
  const filteredEntities = useMemo(() => {
    if (!searchTerm.trim()) return entities;
    const term = searchTerm.toLowerCase();

    return entities.filter((item) => {
      if (item.entityKey.toLowerCase().includes(term)) return true;
      if (item.owner && item.owner.toLowerCase().includes(term)) return true;
      if (item.attributes) {
        for (const [k, v] of Object.entries(item.attributes)) {
          if (k.toLowerCase().includes(term)) return true;
          if (typeof v === "string" && v.toLowerCase().includes(term)) return true;
          if (typeof v === "number" && v.toString().includes(term)) return true;
        }
      }
      return false;
    });
  }, [entities, searchTerm]);

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-7 animate-in fade-in duration-200 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Header with Human-Friendly Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Database className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                Arkiv Decentralized Storage
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Arkiv DB-Chain
              </span>
            </div>

          </div>
        </div>

        {/* Live Network Telemetry Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
          {blockNumber && (
            <div className="text-xs font-medium text-slate-700 bg-slate-50/80 hover:bg-slate-100/80 transition px-3.5 py-1.5 rounded-full border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Block #{parseInt(blockNumber, 10).toLocaleString()}</span>
            </div>
          )}

          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80 hidden sm:flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>Chain ID 7794095</span>
          </div>

          <a
            href="https://rabdi.explorer.arkiv.network"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-200/80 transition inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3 text-amber-500" />
          </a>
        </div>
      </div>


      {/* 3. Search & Filter Control Center */}
      <div className="space-y-3.5">
        {/* Quick Filter Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {sampleFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilterId === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleSelectFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${isActive
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle between Friendly Search & Advanced SQL */}
          <button
            type="button"
            onClick={() => setShowAdvancedQuery(!showAdvancedQuery)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1.5 cursor-pointer ${showAdvancedQuery
              ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold"
              : "bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 hover:bg-slate-50"
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvancedQuery ? "Hide Query Editor" : "Advanced SQL Query"}</span>
          </button>
        </div>

        {/* Friendly Instant Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entities by name, owner, event, category, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/40 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => runQuery()}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            <span>{isLoading ? "Querying Rabdi..." : "Refresh State"}</span>
          </button>
        </div>

        {/* Advanced SQL Predicate Console (Collapsible) */}
        {showAdvancedQuery && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-600" />
                <span>Viem Extended Predicate Expression</span>
              </span>
              <span className="text-slate-400 text-[11px]">Direct Rabdi DB-Chain RPC predicate</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={queryExpr}
                onChange={(e) => setQueryExpr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runQuery()}
                placeholder="e.g. exists(status) or category = str('documents') and priority = u64(0)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => runQuery()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              >
                Execute
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 pt-1">
              <span className="font-medium text-slate-400">Supported predicates:</span>
              <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">exists(status)</code>
              <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">category = str(&apos;documents&apos;)</code>
              <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">exists(eventName)</code>
              <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">priority &gt;= u64(0)</code>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900">Query Communication Warning</div>
            <div className="mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* 4. Entity Explorer Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <div className="flex items-center gap-2">
            <span>Verified On-Chain Entities:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 font-bold text-xs">
              {filteredEntities.length}
            </span>
            {searchTerm && (
              <span className="text-slate-400 text-[11px]">
                (filtered from {entities.length})
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Directly indexed via @arkiv-network/sdk
          </span>
        </div>

        {filteredEntities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntities.map((item) => {
              const meta = classifyEntity(item);
              const expiry = formatExpiration(item.expiresAt, blockNumber);
              const isExpanded = Boolean(expandedCards[item.entityKey]);
              const rawAttrs = item.attributes || {};
              const attrCount = Object.keys(rawAttrs).length;

              return (
                <div
                  key={item.entityKey}
                  className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs"
                >
                  <div className="p-5 space-y-3.5">
                    {/* Header Row: Type Badge + Status + Explorer Link */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeColor}`}>
                          {meta.badge}
                        </span>

                        {rawAttrs.status && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/80 capitalize">
                            {String(rawAttrs.status)}
                          </span>
                        )}
                      </div>

                      <a
                        href={`https://rabdi.explorer.arkiv.network/entity/${item.entityKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200/70 transition inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                      </a>
                    </div>

                    {/* Human Title & Narrative Description */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {meta.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>

                    {/* Prominent High-Impact Attributes Pill Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {rawAttrs.targetAsset && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80">
                          Asset: {rawAttrs.targetAsset}
                        </span>
                      )}
                      {rawAttrs.side && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          Side: {rawAttrs.side}
                        </span>
                      )}
                      {rawAttrs.sizeUsdc && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          Size: ${rawAttrs.sizeUsdc}
                        </span>
                      )}
                      {rawAttrs.language && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                          Lang: {String(rawAttrs.language).toUpperCase()}
                        </span>
                      )}
                      {rawAttrs.priority !== undefined && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                          Priority: P{String(rawAttrs.priority)}
                        </span>
                      )}
                      {rawAttrs.size && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                          {rawAttrs.size} bytes
                        </span>
                      )}
                    </div>

                    {/* Owner & Expiry Status Details */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                      {/* Owner Column */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Cryptographic Owner
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-medium">
                            {item.owner
                              ? `${item.owner.slice(0, 6)}...${item.owner.slice(-4)}`
                              : "None"}
                          </span>
                          {item.owner && (
                            <button
                              type="button"
                              onClick={() => handleCopy(item.owner, `owner-${item.entityKey}`)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 transition"
                              title="Copy owner address"
                            >
                              {copiedKey === `owner-${item.entityKey}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expiration Column */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-amber-500" />
                          <span>On-Chain Lifetime</span>
                        </span>
                        <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                          <span>{expiry.label}</span>
                          {expiry.status === "active" && (
                            <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70">
                              {expiry.subtext}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Entity Key + Expand Attributes Toggle */}
                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="text-[11px] font-medium text-slate-400">ID:</span>
                      <span className="font-mono text-[11px] text-slate-700 font-medium">
                        {item.entityKey.slice(0, 8)}...{item.entityKey.slice(-6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.entityKey, `key-${item.entityKey}`)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 transition"
                        title="Copy Entity ID"
                      >
                        {copiedKey === `key-${item.entityKey}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCardExpand(item.entityKey)}
                      className="text-slate-600 hover:text-slate-900 font-medium text-xs flex items-center gap-1 transition cursor-pointer select-none"
                    >
                      <span>{isExpanded ? "Hide Details" : `Inspect (${attrCount})`}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Attributes Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/90 border-t border-slate-200/80 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          All Indexed Attributes
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(JSON.stringify(rawAttrs, null, 2), `json-${item.entityKey}`)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          {copiedKey === `json-${item.entityKey}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied JSON</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy All JSON</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {Object.entries(rawAttrs).map(([k, v]) => {
                          const isHexBlob = typeof v === "string" && v.startsWith("0x") && v.length > 40;
                          const hexKey = `${item.entityKey}-${k}`;
                          const isHexExpanded = Boolean(expandedHexBlobs[hexKey]);

                          return (
                            <div
                              key={k}
                              className="p-2 rounded-xl bg-white border border-slate-200/70 text-slate-700 flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-800">{k}</span>
                                {isHexBlob ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                      Hex Payload ({v.length / 2} bytes)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(v, hexKey)}
                                      className="text-slate-400 hover:text-slate-700 p-0.5"
                                      title="Copy raw hex payload"
                                    >
                                      {copiedKey === hexKey ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleHexExpand(hexKey)}
                                      className="text-blue-600 hover:text-blue-800 text-[11px] font-medium"
                                    >
                                      {isHexExpanded ? "Collapse" : "Show"}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-900 font-medium text-right truncate max-w-[220px]">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </span>
                                )}
                              </div>

                              {isHexBlob && isHexExpanded && (
                                <div className="mt-1 p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] break-all max-h-24 overflow-y-auto">
                                  {v}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-700">No matching entities found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? `No entities matched your search query "${searchTerm}". Try clearing the search or switching quick filters.`
                  : "No live entities matched this Arkiv filter. Deploy an agent trading intent from the Positions tab to create a fresh on-chain record."}
              </p>
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
