import { DetectedTweet } from "@/types";

// In-memory feed buffer to simulate incoming real-time tweets when user/judge tests live
const liveTweetBuffer: Map<string, DetectedTweet[]> = new Map();

// Short-lived rate limit buffer to prevent 429s from external feed gateways
interface CachedHandleFeed {
  timestamp: number;
  tweets: DetectedTweet[];
}
const handleFeedCache: Map<string, CachedHandleFeed> = new Map();
const CACHE_TTL_MS = 5000; // 5-second server-side rate limit cache

// Server-side outbound throttle queue to ensure at least 1,000ms spacing between external calls
let lastOutboundTime = 0;
const MIN_OUTBOUND_INTERVAL_MS = 1000;

async function throttleOutbound(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastOutboundTime;
  if (elapsed < MIN_OUTBOUND_INTERVAL_MS) {
    const delay = MIN_OUTBOUND_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastOutboundTime = Date.now();
}

function cleanTweetText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ") // strip nested quoted tweets
    .replace(/<a[^>]*>(?:Media|Photo|Video)<\/a>/gi, "") // strip trailing media anchors
    .replace(/<a[^>]*pic\.twitter\.com[^<]*<\/a>/gi, "") // strip pic.twitter anchors
    .replace(/<[^>]+>/g, " ") // strip all html tags
    .replace(/https?:\/\/pbs\.twimg\.com\/\S+/g, "") // strip raw media links
    .replace(/https?:\/\/video\.twimg\.com\/\S+/g, "") // strip raw video links
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNewerTweet(aId: string, bId: string): boolean {
  if (!bId) return true;
  if (/^\d+$/.test(aId) && /^\d+$/.test(bId)) {
    try {
      return BigInt(aId) > BigInt(bId);
    } catch {
      // fallback to string comparison
    }
  }
  return aId > bId;
}

// Track upstream Twitter v2 quota exhaustion to avoid unnecessary timeouts
let isTwitterV2QuotaExceeded = false;

export async function fetchLatestTweetsForHandle({
  handle,
  bearerToken,
  sinceId,
  createdAfter,
}: {
  handle: string;
  bearerToken?: string;
  sinceId?: string;
  createdAfter?: string;
}): Promise<DetectedTweet[]> {
  const cleanHandle = handle.replace("@", "").trim();
  const token = bearerToken || process.env.TWITTER_BEARER_TOKEN;
  const minTimestamp = createdAfter ? new Date(createdAfter).getTime() : 0;
  const now = Date.now();
  // Strictly filter out any old tweets: maximum allowed age is 24 hours
  const MAX_TWEET_AGE_MS = 24 * 60 * 60 * 1000;
  const recencyThreshold = now - MAX_TWEET_AGE_MS;

  // Helper to filter tweets: strictly latest tweets only (within 24h, after createdAfter, and after sinceId)
  const filterFresh = (list: DetectedTweet[]): DetectedTweet[] => {
    let result = list;

    // Never return old tweets older than 24 hours
    result = result.filter((t) => {
      const tTime = new Date(t.createdAt).getTime();
      return !isNaN(tTime) && tTime >= recencyThreshold;
    });

    // If createdAfter is specified (e.g. trade creation time), strictly newer than createdAfter
    if (minTimestamp > 0 && !isNaN(minTimestamp)) {
      result = result.filter((t) => new Date(t.createdAt).getTime() > minTimestamp);
    }
    if (sinceId) {
      result = result.filter((t) => isNewerTweet(t.id, sinceId));
    }
    return result;
  };

  // 1. Check in-memory rate-limit cache first to prevent upstream 429 rate limit errors
  const cached = handleFeedCache.get(cleanHandle.toLowerCase());
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return filterFresh(cached.tweets);
  }

  // 2. If Official Twitter v2 Bearer Token is available and active, try official API
  if (token && !isTwitterV2QuotaExceeded) {
    try {
      let url = `https://api.twitter.com/2/tweets/search/recent?query=from:${cleanHandle}&tweet.fields=created_at&max_results=10`;
      if (sinceId) {
        url += `&since_id=${sinceId}`;
      }

      await throttleOutbound();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const tweets: DetectedTweet[] = data.data.map((t: any) => ({
            id: t.id,
            author: cleanHandle,
            text: cleanTweetText(t.text),
            createdAt: t.created_at || new Date().toISOString(),
            url: `https://x.com/${cleanHandle}/status/${t.id}`,
          }));

          // Sort chronologically descending (newest first)
          tweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          handleFeedCache.set(cleanHandle.toLowerCase(), { timestamp: now, tweets });
          return filterFresh(tweets);
        }
      } else {
        if (res.status === 402 || res.status === 401 || res.status === 403) {
          isTwitterV2QuotaExceeded = true;
        }
      }
    } catch (err) {
      console.warn("Official Twitter API error, falling back to feed bridge:", err);
    }
  }

  // 3. Real-time Live RSS Feed Bridge (FxTwitter) - Works for ANY public handle without API key or credits
  try {
    await throttleOutbound();
    const feedRes = await fetch(`https://fxtwitter.com/${cleanHandle}/feed.xml`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; xMarket/1.0; +https://ethglobal.com)",
      },
      cache: "no-store",
    });

    if (feedRes.ok) {
      const xml = await feedRes.text();
      const items = xml.split("<item>").slice(1);
      const parsedTweets: DetectedTweet[] = [];

      for (const item of items.slice(0, 10)) {
        const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
        const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

        const rawUrl = (linkMatch && linkMatch[1]) || (guidMatch && guidMatch[1]) || "";
        const tweetUrl = rawUrl.trim();

        if (tweetUrl) {
          // Extract tweet ID from url (e.g. https://x.com/user/status/123456)
          const idMatch = tweetUrl.match(/status\/(\d+)/);
          const tweetId = idMatch ? idMatch[1] : Date.now().toString();

          // Extract author from status url or fallback to cleanHandle
          const authorMatch = tweetUrl.match(/(?:x|twitter)\.com\/([^/]+)\/status/i);
          const tweetAuthor = authorMatch ? authorMatch[1] : cleanHandle;

          let textContent = descMatch && descMatch[1] ? cleanTweetText(descMatch[1]) : "";
          if (!textContent && titleMatch && titleMatch[1]) {
            textContent = cleanTweetText(titleMatch[1]);
          }

          const parsedDate = dateMatch ? new Date(dateMatch[1]) : null;
          if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate.getTime() < recencyThreshold) {
            continue;
          }

          if (textContent) {
            parsedTweets.push({
              id: tweetId,
              author: tweetAuthor,
              text: textContent,
              createdAt: parsedDate.toISOString(),
              url: tweetUrl,
            });
          }
        }
      }

      if (parsedTweets.length > 0) {
        // Sort chronologically descending (newest first)
        parsedTweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        handleFeedCache.set(cleanHandle.toLowerCase(), { timestamp: now, tweets: parsedTweets });
        return filterFresh(parsedTweets);
      }
    } else {
      console.warn(`FxTwitter feed returned status ${feedRes.status} for @${cleanHandle}`);
    }
  } catch (feedErr) {
    console.warn("Live feed bridge error:", feedErr);
  }

  // 4. Return cached tweets if recent fetch failed (prevents momentary rate-limit dropouts)
  if (cached && cached.tweets.length > 0) {
    return filterFresh(cached.tweets);
  }

  // 5. Fallback: Check in-memory live test buffer (for manual injections)
  const buffered = liveTweetBuffer.get(cleanHandle.toLowerCase()) || [];
  return filterFresh(buffered);
}

