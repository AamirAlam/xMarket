"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PumpItLogo } from "@/components/PumpItLogo";
import { Zap, ArrowRight, ShieldCheck, Cpu, Radio, Sparkles, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const personas = [
    {
      name: "Jerome Powell",
      handle: "federalreserve",
      tag: "Fed Rate Cut 7 PM",
      role: "Fed Chair",
      trades: "142+ Trades",
      image: "/avatars/powell.jpg",
      rotate: "-rotate-6 sm:-rotate-8 translate-y-3.5",
    },
    {
      name: "Vitalik Buterin",
      handle: "VitalikButerin",
      tag: "Pectra Hardfork",
      role: "Ethereum",
      trades: "189+ Trades",
      image: "/avatars/vitalik.jpg",
      rotate: "-rotate-3 sm:-rotate-4 translate-y-1",
    },
    {
      name: "Elon Musk",
      handle: "elonmusk",
      tag: "Tech & Earnings",
      role: "xAI / Tesla",
      trades: "320+ Trades",
      image: "/avatars/elon.jpg",
      rotate: "rotate-0 -translate-y-2 z-20 shadow-lg",
    },
    {
      name: "Donald Trump",
      handle: "realDonaldTrump",
      tag: "Crypto Policy",
      role: "US Policy",
      trades: "245+ Trades",
      image: "/avatars/trump.jpg",
      rotate: "rotate-3 sm:rotate-4 translate-y-1",
    },
    {
      name: "Michael Saylor",
      handle: "saylor",
      tag: "Treasury Buy",
      role: "BTC Reserve",
      trades: "178+ Trades",
      image: "/avatars/saylor.jpg",
      rotate: "rotate-6 sm:rotate-8 translate-y-3.5",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Top Floating Navbar matching the Barkat-style pill navigation */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto w-full px-4 sm:px-6">
        <nav className="rounded-full border border-slate-200/90 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs text-blue-600">
              <PumpItLogo className="w-4.5 h-4.5" size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 font-sans">
              Pump<span className="text-blue-600">It</span>
            </span>
          </Link>

          {/* CTA Nav Button */}
          <Link
            href="/terminal"
            className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Start Trading</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 flex flex-col items-center text-center">
        {/* Floating Badges & Massive Headline Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Tilted Floating Pill Left */}
          <div className="absolute -top-6 -left-2 sm:-left-12 -rotate-6 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200/80 shadow-xs animate-bounce duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>0G Verified +</span>
          </div>

          {/* Tilted Floating Pill Right */}
          <div className="absolute -top-8 -right-2 sm:-right-8 rotate-6 hidden sm:flex items-center gap-1 px-3.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium shadow-md">
            <span>Non-Custodial</span>
          </div>

          {/* Headline - Big & Impactful (Barkat-style refined bold) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.14] font-sans">
            Saylor to Trump,<br />
            <span className="text-blue-600 whitespace-nowrap">
              Everyone trades on PumpIt.
            </span>
          </h1>

          {/* Subtitle - Refined, airy and clean */}
          <p className="mt-5 text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal leading-relaxed">
            Turn internet breaking tweets into profitable trades before the crowd reacts.<br className="hidden sm:inline" /> Verifiable AI executes protected orders the millisecond news drops.
          </p>

          {/* Single Primary CTA Button */}
          <div className="mt-7 flex justify-center">
            <Link
              href="/terminal"
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 group cursor-pointer"
            >
              <span>Start Trading Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Curved Fan of Persona Cards with Real Pictures (Barkat Style) */}
        <div id="catalysts" className="mt-6 sm:mt-8 w-full">
          <div className="flex items-center justify-center -space-x-3 sm:-space-x-5 py-3 overflow-x-auto px-4 max-w-full">
            {personas.map((p, idx) => (
              <Link
                key={idx}
                href={`/terminal?handle=${encodeURIComponent(p.handle)}&event=${encodeURIComponent(p.tag)}`}
                className={`group relative shrink-0 w-40 sm:w-[200px] h-[252px] sm:h-[268px] flex flex-col justify-between rounded-[24px] border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-md hover:border-slate-300 hover:shadow-lg text-left ${p.rotate}`}
              >
                {/* Photo Frame with Status Pill */}
                <div className="relative w-full h-[162px] sm:h-[188px] rounded-[18px] overflow-hidden bg-slate-100 shrink-0">
                  {/* Real Picture */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Gradient Overlay at Bottom of Photo */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Floating Trade Count Pill */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-medium shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{p.trades}</span>
                    </span>
                  </div>

                  {/* Floating X Logo Top Right */}
                  <div className="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center text-[10px] font-medium">
                    𝕏
                  </div>

                  {/* Bottom overlay text on the image */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                    <div className="font-semibold text-sm sm:text-base leading-tight drop-shadow-sm flex items-center gap-1">
                      <span className="truncate">{p.name}</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        ✓
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-card Details - Fixed uniform single line */}
                <div className="p-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] gap-1">
                    <span className="font-mono text-slate-400 truncate max-w-[85px] sm:max-w-[100px]">@{p.handle}</span>
                    <span className="font-medium text-blue-600 text-[10px] shrink-0 truncate">{p.role}</span>
                  </div>
                  <div className="pt-0.5">
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono truncate max-w-full">
                      {p.tag}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Barkat-style pointer arrow and punchy hook */}
          <div className="mt-2 sm:mt-4 flex flex-col items-center justify-center">
            {/* Hand-drawn arrow pointing up to center card */}
            <svg
              width="18"
              height="28"
              viewBox="0 0 18 28"
              fill="none"
              className="text-blue-600 mb-1"
            >
              <path
                d="M 5 7 L 8.5 2 L 12 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 8.5 2.5 C 7.5 10 10.5 18 12.5 25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-800 font-sans text-center">
              Increase the odds of your winnings
            </h3>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[7px] bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs text-blue-600 shrink-0">
              <PumpItLogo className="w-3.5 h-3.5" size={14} />
            </div>
            <span className="font-bold text-slate-900">
              Pump<span className="text-blue-600">It</span>
            </span>
            <span>• The Event-Driven Trading Protocol</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terminal" className="hover:text-blue-600 font-semibold">Trading Terminal</Link>
            <a href="https://pc.0g.ai" target="_blank" rel="noreferrer" className="hover:text-blue-600">0G Verifiable TEE</a>
            <a href="https://flash.definitive.fi" target="_blank" rel="noreferrer" className="hover:text-blue-600">Definitive Flash Engine</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
