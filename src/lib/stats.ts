'use server';

import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

// Removed date-fns to ensure strict UTC handling without local timezone interference

const publicClient = createPublicClient({
  chain: mainnet, 
  transport: http()
});

interface TxLog {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  input: string;
  functionName?: string;
  isError: string;
  contractAddress?: string;
  gasUsed: string;
  gasPrice: string;
  l1FeesPaid?: string;
}

export interface UserStats {
  totalTransactions: number;
  uniqueDaysActive: number;
  longestStreak: number;
  currentStreak: number;
  activityPeriod: number;
  tokenSwaps: number;
  bridgeTransactions: number;
  defiTransactions: number;
  ensInteractions: number;
  contractsDeployed: number;
  internalTransactions: number;
  totalGasPaid: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Normalize timestamp to absolute UTC Midnight (00:00:00 UTC)
// This is critical for consistent streaks across all timezones.
function getUtcMidnight(timestampMs: number): number {
  const date = new Date(timestampMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// ROBUST FETCH: Throws error if data cannot be retrieved after all retries
// UPDATED: Now retries 8 times
async function fetchWithRetry(url: string, retries = 8, initialDelay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      // CACHE DISABLED as requested
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`HTTP Status ${res.status}`);
        }
        return null;
      }

      const wrapper = await res.json();
      const data = wrapper.data; 

      if (!data) {
        if (wrapper.status && wrapper.message) return wrapper; 
        throw new Error("Invalid API response structure");
      }

      if (data.status === "0" && data.message === "NOTOK") {
        const resultStr = typeof data.result === 'string' ? data.result.toLowerCase() : '';
        
        if (resultStr.includes("no transactions found")) {
          return { result: [] }; 
        }
        
        throw new Error(`API Error: ${data.result}`);
      }

      return data;

    } catch (error) {
      const waitTime = initialDelay * Math.pow(2, i);
      console.warn(`Attempt ${i + 1}/${retries} failed for ${url}. Retrying in ${waitTime}ms...`);
      
      if (i === retries - 1) {
        throw new Error(`Failed to fetch data from ${url} after ${retries} attempts: ${(error as Error).message}`);
      }
      
      await sleep(waitTime);
    }
  }
}

export async function getAddressFromBasename(input: string): Promise<string | null> {
  let name = input.trim().toLowerCase();

  // 1. REJECT STRICT RAW ADDRESSES
  const isRawAddress = /^0x[a-f0-9]{40}$/.test(name);
  if (isRawAddress) {
    return null; 
  }
  
  // 2. Handle Basename logic
  if (!name.includes('.')) {
    name += '.base.eth';
  }

  try {
     const address = await publicClient.getEnsAddress({ name });
     return address;
  } catch (e) {
     console.error("Resolution error", e);
     return null;
  }
}

export async function fetchUserStats(address: string): Promise<UserStats> {
  const baseApiUrl = process.env.BASE_API_URL;
  const ethApiUrl = process.env.ETH_API_URL;
  const internalApiUrl = process.env.BASE_INTERNAL_API_URL;

  if (!baseApiUrl || !ethApiUrl || !internalApiUrl) {
    throw new Error("API URLs are not defined in environment variables.");
  }

  let allMainnetTxs: TxLog[] = [];
  let internalTxs: TxLog[] = [];

  // 1. Fetch BASE Mainnet
  const baseData = await fetchWithRetry(`${baseApiUrl}${address}`);
  if (baseData?.result && Array.isArray(baseData.result)) {
    allMainnetTxs = [...allMainnetTxs, ...baseData.result];
  }

  await sleep(200);

  // 2. Fetch ETH Mainnet
  const ethData = await fetchWithRetry(`${ethApiUrl}${address}`);
  if (ethData?.result && Array.isArray(ethData.result)) {
    allMainnetTxs = [...allMainnetTxs, ...ethData.result];
  }

  await sleep(200);

  // 3. Fetch Internal Transactions
  const internalData = await fetchWithRetry(`${internalApiUrl}${address}`);
  if (internalData?.result && Array.isArray(internalData.result)) {
    internalTxs = [...internalData.result];
  }

  const successTxs = allMainnetTxs.filter(tx => tx.isError === "0");

  // --- UPDATED DATE LOGIC (UTC) ---
  // Convert all timestamps to UTC Midnight milliseconds
  const txDates = successTxs
    .map(tx => getUtcMidnight(parseInt(tx.timeStamp) * 1000))
    .sort((a, b) => a - b);
    
  const uniqueDates = Array.from(new Set(txDates));
  
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { tempStreak = 1; continue; }
    const prev = uniqueDates[i - 1];
    const curr = uniqueDates[i];
    
    // Calculate difference in exact days (rounding handles leap seconds/minor adjustments)
    const diff = Math.round((curr - prev) / ONE_DAY_MS);

    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // UTC-Safe "Today" and "Yesterday"
  const lastActive = uniqueDates[uniqueDates.length - 1];
  const todayUtc = getUtcMidnight(Date.now());
  const yesterdayUtc = todayUtc - ONE_DAY_MS;

  // Check if active today OR yesterday in UTC
  if (lastActive === todayUtc || lastActive === yesterdayUtc) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  const firstTx = uniqueDates[0];
  const activityPeriod = firstTx ? Math.floor((todayUtc - firstTx) / ONE_DAY_MS) : 0;

  let swaps = 0;
  let bridges = 0;
  let defi = 0;
  let ens = 0;
  let deployed = 0;
  let totalGasWei = 0n;

  successTxs.forEach(tx => {
    const fn = (tx.functionName || "").toLowerCase();
    
    if (!tx.to || tx.to === "" || (tx.contractAddress && tx.contractAddress !== "")) deployed++;
    if (fn.includes('swap') || fn.includes('exactoutput') || fn.includes('exactinput') || fn.includes('multicall')) swaps++;
    if (fn.includes('bridge') || fn.includes('deposit') || fn.includes('withdraw')) bridges++;
    if (fn.includes('stake') || fn.includes('supply') || fn.includes('borrow') || fn.includes('repay') || fn.includes('mint') || fn.includes('claim')) defi++;
    if (fn.includes('commit') || fn.includes('register') || fn.includes('setname') || fn.includes('settext')) ens++;

    if (tx.gasUsed && tx.gasPrice) {
      const executionFee = BigInt(tx.gasUsed) * BigInt(tx.gasPrice);
      totalGasWei += executionFee;
      if (tx.l1FeesPaid) {
        totalGasWei += BigInt(tx.l1FeesPaid);
      }
    }
  });

  const totalGasEth = Number(formatEther(totalGasWei)).toFixed(4);

  return {
    totalTransactions: successTxs.length,
    uniqueDaysActive: uniqueDates.length,
    longestStreak,
    currentStreak,
    activityPeriod,
    tokenSwaps: swaps,
    bridgeTransactions: bridges,
    defiTransactions: defi,
    ensInteractions: ens,
    contractsDeployed: deployed,
    internalTransactions: internalTxs.length,
    totalGasPaid: totalGasEth
  };
}