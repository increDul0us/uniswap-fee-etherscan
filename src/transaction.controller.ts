import { Request, Response } from 'express';
import { TransactionService } from './transaction.service';

const transactionService = TransactionService.getSingleton();

export async function getTransactionFee(req: Request, res: Response) {
  const { hash } = req.params;

  try {
    const fee = await transactionService.getTransactionFee(hash);
    res.json({ fee });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
