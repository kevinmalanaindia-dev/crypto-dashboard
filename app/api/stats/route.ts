import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [globalRes, fngRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/global', { next: { revalidate: 300 } }),
      fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } })
    ]);

    let globalData = null;
    let fngData = null;

    if (globalRes.ok) {
      const json = await globalRes.json();
      globalData = json.data;
    }

    if (fngRes.ok) {
      const json = await fngRes.json();
      fngData = json.data[0];
    }

    return NextResponse.json({
      marketCap: globalData?.total_market_cap?.usd || 0,
      marketCapChange: globalData?.market_cap_change_percentage_24h_usd || 0,
      volume: globalData?.total_volume?.usd || 0,
      btcDominance: globalData?.market_cap_percentage?.btc || 0,
      fngValue: fngData?.value || 50,
      fngClassification: fngData?.value_classification || "Neutral"
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
