import { NextRequest, NextResponse } from "next/server";
import { queryArkivEntities, getArkivPublicClient, ARKIV_RPC_URL, ARKIV_CHAIN_ID } from "@/lib/arkiv";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("query") || "exists(status)";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const client = getArkivPublicClient();
    const blockNumber = await client.getBlockNumber();

    const entities = await queryArkivEntities(filter, limit);

    return NextResponse.json({
      success: true,
      query: filter,
      count: entities.length,
      blockNumber: blockNumber.toString(),
      rpc: ARKIV_RPC_URL,
      chainId: ARKIV_CHAIN_ID,
      entities,
    });
  } catch (err: any) {
    console.error("Arkiv GET query API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to query Arkiv testnet" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filter = body.query || "exists(status)";
    const limit = body.limit || 15;

    const client = getArkivPublicClient();
    const blockNumber = await client.getBlockNumber();

    const entities = await queryArkivEntities(filter, limit);

    return NextResponse.json({
      success: true,
      query: filter,
      count: entities.length,
      blockNumber: blockNumber.toString(),
      rpc: ARKIV_RPC_URL,
      chainId: ARKIV_CHAIN_ID,
      entities,
    });
  } catch (err: any) {
    console.error("Arkiv POST query API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to query Arkiv testnet" },
      { status: 500 }
    );
  }
}
