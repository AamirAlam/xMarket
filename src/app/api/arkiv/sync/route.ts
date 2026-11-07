import { NextRequest, NextResponse } from "next/server";
import {
  getPositionById,
  getTradeById,
  updateArkivEntityForPosition,
  updateArkivEntityForTrade,
} from "@/lib/db";
import {
  writeAgentIntentToArkiv,
  writeAgentTradeToArkiv,
  isValidArkivKey,
} from "@/lib/arkiv";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { positionId, tradeId, entityKey, txHash, expiresAt } = body;

    // 1. Client broadcasted from browser wallet (MetaMask)
    if (entityKey) {
      if (!isValidArkivKey(entityKey)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid Arkiv entity key format. Expected 32-byte hex string (0x... 66 characters).",
          },
          { status: 400 }
        );
      }

      if (positionId) {
        updateArkivEntityForPosition(positionId, entityKey, txHash, expiresAt);
        return NextResponse.json({
          success: true,
          positionId,
          entityKey,
          txHash,
          expiresAt,
        });
      }

      if (tradeId) {
        updateArkivEntityForTrade(tradeId, entityKey, txHash, expiresAt);
        return NextResponse.json({
          success: true,
          tradeId,
          entityKey,
          txHash,
          expiresAt,
        });
      }

      return NextResponse.json(
        { success: false, error: "Must specify positionId or tradeId" },
        { status: 400 }
      );
    }

    // 2. Server-side broadcast request using configured Arkiv wallet
    if (positionId) {
      const position = getPositionById(positionId);
      if (!position) {
        return NextResponse.json(
          { success: false, error: `Position ${positionId} not found` },
          { status: 404 }
        );
      }

      const res = await writeAgentIntentToArkiv(position);
      if (res.success && res.entityKey) {
        updateArkivEntityForPosition(
          positionId,
          res.entityKey,
          res.txHash,
          res.expiresAt
        );
        return NextResponse.json({
          success: true,
          positionId,
          entityKey: res.entityKey,
          txHash: res.txHash,
          expiresAt: res.expiresAt,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              res.error ||
              "Arkiv writer wallet is unfunded or not configured. Use MetaMask to broadcast or request testnet tGLM.",
          },
          { status: 400 }
        );
      }
    }

    if (tradeId) {
      const trade = getTradeById(tradeId);
      if (!trade) {
        return NextResponse.json(
          { success: false, error: `Trade ${tradeId} not found` },
          { status: 404 }
        );
      }

      const res = await writeAgentTradeToArkiv(trade);
      if (res.success && res.entityKey) {
        updateArkivEntityForTrade(
          tradeId,
          res.entityKey,
          res.txHash,
          res.expiresAt
        );
        return NextResponse.json({
          success: true,
          tradeId,
          entityKey: res.entityKey,
          txHash: res.txHash,
          expiresAt: res.expiresAt,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              res.error ||
              "Arkiv writer wallet is unfunded or not configured. Use MetaMask to broadcast or request testnet tGLM.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Missing positionId or tradeId" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error in /api/arkiv/sync:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

