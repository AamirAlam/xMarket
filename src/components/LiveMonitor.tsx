"use client";

import React, { useState, useEffect, useRef } from "react";
import { DetectedTweet } from "@/types";
import {
  RefreshCw,
  ArrowUpRight,
  MessageCircle,
  Repeat2,
  Heart,
  Share2,
  BarChart2,
  Radio,
} from "lucide-react";

interface LiveMonitorProps {
  handle?: string;
  isListening?: boolean;
  tweets?: DetectedTweet[];
  latestTweet?: DetectedTweet | null;
  pollSecondsRemaining?: number;
  onInjectTestTweet?: (text: string) => void;
  onFetchTweetByUrl?: (url: string) => void;
  onFetchTweetFromPerson?: (handle: string) => Promise<void>;
  isInjecting?: boolean;
  trackedHandles?: string[];
  currentCheckingHandle?: string;
  queueProgress?: { current: number; total: number };
  onToggleListening?: () => void;
  agentCreatedAt?: string;
  hasActiveAgents?: boolean;
  hasPausedAgents?: boolean;
}

interface AuthorProfile {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

const AUTHOR_PROFILES: Record<string, AuthorProfile> = {
  aamiralam201096: {
    name: "Aamir Alam",
    handle: "AamirAlam201096",
    avatar: "https://pbs.twimg.com/profile_images/1451232272502308864/S_2iC4ux_normal.jpg",
    verified: true,
  },
  federalreserve: {
    name: "Federal Reserve",
    handle: "federalreserve",
    avatar: "/avatars/powell.jpg",
    verified: true,
  },
  vitalikbuterin: {
    name: "Vitalik Buterin",
    handle: "VitalikButerin",
    avatar: "/avatars/vitalik.jpg",
    verified: true,
  },
  realdonaldtrump: {
    name: "Donald J. Trump",
    handle: "realDonaldTrump",
    avatar: "/avatars/trump.jpg",
    verified: true,
  },
  elonmusk: {
    name: "Elon Musk",
    handle: "elonmusk",
    avatar: "/avatars/elon.jpg",
    verified: true,
  },
  saylor: {
    name: "Michael Saylor",
    handle: "saylor",
    avatar: "/avatars/saylor.jpg",
    verified: true,
  },
  cz_binance: {
    name: "CZ 🔶 BNB",
    handle: "cz_binance",
    avatar: "/avatars/cz.jpg",
    verified: true,
  },
  brian_armstrong: {
    name: "Brian Armstrong",
    handle: "brian_armstrong",
    avatar: "/avatars/brian.jpg",
    verified: true,
  },
  watcherguru: {
    name: "Watcher.Guru",
    handle: "WatcherGuru",
    avatar: "/avatars/watcherguru.png",
    verified: true,
  },
  cryptohayes: {
    name: "Arthur Hayes",
    handle: "CryptoHayes",
    avatar: "/avatars/hayes.jpg",
    verified: true,
  },
  whale_alert: {
    name: "Whale Alert",
    handle: "whale_alert",
    avatar: "/avatars/whale_alert.png",
    verified: true,
  },
  ericbalchunas: {
    name: "Eric Balchunas",
    handle: "EricBalchunas",
    avatar: "/avatars/balchunas.jpg",
    verified: true,
  },
  cathiedwood: {
    name: "Cathie Wood",
    handle: "CathieDWood",
    avatar: "/avatars/cathie.jpg",
    verified: true,
  },
  muststopmurad: {
    name: "Murad",
    handle: "MustStopMurad",
    avatar: "/avatars/murad.jpg",
    verified: true,
  },
  cobie: {
    name: "Cobie",
    handle: "cobie",
    avatar: "/avatars/cobie.jpg",
    verified: true,
  },
  zachxbt: {
    name: "ZachXBT",
    handle: "zachxbt",
    avatar: "/avatars/zachxbt.jpg",
    verified: true,
  },
};

function getAuthorProfile(handle: string): AuthorProfile {
  const clean = handle.replace("@", "").trim();
  const lower = clean.toLowerCase();

  if (AUTHOR_PROFILES[lower]) {
    return AUTHOR_PROFILES[lower];
  }

  const match = Object.keys(AUTHOR_PROFILES).find((k) => k.toLowerCase() === lower);
  if (match) {
    return AUTHOR_PROFILES[match];
  }

  return {
    name: clean || "Analyst",
    handle: clean || "analyst",
    avatar: "",
    verified: true,
  };
}

// Dynamic pool of top market catalyst tweets that stream in realtime when no trade is active
const DUMMY_STREAM_POOL: Array<{ author: string; text: string; url: string }> = [
  {
    author: "elonmusk",
    text: "Tesla AI and Grok integration deploying ahead of schedule. Compute efficiency reached new all-time high.",
    url: "https://x.com/elonmusk",
  },
  {
    author: "federalreserve",
    text: "FOMC statement: The Committee decided to lower the target range for the federal funds rate by 50 basis points. Economic indicators resilient, cooling inflation.",
    url: "https://x.com/federalreserve",
  },
  {
    author: "VitalikButerin",
    text: "Pectra hardfork specifications finalized for devnet testing. Layer 1 scalability improvements on track.",
    url: "https://x.com/VitalikButerin",
  },
  {
    author: "saylor",
    text: "MicroStrategy has acquired an additional 12,500 BTC for ~$1.1 billion. Bitcoin is institutional-grade capital.",
    url: "https://x.com/saylor",
  },
  {
    author: "cz_binance",
    text: "Binance SAFU fund reserves fully backed 1:1 onchain. All user balances transparent on Merkle proof reserves.",
    url: "https://x.com/cz_binance",
  },
  {
    author: "realDonaldTrump",
    text: "Crypto and Bitcoin will thrive in America! We will make the USA the undisputed crypto capital of the planet.",
    url: "https://x.com/realDonaldTrump",
  },
  {
    author: "brian_armstrong",
    text: "Coinbase Base L2 processed over 10M transactions yesterday at $0.001 fee. Onchain is the new online.",
    url: "https://x.com/brian_armstrong",
  },
  {
    author: "WatcherGuru",
    text: "JUST IN: Global institutional inflows into Bitcoin and crypto funds surge to record weekly highs.",
    url: "https://x.com/WatcherGuru",
  },
  {
    author: "CryptoHayes",
    text: "Global fiat debasement continues. Dollar liquidity expansion accelerating. BTC is the apex asset.",
    url: "https://x.com/CryptoHayes",
  },
  {
    author: "whale_alert",
    text: "🚨 2,450 #BTC ($214,800,000 USD) transferred from Coinbase Institutional to unknown cold wallet.",
    url: "https://x.com/whale_alert",
  },
  {
    author: "EricBalchunas",
    text: "Bitcoin ETF daily inflow crossed $680M yesterday. BlackRock IBIT volume hitting top decile of all US ETFs.",
    url: "https://x.com/EricBalchunas",
  },
  {
    author: "CathieDWood",
    text: "ARK Invest research: Digital assets and autonomous agents are converging to create unprecedented economic velocity.",
    url: "https://x.com/CathieDWood",
  },
  {
    author: "MustStopMurad",
    text: "The momentum behind decentralized AI agents is unstoppable. Culture + compute = onchain velocity.",
    url: "https://x.com/MustStopMurad",
  },
  {
    author: "cobie",
    text: "Market volatility picking up across major pairs. Make sure your stop-loss and take-profit brackets are properly set.",
    url: "https://x.com/cobie",
  },
  {
    author: "zachxbt",
    text: "Verified on Arbitrum: Smart contract router permits confirm all trader assets remain non-custodial.",
    url: "https://x.com/zachxbt",
  },
];

// Deterministic social counters for realistic Twitter feel
function getDeterministicStats(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return {
    replies: 120 + (positive % 740),
    retweets: 480 + (positive % 2400),
    likes: 1800 + (positive % 8600),
    views: `${((positive % 800) / 10 + 24).toFixed(1)}K`,
  };
}

// Twitter / X Verified Checkmark Icon
function TwitterVerifiedBadge({ className = "w-4 h-4 text-[#1d9bf0]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" aria-label="Verified account" className={`${className} fill-current shrink-0 inline-block`}>
      <g>
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.146 5.823-5.824 1.293 1.302-7.116 7.106z"></path>
      </g>
    </svg>
  );
}

// Twitter / X Logo
function XLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Relative time formatting like Twitter
function formatTwitterTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 6) return "just now";
    if (diffSec < 60) return `${Math.max(1, diffSec)}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recent";
  }
}

// Format hashtags, tickers, and mentions in Twitter blue
function formatTweetText(text: string) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, idx) => {
    if (part.startsWith("#") || part.startsWith("$") || part.startsWith("@")) {
      return (
        <span key={idx} className="text-[#1d9bf0] hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1d9bf0] hover:underline break-all"
        >
          {part.replace(/^https?:\/\//, "").slice(0, 24)}...
        </a>
      );
    }
    return part;
  });
}

export function LiveMonitor({
  handle = "",
  isListening = true,
  tweets,
  latestTweet,
  pollSecondsRemaining = 5,
  onInjectTestTweet,
  onFetchTweetByUrl,
  onFetchTweetFromPerson,
  isInjecting = false,
  trackedHandles = [],
  currentCheckingHandle,
  queueProgress,
  onToggleListening,
  agentCreatedAt,
  hasActiveAgents = false,
  hasPausedAgents = false,
}: LiveMonitorProps) {
  // Use passed tweets from props as primary source of truth; maintain local state as fallback
  const [localTweets, setLocalTweets] = useState<DetectedTweet[]>([]);
  const tweetFeed = tweets !== undefined ? tweets : localTweets;

  const [likedTweets, setLikedTweets] = useState<Record<string, boolean>>({});
  const [retweetedTweets, setRetweetedTweets] = useState<Record<string, boolean>>({});
  const [personInput, setPersonInput] = useState<string>("");

  const feedBottomRef = useRef<HTMLDivElement>(null);

  // Clean and deduplicate tracked handles (strictly focus on running agents if any)
  const cleanTrackedHandles = Array.from(
    new Set(
      trackedHandles
        .filter(Boolean)
        .map((h) => h?.replace("@", "").trim().toLowerCase())
        .filter((h) => h && h.length > 0)
    )
  );

  const activeHandlesSet = new Set(cleanTrackedHandles);

  // STRICT REQUIREMENT:
  // When active or looking positions exist: show ONLY real fetched tweets for those positions (no other tweets, no dummy tweets)
  // When no active or looking positions exist: show live moving market stream from top catalysts
  const hasActiveOrLooking = cleanTrackedHandles.length > 0;

  const realActiveTweets = (tweetFeed || []).filter((tweet) => {
    const authorClean = tweet.author?.replace("@", "").trim().toLowerCase();
    return activeHandlesSet.has(authorClean);
  });

  // Dynamic market streaming feed when no trades are active/looking
  const [streamingDummyTweets, setStreamingDummyTweets] = useState<DetectedTweet[]>(() => {
    const now = Date.now();
    return [
      {
        id: `tw-preview-init-0`,
        author: DUMMY_STREAM_POOL[0].author,
        text: DUMMY_STREAM_POOL[0].text,
        createdAt: new Date(now - 7000).toISOString(),
        url: DUMMY_STREAM_POOL[0].url,
      },
      {
        id: `tw-preview-init-1`,
        author: DUMMY_STREAM_POOL[1].author,
        text: DUMMY_STREAM_POOL[1].text,
        createdAt: new Date(now - 32000).toISOString(),
        url: DUMMY_STREAM_POOL[1].url,
      },
      {
        id: `tw-preview-init-2`,
        author: DUMMY_STREAM_POOL[2].author,
        text: DUMMY_STREAM_POOL[2].text,
        createdAt: new Date(now - 85000).toISOString(),
        url: DUMMY_STREAM_POOL[2].url,
      },
      {
        id: `tw-preview-init-3`,
        author: DUMMY_STREAM_POOL[3].author,
        text: DUMMY_STREAM_POOL[3].text,
        createdAt: new Date(now - 170000).toISOString(),
        url: DUMMY_STREAM_POOL[3].url,
      },
    ];
  });

  const [newlyArrivedId, setNewlyArrivedId] = useState<string | null>(null);
  const [marketScanningHandle, setMarketScanningHandle] = useState<string>("elonmusk");
  const poolIndexRef = useRef<number>(4);
  const [, setTimeTick] = useState<number>(0);

  // Re-render time tick every 2s so "just now" / "6s" / "18s" updates live in realtime
  useEffect(() => {
    const tickTimer = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(tickTimer);
  }, []);

  // When no trades are active, actively stream new market tweets every 3.8 seconds so it feels alive
  useEffect(() => {
    if (hasActiveOrLooking || !isListening) {
      return;
    }

    const streamTimer = setInterval(() => {
      const nextItem = DUMMY_STREAM_POOL[poolIndexRef.current % DUMMY_STREAM_POOL.length];
      poolIndexRef.current += 1;

      setMarketScanningHandle(nextItem.author);

      const freshId = `tw-stream-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const freshTweet: DetectedTweet = {
        id: freshId,
        author: nextItem.author,
        text: nextItem.text,
        createdAt: new Date().toISOString(),
        url: nextItem.url,
      };

      setStreamingDummyTweets((prev) => [freshTweet, ...prev.slice(0, 14)]);
      setNewlyArrivedId(freshId);

      setTimeout(() => {
        setNewlyArrivedId((cur) => (cur === freshId ? null : cur));
      }, 2400);
    }, 3800);

    return () => clearInterval(streamTimer);
  }, [hasActiveOrLooking, isListening]);

  const visibleTweets = hasActiveOrLooking ? realActiveTweets : streamingDummyTweets;

  // Sync latestTweet into local state if props tweets not supplied
  useEffect(() => {
    if (tweets === undefined && latestTweet) {
      const authorClean = latestTweet.author?.replace("@", "").trim().toLowerCase();
      if (!activeHandlesSet.has(authorClean)) {
        return;
      }
      if (agentCreatedAt) {
        const minTime = new Date(agentCreatedAt).getTime();
        const tweetTime = new Date(latestTweet.createdAt).getTime();
        if (tweetTime <= minTime) {
          return;
        }
      }
      setLocalTweets((prev) => {
        if (prev.some((t) => t.id === latestTweet.id || t.text === latestTweet.text)) {
          return prev;
        }
        return [latestTweet, ...prev];
      });
    }
  }, [tweets, latestTweet, agentCreatedAt, activeHandlesSet]);

  const toggleLike = (id: string) => {
    setLikedTweets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRetweet = (id: string) => {
    setRetweetedTweets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col h-[560px] relative overflow-hidden">
      {/* Header: X event tracking */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <XLogo className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>X event tracking</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isListening && cleanTrackedHandles.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Real-time updates for active and waiting trades</p>
          </div>
        </div>
      </div>

      {/* Main Container: Tweets Scroll, Loader Pinned Always in View at Bottom */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col pt-3">
        {/* Tweets Feed: Only tweets scroll, slide & hide behind loader if more content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-36 scroll-smooth">
          {visibleTweets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/90 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  Watching for tweets from @{cleanTrackedHandles.join(", @")}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  {agentCreatedAt ? (
                    <>
                      Waiting for new tweets published after trade was created (
                      <span className="font-semibold text-slate-700">
                        {new Date(agentCreatedAt).toLocaleTimeString()}
                      </span>
                      ).
                    </>
                  ) : (
                    "Waiting for new tweets in real time."
                  )}
                </p>
              </div>
              {cleanTrackedHandles.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Watching for latest tweets</span>
                </div>
              )}
            </div>
          ) : (
            visibleTweets.map((tweet) => {
              const profile = getAuthorProfile(tweet.author);
              const social = getDeterministicStats(tweet.id);
              const isLiked = !!likedTweets[tweet.id];
              const isRetweeted = !!retweetedTweets[tweet.id];

              const isNewArrival = tweet.id === newlyArrivedId;

              return (
                <div
                  key={tweet.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-300 space-y-2.5 group ${
                    isNewArrival
                      ? "border-blue-400 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10 animate-in fade-in slide-in-from-top-3 duration-300"
                      : "border-slate-200/85"
                  }`}
                >
                  {/* Twitter Post Header */}
                  <div className="flex items-start gap-3">
                    {/* Round Avatar */}
                    <div className="shrink-0 relative">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-10 h-10 rounded-full object-cover object-top border border-slate-200/90 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-2xs">
                          {profile.name.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Tweet Header Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          {/* Full Name */}
                          <span className="font-bold text-slate-900 text-[13px] hover:underline cursor-pointer truncate">
                            {profile.name}
                          </span>

                          {/* Verified Badge */}
                          {profile.verified && <TwitterVerifiedBadge className="w-3.5 h-3.5 text-[#1d9bf0]" />}

                          {/* @handle */}
                          <span className="text-slate-400 text-[12px] truncate">
                            @{profile.handle}
                          </span>

                          <span className="text-slate-300 text-[11px]">·</span>

                          {/* Relative Time */}
                          <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap tabular-nums">
                            {formatTwitterTime(tweet.createdAt)}
                          </span>

                          {isNewArrival && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200/70 animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>

                        {/* View Link Icon */}
                        {tweet.url && (
                          <a
                            href={tweet.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition p-0.5 rounded-md shrink-0"
                            title="View post on X"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Tweet Body Text */}
                      <p className="mt-1.5 text-[13px] text-slate-800 font-normal leading-relaxed break-words whitespace-pre-wrap">
                        {formatTweetText(tweet.text)}
                      </p>

                      {/* Twitter Interaction Actions Bar */}
                      <div className="flex items-center justify-between pt-2.5 mt-1 text-[11px] text-slate-400 border-t border-slate-100/90 max-w-sm">
                        {/* Replies */}
                        <button
                          type="button"
                          className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition group cursor-pointer"
                        >
                          <div className="p-1 rounded-full group-hover:bg-blue-50 transition">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </div>
                          <span>{social.replies}</span>
                        </button>

                        {/* Retweets */}
                        <button
                          type="button"
                          onClick={() => toggleRetweet(tweet.id)}
                          className={`flex items-center gap-1.5 transition group cursor-pointer ${isRetweeted ? "text-[#00ba7c] font-semibold" : "hover:text-[#00ba7c]"
                            }`}
                        >
                          <div className="p-1 rounded-full group-hover:bg-emerald-50 transition">
                            <Repeat2 className="w-3.5 h-3.5" />
                          </div>
                          <span>{social.retweets + (isRetweeted ? 1 : 0)}</span>
                        </button>

                        {/* Likes */}
                        <button
                          type="button"
                          onClick={() => toggleLike(tweet.id)}
                          className={`flex items-center gap-1.5 transition group cursor-pointer ${isLiked ? "text-[#f91880] font-semibold" : "hover:text-[#f91880]"
                            }`}
                        >
                          <div className="p-1 rounded-full group-hover:bg-rose-50 transition">
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                          </div>
                          <span>{social.likes + (isLiked ? 1 : 0)}</span>
                        </button>

                        {/* Views / Analytics */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <div className="p-1">
                            <BarChart2 className="w-3.5 h-3.5" />
                          </div>
                          <span>{social.views}</span>
                        </div>

                        {/* Share */}
                        {tweet.url && (
                          <a
                            href={tweet.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-full hover:bg-slate-100 hover:text-slate-600 transition"
                            title="Share on X"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }))}
          <div ref={feedBottomRef} className="h-2" />
        </div>

        {/* Loader: Always In View, Centered, No Background Color Card */}
        {/* Tweets smoothly scroll down and show/hide behind loader with natural gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 pt-20 pb-3 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-center text-center pointer-events-none z-10">
          <div className="pointer-events-auto flex flex-col items-center justify-center text-center space-y-1.5 pt-5 pb-1">
            {/* Centered blinking & spinning beacon */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 text-slate-500 shrink-0 shadow-xs">
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isListening ? "animate-spin" : ""}`} />
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping pointer-events-none" />
                  <span className="absolute -inset-1 rounded-full border border-blue-300/40 animate-pulse pointer-events-none" />
                </>
              )}
            </div>

            {/* Title with live checking status */}
            <div className="flex flex-col items-center justify-center gap-1 text-xs">
              {currentCheckingHandle ? (
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>Checking @{currentCheckingHandle}</span>
                  {queueProgress && queueProgress.total > 1 && (
                    <span className="text-blue-600 font-bold text-[11px] bg-blue-50 px-1.5 py-0.2 rounded">
                      [{queueProgress.current}/{queueProgress.total}]
                    </span>
                  )}
                  <span className="inline-flex gap-0.5 ml-0.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "400ms" }} />
                  </span>
                </div>
              ) : !isListening ? (
                <span className="text-slate-500 font-bold">Updates paused</span>
              ) : cleanTrackedHandles.length === 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-slate-800 font-bold">
                    Place your first trade to start fetching...
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-[10px] font-semibold text-blue-700 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Streaming live market • Scanning @{marketScanningHandle}</span>
                  </div>
                </div>
              ) : (
                <span className="font-bold text-slate-800">Checking again in {pollSecondsRemaining}s</span>
              )}
            </div>

            {/* Helper status text */}
            <p className="text-[10px] text-slate-400 font-medium">
              {cleanTrackedHandles.length > 0
                ? "Checking for latest tweets automatically"
                : "Real tweets will lock to your agent once a trade is active"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
