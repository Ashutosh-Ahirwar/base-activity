'use server';

import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { differenceInDays, fromUnixTime, subDays, startOfDay } from 'date-fns';

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

// ROBUST FETCH: Throws error if data cannot be retrieved after all retries
async function fetchWithRetry(url: string, retries = 5, initialDelay = 1000): Promise<any> {
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
  // A raw address is 0x followed by exactly 40 hex characters.
  // We reject this to enforce "Basename only" input.
  // Note: Basenames starting with 0x (like 0xjohn.base.eth) will PASS this check 
  // because they are longer or contain non-hex characters (dots).
  const isRawAddress = /^0x[a-f0-9]{40}$/.test(name);
  if (isRawAddress) {
    return null; 
  }
  
  // 2. Handle Basename logic
  // If it doesn't have a dot (e.g. "jesse"), append .base.eth
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

  const txDates = successTxs
    .map(tx => startOfDay(fromUnixTime(parseInt(tx.timeStamp))).getTime())
    .sort((a, b) => a - b);
  const uniqueDates = Array.from(new Set(txDates));
  
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { tempStreak = 1; continue; }
    const prev = uniqueDates[i - 1];
    const curr = uniqueDates[i];
    if (differenceInDays(curr, prev) === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const lastActive = uniqueDates[uniqueDates.length - 1];
  const today = startOfDay(new Date()).getTime();
  const yesterday = startOfDay(subDays(new Date(), 1)).getTime();

  if (lastActive === today || lastActive === yesterday) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  const firstTx = uniqueDates[0];
  const activityPeriod = firstTx ? differenceInDays(Date.now(), firstTx) : 0;

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