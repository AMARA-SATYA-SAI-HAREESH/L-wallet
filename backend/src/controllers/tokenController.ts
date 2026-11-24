// backend/src/controllers/tokenController.ts
import { Request, Response, NextFunction } from 'express';
import Token from '../models/Token';

// Return all supported tokens for the given chainId (default BSC)
export const getTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chainId = parseInt(req.query.chainId as string) || 56;
    const tokens = await Token.find({ chainId, isActive: true });
    if (tokens.length === 0) {
      // Return hardcoded defaults if DB is empty
      return res.json([
        { symbol: 'BNB',  name: 'BNB',       decimals: 18, contractAddress: null, isNative: true,  chainId: 56 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 18, contractAddress: '0x55d398326f99059fF775485246999027B3197955', isNative: false, chainId: 56 },
        { symbol: 'USDC', name: 'USD Coin',   decimals: 18, contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', isNative: false, chainId: 56 },
      ]);
    }
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};
