// backend/src/routes/swap.ts
import { Router } from 'express';
import { getSwapQuoteHandler, recordSwapHandler } from '../controllers/swapController';

const router = Router();

router.post('/quote', getSwapQuoteHandler);
router.post('/record', recordSwapHandler);

export default router;
