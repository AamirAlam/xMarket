import { DetectedTweet } from "@/types";

// In-memory feed buffer to simulate incoming real-time tweets when user/judge tests live
const liveTweetBuffer: Map<string, DetectedTweet[]> = new Map();

export async function fetchLatestTweetsForHandle({
  handle,
  bearerToken,
  sinceId,
}: {
  handle: string;
  bearerToken?: string;
  sinceId?: string;
}): Promise<DetectedTweet[]> {
  const cleanHandle = handle.replace("@", "").trim();
  const token = bearerToken || process.env.TWITTER_BEARER_TOKEN;

  // 1. If Official Twitter v2 Bearer Token is available, try official API
  if (token) {
    try {
      let url = `https://api.twitter.com/2/tweets/search/recent?query=from:${cleanHandle}&tweet.fields=created_at&max_results=10`;
      if (sinceId) {
        url += `&since_id=${sinceId}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((t: any) => ({
            id: t.id,
            author: cleanHandle,
            text: t.text,
            createdAt: t.created_at || new Date().toISOString(),
            url: `https://x.com/${cleanHandle}/status/${t.id}`,
          }));
        }
      } else {
        console.warn(`Twitter API returned ${res.status} (likely credits depleted or rate limit), switching to live RSS feed bridge...`);
      }
    } catch (err) {
      console.warn("Official Twitter API error, falling back to feed bridge:", err);
    }
  }

  // 2. Real-time Live RSS Feed Bridge (FxTwitter) - Works for ANY public handle without API key or credits
  try {
    const feedRes = await fetch(`https://fxtwitter.com/${cleanHandle}/feed.xml`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; xMarket/1.0; +https://ethglobal.com)",
      },
      next: { revalidate: 0 },
    });

    if (feedRes.ok) {
      const xml = await feedRes.text();
      const items = xml.split("<item>").slice(1);
      const parsedTweets: DetectedTweet[] = [];

      for (const item of items.slice(0, 10)) {
        const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

        if (linkMatch && linkMatch[1]) {
          const tweetUrl = linkMatch[1].trim();
          // Extract tweet ID from url (e.g. https://x.com/user/status/123456)
          const idMatch = tweetUrl.match(/status\/(\d+)/);
          const tweetId = idMatch ? idMatch[1] : Date.now().toString();

          // Extract cleaner full text from description if available (stripping html tags)
          let cleanText = titleMatch ? titleMatch[1].trim() : "";
          if (descMatch && descMatch[1]) {
            const rawDesc = descMatch[1]
              .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
              .replace(/<[^>]+>/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/\s+/g, " ")
              .trim();
            if (rawDesc.length > cleanText.length) {
              cleanText = rawDesc;
            }
          }

          parsedTweets.push({
            id: tweetId,
            author: cleanHandle,
            text: cleanText,
            createdAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
            url: tweetUrl,
          });
        }
      }

      if (parsedTweets.length > 0) {
        if (sinceId) {
          const fresh = parsedTweets.filter((t) => t.id > sinceId);
          if (fresh.length > 0) return fresh;
        } else {
          return parsedTweets;
        }
      }
    }
  } catch (feedErr) {
    console.warn("Live feed bridge error:", feedErr);
  }

  // 3. Check in-memory live buffer (for manually emitted/tested tweets)
  const buffered = liveTweetBuffer.get(cleanHandle) || [];
  if (sinceId) {
    const fresh = buffered.filter((t) => t.id > sinceId);
    return fresh;
  }
  return buffered;
}

export async function fetchTweetByUrl(url: string): Promise<DetectedTweet | null> {
  try {
    const statusMatch = url.match(/status\/(\d+)/);
    if (!statusMatch) return null;
    const tweetId = statusMatch[1];

    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.tweet) {
        return {
          id: data.tweet.id,
          author: data.tweet.author?.screen_name || "unknown",
          text: data.tweet.text,
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
    text,
    createdAt: new Date().toISOString(),
    url: `https://x.com/${cleanHandle}/status/${id}`,
  };

  const existing = liveTweetBuffer.get(cleanHandle) || [];
  existing.unshift(tweet);
  liveTweetBuffer.set(cleanHandle, existing.slice(0, 20));

  return tweet;
}
