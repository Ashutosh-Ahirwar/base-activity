import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract params
    const rawName = searchParams.get('name') || 'User';
    const tx = searchParams.get('tx') || '0';
    const gas = searchParams.get('gas') || '0';
    const contracts = searchParams.get('contracts') || '0'; 
    const _t = searchParams.get('t'); 

    // Basename Logic
    let displayName = rawName.trim();
    if (!displayName.toLowerCase().endsWith('.base.eth') && !displayName.startsWith('0x')) {
      displayName += '.base.eth';
    }

    // PFP Logic: Use reliable URL directly with encoding
    // Adding .png ensures Satori treats it as an image resource correctly
    const pfpUrl = `https://avatar.vercel.sh/${encodeURIComponent(rawName)}.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0052FF', // Base Blue
            backgroundImage: 'linear-gradient(to bottom right, #0052FF, #0033CC)',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background Circles (Subtle Texture) */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: '-50px',
              width: '300px',
              height: '300px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              display: 'flex',
            }}
          />
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white', // White Card Background
              borderRadius: 24,
              padding: '40px 60px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              width: '85%',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: 30, 
                backgroundColor: '#0052FF',
                marginRight: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 32,
                fontWeight: 'bold',
                overflow: 'hidden'
              }}>
                {/* DIRECT IMG TAG - Fixes timeout/buffer issues */}
                <img 
                  src={pfpUrl} 
                  width="60" 
                  height="60" 
                  style={{ objectFit: 'cover' }} 
                  alt={displayName}
                />
              </div>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#111' }}>
                {displayName}
              </span>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
              
              {/* Stat 1: Transactions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{tx}</span>
                <span style={{ fontSize: 24, color: '#666' }}>Transactions</span>
              </div>
              
              <div style={{ width: 2, height: 80, backgroundColor: '#eee' }} />

              {/* Stat 2: Gas Paid */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{gas}</span>
                <span style={{ fontSize: 24, color: '#666' }}>Gas Paid</span>
              </div>

              <div style={{ width: 2, height: 80, backgroundColor: '#eee' }} />

              {/* Stat 3: Contracts Deployed */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{contracts}</span>
                <span style={{ fontSize: 24, color: '#666' }}>Contracts Deployed</span>
              </div>
            </div>

            {/* Footer Text */}
            <div style={{ marginTop: 30, fontSize: 20, color: '#999', fontStyle: 'italic' }}>
              + swaps, bridges, and much more...
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error("OG Generation Error:", e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}