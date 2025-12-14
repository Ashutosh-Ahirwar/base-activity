'use client';

import { useState, useEffect, useRef } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { fetchUserStats, getAddressFromBasename, type UserStats } from '@/lib/stats';
import { Loader2, Search, BarChart3, Wallet, Activity, Heart, Share2 } from 'lucide-react';
import clsx from 'clsx';
// UPDATED IMPORTS: Added 'toHex' which is required for the fix
import { createWalletClient, custom, parseEther, toHex } from 'viem'; 
import { base } from 'viem/chains';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  
  const hasPromptedBookmark = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("SDK Ready failed", e);
      }
    };
    init();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    const isRawAddress = /^0x[a-fA-F0-9]{40}$/.test(input.trim());
    if (isRawAddress) {
      setError('Please enter a valid Basename (e.g. jesse.base.eth), not a raw address.');
      return;
    }

    if (!hasPromptedBookmark.current) {
      try {
        const context = await sdk.context;
        if (context?.client && !context.client.added) {
          await sdk.actions.addMiniApp();
        }
      } catch (e) {
        console.error("Bookmark check failed", e);
      }
      hasPromptedBookmark.current = true;
    }

    setLoading(true);
    setError('');
    setStats(null);

    try {
      const address = await getAddressFromBasename(input);
      if (!address) {
        throw new Error("Could not resolve Basename. Make sure it is correct.");
      }
      const data = await fetchUserStats(address);
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Ensure the Basename is valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!stats) return;

    const host = window.location.origin;
    const timestamp = Date.now();
    
    const shareUrl = new URL(`${host}/share`);
    shareUrl.searchParams.set('name', input);
    shareUrl.searchParams.set('tx', stats.totalTransactions.toString());
    shareUrl.searchParams.set('gas', stats.totalGasPaid);
    shareUrl.searchParams.set('contracts', stats.contractsDeployed.toString());
    shareUrl.searchParams.set('t', timestamp.toString()); 

    try {
      await sdk.actions.composeCast({
        text: `Just checked the Base activity stats for ${input}!`,
        embeds: [shareUrl.toString()]
      });
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  // UPDATED: Exact logic from Base Builder Score project
  const handleDonate = async () => {
    const RECIPIENT = "0xa6DEe9FdE9E1203ad02228f00bF10235d9Ca3752";
    const AMOUNT_ETH = "0.00169"; 
    let success = false;

    // 1. Try Injected Wallet FIRST (Base App / MetaMask / Coinbase Wallet)
    // This is the native way for Base App and fixes the "failed to send" error.
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const walletClient = createWalletClient({
          chain: base,
          transport: custom((window as any).ethereum)
        });

        const [address] = await walletClient.requestAddresses();
        
        // Try to switch to Base chain first
        try {
          await walletClient.switchChain({ id: base.id });
        } catch (switchError) {
          console.log("Chain switch handled by wallet or ignored", switchError);
        }

        await walletClient.sendTransaction({
          account: address,
          to: RECIPIENT,
          value: parseEther(AMOUNT_ETH),
          chain: base
        });
        
        success = true;
      } catch (e: any) {
        console.error("Wallet donation failed", e);
        // If user explicitly rejected, stop here.
        if (e.code === 4001 || e.message?.toLowerCase().includes("reject")) {
            return;
        }
      }
    }

    // 2. Try Farcaster SDK (Fallback for Warpcast mobile)
    if (!success) {
      try {
        const context = await sdk.context;
        // Only attempt if we are in a Farcaster client
        if (context?.client) {
            const amountWei = parseEther(AMOUNT_ETH);
            const amountHex = toHex(amountWei); // FIX: Use Hex string for SDK

            await sdk.actions.sendToken({
              token: "eip155:8453/native", 
              recipientAddress: RECIPIENT,
              amount: amountHex 
            });
            success = true;
        }
      } catch (e) {
        console.warn("Farcaster SDK donate failed:", e);
      }
    }

    // 3. Final Fallback: Copy Address
    if (!success) {
       try {
         await navigator.clipboard.writeText(RECIPIENT);
         alert("Donation address copied to clipboard! (No active wallet found)");
       } catch (err) {
         alert("Please send 0.00169 ETH to: " + RECIPIENT);
       }
    }
  };

  return (
    <main className="min-h-screen bg-white p-4 font-sans text-gray-900 pb-20 relative">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 text-center">
            Base Activity
          </h1>
          
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="username.base.eth"
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </form>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Intro / Welcome Screen */}
        {!stats && !loading && (
          <div className="pt-8 space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Discover Onchain Stats</h2>
              <p className="text-gray-500 text-sm px-8">
                Enter any Basename to generate a detailed activity report.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 px-2">
              <FeatureItem 
                icon={<Activity className="w-6 h-6 text-blue-500" />}
                title="Track Streaks"
                desc="See daily activity streaks and active days."
              />
              <FeatureItem 
                icon={<Wallet className="w-6 h-6 text-purple-500" />}
                title="Transaction History"
                desc="Analyze swaps, bridges, and DeFi moves."
              />
              <FeatureItem 
                icon={<BarChart3 className="w-6 h-6 text-green-500" />}
                title="Gas Fees"
                desc="Calculate total fees paid on Base & ETH."
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              Share Stats
            </button>

            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                value={stats.totalTransactions} 
                label="Transactions on Ethereum & Base" 
                highlight 
              />
              <StatCard 
                value={stats.uniqueDaysActive} 
                label="Unique days active" 
              />
              <StatCard 
                value={stats.longestStreak} 
                label="Day longest streak" 
              />
              <StatCard 
                value={stats.currentStreak} 
                label="Day current streak" 
                valueColor={stats.currentStreak > 0 ? 'text-green-600' : 'text-gray-900'}
              />
              <StatCard 
                value={stats.activityPeriod} 
                label="Day activity period" 
              />
              <StatCard 
                value={stats.tokenSwaps} 
                label="Token swaps performed" 
                highlight 
              />
              <StatCard 
                value={stats.bridgeTransactions} 
                label="Bridge transactions" 
                highlight 
              />
              <StatCard 
                value={stats.defiTransactions} 
                label="Lend/borrow/stake transactions" 
                highlight 
              />
              <StatCard 
                value={stats.ensInteractions} 
                label="ENS interactions" 
                highlight 
              />
              <StatCard 
                value={stats.contractsDeployed} 
                label="Smart contracts deployed" 
                highlight 
              />
              <StatCard 
                value={stats.internalTransactions} 
                label="Internal transactions" 
                highlight 
              />
              <StatCard 
                value={stats.totalGasPaid} 
                label="Total Gas Fees (Base & ETH)" 
                highlight 
              />
            </div>
          </div>
        )}
      </div>

      {/* Donate Button - Fixed Bottom Left */}
      <button 
        onClick={handleDonate}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-medium transition-all shadow-sm border border-gray-200 backdrop-blur-sm active:scale-95"
      >
        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        <span>Donate</span>
      </button>

    </main>
  );
}

// Sub-components

function StatCard({ 
  value, 
  label, 
  highlight = false,
  valueColor 
}: { 
  value: number | string;
  label: string; 
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 hover:border-blue-200 transition-colors">
      <div className={clsx("text-3xl font-bold truncate", valueColor ? valueColor : "text-blue-600")}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm font-medium text-gray-500 leading-tight">
        {label}
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  )
}