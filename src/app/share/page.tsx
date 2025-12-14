import { Metadata } from 'next';

// FORCE DYNAMIC to prevent 400 errors
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  
  const name = (sp.name as string) || 'User';
  const tx = (sp.tx as string) || '0';
  const gas = (sp.gas as string) || '0';
  // Read 'contracts' instead of 'streak'
  const contracts = (sp.contracts as string) || '0';
  const t = (sp.t as string) || Date.now().toString();

  // Dynamic Host
  const host = process.env.NEXT_PUBLIC_HOST 
    ? process.env.NEXT_PUBLIC_HOST 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

  // Construct Image URL with 'contracts' param
  const imageUrl = `${host}/api/og?name=${encodeURIComponent(name)}&tx=${encodeURIComponent(tx)}&gas=${encodeURIComponent(gas)}&contracts=${encodeURIComponent(contracts)}&t=${t}`;

  return {
    title: `${name}'s Base Stats`,
    description: `Check out ${name}'s onchain activity on Base!`,
    openGraph: {
      title: `${name}'s Base Stats`,
      description: `Check out ${name}'s onchain activity on Base!`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${name}'s Base Stats`,
        }
      ],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:button:1": "View Stats",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${host}?basename=${name}`, 
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