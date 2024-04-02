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
    this.address = address
  }

  async fetchIntTxByHash(hash: string) {
    try {
      const res = await this.client.get<{ message: string, result: IInternalTransaction[] }>(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${this.apiKey}`);
      console.log(res.data)
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
      throw 'FETCH_TX_BY_HASH_ERROR'
    }
  }

  async fetchTransferTxs(startBlock: number, endBlock: number) {
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
      throw 'FETCH_TXS_ERROR'
    }
  }

  async fetchLatestBlockNumber(): Promise<number> {
    try {
      const res = await this.client.get<{ result: string }>(`?module=proxy&action=eth_blockNumber`);

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

  calculateFee(transaction: ISwapTransaction, ethUsdRate: number) {
    const gasPrice = parseFloat(ethers.utils.formatEther(transaction.gasPrice));
    const gasUsed = parseFloat(transaction.gasUsed);

    const ethFee = gasPrice * gasUsed;
    const usdtFee = ethFee * ethUsdRate;

    console.log({
      message: 'calculateFee',
      details: { usdtFee, ethFee, ethUsdRate, hash: transaction.hash }
    });

    return usdtFee.toFixed(2);
  }

  
}