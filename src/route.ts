import express from 'express';
import { getTransactionFee } from './transaction/transaction.controller';

const router = express.Router();

router.get('/transaction/:hash/fee', getTransactionFee);

export default router;
