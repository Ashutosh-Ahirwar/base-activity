import { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  
  const name = (sp.name as string) || 'User';
  const tx = (sp.tx as string) || '0';
  const gas = (sp.gas as string) || '0';
  const streak = (sp.streak as string) || '0';

  // 1. DYNAMIC HOST RESOLUTION
  // This prioritizes a manual env var, falls back to Vercel's automatic URL, 
  // and finally defaults to localhost for local development.
  const host = process.env.NEXT_PUBLIC_HOST 
    ? process.env.NEXT_PUBLIC_HOST 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

  // 2. ENCODING PARAMETERS
  // Important to encode values to prevent URL breakage with special chars
  const imageUrl = `${host}/api/og?name=${encodeURIComponent(name)}&tx=${encodeURIComponent(tx)}&gas=${encodeURIComponent(gas)}&streak=${encodeURIComponent(streak)}`;

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
      "fc:frame:button:1": "View Stats",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${host}?basename=${name}`, 
    }
  };
}

export default function SharePage() {
  return (
    <div className="flex items-center justify-center h-screen bg-white text-gray-500">
      <p>Redirecting to stats...</p>
    </div>
  );
}