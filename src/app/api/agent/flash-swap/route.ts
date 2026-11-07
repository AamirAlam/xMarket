import { NextRequest, NextResponse } from "next/server";
import { getPositionById, savePosition, saveTrade } from "@/lib/db";
import { signFlashOrderTypedData } from "@/lib/agentWallet";
import { writeAgentTradeToArkiv } from "@/lib/arkiv";
import { EventPosition, AgentTradeRecord } from "@/types";

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

      let updatedPos: EventPosition | undefined;
      if (body.positionId) {
        const position = getPositionById(body.positionId);
        if (position) {
          const currentPrice = position.currentPrice || position.entryPrice || 2248.5;
          updatedPos = {
            ...position,
            status: "OPEN",
            sizeUsdc: Number(qty) || position.sizeUsdc,
            entryPrice: currentPrice,
            entryTxHash: txHash || (orderId ? `Order submitted (${orderId})` : ""),
            entryExplorerUrl: txHash.startsWith("0x") ? `https://arbiscan.io/tx/${txHash}` : undefined,
          };
          savePosition(updatedPos);

          if (txHash && txHash.startsWith("0x")) {
            const tradeRecord: AgentTradeRecord = {
              id: `trade-entry-${orderId || Date.now()}`,
              positionId: position.id,
              eventName: position.eventName,
              targetHandle: position.targetHandle,
              persona: position.persona,
              avatar: position.avatar,
              targetAsset: position.targetAsset,
              contraAsset: position.contraAsset,
              tradeType: "ENTRY_BUY",
              side: position.side,
              orderType: position.orderType || "MARKET",
              sizeUsdc: Number(qty) || position.sizeUsdc,
              price: currentPrice,
              pnlUsd: 0,
              pnlPct: 0,
              status: "FILLED",
              txHash,
              explorerUrl: `https://arbiscan.io/tx/${txHash}`,
              agentWalletAddress: position.agentWallet?.address,
              masterController: funderAddress,
              triggeredTweet: position.triggeredTweet,
              createdAt: new Date().toISOString(),
            };
            saveTrade(tradeRecord);
            try {
              writeAgentTradeToArkiv(tradeRecord);
            } catch { }
          }
        }
      }

      return NextResponse.json({
        success: true,
        orderId,
        txHash: txHash || `Order submitted (${orderId})`,
        explorerUrl: txHash.startsWith("0x") ? `https://arbiscan.io/tx/${txHash}` : undefined,
        position: updatedPos,
        raw: orderData,
      });
    }

    // ACTION 3: Autonomous Agent Execution (Zero User Interaction)
    // Uses pre-authorized session key & pre-approved Definitive Flash allowance
    if (action === "EXECUTE_AGENT_SWAP") {
      const { positionId } = body;
      if (!positionId) {
        return NextResponse.json(
          { success: false, error: "positionId is required for EXECUTE_AGENT_SWAP" },
          { status: 400 }
        );
      }

      const position = getPositionById(positionId);
      if (!position) {
        return NextResponse.json(
          { success: false, error: `Position ${positionId} not found` },
          { status: 404 }
        );
      }

      const funderAddress =
        position.agentWallet?.masterController ||
        body.funderAddress ||
        process.env.NEXT_PUBLIC_DEFAULT_WALLET ||
        "0x666aaB9c94bE79AbA5bf033a393A705156AD5060";

      const agentPrivateKey =
        position.agentWallet?.privateKey ||
        process.env.AGENT_SESSION_PRIVATE_KEY;

      const targetAsset = position.targetAsset || "WETH";
      const contraAsset = position.contraAsset || "USDC";
      const qty = position.sizeUsdc || 1;
      const side = position.side === "SHORT" ? "sell" : "buy";

      const targetAssetAddress = TOKEN_ADDRESSES[targetAsset] || TOKEN_ADDRESSES.WETH;
      const contraAssetAddress = TOKEN_ADDRESSES[contraAsset] || TOKEN_ADDRESSES.USDC;

      const currentPrice = position.currentPrice || position.entryPrice || 2248.5;
      const tpPct = position.takeProfitPct || 5;
      const slPct = position.stopLossPct || 2.5;
      const tpPrice = Math.round(currentPrice * (1 + tpPct / 100) * 100) / 100;
      const slPrice = Math.round(currentPrice * (1 - slPct / 100) * 100) / 100;

      // 1. Fetch live Definitive Flash Quote
      const quotePayload: Record<string, any> = {
        targetChain: "arbitrum",
        contraChain: "arbitrum",
        targetAsset: targetAssetAddress,
        contraAsset: contraAssetAddress,
        side,
        qty: qty.toString(),
        orderType: "market",
        funderAddress,
        attachedBracket: {
          takeProfit: { notionalPrice: tpPrice.toString() },
          stopLoss: { notionalPrice: slPrice.toString() },
        },
        flashIntegratorFeeBps: "10",
      };

      let quoteData: any = null;
      try {
        const quoteRes = await fetch(`${FLASH_API_BASE}/quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-definitive-api-key": token,
          },
          body: JSON.stringify(quotePayload),
        });
        if (quoteRes.ok) {
          quoteData = await quoteRes.json();
        }
      } catch (err) {
        console.warn("Quote fetch warning in EXECUTE_AGENT_SWAP:", err);
      }

      // 2. Autonomous Non-Custodial Agent Signing via pre-authorized session key
      let userSignature = "";
      if (agentPrivateKey && quoteData?.evm?.orderTypedData) {
        try {
          userSignature = await signFlashOrderTypedData(
            agentPrivateKey,
            quoteData.evm.orderTypedData
          );
        } catch (sigErr) {
          console.warn("Error signing order typed data with agent session key:", sigErr);
        }
      }

      let txHash = "";
      let orderId = "";

      // 3. Submit to Definitive Flash API if signed
      if (quoteData?.quoteId && userSignature) {
        try {
          const submitPayload: Record<string, any> = {
            quoteId: quoteData.quoteId,
            targetChain: "arbitrum",
            contraChain: "arbitrum",
            targetAsset: targetAssetAddress,
            contraAsset: contraAssetAddress,
            side,
            qty: qty.toString(),
            orderType: "market",
            funderAddress,
            recipient: funderAddress,
            userSignature,
            evmOrderTypedData:
              typeof quoteData.evm.orderTypedData === "string"
                ? quoteData.evm.orderTypedData
                : JSON.stringify(quoteData.evm.orderTypedData),
            flashIntegratorFeeBps: "10",
            attachedBracket: quotePayload.attachedBracket,
          };

          const orderRes = await fetch(`${FLASH_API_BASE}/order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-definitive-api-key": token,
            },
            body: JSON.stringify(submitPayload),
          });

          if (orderRes.ok) {
            const orderData = await orderRes.json();
            orderId = orderData.orderId || "";
            txHash = orderData.txHash || "";

            // Poll for mined txHash if still pending broadcast
            if (!txHash && orderId) {
              for (let i = 0; i < 6; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                try {
                  const statusRes = await fetch(
                    `${FLASH_API_BASE}/orders/${orderId}?funderAddress=${encodeURIComponent(funderAddress)}`,
                    { headers: { "x-definitive-api-key": token } }
                  );
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.txHash) {
                      txHash = statusData.txHash;
                      break;
                    }
                  }
                } catch { }
              }
            }
          }
        } catch (submitErr) {
          console.warn("Definitive Flash submit error in EXECUTE_AGENT_SWAP:", submitErr);
        }
      }

      // Require legitimate broadcast or order from Definitive Flash
      if (!txHash && !orderId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Definitive Flash requires user wallet authorization. Please click 'Execute Real Definitive Flash Swap' to authorize the order in MetaMask.",
          },
          { status: 400 }
        );
      }

      const finalTxHash = txHash || (orderId ? `Order submitted (${orderId})` : "");

      // 4. Update Position to OPEN with entry transaction in SQLite
      const updatedPosition: EventPosition = {
        ...position,
        status: "OPEN",
        entryPrice: currentPrice,
        entryTxHash: finalTxHash,
        entryExplorerUrl: finalTxHash.startsWith("0x") ? `https://arbiscan.io/tx/${finalTxHash}` : undefined,
      };

      savePosition(updatedPosition);

      if (txHash && txHash.startsWith("0x")) {
        const tradeRecord: AgentTradeRecord = {
          id: `trade-entry-${orderId || Date.now()}`,
          positionId: position.id,
          eventName: position.eventName,
          targetHandle: position.targetHandle,
          persona: position.persona,
          avatar: position.avatar,
          targetAsset: position.targetAsset,
          contraAsset: position.contraAsset,
          tradeType: "ENTRY_BUY",
          side: position.side,
          orderType: position.orderType || "MARKET",
          sizeUsdc: position.sizeUsdc,
          price: currentPrice,
          pnlUsd: 0,
          pnlPct: 0,
          status: "FILLED",
          txHash,
          explorerUrl: `https://arbiscan.io/tx/${txHash}`,
          agentWalletAddress: position.agentWallet?.address,
          masterController: funderAddress,
          triggeredTweet: position.triggeredTweet,
          createdAt: new Date().toISOString(),
        };
        saveTrade(tradeRecord);
        try {
          writeAgentTradeToArkiv(tradeRecord);
        } catch { }
      }

      return NextResponse.json({
        success: true,
        autonomous: true,
        txHash: finalTxHash,
        orderId,
        explorerUrl: finalTxHash.startsWith("0x") ? `https://arbiscan.io/tx/${finalTxHash}` : undefined,
        position: updatedPosition,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Use QUOTE, SUBMIT, or EXECUTE_AGENT_SWAP" }, { status: 400 });
  } catch (err: any) {
    console.error("Definitive Flash Swap error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal Flash swap error" }, { status: 500 });
  }
}
