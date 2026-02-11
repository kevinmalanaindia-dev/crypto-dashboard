import { NextResponse } from "next/server";

type WalletTag = "sniper" | "swing" | "momentum" | "smart-money";

interface WalletRegistryItem {
  id: string;
  name: string;
  tag: WalletTag;
  qualityScore: number;
  winRate: number;
}

interface WalletActivity {
  walletId: string;
  walletName: string;
  tag: WalletTag;
  token: string;
  side: "buy" | "sell";
  sizeUsd: number;
  qualityScore: number;
  timestamp: number;
}

interface MemeRadarItem {
  key: string;
  symbol: string;
  name: string;
  chainId: string;
  tokenAddress: string;
  dexUrl: string;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  tx24h: number;
  pairAgeHours: number;
  momentumScore: number;
  riskFlags: string[];
}

interface Opportunity {
  key: string;
  symbol: string;
  chainId: string;
  tokenAddress: string;
  dexUrl: string;
  score: number;
  scoreBreakdown: {
    smartWallet: number;
    launchMomentum: number;
    liquidityQuality: number;
    riskDeduction: number;
  };
  riskFlags: string[];
  walletsInvolved: string[];
}

const WALLET_REGISTRY: WalletRegistryItem[] = [
  { id: "w1", name: "ApexFlow", tag: "smart-money", qualityScore: 86, winRate: 62 },
  { id: "w2", name: "SolSniper-9", tag: "sniper", qualityScore: 79, winRate: 58 },
  { id: "w3", name: "MomoRotate", tag: "momentum", qualityScore: 74, winRate: 55 },
  { id: "w4", name: "BlueWhale-R", tag: "swing", qualityScore: 83, winRate: 60 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreMeme(item: MemeRadarItem) {
  const liquidityQuality = clamp((item.liquidityUsd / 250000) * 100, 0, 100);
  const launchMomentum = clamp((item.volume24h / 300000) * 45 + item.tx24h / 40 + Math.max(item.priceChange24h, 0) * 0.9, 0, 100);
  const riskDeduction = clamp(item.riskFlags.length * 12 + (item.pairAgeHours < 2 ? 8 : 0), 0, 65);
  const smartWallet = clamp(35 + item.momentumScore * 0.45, 0, 100);

  const weighted =
    smartWallet * 0.35 +
    launchMomentum * 0.3 +
    liquidityQuality * 0.2 -
    riskDeduction * 0.15;

  return {
    score: clamp(Math.round(weighted), 0, 100),
    scoreBreakdown: {
      smartWallet: Math.round(smartWallet),
      launchMomentum: Math.round(launchMomentum),
      liquidityQuality: Math.round(liquidityQuality),
      riskDeduction: Math.round(riskDeduction),
    },
  };
}

async function fetchDexRadar(): Promise<MemeRadarItem[]> {
  try {
    const boostsRes = await fetch("https://api.dexscreener.com/token-boosts/latest/v1", {
      next: { revalidate: 30 },
    });

    if (!boostsRes.ok) return [];

    const boosts = (await boostsRes.json()) as Array<{ chainId: string; tokenAddress: string }>;
    const unique = Array.from(new Map(boosts.map((b) => [`${b.chainId}:${b.tokenAddress}`, b])).values()).slice(0, 8);

    const results = await Promise.all(
      unique.map(async (row) => {
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${row.tokenAddress}`, {
            next: { revalidate: 30 },
          });
          if (!res.ok) return null;

          const json = (await res.json()) as {
            pairs?: Array<{
              chainId?: string;
              pairCreatedAt?: number;
              liquidity?: { usd?: number };
              volume?: { h24?: number };
              priceChange?: { h24?: number };
              txns?: { h24?: { buys?: number; sells?: number } };
              baseToken?: { symbol?: string; name?: string };
            }>;
          };

          const pairs = json?.pairs || [];
          const pair = pairs.find((p) => String(p.chainId || "") === row.chainId) || pairs[0];
          if (!pair) return null;

          const liquidityUsd = Number(pair?.liquidity?.usd || 0);
          const volume24h = Number(pair?.volume?.h24 || 0);
          const priceChange24h = Number(pair?.priceChange?.h24 || 0);
          const buys = Number(pair?.txns?.h24?.buys || 0);
          const sells = Number(pair?.txns?.h24?.sells || 0);
          const tx24h = buys + sells;
          const ageHours = pair?.pairCreatedAt ? (Date.now() - Number(pair.pairCreatedAt)) / 3600000 : 0;

          const riskFlags: string[] = [];
          if (liquidityUsd < 50000) riskFlags.push("low_liquidity");
          if (ageHours < 3) riskFlags.push("very_new_pair");
          if (tx24h > 0) {
            const ratio = buys / Math.max(sells, 1);
            if (ratio > 4 || ratio < 0.25) riskFlags.push("one_sided_flow");
          }
          if (Math.abs(priceChange24h) > 45) riskFlags.push("extreme_volatility");

          const momentumScore = clamp(
            (volume24h / 200000) * 40 + (tx24h / 300) * 30 + Math.max(priceChange24h, 0) * 1.2,
            0,
            100,
          );

          return {
            key: `${row.chainId}:${row.tokenAddress.toLowerCase()}`,
            symbol: pair.baseToken?.symbol || "UNK",
            name: pair.baseToken?.name || "Unknown",
            chainId: row.chainId,
            tokenAddress: row.tokenAddress,
            dexUrl: `https://dexscreener.com/${row.chainId}/${row.tokenAddress}`,
            liquidityUsd,
            volume24h,
            priceChange24h,
            tx24h,
            pairAgeHours: ageHours,
            momentumScore: Math.round(momentumScore),
            riskFlags,
          } as MemeRadarItem;
        } catch {
          return null;
        }
      }),
    );

    return results.filter(Boolean).slice(0, 10) as MemeRadarItem[];
  } catch {
    return [];
  }
}

