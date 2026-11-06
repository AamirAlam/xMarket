import { NextResponse } from "next/server";
import { analyzeSentimentWith0G } from "@/lib/zeroG";
import { executeDefinitiveFlashOrder } from "@/lib/definitive";
import { DetectedTweet, TradingIntent, AuditExecutionRecord } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tweet,
      intent,
      apiKeys = {},
      walletAddress,
      agentWallet,
    }: {
      tweet: DetectedTweet;
      intent: TradingIntent;
      apiKeys?: { zeroGKey?: string; definitiveKey?: string };
      walletAddress?: string;
      agentWallet?: { address: string; privateKey?: string; masterController?: string };
    } = body;

    if (!tweet || !intent) {
      return NextResponse.json(
        { success: false, error: "Tweet and intent parameters are required" },
        { status: 400 }
      );
    }

    // 1. Run 0G Private Computer Verifiable Sentiment Inference
    const zeroGResult = await analyzeSentimentWith0G({
      tweetText: tweet.text,
      author: tweet.author,
      eventName: intent.eventName,
      apiKey: apiKeys.zeroGKey,
    });

    // 2. Intent Matching Logic
    const meetsConfidence = zeroGResult.confidence >= intent.confidenceThreshold;
    let directionMatches = false;

    if (intent.sentimentDirection === "ANY") {
      directionMatches = zeroGResult.action === "BUY" || zeroGResult.action === "SELL";
    } else if (intent.sentimentDirection === "BULLISH_ONLY") {
      directionMatches = zeroGResult.action === "BUY";
    } else if (intent.sentimentDirection === "BEARISH_ONLY") {
      directionMatches = zeroGResult.action === "SELL";
    }

    const isMatch = meetsConfidence && directionMatches;
    zeroGResult.matchedIntent = isMatch;

    // 3. Execution via Definitive Flash API
    if (isMatch) {
      if (!agentWallet || !agentWallet.address) {
        const auditRecord: AuditExecutionRecord = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          tweet,
          zeroG: zeroGResult,
          status: "SKIPPED_THRESHOLD",
          reason: `Sentiment match verified by 0G (${Math.round(zeroGResult.confidence * 100)}%), but no authorized agent session delegation exists. Capital protected; trade skipped.`,
        };
        return NextResponse.json({
          success: true,
          record: auditRecord,
          vaultRebateUsd: 0,
        });
      }

      const order = await executeDefinitiveFlashOrder({
        intent,
        sentimentScore: zeroGResult.sentimentScore,
        apiKey: apiKeys.definitiveKey,
        funderAddress: walletAddress || agentWallet?.masterController || agentWallet?.address || "0x71C84A962bFe2487431e50fB79D325603F01498B",
        agentPrivateKey: agentWallet?.privateKey,
      });

      const isFilledOnChain = Boolean(order.txHash && order.status === "FILLED");

      const auditRecord: AuditExecutionRecord = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tweet,
        zeroG: zeroGResult,
        order,
        status: isFilledOnChain ? "EXECUTED" : "PENDING",
        reason: isFilledOnChain
          ? `Confidence (${Math.round(zeroGResult.confidence * 100)}%) exceeded threshold (${Math.round(intent.confidenceThreshold * 100)}%). Placed ${intent.orderType} order via Definitive Flash.`
          : `0G verified catalyst sentiment (${Math.round(zeroGResult.confidence * 100)}%). Ready for live Definitive Flash swap on Arbitrum One via user wallet signature.`,
      };

      return NextResponse.json({
        success: true,
        record: auditRecord,
        vaultRebateUsd: order.integratorFeeRebateUsd,
      });
    } else {
      let skipReason = "";
      if (!meetsConfidence) {
        skipReason = `Confidence score ${Math.round(zeroGResult.confidence * 100)}% fell below intent threshold ${Math.round(intent.confidenceThreshold * 100)}%. Trade aborted to protect capital.`;
      } else {
        skipReason = `Sentiment action (${zeroGResult.action}) did not match selected strategy direction (${intent.sentimentDirection}).`;
      }

      const auditRecord: AuditExecutionRecord = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tweet,
        zeroG: zeroGResult,
        status: "SKIPPED_THRESHOLD",
        reason: skipReason,
      };

      return NextResponse.json({
        success: true,
        record: auditRecord,
        vaultRebateUsd: 0,
      });
    }
  } catch (error: any) {
    console.error("Evaluate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate tweet intent" },
      { status: 500 }
    );
  }
}
