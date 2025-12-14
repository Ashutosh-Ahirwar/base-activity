import { Metadata } from 'next';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams; // Next.js 15+ await searchParams
  
  const name = (sp.name as string) || 'User';
  const tx = (sp.tx as string) || '0';
  const gas = (sp.gas as string) || '0';
  const streak = (sp.streak as string) || '0';

  // Construct the absolute URL to your image generator
  // Ensure NEXT_PUBLIC_HOST is set in .env or fallback to localhost for dev
  const host = process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000';
  const imageUrl = `${host}/api/og?name=${name}&tx=${tx}&gas=${gas}&streak=${streak}`;

  return {
    title: `${name}'s Base Stats`,
    description: `Check out ${name}'s onchain activity on Base!`,
    openGraph: {
      title: `${name}'s Base Stats`,
      images: [imageUrl],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:button:1": "View Stats",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${host}?basename=${name}`, // Deep link back to main app
    }
  };
}

export default function SharePage() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p>Redirecting to stats...</p>
    </div>
  );
}