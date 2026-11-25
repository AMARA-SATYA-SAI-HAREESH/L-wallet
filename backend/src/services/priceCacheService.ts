// backend/src/services/priceCacheService.ts
import axios from 'axios';
import { Schema, model, Document } from 'mongoose';
import logger from '../utils/logger';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PRICE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes (~8,640 req/month)

export type CoinSymbol = 'BNB' | 'USDT' | 'USDC';
export type ChartDays = '1' | '7' | '30' | '365';

const COINGECKO_IDS: Record<CoinSymbol, string> = {
  BNB: 'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
};

export interface CoinPriceData {
  usd: number;
  usd_24h_change: number;
}

export type LivePricesMap = Record<CoinSymbol, CoinPriceData>;

export interface ChartPoint {
  timestamp: number;
  price: number;
}

interface IPriceSnapshot extends Document {
  key: string;
  prices: LivePricesMap;
  updatedAt: Date;
}

const PriceSnapshotSchema = new Schema<IPriceSnapshot>(
  {
    key: { type: String, required: true, unique: true },
    prices: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

const PriceSnapshot = model<IPriceSnapshot>('PriceSnapshot', PriceSnapshotSchema);

// In-memory caches
let cachedPrices: LivePricesMap | null = null;
let lastPriceFetch = 0;

interface ChartCacheEntry {
  points: ChartPoint[];
  expiresAt: number;
}
const chartCache = new Map<string, ChartCacheEntry>();

function getHeaders() {
  const apiKey = process.env.COINGECKO_API_KEY;
  return apiKey ? { 'x-cg-demo-api-key': apiKey } : {};
}

export async function refreshLivePrices(): Promise<LivePricesMap> {
  try {
    const res = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: 'binancecoin,tether,usd-coin',
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
      headers: getHeaders(),
      timeout: 10000,
    });

    const d = res.data;
    const prices: LivePricesMap = {
      BNB: {
        usd: d.binancecoin?.usd ?? 0,
        usd_24h_change: d.binancecoin?.usd_24h_change ?? 0,
      },
      USDT: {
        usd: d.tether?.usd ?? 1,
        usd_24h_change: d.tether?.usd_24h_change ?? 0,
      },
      USDC: {
        usd: d['usd-coin']?.usd ?? 1,
        usd_24h_change: d['usd-coin']?.usd_24h_change ?? 0,
      },
    };

    cachedPrices = prices;
    lastPriceFetch = Date.now();

    // Persist latest snapshot in MongoDB for cold-start resilience
    await PriceSnapshot.findOneAndUpdate(
      { key: 'latest' },
      { prices },
      { upsert: true, new: true },
    );

    logger.info('CoinGecko live prices refreshed');
    return prices;
  } catch (err: any) {
    logger.warn('Failed to refresh CoinGecko prices', { message: err.message });
    if (cachedPrices) return cachedPrices;
    throw err;
  }
}

export async function getCachedPrices(): Promise<{
  prices: LivePricesMap;
  updatedAt: number;
}> {
  if (cachedPrices) {
    return { prices: cachedPrices, updatedAt: lastPriceFetch };
  }

  // Try loading from MongoDB if memory is empty
  const doc = await PriceSnapshot.findOne({ key: 'latest' });
  if (doc?.prices) {
    cachedPrices = doc.prices;
    lastPriceFetch = doc.updatedAt?.getTime() ?? Date.now();
    return { prices: cachedPrices, updatedAt: lastPriceFetch };
  }

  const fresh = await refreshLivePrices();
  return { prices: fresh, updatedAt: lastPriceFetch };
}

export async function getCachedChart(
  symbol: CoinSymbol,
  days: ChartDays,
): Promise<ChartPoint[]> {
  const cacheKey = `${symbol}_${days}`;
  const now = Date.now();
  const cached = chartCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.points;
  }

  const id = COINGECKO_IDS[symbol];
  const res = await axios.get(`${COINGECKO_API}/coins/${id}/market_chart`, {
    params: { vs_currency: 'usd', days },
    headers: getHeaders(),
    timeout: 12000,
  });

  const raw: [number, number][] = res.data?.prices ?? [];
  const maxPoints = 90;
  const step = Math.max(1, Math.floor(raw.length / maxPoints));
  const points: ChartPoint[] = [];
  for (let i = 0; i < raw.length; i += step) {
    points.push({ timestamp: raw[i][0], price: raw[i][1] });
  }
  if (raw.length > 0 && points[points.length - 1]?.timestamp !== raw[raw.length - 1][0]) {
    const last = raw[raw.length - 1];
    points.push({ timestamp: last[0], price: last[1] });
  }

  // Cache 24H chart for 2 hours; longer ranges (7D, 30D, 1Y) for 6 hours
  const ttlMs = days === '1' ? 2 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
  chartCache.set(cacheKey, { points, expiresAt: now + ttlMs });

  logger.info(`CoinGecko chart cached: ${cacheKey} (${points.length} pts)`);
  return points;
}

export function startPriceRefreshJob(): void {
  // Initial fetch on startup
  refreshLivePrices().catch(() => {});
  // Refresh every 5 minutes
  setInterval(() => {
    refreshLivePrices().catch(() => {});
  }, PRICE_REFRESH_MS);
}
