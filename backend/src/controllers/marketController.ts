// backend/src/controllers/marketController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getCachedPrices,
  getCachedChart,
  CoinSymbol,
  ChartDays,
} from '../services/priceCacheService';

const chartQuerySchema = z.object({
  symbol: z.enum(['BNB', 'USDT', 'USDC']),
  days: z.enum(['1', '7', '30', '365']).default('1'),
});

export const getPricesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getCachedPrices();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getChartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = chartQuerySchema.parse({
      symbol: String(req.query.symbol ?? '').toUpperCase(),
      days: req.query.days ? String(req.query.days) : '1',
    });
    const points = await getCachedChart(
      parsed.symbol as CoinSymbol,
      parsed.days as ChartDays,
    );
    res.json({ symbol: parsed.symbol, days: parsed.days, points });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid query parameters', details: err.errors });
    }
    next(err);
  }
};
