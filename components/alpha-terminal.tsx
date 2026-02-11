"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

type Opportunity = {
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
};

type WalletActivity = {
  walletName: string;
  tag: string;
  token: string;
  side: "buy" | "sell";
  sizeUsd: number;
  qualityScore: number;
  timestamp: number;
};

type MemeRadar = {
  key: string;
  symbol: string;
  chainId: string;
  tokenAddress: string;
  dexUrl: string;
  liquidityUsd: number;
  volume24h: number;
  momentumScore: number;
  riskFlags: string[];
};

type AlphaPayload = {
  generatedAt: number;
  opportunities: Opportunity[];
  walletFeed: WalletActivity[];
  memeRadar: MemeRadar[];
};

function ScorePill({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-green-100 text-green-700" : value >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`text-xs px-2 py-1 rounded-full font-semibold ${tone}`}>Score {value}</span>;
}

function shortAddress(addr: string, head = 6, tail = 4) {
  if (!addr) return "-";
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function AlphaTerminal() {
  const [data, setData] = useState<AlphaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/opportunities");
        const json = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const refreshed = useMemo(() => {
    if (!data?.generatedAt) return "-";
    return new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [data?.generatedAt]);

  const copyContract = async (key: string, contract: string) => {
    try {
      await navigator.clipboard.writeText(contract);
      setCopied(key);
      setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 1600);
    } catch {
      // no-op
    }
  };

  if (loading) {
    return <div className="bg-white rounded-xl border border-slate-100 p-4 text-sm text-slate-500">Loading alpha feeds…</div>;
  }

  if (!data) {
    return <div className="bg-white rounded-xl border border-slate-100 p-4 text-sm text-red-500">Alpha feed unavailable.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Opportunity Feed</h3>
          <p className="text-xs text-slate-500">Ranked by wallet signal, launch momentum, liquidity, and risk deductions.</p>
        </div>
        <p className="text-xs text-slate-500">Last refresh {refreshed}</p>
      </div>

      <details className="bg-white rounded-xl border border-slate-100 p-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-800">How Smart / Momentum / Liq / Risk are calculated</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p><span className="font-semibold text-slate-800">Smart:</span> Average quality score of matched tracked wallets (clamped to 40–95).</p>
          <p><span className="font-semibold text-slate-800">Momentum:</span> Based on 24h volume, 24h transaction count, and positive price change. Higher activity + stronger move = higher score.</p>
          <p><span className="font-semibold text-slate-800">Liq:</span> Liquidity quality = (liquidity ÷ 250,000) × 100, clamped to 0–100.</p>
          <p><span className="font-semibold text-slate-800">Risk:</span> Deductions from flags (low liquidity, very new pair, one-sided flow, extreme volatility). More flags = higher penalty.</p>
          <p className="text-[11px] text-slate-500">Final score weight: 35% Smart + 30% Momentum + 20% Liq − 15% Risk.</p>
        </div>
      </details>

      <div className="grid grid-cols-1 gap-3">
        {data.opportunities.map((o) => (
          <div key={o.key} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {o.symbol} <span className="text-xs text-slate-500 uppercase">{o.chainId}</span>
                </p>
                <p className="text-xs text-slate-500">Wallets: {o.walletsInvolved.length ? o.walletsInvolved.join(", ") : "No direct hit"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-mono text-slate-500">Contract: {shortAddress(o.tokenAddress, 8, 6)}</span>
                  <button
                    onClick={() => copyContract(o.key, o.tokenAddress)}
                    className="px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {copied === o.key ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={o.dexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Verify <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <ScorePill value={o.score} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2">Smart {o.scoreBreakdown.smartWallet}</div>
              <div className="bg-slate-50 rounded-lg p-2">Momentum {o.scoreBreakdown.launchMomentum}</div>
              <div className="bg-slate-50 rounded-lg p-2">Liq {o.scoreBreakdown.liquidityQuality}</div>
              <div className="bg-slate-50 rounded-lg p-2">Risk -{o.scoreBreakdown.riskDeduction}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {o.riskFlags.length === 0 ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">no_major_flags</span>
              ) : (
                o.riskFlags.map((r) => (
                  <span key={r} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">{r}</span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Good Wallet Tracker</h4>
          <div className="space-y-2">
            {data.walletFeed.slice(0, 6).map((w, i) => (
              <div key={`${w.walletName}-${i}`} className="text-xs sm:text-sm border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{w.walletName} <span className="text-[11px] uppercase text-slate-500">{w.tag}</span></p>
                  <p className="text-slate-500">{w.side.toUpperCase()} {w.token}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">${formatCompactNumber(w.sizeUsd)}</p>
                  <p className="text-slate-500">Q{w.qualityScore}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Meme Launch Radar</h4>
          <div className="space-y-2">
            {data.memeRadar.slice(0, 6).map((m) => (
              <div key={m.key} className="text-xs sm:text-sm border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{m.symbol} <span className="text-[11px] uppercase text-slate-500">{m.chainId}</span></p>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Momo {m.momentumScore}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-mono text-slate-500">Contract: {shortAddress(m.tokenAddress, 8, 6)}</span>
                  <a
                    href={m.dexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Verify <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-slate-500 mt-1">Liq ${formatCompactNumber(m.liquidityUsd)} · Vol ${formatCompactNumber(m.volume24h)}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(m.riskFlags.length ? m.riskFlags : ["no_major_flags"]).slice(0, 3).map((flag) => (
                    <span key={flag} className={`text-[11px] px-2 py-1 rounded-full ${flag === "no_major_flags" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{flag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
