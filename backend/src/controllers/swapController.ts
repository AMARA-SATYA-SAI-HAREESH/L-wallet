// backend/src/controllers/swapController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getSwapQuote } from '../services/swapService';
import SwapRecord from '../models/SwapRecord';
import Transaction from '../models/Transaction';
import logger from '../utils/logger';

const quoteSchema = z.object({
  sellToken:    z.string().min(2),
  buyToken:     z.string().min(2),
  sellAmount:   z.string().min(1),
  takerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid address'),
});

export const getSwapQuoteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = quoteSchema.parse(req.body);
    const quote = await getSwapQuote(
      body.sellToken,
      body.buyToken,
      body.sellAmount,
      body.takerAddress,
    );
    res.json(quote);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    logger.error('Swap quote error', { message: err.message });
    next(err);
  }
};

// Record a completed swap (called after the mobile app broadcasts the tx)
const recordSchema = z.object({
  txHash:       z.string().min(10),
  takerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  sellToken:    z.string(),
  buyToken:     z.string(),
  sellAmount:   z.string(),
  buyAmount:    z.string(),
  lwFeeBps:     z.number().int().min(0),
  lwFeeUSD:     z.string(),
});

export const recordSwapHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = recordSchema.parse(req.body);
    const record = await SwapRecord.create({ ...body, status: 'pending', chainId: 56 });
    // Also record in the general transaction log
    await Transaction.create({
      txHash: body.txHash,
      type: 'swap',
      fromAddress: body.takerAddress,
      tokenSymbol: body.sellToken,
      amount: body.sellAmount,
      chainId: 56,
      status: 'pending',
      metadata: { buyToken: body.buyToken, buyAmount: body.buyAmount },
    });
    res.status(201).json({ id: record._id, txHash: record.txHash });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    logger.error('Record swap error', { message: err.message });
    next(err);
  }
};
