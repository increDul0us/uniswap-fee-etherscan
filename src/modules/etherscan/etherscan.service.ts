import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { config } from '../../../config/config';
import { IInternalTransaction, ISwapTransaction } from './types';

export class EtherscanService {
  private client: AxiosInstance;
  private apiKey: string;

  address: string;

  constructor(address: string) {
    this.client = axios.create({
      baseURL: config.etherscan.baseUrl,
    });
    this.apiKey = config.etherscan.apiKey;
    this.address = address;
  }

  /**
   * Fetches internal transactions by hash from the Etherscan API.
   * @param hash The hash of the transaction.
   * @returns An array of internal transactions.
   * @throws If an error occurs during the fetch.
   */
  async fetchIntTxByHash(hash: string): Promise<IInternalTransaction[]> {
    try {
      const res = await this.client.get<{ message: string, result: IInternalTransaction[] }>(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${this.apiKey}`);
      if (!res.data.message.startsWith('OK')) return [];
      const transactions = res.data.result;

      console.log({
        message: 'fetchIntTxByHash',
        details: { transactionLength: transactions.length, hash }
      });

      return transactions;
    } catch (error: any) {
      console.error({
        message: 'fetchIntTxByHashError',
        details: { hash },
        error,
      });
      throw 'FETCH_TX_BY_HASH_ERROR';
    }
  }

  /**
   * Fetches transfer transactions within a specified block range from the Etherscan API.
   * Filters out WETH side of the transfer as we only need the side
   * @param startBlock The start block number.
   * @param endBlock The end block number.
   * @returns An array of transfer transactions.
   * @throws If an error occurs during the fetch.
   */
  async fetchTransferTxs(startBlock: number, endBlock: number): Promise<ISwapTransaction[]> {
    try {
      const res = await this.client.get<{ message: string, result: ISwapTransaction[] }>(`?module=account&action=tokentx&address=${this.address}&startblock=${startBlock}&endblock=${endBlock}&apikey=${this.apiKey}`);
      if (!res.data.message.startsWith('OK')) return [];
      const transactions = res.data.result?.filter(tx => tx.tokenSymbol !== 'WETH'); // we do not need the 2 transactions

      console.log({
        message: 'fetchTransferTxs',
        details: { transactionLength: transactions.length, startBlock, endBlock }
      });

      return transactions;
    } catch (error: any) {
      console.error({
        message: 'fetchTransferTxsError',
        details: { startBlock, endBlock },
        error,
      });
      throw 'FETCH_TXS_ERROR';
    }
  }

  /**
   * Fetches the latest block number from the Etherscan API.
   * @returns The latest block number.
   * @throws If an error occurs during the fetch.
   */
  async fetchLatestBlockNumber(): Promise<number> {
    try {
      const res = await this.client.get<{ result: string }>(`?module=proxy&action=eth_blockNumber&apikey=${this.apiKey}`);

      const blockNumber = ethers.BigNumber.from(res.data.result).toNumber();

      console.log({
        message: 'fetchLatestBlockNumber',
        details: { blockNumber }
      });

      return blockNumber;
    } catch (error: any) {
      console.error({
        message: 'fetchLatestBlockNumberError',
        error,
      });
      throw 'BLOCK_NUMBER_ERROR';
    }
  }

  async getBlockNumberFromTimestamp(timestamp: string): Promise<number> {
    try {
      const res = await this.client.get<{ result: string }>(`?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${this.apiKey}`);
  
      const blockNumber = ethers.BigNumber.from(res.data.result).toNumber();
  
      console.log({
        message: 'getBlockNumberFromTimestamp',
        details: { blockNumber, timestamp }
      });
  
      return blockNumber;
    } catch (error: any) {
      console.error({
        message: 'getBlockNumberFromTimestampError',
        details: { timestamp },
        error,
      });
      throw 'BLOCK_NUMBER_FROM_TIMESTAMP_ERROR';
    }
  }
}
