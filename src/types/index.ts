export type SentimentDirection = "BULLISH_ONLY" | "BEARISH_ONLY" | "ANY";
export type OrderType = "BRACKET" | "MARKET" | "LIMIT";

export interface TradingIntent {
  targetHandle: string;
  eventName: string;
  targetAsset: string;
  contraAsset: string;
  confidenceThreshold: number; // 0.0 to 1.0 (e.g. 0.75)
  sentimentDirection: SentimentDirection;
  tradeSizeUsdc: number;
  takeProfitPct: number; // e.g. 5.0
  stopLossPct: number;   // e.g. 2.5
  orderType: OrderType;
  maxTrades: number;
}

export interface DetectedTweet {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  url: string;
}

export interface ZeroGInferenceResult {
  requestId: string;
  model: string;
  sentimentScore: number; // -1.0 (Extremely Bearish) to +1.0 (Extremely Bullish)
  confidence: number;     // 0.0 to 1.0
  sentimentLabel: "EXTREMELY_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "EXTREMELY_BEARISH";
  action: "BUY" | "SELL" | "HOLD";
  rationale: string;
  matchedIntent: boolean;
  timestamp: string;
  isSimulatedFallback?: boolean;
}

export interface FlashOrderResult {
  orderId: string;
  status: "SUBMITTED" | "FILLED" | "PENDING" | "REJECTED";
  targetChain: string;
  targetToken: string;
  contraToken: string;
  amount: string;
  txHash: string;
  bracket?: {
    takeProfitPercentage: number;
    stopLossPercentage: number;
    estimatedTakeProfitPrice?: number;
    estimatedStopLossPrice?: number;
  };
  integratorFeeRebateUsd: number;
  explorerUrl: string;
  timestamp: string;
  isSimulatedFallback?: boolean;
}

export interface AgentVaultState {
  zeroGComputeBalanceUsd: number;
  creditsEarnedFromTradesUsd: number;
  dailySpendCapUsd: number;
  inferencesRunCount: number;
  tradesExecutedCount: number;
}

export type PositionStatus = "ARMED" | "OPEN" | "CLOSED" | "PROFIT_TAKEN" | "STOPPED_OUT";

export interface EventPosition {
  id: string;
  eventName: string;
  targetHandle: string;
  persona?: string;
  avatar?: string;
  targetAsset: string;
  contraAsset: string;
  sizeUsdc: number;
  entryPrice: number;
  currentPrice: number;
  side: "LONG" | "SHORT";
  pnlUsd: number;
  pnlPct: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  takeProfitPct: number;
  stopLossPct: number;
  status: PositionStatus;
  confidenceThreshold: number;
  orderType: OrderType;
  createdAt: string;
  txHash?: string;
  explorerUrl?: string;
  triggeredTweet?: string;
}

export interface AuditExecutionRecord {
  id: string;
  timestamp: string;
  tweet: DetectedTweet;
  zeroG: ZeroGInferenceResult;
  order?: FlashOrderResult;
  status: "EXECUTED" | "SKIPPED_THRESHOLD" | "FAILED";
  reason: string;
}
