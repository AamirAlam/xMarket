import { NextRequest, NextResponse } from "next/server";

const FLASH_API_BASE = process.env.DEFINITIVE_FLASH_API_URL || "https://flash.definitive.fi/v1";
const DEFAULT_FLASH_KEY = process.env.DEFINITIVE_FLASH_API_KEY || "dpka_aee79258_957c_4854_9ee9_12c1c525ce16";

const TOKEN_ADDRESSES: Record<string, string> = {
  WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
  ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  SOL: "0x2bCc6703c0FC432B02640F7c0B6F05E0954b87Ac",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, funderAddress, targetAsset, contraAsset, qty, side, apiKey } = body;
    const token = apiKey || DEFAULT_FLASH_KEY;

    // ACTION 1: Request live Quote from Definitive Flash
    if (action === "QUOTE") {
      if (!funderAddress) {
        return NextResponse.json({ success: false, error: "funderAddress is required for QUOTE" }, { status: 400 });
      }

      const targetAssetAddress = TOKEN_ADDRESSES[targetAsset || "WETH"] || TOKEN_ADDRESSES.WETH;
      const contraAssetAddress = TOKEN_ADDRESSES[contraAsset || "USDC"] || TOKEN_ADDRESSES.USDC;

      const quoteRes = await fetch(`${FLASH_API_BASE}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-definitive-api-key": token,
        },
        body: JSON.stringify({
          targetChain: "arbitrum",
          contraChain: "arbitrum",
          targetAsset: targetAssetAddress,
          contraAsset: contraAssetAddress,
          side: side || "buy",
          qty: (qty || 1).toString(),
          orderType: "market",
          funderAddress,
          flashIntegratorFeeBps: "10",
        }),
      });

      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) {
        return NextResponse.json(
          { success: false, error: quoteData?.error?.message || "Failed to fetch Definitive Flash quote" },
          { status: quoteRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        quoteId: quoteData.quoteId,
        from: quoteData.from,
        to: quoteData.to,
        evm: quoteData.evm,
      });
    }

    // ACTION 2: Submit Signed Order to Definitive Flash Execution Router
    if (action === "SUBMIT") {
      const { quoteId, userSignature, evmOrderTypedData } = body;
      if (!quoteId || !userSignature || !evmOrderTypedData || !funderAddress) {
        return NextResponse.json(
          { success: false, error: "quoteId, userSignature, evmOrderTypedData, and funderAddress are required for SUBMIT" },
          { status: 400 }
        );
      }

      const targetAssetAddress = TOKEN_ADDRESSES[targetAsset || "WETH"] || TOKEN_ADDRESSES.WETH;
      const contraAssetAddress = TOKEN_ADDRESSES[contraAsset || "USDC"] || TOKEN_ADDRESSES.USDC;

      const payload: Record<string, any> = {
        quoteId,
        targetChain: "arbitrum",
        contraChain: "arbitrum",
        targetAsset: targetAssetAddress,
        contraAsset: contraAssetAddress,
        side: side || "buy",
        qty: (qty || 1).toString(),
        orderType: "market",
        funderAddress,
        recipient: funderAddress,
        userSignature,
        evmOrderTypedData: typeof evmOrderTypedData === "string" ? evmOrderTypedData : JSON.stringify(evmOrderTypedData),
        flashIntegratorFeeBps: "10",
      };

      if (body.attachedBracket) {
        payload.attachedBracket = body.attachedBracket;
      }

      const orderRes = await fetch(`${FLASH_API_BASE}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-definitive-api-key": token,
        },
        body: JSON.stringify(payload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        return NextResponse.json(
          { success: false, error: orderData?.error?.message || "Definitive Flash order submission rejected" },
          { status: orderRes.status }
        );
      }

      let txHash = orderData.txHash || "";
      const orderId = orderData.orderId;

      // If txHash is still pending broadcast, poll Definitive Flash order status up to 8 times
      if (!txHash && orderId) {
        for (let i = 0; i < 8; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          try {
            const statusRes = await fetch(`${FLASH_API_BASE}/orders/${orderId}?funderAddress=${encodeURIComponent(funderAddress)}`, {
              headers: { "x-definitive-api-key": token },
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.txHash) {
                txHash = statusData.txHash;
                break;
              }
            }
          } catch {
            // continue polling
          }
        }
      }

      return NextResponse.json({
        success: true,
        orderId,
        txHash: txHash || `Order submitted (${orderId})`,
        explorerUrl: txHash ? `https://arbiscan.io/tx/${txHash}` : undefined,
        raw: orderData,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Use QUOTE or SUBMIT" }, { status: 400 });
  } catch (err: any) {
    console.error("Definitive Flash Swap error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal Flash swap error" }, { status: 500 });
  }
}
