// src/controllers/tokenController.ts
import { Request, Response } from 'express';
import Token from '../models/Token';

export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await Token.find();
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
};
