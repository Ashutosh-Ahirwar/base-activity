import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract params
    const basename = searchParams.get('name') || 'User';
    const tx = searchParams.get('tx') || '0';
    const gas = searchParams.get('gas') || '0';
    const streak = searchParams.get('streak') || '0';
    const active = searchParams.get('active') || '0';

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: 24,
              padding: '40px 60px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              width: '85%',
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
                fontWeight: 'bold'
              }}>
                {basename[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#111' }}>
                {basename}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
              {/* Stat 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{tx}</span>
                <span style={{ fontSize: 24, color: '#666' }}>Transactions</span>
              </div>
              
              {/* Divider */}
              <div style={{ width: 2, height: 80, backgroundColor: '#eee' }} />

              {/* Stat 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{gas}</span>
                <span style={{ fontSize: 24, color: '#666' }}>ETH Fees</span>
              </div>

              {/* Divider */}
              <div style={{ width: 2, height: 80, backgroundColor: '#eee' }} />

              {/* Stat 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#0052FF' }}>{streak}</span>
                <span style={{ fontSize: 24, color: '#666' }}>Day Streak</span>
              </div>
            </div>

            <div style={{ marginTop: 40, fontSize: 20, color: '#999' }}>
              Base Activity Stats
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