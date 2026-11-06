"use client";

import React, { useState } from "react";
import { ZeroGInferenceResult } from "@/types";
import { ShieldCheck, Cpu, Copy, Check, Sparkles } from "lucide-react";

interface ZeroGEngineProps {
  inference: ZeroGInferenceResult | null;
  isEvaluating: boolean;
}

export function ZeroGEngine({ inference, isEvaluating }: ZeroGEngineProps) {
  const [copied, setCopied] = useState(false);

  const copyRequestId = () => {
    if (!inference?.requestId) return;
    navigator.clipboard.writeText(inference.requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* Header with 0G Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">0G Private Computer</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  TEE Verifiable
                </span>
              </div>
              <p className="text-xs text-slate-500">Cryptographically verified AI sentiment intelligence</p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            0gm-1.0-35b-a3b
          </span>
        </div>

        {/* Inference Status / Content */}
        {isEvaluating ? (
          <div className="p-8 rounded-[24px] border border-blue-200 bg-blue-50/40 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900">
                0G Private Computer Running Verifiable Inference...
              </p>
              <p className="text-[11px] text-slate-500">
                Analyzing tweet semantics, economic policy impact, and producing cryptographic TEE receipt.
              </p>
            </div>
          </div>
        ) : inference ? (
          <div className="space-y-4">
            {/* 0G Request ID Bar */}
            <div className="p-3.5 rounded-[20px] bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-500 text-xs font-semibold">0G Proof ID:</span>
                <span className="font-mono text-blue-800 font-bold text-xs truncate max-w-[220px]">
                  {inference.requestId}
                </span>
              </div>
              <button
                onClick={copyRequestId}
                className="px-2.5 py-1 rounded-[10px] bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition flex items-center gap-1 text-[11px] font-bold shadow-2xs"
              >
                {copied ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Score & Gauge Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Polarity</div>
                <div
                  className={`text-2xl font-mono font-black mt-0.5 ${
                    inference.sentimentScore > 0 ? "text-blue-700" : "text-rose-700"
                  }`}
                >
                  {inference.sentimentScore > 0 ? `+${inference.sentimentScore}` : inference.sentimentScore}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">-1.0 to +1.0</div>
              </div>

              <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confidence</div>
                <div className="text-2xl font-mono font-black mt-0.5 text-blue-700">
                  {Math.round(inference.confidence * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Certainty Index</div>
              </div>

              <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Action</div>
                <div
                  className={`text-2xl font-mono font-black mt-0.5 ${
                    inference.action === "BUY" ? "text-blue-700" : inference.action === "SELL" ? "text-rose-700" : "text-amber-700"
                  }`}
                >
                  {inference.action}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 truncate">{inference.sentimentLabel}</div>
              </div>
            </div>

            {/* Sentiment Gauge Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span className="text-rose-600">Bearish (-1.0)</span>
                <span>Neutral (0.0)</span>
                <span className="text-blue-600">Bullish (+1.0)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-blue-600 transition-all duration-700 rounded-full"
                  style={{
                    width: `${((inference.sentimentScore + 1) / 2) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Rationale Explanation */}
            <div className="p-4 rounded-[22px] bg-blue-50/50 border border-blue-100 space-y-1">
              <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>0G Model Economic Commentary</span>
              </div>
              <p className="text-slate-800 leading-relaxed text-xs font-medium">
                &ldquo;{inference.rationale}&rdquo;
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
            <Cpu className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Awaiting tweet to trigger 0G Compute inference</p>
            <p className="text-[11px] text-slate-400">
              When a tweet is captured, 0G Private Computer computes sentiment in a TEE and outputs a proof receipt.
            </p>
          </div>
        )}

        {/* 0G Requirement Callout */}
        <div className="p-3.5 rounded-[18px] border border-slate-200/80 bg-slate-50 text-xs text-slate-600 space-y-0.5">
          <span className="text-slate-900 font-bold block text-[11px]">Why 0G is Irreplaceable:</span>
          <p className="text-slate-500 leading-normal text-[11px]">
            Without 0G Private Computer, users have no verifiable proof the trade was triggered by objective sentiment rather than front-running or hallucinated signals.
          </p>
        </div>
      </div>
    </div>
  );
}
