import { NextRequest, NextResponse } from "next/server";
import { getAllTrades, saveTrade } from "@/lib/db";
import { AgentTradeRecord } from "@/types";

export async function GET() {
  try {
    const trades = getAllTrades();
    return NextResponse.json({ success: true, trades });
  } catch (err: any) {
    console.error("Failed to query trades from SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to query SQLite DB" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trade = body.trade as AgentTradeRecord;
    if (!trade || !trade.id) {
      return NextResponse.json(
        { success: false, error: "Invalid trade data" },
        { status: 400 }
      );
    }

    const saved = saveTrade(trade);
    return NextResponse.json({ success: true, trade: saved });
  } catch (err: any) {
    console.error("Failed to save trade to SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to persist trade to SQLite DB" },
      { status: 500 }
    );
  }
}
