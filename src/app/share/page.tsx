import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  
  const name = (sp.name as string) || 'User';
  const tx = (sp.tx as string) || '0';
  const gas = (sp.gas as string) || '0';
  const contracts = (sp.contracts as string) || '0';
  const t = (sp.t as string) || Date.now().toString();

  // 1. HOST RESOLUTION (Force HTTPS)
  let rawHost = process.env.NEXT_PUBLIC_HOST 
    ? process.env.NEXT_PUBLIC_HOST 
    : process.env.VERCEL_URL 
      ? process.env.VERCEL_URL 
      : 'http://localhost:3000';

  let host = rawHost.toString();
  if (!host.startsWith('http')) {
    host = `https://${host}`;
  }
  host = host.replace(/\/$/, '');

  // 2. CONSTRUCT URLS
  const imageUrl = `${host}/api/og?name=${encodeURIComponent(name)}&tx=${encodeURIComponent(tx)}&gas=${encodeURIComponent(gas)}&contracts=${encodeURIComponent(contracts)}&t=${t}`;
  const appUrl = host; // The root URL of your app

  // 3. CREATE FRAME METADATA (JSON Format - Frames v2)
  const frameMetadata = JSON.stringify({
    version: "next",
    imageUrl: imageUrl,
    button: {
      title: "Check Stats",
      action: {
        type: "launch_frame",
        name: "Base Activity",
        url: appUrl,
        splashImageUrl: `${host}/splash.png`,
        splashBackgroundColor: "#0052FF" // Matches your blue theme
      }
    }
  });

  return {
    title: `${name}'s Base Stats`,
    description: `Check out ${name}'s onchain activity on Base!`,
    openGraph: {
      title: `${name}'s Base Stats`,
      description: `Check out ${name}'s onchain activity on Base!`,
      images: [imageUrl],
    },
    other: {
      "fc:frame": frameMetadata
    }
  };
}

export default function SharePage() {
  return (
    <div className="flex items-center justify-center h-screen bg-white text-gray-500 font-sans">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Base Activity Stats</h1>
        <p>Redirecting to full stats...</p>
      </div>
    </div>
  );
}