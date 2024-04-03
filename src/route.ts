import express from 'express';
import { backfill, getTransactionFee } from './transaction/transaction.controller';

const router = express.Router();

router.get('/transaction/backfill', backfill);
router.get('/transaction/:hash/fee', getTransactionFee);

export default router;
