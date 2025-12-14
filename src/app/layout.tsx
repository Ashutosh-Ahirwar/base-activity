import './globals.css';
import type { Metadata } from 'next';

const APP_URL = "https://base-activity.vercel.app";

const embedMetadata = JSON.stringify({
  version: "next",
  imageUrl: `${APP_URL}/hero.png`,
  button: {
    title: "Check Stats",
    action: {
      type: "launch_frame",
      name: "Base Activity",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0052FF",
    },
  },
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Base Activity Tracker',
  description: 'Analyze your onchain activity, gas fees, and streaks on Base & Ethereum.',
  openGraph: {
    title: 'Base Activity Tracker',
    description: 'Analyze your onchain activity, gas fees, and streaks on Base & Ethereum.',
    url: APP_URL,
    siteName: 'Base Activity',
    images: [
      {
        url: `${APP_URL}/hero.png`,
        width: 1200,
        height: 630,
        alt: 'Base Activity Stats Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  other: {
    'base:app_id': '693e8094d19763ca26ddc2bb',
    "fc:frame": embedMetadata,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}