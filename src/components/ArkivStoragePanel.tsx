"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface ArkivStoragePanelProps {
  onClose?: () => void;
}

export function ArkivStoragePanel({ onClose }: ArkivStoragePanelProps) {
  const [queryExpr, setQueryExpr] = useState<string>("exists(status)");
  const [entities, setEntities] = useState<ArkivQueryResult[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runQuery = useCallback(async (exprToRun?: string) => {
    const q = exprToRun !== undefined ? exprToRun : queryExpr;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/arkiv/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 15 }),
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
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const sampleQueries = [
    { label: "All Live Entities", expr: "exists(status)" },
    { label: "xMarket Agent Intents", expr: "exists(eventName)" },
    { label: "Published Documents", expr: "category = str('documents')" },
    { label: "Active Status", expr: "status = str('published')" },
    { label: "High Priority", expr: "priority >= u64(0)" },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      {/* Header with Network Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Arkiv DB-Chain Storage Layer</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rabdi Testnet
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ethereum-aligned decentralized database with wallet-owned entities &amp; native expiration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {blockNumber && (
            <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Block #{blockNumber}</span>
            </div>
          )}
          <a
            href="https://rabdi.explorer.arkiv.network"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 transition inline-flex items-center gap-1"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Query Bar & Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>SQL-Like Entity Query (Viem Extended Predicate)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Chain ID: 7794095</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryExpr}
              onChange={(e) => setQueryExpr(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runQuery()}
              placeholder="e.g. exists(status) or category = str('documents')"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          <button
            type="button"
            onClick={() => runQuery()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Querying..." : "Execute Query"}</span>
          </button>
        </div>

        {/* Query Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Quick Queries:</span>
          {sampleQueries.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setQueryExpr(q.expr);
                runQuery(q.expr);
              }}
              className="text-[11px] px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer font-mono"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-mono">
          {errorMsg}
        </div>
      )}

      {/* Query Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Returned Entities: <strong className="text-slate-900 font-bold">{entities.length}</strong></span>
          <span className="text-[11px] text-slate-400">Read live via @arkiv-network/sdk</span>
        </div>

        {entities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {entities.map((item) => (
              <div
                key={item.entityKey}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition space-y-2.5 shadow-2xs"
              >
                {/* Entity Key & Explorer Link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Entity Key</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.entityKey, item.entityKey)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                      title="Copy Key"
                    >
                      {copiedKey === item.entityKey ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <a
                    href={`https://rabdi.explorer.arkiv.network/entity/${item.entityKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5 font-mono"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="font-mono text-xs font-bold text-slate-900 truncate">
                  {item.entityKey}
                </div>

                {/* Owner & Expiry */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Owner</span>
                    <span className="font-mono truncate block text-slate-700">
                      {item.owner ? `${item.owner.slice(0, 6)}...${item.owner.slice(-4)}` : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Expires Block</span>
                    </span>
                    <span className="font-mono block text-amber-700 font-bold">
                      #{item.expiresAt || "Never"}
                    </span>
                  </div>
                </div>

                {/* Attributes Payload */}
                {Object.keys(item.attributes).length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Typed Attributes
                    </span>
                    <div className="bg-white rounded-xl border border-slate-200/70 p-2 text-[11px] font-mono text-slate-700 max-h-24 overflow-y-auto space-y-0.5">
                      {Object.entries(item.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-slate-400">{k}:</span>
                          <span className="text-slate-900 font-medium truncate max-w-[180px]">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <Layers className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600 font-medium">No entities matched this Arkiv query.</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Try executing a query like <code className="font-mono text-slate-600">exists(status)</code> or deploy an agent intent to create a fresh on-chain entity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
