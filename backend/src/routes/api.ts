// src/routes/api.ts
import { Router } from 'express';
import tokenRouter from './token';
import swapRouter from './swap';
import transactionRouter from './transaction';

const router = Router();
router.use('/tokens', tokenRouter);
router.use('/swap', swapRouter);
router.use('/transactions', transactionRouter);

export default router;