export async function fetchTweetByUrl(url: string): Promise<DetectedTweet | null> {
  try {
    const statusMatch = url.match(/status\/(\d+)/);
    if (!statusMatch) return null;
    const tweetId = statusMatch[1];

    await throttleOutbound();
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.tweet) {
        return {
          id: data.tweet.id,
          author: data.tweet.author?.screen_name || "unknown",
          text: cleanTweetText(data.tweet.text || ""),
          createdAt: data.tweet.created_at || new Date().toISOString(),
          url: data.tweet.url || url,
        };
      }
    }
  } catch (err) {
    console.warn("Error fetching tweet by URL:", err);
  }
  return null;
}

export function registerLiveIncomingTweet({
  author,
  text,
}: {
  author: string;
  text: string;
}): DetectedTweet {
  const cleanHandle = author.replace("@", "").trim();
  const id = Date.now().toString();
  const tweet: DetectedTweet = {
    id,
    author: cleanHandle,
    text: cleanTweetText(text),
    createdAt: new Date().toISOString(),
    url: `https://x.com/${cleanHandle}/status/${id}`,
  };

  const key = cleanHandle.toLowerCase();
  const existing = liveTweetBuffer.get(key) || [];
  existing.unshift(tweet);
  liveTweetBuffer.set(key, existing.slice(0, 20));

  // Also pre-warm cache
  handleFeedCache.set(key, { timestamp: Date.now(), tweets: existing.slice(0, 20) });

  return tweet;
}
