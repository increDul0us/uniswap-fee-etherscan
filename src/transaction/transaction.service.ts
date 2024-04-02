import { CreationAttributes } from 'sequelize';
import { Transaction } from './model/transaction.model';
import { EtherscanService, BinanceService, UsdcEtherscanService } from '../modules';
import { ISwapTransaction } from '../modules/etherscan/types';
import sequelize from '../db';

export class TransactionService {
  static singleton: TransactionService;

  constructor(
    readonly etherscanService: EtherscanService,
    readonly binanceService: BinanceService,
  ) {
    sequelize.addModels([Transaction]);
    // const everyFiveMinutes = 1000 * 60 * 1;
    // setInterval(() => this.poll(), everyFiveMinutes); // using setInterval to poll every 5 minutes
  }

  static getSingleton(): TransactionService {
    if (!TransactionService.singleton) {
      TransactionService.singleton = TransactionService.createDefault();
    }
    return TransactionService.singleton;
  }

  static createDefault() {
    return TransactionService.create({
      etherscanService: UsdcEtherscanService.getSingleton(),
      binanceService: BinanceService.getSingleton(),
    });
  }

  static create({
    etherscanService,
    binanceService,
  }: {
    etherscanService: EtherscanService,
    binanceService: BinanceService,
  }) {
    return new TransactionService(
      etherscanService,
      binanceService,
    );
  }
  
  async poll() {
    const latestSavedBlockNumber = await this.getLatestSavedBlockNumber()
    const latestBlockNumber = await this.etherscanService.fetchLatestBlockNumber();
    const startBlock = latestSavedBlockNumber ?? latestBlockNumber - 10 ;

    const transactions = await this.etherscanService.fetchTransferTxs(startBlock, latestBlockNumber);
    const transactionsWithFee = await this.mapTransactionsWithFee(transactions);
    await this.batchInsertTransactions(transactionsWithFee);
  }

  async mapTransactionsWithFee(transactions: ISwapTransaction[]) {
    if(!transactions.length) return []

    // we are assuming all transactions within same time frame. Hence, We do not need to keep fetching the eth-usd price for each transactions
   const timeStamp = transactions[0].timeStamp;
   const ethUsdRate = await this.binanceService.getEthUsdRate(timeStamp);

   const transactionsWithFee = transactions.map(transaction => {
     const fee = this.etherscanService.calculateFee(transaction, ethUsdRate);
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
    const internalTransactions = await this.etherscanService.fetchIntTxByHash(hash);
    if (!internalTransactions.length) {
      throw 'TRANSACTION_NOT_FOUND';
    }
    const internalTransaction  = internalTransactions[0];
    if (internalTransaction.isError !== '0') {
      throw 'TRANSACTION_FAILED'
    }

    const startBlock = Number(internalTransaction.blockNumber);
    const endBlock = startBlock + 1;
    const transferTransactions = await this.etherscanService.fetchTransferTxs(startBlock, endBlock);
    const transactionsWithFee = await this.mapTransactionsWithFee(transferTransactions);
    return transactionsWithFee.find(tx => tx.hash === hash)?.fee;
  }
}