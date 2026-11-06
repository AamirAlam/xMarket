"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Wallet, ChevronDown, Check, Copy, ExternalLink, LogOut, X, Sparkles, RefreshCw, Coins } from "lucide-react";
import { WalletBalances } from "@/types";
import { fetchRealWalletBalances } from "@/lib/walletBalances";

interface WalletButtonProps {
  onAddressChange?: (address: string) => void;
  onBalanceChange?: (balances: WalletBalances) => void;
}

export function WalletButton({ onAddressChange, onBalanceChange }: WalletButtonProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("Arbitrum One");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasInjected, setHasInjected] = useState<boolean>(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);

  // Real Wallet Balance State (ETH + USDC converted to USD)
  const [balanceState, setBalanceState] = useState<WalletBalances>({
    eth: 0,
    usdc: 0,
    totalUsd: 0,
    ethPriceUsd: 2840.50,
    isLoading: false,
    lastUpdated: "",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real onchain balances in USD (Arbitrum native ETH + Arbitrum USDC)
  const fetchRealWalletBalance = useCallback(async (walletAddr: string) => {
    if (!walletAddr) return;
    setIsRefreshingBalance(true);

    try {
      const res = await fetchRealWalletBalances(walletAddr);
      setBalanceState(res);
      onBalanceChange?.(res);
    } catch (err) {
      console.warn("Could not fetch real wallet balance:", err);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [onBalanceChange]);

  // Check for injected provider (e.g. MetaMask, Rabby)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as { ethereum?: unknown }).ethereum) {
      setHasInjected(true);
    }
  }, []);

  // Sync address changes to parent and localStorage
  const handleSetAddress = (addr: string | null) => {
    setAddress(addr);
    if (addr) {
      try {
        localStorage.setItem("pumpit_connected_wallet", addr);
      } catch (e) {
        console.warn("Could not save wallet address", e);
      }
      onAddressChange?.(addr);
      fetchRealWalletBalance(addr);
    } else {
      try {
        localStorage.removeItem("pumpit_connected_wallet");
      } catch (e) {
        console.warn("Could not remove wallet address", e);
      }
      onAddressChange?.("");
      setBalanceState({ eth: 0, usdc: 0, totalUsd: 0, ethPriceUsd: 2840.50, isLoading: false, lastUpdated: "" });
    }
  };

  // Auto-refresh balance on interval
  useEffect(() => {
    if (!address) return;
    fetchRealWalletBalance(address);
    const timer = setInterval(() => {
      fetchRealWalletBalance(address);
    }, 15000);
    return () => clearInterval(timer);
  }, [address, fetchRealWalletBalance]);

  // Check stored connection or authorized accounts on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pumpit_connected_wallet");
      if (saved) {
        setAddress(saved);
        onAddressChange?.(saved);
      } else if (typeof window !== "undefined") {
        const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
        if (eth && typeof eth.request === "function") {
          eth
            .request({ method: "eth_accounts" })
            .then((accounts) => {
              if (accounts && accounts.length > 0) {
                handleSetAddress(accounts[0]);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Listen to account changes from extension
    if (typeof window !== "undefined") {
      const eth = (window as unknown as {
        ethereum?: {
          on?: (event: string, handler: (...args: any[]) => void) => void;
          removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        };
      }).ethereum;

      if (eth?.on) {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            handleSetAddress(accounts[0]);
          } else {
            handleSetAddress(null);
          }
        };

        const handleChainChanged = (chainId: string) => {
          if (chainId === "0xa4b1" || chainId === "42161") {
            setNetwork("Arbitrum One");
          } else if (chainId === "0x1" || chainId === "1") {
            setNetwork("Ethereum");
          } else {
            setNetwork("Arbitrum One");
          }
        };

        eth.on("accountsChanged", handleAccountsChanged);
        eth.on("chainChanged", handleChainChanged);

        return () => {
          if (eth.removeListener) {
            eth.removeListener("accountsChanged", handleAccountsChanged);
            eth.removeListener("chainChanged", handleChainChanged);
          }
        };
      }
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const connectInjected = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== "undefined") {
        const eth = (window as unknown as {
          ethereum?: { request: (args: { method: string }) => Promise<string[]> };
        }).ethereum;

        if (eth && typeof eth.request === "function") {
          const accounts = await eth.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            handleSetAddress(accounts[0]);
            setIsModalOpen(false);
            setIsConnecting(false);
            return;
          }
        }
      }
      setIsModalOpen(true);
    } catch (err) {
      console.warn("Wallet connect failed:", err);
      setIsModalOpen(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectDemoWallet = () => {
    const demoAddress = "0x71C84A962bFe2487431e50fB79D325603F01498B";
    handleSetAddress(demoAddress);
    setNetwork("Arbitrum One");
    setIsModalOpen(false);
  };

  const disconnectWallet = () => {
    handleSetAddress(null);
    setIsDropdownOpen(false);
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatAddress = (addr: string) => {
    if (addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      {address ? (
        <div className="flex items-center gap-2" ref={dropdownRef}>
          {/* Wallet Balance Badge on Navbar */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-mono font-black text-slate-900 leading-none">
              {balanceState.isLoading ? (
                <span className="text-slate-400 font-normal">Loading...</span>
              ) : (
                `$${balanceState.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-slate-700 font-bold">{formatAddress(address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">Connected</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {network}
                  </span>
                </div>

                {/* Balance Breakdown Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-mono font-black text-slate-900 leading-none">
                      ${balanceState.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchRealWalletBalance(address)}
                      disabled={isRefreshingBalance}
                      className="text-slate-400 hover:text-blue-600 transition p-1 hover:bg-white rounded cursor-pointer disabled:opacity-50"
                      title="Refresh on-chain balance"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBalance ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Arbitrum ETH</span>
                      <span className="font-mono font-semibold text-slate-800">{balanceState.eth.toFixed(4)} ETH</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Arbitrum USDC</span>
                      <span className="font-mono font-semibold text-slate-800">{balanceState.usdc.toFixed(2)} USDC</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Wallet Address
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-xs font-mono text-slate-700 truncate mr-2">
                      {address}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="text-slate-500 hover:text-slate-800 transition p-1 hover:bg-slate-200 rounded-lg cursor-pointer"
                      title="Copy Address"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex flex-col gap-1.5">
                  <a
                    href={`https://arbiscan.io/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                  >
                    <span>View on Arbiscan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={disconnectWallet}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <span>Disconnect Wallet</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (hasInjected) {
              connectInjected();
            } else {
              setIsModalOpen(true);
            }
          }}
          disabled={isConnecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-500/20 transition duration-150 cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
        </button>
      )}

      {/* Wallet Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Connect Wallet</h3>
                  <p className="text-[11px] text-slate-400">Select your preferred EVM provider</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Injected Wallet (MetaMask / Rabby) */}
              <button
                onClick={connectInjected}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    🦊
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      Browser Wallet
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {hasInjected ? "MetaMask / Rabby Detected" : "Injected Web3 Provider"}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                  Connect &rarr;
                </span>
              </button>

              {/* Demo Trader Wallet */}
              <button
                onClick={connectDemoWallet}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 hover:border-blue-400 transition text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                        Demo Trader Wallet
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white">
                        Fast Test
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Arbitrum One (0x71C...498B)
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600">
                  Instant &rarr;
                </span>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-100">
              Non-custodial trades routed via Arbitrum Flash liquidity.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
