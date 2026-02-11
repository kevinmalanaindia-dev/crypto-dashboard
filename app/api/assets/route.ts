import { NextResponse } from 'next/server';

export async function GET() {
  // Attempt 1: CoinGecko (Vercel-friendly)
  try {
    const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (cgRes.ok) {
      const data = await cgRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((coin: any) => ({
        id: coin.id,
        rank: String(coin.market_cap_rank),
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        supply: String(coin.circulating_supply),
        maxSupply: coin.max_supply ? String(coin.max_supply) : null,
        marketCapUsd: String(coin.market_cap),
        volumeUsd24Hr: String(coin.total_volume),
        priceUsd: String(coin.current_price),
        changePercent24Hr: String(coin.price_change_percentage_24h),
        vwap24Hr: String(coin.current_price)
      }));
      return NextResponse.json({ data: mapped });
    }
    console.warn("CoinGecko failed:", cgRes.status);
  } catch (e) {
    console.warn("CoinGecko error:", e);
  }

  // Attempt 2: CoinCap (Fallback)
  try {
    const ccRes = await fetch('https://api.coincap.io/v2/assets?limit=50', {
      headers: { 'Accept-Encoding': 'gzip' },
      next: { revalidate: 60 }
    });
    
    if (ccRes.ok) {
      const data = await ccRes.json();
      return NextResponse.json(data);
    }
    throw new Error(`CoinCap failed: ${ccRes.status}`);
  } catch (error) {
    console.error("All APIs failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
