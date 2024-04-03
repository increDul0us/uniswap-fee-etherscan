import { CreationAttributes } from 'sequelize';
import { Transaction } from './model/transaction.model';
import { EtherscanService, BinanceService, UsdcEtherscanService } from '../modules';
import { ISwapTransaction } from '../modules/etherscan/types';
import sequelize from '../db';
import { calculateFee } from '../utils/util';
import { RabbitMQService } from '../rmq/rabbitmq.service';
import { config } from '../../config/config';

export class TransactionService {
  static singleton: TransactionService;

  queueName = 'transaction_queue';

  constructor(
    readonly etherscanService: EtherscanService,
    readonly binanceService: BinanceService,
    readonly rabbitMQService: RabbitMQService,
  ) {
    sequelize.addModels([Transaction]);
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
      rabbitMQService: RabbitMQService.getSingleton(),
    });
  }

  static create({
    etherscanService,
    binanceService,
    rabbitMQService,
  }: {
    etherscanService: EtherscanService,
    binanceService: BinanceService,
    rabbitMQService: RabbitMQService,
  }) {
    return new TransactionService(
      etherscanService,
      binanceService,
      rabbitMQService,
    );
  }
  
  /**
   * Polls for new transactions and processes them.
   * Processes last 10 blocks for upon start
   */
  async poll() {
    const latestBlockNumber = await this.etherscanService.fetchLatestBlockNumber();
    const latestSavedBlockNumber = await this.getLatestSavedBlockNumber()
    const startBlock = latestSavedBlockNumber ?? latestBlockNumber - 10 ;

    await this.processTransactions(startBlock, latestBlockNumber);
  }

  /**
   * Processes transactions within the specified block range.
   * Fetches all transfer transactions between the block range
   * Batch insert the transactions to the db
   * @param startBlock The start block number.
   * @param endBlock The end block number.
   */
  async processTransactions(startBlock: number, endBlock: number) {
    console.log({
      message: 'processTransactions',
      details: { startBlock, endBlock }
    });
    try {
      const transactions = await this.etherscanService.fetchTransferTxs(startBlock, endBlock);
      const transactionsWithFee = await Promise.all(transactions.map(transaction => this.mapTransactionWithFee(transaction)));
      await this.batchInsertTransactions(transactionsWithFee);
    } catch (error: any) {
      console.error({
        message: 'processTransactionsError',
        details: { startBlock, endBlock },
        error,
      });
      throw error;
    }
  }

  /**
   * Maps a transaction with its fee.
   * Calculates the eth-usdt rate from binance api at the transaction time
   * Uses the rate to calculate the fee in USDT
   * @param transaction The transaction to map.
   * @returns The mapped transaction with fee.
   */
  async mapTransactionWithFee(transaction: ISwapTransaction) {
    const ethUsdRate = await this.binanceService.getEthUsdRate(transaction.timeStamp);
    const fee = calculateFee(transaction.gasPrice, transaction.gasUsed, ethUsdRate);
    console.log({
      message: 'calculateFee',
      details: { fee, ethUsdRate, hash: transaction.hash }
    });
    return { ...transaction, fee }
  }

  /**
   * Retrieves the latest saved block number from the database.
   * @returns The latest saved block number, or null if not found.
   */
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

  /**
   * Inserts transactions into the database in bulk.
   * @param transactions The transactions to insert.
   */
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

  /**
   * Retrieves the transaction fee by hash.
   * Checks the db for the transaction and returns the fee
   * Queries the api if not in our db and calculate the fee
   * @param hash The hash of the transaction.
   * @returns The fee of the transaction.
   */
  async getTransactionFee(hash: string) {
    const transaction = await Transaction.findOne({
      where: { hash },
      attributes: ['fee'],
    });
    if (transaction) return transaction.fee;

    return this.getTransactionFeeFromApi(hash);
  }

  /**
   * Retrieves the transaction fee from the API by hash.
   * Fetches the internal transaction from the hash
   * Gets the block number and fetch the transfer transaction
   * @param hash The hash of the transaction.
   * @returns The fee of the transaction.
   * @throws throws if transaction not found or failed.
   */
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
    const transaction = transferTransactions.find(tx => tx.hash === hash);
    if (!transaction) {
      throw 'TRANSACTION_NOT_FOUND';
    }
    const transactionWithFee = await this.mapTransactionWithFee(transaction);
    return transactionWithFee.fee;
  }

  async backfill(startTime: string, endTime: string) {
    const startBlock = await this.etherscanService.getBlockNumberFromTimestamp(startTime);
    const endBlock = await this.etherscanService.getBlockNumberFromTimestamp(endTime);

    const batchSize = 10000;
    
    const numBatches = Math.ceil((endBlock - startBlock) / batchSize);

    for (let i = 0; i < numBatches; i++) {
      const batchStart = startBlock + i * batchSize;
      const batchEnd = Math.min(startBlock + (i + 1) * batchSize - 1, endBlock);
      
      const message = { startBlock: batchStart, endBlock: batchEnd };
      await this.rabbitMQService.sendMessage(this.queueName, message);
      console.log({
        message: 'backfill',
        details: { batch: `${i + 1}/${numBatches}`, message }
      });
    }
  }

  async initListener() {
    try {
      await this.rabbitMQService.connect(config.rabbitMqUrl);
      await this.rabbitMQService.createQueue(this.queueName);
  
      this.rabbitMQService.channel?.consume(this.queueName, async (message)=> {
        if (message !== null) {
          const { startBlock, endBlock } = JSON.parse(message.content.toString());
          try {
            await this.processTransactions(startBlock, endBlock);
            this.rabbitMQService.channel?.ack(message);
          } catch (error) {
            console.error('Error processing message:', error);
            this.rabbitMQService.channel?.reject(message, true);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing listener:', error);
      throw error;
    }
  }
}