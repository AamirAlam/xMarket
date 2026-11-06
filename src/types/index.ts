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
  agentWalletAddress?: string;
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
  agentWalletAddress?: string;
}

export interface AgentVaultState {
  zeroGComputeBalanceUsd: number;
  creditsEarnedFromTradesUsd: number;
  dailySpendCapUsd: number;
  inferencesRunCount: number;
  tradesExecutedCount: number;
}

export interface SmartAccountPolicy {
  targetRouter: string;
  allowedMethods: string[];
  spendingCapUsdc: number;
  sessionExpiry: number;
  deductionMode?: string;
}

export interface AgentWalletInfo {
  address: string; // The Counterfactual Smart Account / Agent Session Address on Arbitrum
  sessionKeyAddress: string; // Ephemeral Session Key Address authorized by Main Wallet
  privateKey?: string; // Private key of ephemeral session key (stored client-side)
  masterController: string; // The Main Connected Wallet (Funder & 100% Custody Owner)
  allocatedBudgetUsdc: number;
  fundingMode?: "DIRECT_MAIN_WALLET_DELEGATION" | "SMART_ACCOUNT_ESCROW";
  manualFundingRequiredUsdc?: number; // 0.00 (Zero manual transfer needed)
  status: "ARMED" | "ACTIVE" | "SETTLED" | "REVOKED";
  createdAt: string;
  explorerUrl: string;
  delegationSignature?: string;
  sessionExpiry?: number;
  accountType: "ERC4337_SMART_ACCOUNT" | "SAFE_SESSION_MODULE" | "DELEGATED_MAIN_WALLET_AGENT";
  policy?: SmartAccountPolicy;
}

export type PositionStatus = "ARMED" | "OPEN" | "PAUSED" | "CLOSED" | "PROFIT_TAKEN" | "STOPPED_OUT";

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
  entryTxHash?: string;
  entryExplorerUrl?: string;
  exitTxHash?: string;
  exitExplorerUrl?: string;
  exitPrice?: number;
  settledAt?: string;
  isSwept?: boolean;
  sweepTxHash?: string;
  triggeredTweet?: string;
  agentWallet?: AgentWalletInfo;
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

export type AgentTradeType =
  | "ENTRY_BUY"
  | "EXIT_TAKE_PROFIT"
  | "EXIT_STOP_LOSS"
  | "EXIT_SELL"
  | "SWEEP";

export interface AgentTradeRecord {
  id: string;
  positionId: string;
  eventName: string;
  targetHandle: string;
  persona?: string;
  avatar?: string;
  targetAsset: string;
  contraAsset: string;
  tradeType: AgentTradeType;
  side: "LONG" | "SHORT";
  orderType: OrderType;
  sizeUsdc: number;
  price: number;
  exitPrice?: number;
  pnlUsd?: number;
  pnlPct?: number;
  status: "FILLED" | "SETTLED" | "OPEN" | "SWEPT";
  txHash: string;
  explorerUrl: string;
  agentWalletAddress?: string;
  masterController?: string;
  triggeredTweet?: string;
  zeroGProofId?: string;
  createdAt: string;
}

export interface WalletBalances {
  eth: number;
  usdc: number;
  totalUsd: number;
  ethPriceUsd: number;
  isLoading: boolean;
  lastUpdated: string;
}
