// backend/src/controllers/transactionController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Transaction from '../models/Transaction';
import logger from '../utils/logger';

const createSchema = z.object({
  txHash:      z.string().min(10),
  type:        z.enum(['send', 'receive', 'swap']),
  fromAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  toAddress:   z.string().optional(),
  tokenSymbol: z.string(),
  amount:      z.string(),
  chainId:     z.number().int().default(56),
});

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createSchema.parse(req.body);
    const tx = await Transaction.create(body);
    res.status(201).json(tx);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    next(err);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address is required' });
    const txs = await Transaction.find({ fromAddress: address }).sort({ createdAt: -1 }).limit(50);
    res.json(txs);
  } catch (err) {
    next(err);
  }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = await Transaction.findOne({ txHash: req.params.hash });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};
