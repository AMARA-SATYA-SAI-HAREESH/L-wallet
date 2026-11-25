// mobile/src/services/priceService.ts
import axios from 'axios';
import { BACKEND_URL } from '../constants/config';

export interface CoinPriceData {
  usd: number;
  usd_24h_change: number;
}

export type LivePricesMap = Record<'BNB' | 'USDT' | 'USDC', CoinPriceData>;

export interface ChartPoint {
  timestamp: number;
  price: number;
}

export type ChartTimeframe = '1' | '7' | '30' | '365';

/**
 * Fetch cached live USD prices and 24h changes from the L Wallet backend.
 * Backend refreshes CoinGecko every 5 minutes and caches in memory + MongoDB.
 */
export async function fetchLivePrices(): Promise<LivePricesMap> {
  const res = await axios.get(`${BACKEND_URL}/api/market/prices`, {
    timeout: 10000,
  });
  return res.data.prices;
}

/**
 * Fetch cached historical price chart points from the L Wallet backend.
 * Backend fetches on demand and caches for 2–6 hours.
 */
export async function fetchCoinChart(
  symbol: 'BNB' | 'USDT' | 'USDC',
  days: ChartTimeframe = '1',
): Promise<ChartPoint[]> {
  const res = await axios.get(`${BACKEND_URL}/api/market/chart`, {
    params: { symbol, days },
    timeout: 12000,
  });
  return res.data.points ?? [];
}
