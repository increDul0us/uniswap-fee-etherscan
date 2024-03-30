import { CreationAttributes } from 'sequelize';
import { Transaction } from '../model/transaction.model';
import { ExtractorService, ISwapTransaction } from './extractor.service';
import { PriceService } from './price.service';

export class RecordService {
  static singleton: RecordService;

  constructor(
    readonly extractorService: ExtractorService,
    readonly priceService: PriceService,
  ) {
    // const everyFiveMinutes = 1000 * 60 * 1;
    // setInterval(() => this.poll(), everyFiveMinutes); // using setInterval to poll every 5 minutes
  }

  static getSingleton(): RecordService {
    if (!RecordService.singleton) {
      RecordService.singleton = RecordService.createDefault();
    }
    return RecordService.singleton;
  }

  static createDefault() {
    return RecordService.create({
      extractorService: ExtractorService.getSingleton(),
      priceService: PriceService.getSingleton(),
    });
  }

  static create({
    extractorService,
    priceService,
  }: {
    extractorService: ExtractorService,
    priceService: PriceService,
  }) {
    return new RecordService(
      extractorService,
      priceService,
    );
  }
  
  async poll() {
    const latestSavedBlockNumber = await this.getLatestSavedBlockNumber()
    const latestBlockNumber = await this.extractorService.fetchLatestBlockNumber();
    const startBlock = latestSavedBlockNumber ?? latestBlockNumber - 10 ;

    const transactions = await this.extractorService.fetchTxs(startBlock, latestBlockNumber);
    const transactionsWithFee = await this.mapTransactionsWithFee(transactions);
    await this.batchInsertTransactions(transactionsWithFee);
  }

  async mapTransactionsWithFee(transactions: ISwapTransaction[]) {
    if(!transactions.length) return []

    // we are assuming all transactions within same time frame. Hence, We do not need to keep fetching the eth-usd price for each transactions
   const timeStamp = transactions[0].timeStamp;
   const ethUsdRate = await this.priceService.getEthUsdRate(timeStamp);

   const transactionsWithFee = transactions.map(transaction => {
     const fee = this.extractorService.calculateFee(transaction, ethUsdRate);
     return { ...transaction, fee }
   });

   return transactionsWithFee;
  }

  async getLatestSavedBlockNumber(): Promise<number | null> {
    try {
      const latestTransaction = await Transaction.findOne({
        order: [['blockNumber', 'DESC']],
        attributes: ['blockNumber'],
      });

      return latestTransaction ? parseInt(latestTransaction.blockNumber) : null;
    } catch (error) {
      console.error({
        message: 'getLatestSavedBlockNumberError',
        error,
      });
      throw 'GET_LATEST_SAVED_BLOCK_NUMBER_ERROR';
    }
  }

  async batchInsertTransactions(transactions: CreationAttributes<Transaction>[]): Promise<void> {
    try {
      await Transaction.bulkCreate(transactions, { ignoreDuplicates: true });
    } catch (error) {
      console.error({
        message: 'batchInsertTransactionsError',
        error,
      });
      throw 'BATCH_INSERT_TRANSACTIONS_ERROR';
    }
  }

  async getTransactionFee(hash: string) {
    const transaction = await Transaction.findOne({
      where: { hash },
      attributes: ['fee'],
    });
    if (transaction) return transaction.fee;

    return this.getTransactionFeeFromApi(hash);
  }

  async getTransactionFeeFromApi(hash: string) {
    const internalTransactions = await this.extractorService.fetchTxByHash(hash);
    if (!internalTransactions.length) {
      throw 'TRANSACTION_NOT_FOUND';
    }
    const internalTransaction  = internalTransactions[0];
    if (internalTransaction.isError !== '0') {
      throw 'TRANSACTION_FAILED'
    }

    const startBlock = Number(internalTransaction.blockNumber);
    const endBlock = startBlock + 1;
    const transferTransactions = await this.extractorService.fetchTxs(startBlock, endBlock);
    const transactionsWithFee = await this.mapTransactionsWithFee(transferTransactions);
    return transactionsWithFee.find(tx => tx.hash === hash)!.fee;
  }
}