function buildWalletFeed(meme: MemeRadarItem[]): WalletActivity[] {
  const base = meme.slice(0, 5);
  const now = Date.now();
  const activities: WalletActivity[] = [];

  base.forEach((token, i) => {
    const wallet = WALLET_REGISTRY[i % WALLET_REGISTRY.length];
    const side: "buy" | "sell" = token.priceChange24h >= 0 ? "buy" : "sell";
    activities.push({
      walletId: wallet.id,
      walletName: wallet.name,
      tag: wallet.tag,
      token: token.symbol,
      side,
      sizeUsd: Math.round(Math.max(token.liquidityUsd * 0.04, 12000) + i * 2200),
      qualityScore: wallet.qualityScore,
      timestamp: now - i * 6 * 60 * 1000,
    });
  });

  return activities;
}

function buildOpportunities(meme: MemeRadarItem[], walletFeed: WalletActivity[]): Opportunity[] {
  const walletMap = new Map<string, WalletActivity[]>();
  walletFeed.forEach((w) => {
    const arr = walletMap.get(w.token) || [];
    arr.push(w);
    walletMap.set(w.token, arr);
  });

  const dedupe = new Map<string, Opportunity>();

  meme.forEach((item) => {
    const scored = scoreMeme(item);
    const wallets = walletMap.get(item.symbol) || [];
    const walletBoost = clamp(wallets.reduce((acc, w) => acc + w.qualityScore, 0) / Math.max(wallets.length, 1), 40, 95);
    const finalScore = clamp(Math.round(scored.score * 0.7 + walletBoost * 0.3), 0, 100);

    const opp: Opportunity = {
      key: item.key,
      symbol: item.symbol,
      chainId: item.chainId,
      tokenAddress: item.tokenAddress,
      dexUrl: item.dexUrl,
      score: finalScore,
      scoreBreakdown: {
        ...scored.scoreBreakdown,
        smartWallet: Math.round(walletBoost),
      },
      riskFlags: item.riskFlags,
      walletsInvolved: wallets.map((w) => w.walletName),
    };

    // Deduplicate by chain + contract (NOT symbol), to avoid same-ticker token collisions.
    const existing = dedupe.get(opp.key);
    if (!existing || opp.score > existing.score) dedupe.set(opp.key, opp);
  });

  return Array.from(dedupe.values()).sort((a, b) => b.score - a.score).slice(0, 8);
}

export async function GET() {
  const memeRadar = await fetchDexRadar();
  const walletFeed = buildWalletFeed(memeRadar);
  const opportunities = buildOpportunities(memeRadar, walletFeed);

  return NextResponse.json({
    generatedAt: Date.now(),
    opportunities,
    walletFeed,
    memeRadar,
    alerts: opportunities
      .filter((o) => o.score >= 70)
      .map((o) => ({ key: `${o.key}:high-score`, type: "high_score", symbol: o.symbol, score: o.score })),
  });
}
