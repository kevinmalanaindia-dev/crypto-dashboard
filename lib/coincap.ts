export interface Asset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

export interface CoinCapResponse {
  data: Asset[];
  timestamp: number;
}

export async function getTopAssets(limit = 50): Promise<Asset[]> {
  try {
    const res = await fetch(`https://api.coincap.io/v2/assets?limit=${limit}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds on server
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch assets: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching CoinCap assets:", error);
    return [];
  }
}

export function subscribeToPrices(assetIds: string[], onPriceUpdate: (prices: Record<string, string>) => void): WebSocket {
  const ids = assetIds.join(",");
  const ws = new WebSocket(`wss://ws.coincap.io/prices?assets=${ids}`);

  ws.onmessage = (event) => {
    try {
      const prices = JSON.parse(event.data);
      onPriceUpdate(prices);
    } catch (e) {
      console.error("Error parsing WebSocket message:", e);
    }
  };

  ws.onerror = (error) => {
    console.error("CoinCap WebSocket error:", error);
  };

  return ws;
}
