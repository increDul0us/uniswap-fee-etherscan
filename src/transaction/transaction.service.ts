import { CreationAttributes } from 'sequelize';
import { Transaction } from './model/transaction.model';
import { EtherscanService, BinanceService, UsdcEtherscanService } from '../modules';
import { ISwapTransaction } from '../modules/etherscan/types';
import sequelize from '../db';
import { calculateFee } from '../utils/util';
import { RabbitMQService } from '../rmq/rabbitmq.service';
import { config } from '../../config/config';
import { ErrorHandler } from '../utils/error.handler';

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

  async init() {
    try {
      await this.initRmqListener();

      setInterval(()=> this.processFromLastSavedBlock(), 1000 * 12); // cron that polls every 12 seconds

    } catch (error) {
      console.error('Error initializing listener:', error);
      throw error;
    }
  }

  async initRmqListener() {
    await this.rabbitMQService.connect(config.rabbitMqUrl);
    await this.rabbitMQService.createQueue(this.queueName);
    await this.rabbitMQService.channel?.prefetch(1);

    const rmqConsumers = 5;
    for (let i = 0; i < rmqConsumers; i++) {
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
    }
  }

  /**
    * processes from last saved block until latest block on chain.
    * if none, it processes last 10 blocks.
    */
  async processFromLastSavedBlock() {
    try {
      const latestBlockNumber = await this.etherscanService.fetchLatestBlockNumber();
      const latestSavedBlockNumber = await this.getLatestSavedBlockNumber()
      const startBlock = latestSavedBlockNumber ?? latestBlockNumber - 10 ;
  
      await this.processTransactions(startBlock, latestBlockNumber);
    } catch (error) {
      console.error({
        message: 'processFromLastSavedBlockError',
        error,
      });
    }
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
      const transactionsWithFee = await this.mapTransactionsWithFee(transactions);
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
   * Maps a transactions with fee.
   * Fetches the eth-usdt rates from binance api of the transactions time frame
   * Uses the rate to calculate the fee in USDT
   * @param transaction The transactions to map.
   * @returns The mapped transactions with fee.
   */
  async mapTransactionsWithFee(transactions: ISwapTransaction[]) {
    if (!transactions.length) return [];
    const startTime = transactions[0].timeStamp;
    const endTime = transactions[transactions.length - 1].timeStamp;
    const ethUsdRates = await this.binanceService.getEthUsdRates(startTime, endTime);

    const transactionsWithFee = transactions.map(transaction => {
      const timeStamp = parseInt(transaction.timeStamp) * 1000
      const ethUsdRate = ethUsdRates.reduce((prev, curr) => {
        if (curr.timestamp <= timeStamp && curr.timestamp > prev.timestamp) {
          return curr;
        }
        return prev;
      }, ethUsdRates[0]);

      const fee = calculateFee(transaction.gasPrice, transaction.gasUsed, ethUsdRate.ethUsdRate);
  
      return { ...transaction, fee }
    })

    return transactionsWithFee;
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
    try {
      const transaction = await Transaction.findOne({
        where: { hash },
        attributes: ['fee'],
      });
      if (transaction) return transaction.fee;
  
      return this.getTransactionFeeFromApi(hash);
    } catch (error) {
      throw ErrorHandler.handleCustomError('GET_TRANSACTION_FEE_ERROR', error, { hash });
    }
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
      throw ErrorHandler.handleCustomError('TRANSACTION_NOT_FOUND', {}, { hash }, 400);
    }
    const internalTransaction  = internalTransactions[0];
    if (internalTransaction.isError !== '0') {
      throw ErrorHandler.handleCustomError('TRANSACTION_WAS_FAILED', {}, { hash }, 400);
    }

    const blockNumber = Number(internalTransaction.blockNumber);
    const transferTransactions = await this.etherscanService.fetchTransferTxs(blockNumber, blockNumber);
    const transactionWithFee = await this.mapTransactionsWithFee(transferTransactions);
    const transaction = transactionWithFee.find(tx => tx.hash === hash);
    if (!transaction) {
      throw ErrorHandler.handleCustomError('TRANSACTION_NOT_FOUND', {}, { hash }, 400);
    }
    return transaction.fee;
  }

  /**
   * Initiates the backfill process to fetch historical transaction data
   * between the specified start and end time.
   * Uses rmq to queue the request and processes it in the background
   * Processes in batch of 2000 blocks
   * @param startTime - The start time in Unix timestamp format.
   * @param endTime - The end time in Unix timestamp format.
   * @throws Throws an error if there is an issue with backfilling.
   */
  async backfill(startTime: string, endTime: string) {
    try {
      const startBlock = await this.etherscanService.getBlockNumberFromTimestamp(startTime);
      const endBlock = await this.etherscanService.getBlockNumberFromTimestamp(endTime);
  
      const batchSize = 2000;
      
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
    } catch (error) {
      throw ErrorHandler.handleCustomError('BACKFILL_ERROR', error, { startTime, endTime });
    }
  }
}