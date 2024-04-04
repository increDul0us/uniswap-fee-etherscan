import express from 'express';
import { backfill, getTransactionFee } from './transaction/transaction.controller';
import { validateBackfillParams, validateHashParam } from './middleware/validate';

const router = express.Router();

router.get('/transaction/backfill',validateBackfillParams,  backfill);
router.get('/transaction/:hash/fee', validateHashParam, getTransactionFee);

export default router;
