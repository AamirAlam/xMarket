import { NextResponse } from "next/server";
import { fetchLatestTweetsForHandle, registerLiveIncomingTweet, fetchTweetByUrl } from "@/lib/twitter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");
  const handle = searchParams.get("handle") || "federalreserve";
  const sinceId = searchParams.get("sinceId") || undefined;
  const createdAfter = searchParams.get("createdAfter") || undefined;
  const bearerToken = req.headers.get("x-twitter-token") || undefined;

  try {
    if (urlParam) {
      const tweet = await fetchTweetByUrl(urlParam);
      if (tweet) {
        if (createdAfter) {
          const minTime = new Date(createdAfter).getTime();
          if (minTime > 0 && !isNaN(minTime) && new Date(tweet.createdAt).getTime() <= minTime) {
            return NextResponse.json({ success: true, handle: tweet.author, tweets: [] });
          }
        }
        return NextResponse.json({ success: true, handle: tweet.author, tweets: [tweet] });
      }
      return NextResponse.json({ success: false, error: "Could not parse tweet from URL" }, { status: 404 });
    }

    const tweets = await fetchLatestTweetsForHandle({
      handle,
      bearerToken,
      sinceId,
      createdAfter,
    });
    return NextResponse.json({ success: true, handle, tweets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { author, text, url } = body;

    if (url) {
      const tweet = await fetchTweetByUrl(url);
      if (tweet) {
        return NextResponse.json({ success: true, tweet });
      }
    }

    if (!author || !text) {
      return NextResponse.json(
        { success: false, error: "Author and text or url are required" },
        { status: 400 }
      );
    }

    const tweet = registerLiveIncomingTweet({ author, text });
    return NextResponse.json({ success: true, tweet });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register tweet" },
      { status: 500 }
    );
  }
}
