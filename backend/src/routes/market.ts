// backend/src/routes/market.ts
import { Router } from 'express';
import { getPricesHandler, getChartHandler } from '../controllers/marketController';

const router = Router();

router.get('/prices', getPricesHandler);
router.get('/chart', getChartHandler);

export default router;
