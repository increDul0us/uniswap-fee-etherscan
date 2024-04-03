import { Request, Response } from 'express';
import { TransactionService } from './transaction.service';

const transactionService = TransactionService.getSingleton();

export async function getTransactionFee(req: Request, res: Response) {
  const { hash } = req.params;

  try {
    const fee = await transactionService.getTransactionFee(hash);
    res.json({ message: 'success', data: { fee } });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function backfill(req: Request, res: Response) {
  const { startTime, endTime } = req.query;

  try {
    await transactionService.backfill(startTime as any, endTime as any);
    res.json({ message: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
