"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: { zeroGKey: string; definitiveKey: string; twitterToken: string }) => void;
  initialKeys: { zeroGKey: string; definitiveKey: string; twitterToken: string };
}

export function ApiKeyModal({ isOpen, onClose, onSave, initialKeys }: ApiKeyModalProps) {
  const [zeroGKey, setZeroGKey] = useState(initialKeys.zeroGKey);
  const [definitiveKey, setDefinitiveKey] = useState(initialKeys.definitiveKey);
  const [twitterToken, setTwitterToken] = useState(initialKeys.twitterToken);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setZeroGKey(initialKeys.zeroGKey);
    setDefinitiveKey(initialKeys.definitiveKey);
    setTwitterToken(initialKeys.twitterToken);
  }, [initialKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ zeroGKey, definitiveKey, twitterToken });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Sponsor API Keys &amp; Credentials</h2>
              <p className="text-xs text-slate-500">Connect live sponsor keys or use built-in live bridge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 0G API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>0G Private Computer API Key</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">Verifiable Inference</span>
              </label>
              <a
                href="https://pc.0g.ai"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Get at pc.0g.ai <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="0g_router_sk_..."
              value={zeroGKey}
              onChange={(e) => setZeroGKey(e.target.value)}
              className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition font-medium"
            />
            <p className="text-[11px] text-slate-500">
              Enables live TEE sentiment inference on 0G Galileo router (`0gm-1.0-35b-a3b`).
            </p>
          </div>

          {/* Definitive Flash API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Definitive Flash API Key</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">Flash Engine</span>
              </label>
              <a
                href="https://flash.definitive.fi/docs/getting-started"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
              >
                Flash docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="flash_live_..."
              value={definitiveKey}
              onChange={(e) => setDefinitiveKey(e.target.value)}
              className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition font-medium"
            />
            <p className="text-[11px] text-slate-500">
              Header `x-definitive-api-key` used for real-time bracket order quotes &amp; settlement.
            </p>
          </div>

          {/* Twitter API v2 Bearer Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Twitter / X API v2 Bearer Token</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">Optional</span>
              </label>
              <span className="text-[11px] text-slate-400">Live feed bridge active</span>
            </div>
            <input
              type="password"
              placeholder="AAAAAAAAAAAAAAAAAAAAA..."
              value={twitterToken}
              onChange={(e) => setTwitterToken(e.target.value)}
              className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition font-medium"
            />
            <p className="text-[11px] text-slate-500">
              Not required: the live RSS feed bridge and Tweet URL loader run seamlessly without a paid X subscription.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Encrypted locally in session</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-[16px] text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                "Save & Apply"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
