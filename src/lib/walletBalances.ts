import { WalletBalances } from "@/types";

const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
export const REFERENCE_ETH_PRICE = 2840.50;

/**
 * Queries real onchain balances for a given wallet address on Arbitrum One.
 * Batches eth_getBalance (ETH) and eth_call balanceOf (canonical USDC).
 */
export async function fetchRealWalletBalances(walletAddress: string): Promise<WalletBalances> {
  if (!walletAddress) {
    return {
      eth: 0,
      usdc: 0,
      totalUsd: 0,
      ethPriceUsd: REFERENCE_ETH_PRICE,
      isLoading: false,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  let ethBal = 0;
  let usdcBal = 0;

  // 1. If running in browser and ethereum provider is available, attempt direct query
  if (typeof window !== "undefined") {
    const eth = (window as unknown as {
      ethereum?: { request: (args: { method: string; params?: any[] }) => Promise<any> };
    }).ethereum;

    if (eth && typeof eth.request === "function") {
      try {
        const rawEth = await eth.request({
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        });
        if (rawEth && typeof rawEth === "string") {
          ethBal = Number(BigInt(rawEth)) / 1e18;
        }
      } catch (err) {
        console.warn("Direct injected eth_getBalance note:", err);
      }

      try {
        const cleanAddr = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
        const rawUsdc = await eth.request({
          method: "eth_call",
          params: [
            {
              to: ARBITRUM_USDC,
              data: `0x70a08231${cleanAddr}`,
            },
            "latest",
          ],
        });
        if (rawUsdc && typeof rawUsdc === "string" && rawUsdc !== "0x") {
          usdcBal = Number(BigInt(rawUsdc)) / 1e6;
        }
      } catch (err) {
        console.warn("Direct injected USDC balanceOf note:", err);
      }
    }
  }

  // 2. Query public Arbitrum RPC as ground-truth onchain verification
  try {
    const cleanAddr = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    const rpcRes = await fetch(ARBITRUM_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        },
        {
          jsonrpc: "2.0",
          id: 2,
          method: "eth_call",
          params: [
            {
              to: ARBITRUM_USDC,
              data: `0x70a08231${cleanAddr}`,
            },
            "latest",
          ],
        },
      ]),
    });

    if (rpcRes.ok) {
      const batchData = await rpcRes.json();
      if (Array.isArray(batchData)) {
        const ethItem = batchData.find((r) => r.id === 1)?.result;
        const usdcItem = batchData.find((r) => r.id === 2)?.result;

        if (ethItem && typeof ethItem === "string") {
          const rpcEth = Number(BigInt(ethItem)) / 1e18;
          if (rpcEth > ethBal) ethBal = rpcEth;
        }

        if (usdcItem && typeof usdcItem === "string" && usdcItem !== "0x") {
          const rpcUsdc = Number(BigInt(usdcItem)) / 1e6;
          if (rpcUsdc > usdcBal) usdcBal = rpcUsdc;
        }
      }
    }
  } catch (err) {
    console.warn("Arbitrum RPC batch query error:", err);
  }

  const totalUsd = Math.round((ethBal * REFERENCE_ETH_PRICE + usdcBal) * 100) / 100;

  return {
    eth: Math.round(ethBal * 10000) / 10000,
    usdc: Math.round(usdcBal * 100) / 100,
    totalUsd,
    ethPriceUsd: REFERENCE_ETH_PRICE,
    isLoading: false,
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}
