import { NextRequest, NextResponse } from "next/server";
import { executeDefinitiveFlashExitOrder } from "@/lib/definitive";
import { executeEmergencySweepToMaster } from "@/lib/agentWallet";
import { EventPosition } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, position, exitType, apiKey, masterController, amountUsdc } = body;

    if (action === "EXIT_SELL") {
      if (!position) {
        return NextResponse.json({ success: false, error: "Position required for EXIT_SELL" }, { status: 400 });
      }

      const result = await executeDefinitiveFlashExitOrder({
        position,
        exitType: exitType || "TAKE_PROFIT",
        apiKey,
      });

      return NextResponse.json({
        success: true,
        trade: result,
      });
    }

    if (action === "SWEEP_MASTER") {
      const smartAccountAddress = position?.agentWallet?.address || body.smartAccountAddress;
      const owner = masterController || position?.agentWallet?.masterController || body.masterAddress;

      if (!smartAccountAddress || !owner) {
        return NextResponse.json(
          { success: false, error: "Smart account and master owner addresses required for SWEEP_MASTER" },
          { status: 400 }
        );
      }

      const sweepResult = await executeEmergencySweepToMaster({
        smartAccountAddress,
        masterController: owner,
        amountUsdc: amountUsdc || position?.sizeUsdc || 100,
      });

      return NextResponse.json({
        success: true,
        sweep: sweepResult,
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported trade action" }, { status: 400 });
  } catch (err: any) {
    console.error("Trade API execution error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal trade execution error" }, { status: 500 });
  }
}
