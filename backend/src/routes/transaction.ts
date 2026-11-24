// backend/src/routes/transaction.ts
import { Router } from 'express';
import {
  createTransaction, getTransactions, getTransaction,
} from '../controllers/transactionController';

const router = Router();

router.get('/',       getTransactions);
router.get('/:hash',  getTransaction);
router.post('/',      createTransaction);

export default router;
