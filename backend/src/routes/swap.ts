// src/routes/swap.ts
import { Router } from 'express';
import { getSwapQuote, executeSwap } from '../controllers/swapController';

const router = Router();
router.post('/quote', getSwapQuote);
router.post('/execute', executeSwap);
export default router;
