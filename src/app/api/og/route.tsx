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
    const contracts = searchParams.get('contracts') || '0'; // Changed from 'streak'
    
    // We read 't' to ensure the URL is unique (cache busting)
    const _t = searchParams.get('t'); 

    // Basename Logic: Ensure it ends with .base.eth
    let displayName = rawName.trim();
    if (!displayName.toLowerCase().endsWith('.base.eth')) {
      displayName += '.base.eth';
    }

    // PFP Logic
    const pfpUrl = `https://avatar.vercel.sh/${rawName}`;
    let pfpSrc = null;

    try {
      const res = await fetch(pfpUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        // @ts-ignore
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = res.headers.get('content-type') || 'image/png';
        pfpSrc = `data:${contentType};base64,${base64}`;
      }
    } catch (e) {
      console.warn("PFP fetch error:", e);
    }

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
            backgroundColor: '#0052FF',
            backgroundImage: 'linear-gradient(to bottom right, #0052FF, #0033CC)',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Circles */}
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
              zIndex: 10,
              width: '90%',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
               {/* Title */}
               <div style={{ fontSize: 32, textTransform: 'uppercase', letterSpacing: '4px', color: '#bfdbfe' }}>
                  Base Activity Stats
               </div>
            </div>

            {/* Stats Card */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-around',
              background: 'rgba(255, 255, 255, 0.1)', 
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '40px',
              padding: '30px 40px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              width: '100%',
              gap: '20px'
            }}>
              {/* Stat 1: Transactions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <span style={{ fontSize: 56, fontWeight: 900, color: 'white' }}>{tx}</span>
                <span style={{ fontSize: 20, color: '#bfdbfe', marginTop: 5, textAlign: 'center' }}>Transactions</span>
              </div>
              
              <div style={{ width: 2, height: 70, background: 'rgba(255,255,255,0.2)' }} />

              {/* Stat 2: Gas Paid */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <span style={{ fontSize: 56, fontWeight: 900, color: 'white' }}>{gas}</span>
                <span style={{ fontSize: 20, color: '#bfdbfe', marginTop: 5, textAlign: 'center' }}>Gas Paid</span>
              </div>

              <div style={{ width: 2, height: 70, background: 'rgba(255,255,255,0.2)' }} />

              {/* Stat 3: Contracts Deployed */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <span style={{ fontSize: 56, fontWeight: 900, color: 'white' }}>{contracts}</span>
                <span style={{ fontSize: 20, color: '#bfdbfe', marginTop: 5, textAlign: 'center' }}>Contracts Deployed</span>
              </div>
            </div>

            {/* "And More" Indicator */}
            <div style={{ marginTop: 15, color: '#bfdbfe', fontSize: 18, fontStyle: 'italic', opacity: 0.8 }}>
              + swaps, bridges, and much more...
            </div>

            {/* Footer Profile */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
              {pfpSrc && (
                <img 
                  src={pfpSrc}
                  width="50" 
                  height="50" 
                  style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', marginRight: 15, objectFit: 'cover' }} 
                />
              )}
              <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: 'white' }}>
                {displayName}
              </div>
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
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}