import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';

const transactionService = TransactionService.getSingleton();

export async function getTransactionFee(req: Request, res: Response, next: NextFunction) {
  const { hash } = req.params;

  try {
    const fee = await transactionService.getTransactionFee(hash);
    res.json({ status: 'success', data: { fee } });
  } catch (error) {
    next(error);
  }
}

export async function backfill(req: Request, res: Response, next: NextFunction) {
  const { startTime, endTime } = req.query;

  try {
    await transactionService.backfill(startTime as any, endTime as any);
    res.json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
}
