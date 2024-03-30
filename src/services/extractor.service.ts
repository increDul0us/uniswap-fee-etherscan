import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { config } from '../../config/config';

export interface ISwapTransaction {
  blockNumber: string,
  timeStamp: string,
  hash: string,
  nonce: string,
  blockHash: string,
  from: string,
  contractAddress: string,
  to: string,
  value: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimal: string,
  transactionIndex: string,
  gas: string,
  gasPrice: string,
  gasUsed: string,
  cumulativeGasUsed: string,
  input: string,
  confirmations: string,
}

export interface IInternalTransaction {
  blockNumber: string
  timeStamp: string
  from: string
  to: string
  value: string
  contractAddress: string
  input: string
  type: string
  gas: string
  gasUsed: string
  isError: string
  errCode: string
}

export class ExtractorService {
  static singleton: ExtractorService;

  private client: AxiosInstance;
  private apiKey: string;

  uniswapUsdcAddress = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

  constructor() {
    this.client = axios.create({
      baseURL: config.etherscan.baseUrl,
    });
    this.apiKey = config.etherscan.apiKey;
  }

  static getSingleton(): ExtractorService {
    if (!ExtractorService.singleton) {
      ExtractorService.singleton = new ExtractorService();
    }
    return ExtractorService.singleton;
  }

  async fetchTxByHash(hash: string) {
    try {
      const res = await this.client.get<{ message: string, result: IInternalTransaction[] }>(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${this.apiKey}`);
      if (!res.data.message.startsWith('OK')) return [];
      const transactions = res.data.result;

      console.log({
        message: 'fetchTxByHash',
        details: { transactionLength: transactions.length, hash }
      });

      return transactions;
    } catch (error: any) {
      console.error({
        message: 'fetchTxByHashError',
        details: { hash },
        error,
      });
      throw 'FETCH_TX_BY_HASH_ERROR'
    }
  }

  async fetchTxs(startBlock: number, endBlock: number) {
    try {
      const res = await this.client.get<{ message: string, result: ISwapTransaction[] }>(`?module=account&action=tokentx&address=${this.uniswapUsdcAddress}&startblock=${startBlock}&endblock=${endBlock}&apikey=${this.apiKey}`);
      if (!res.data.message.startsWith('OK')) return [];
      const transactions = res.data.result?.filter(tx => tx.tokenSymbol === 'WETH'); // we do not need the 2 transactions

      console.log({
        message: 'fetchTxs',
        details: { transactionLength: transactions.length, startBlock, endBlock }
      });

      return transactions;
    } catch (error: any) {
      console.error({
        message: 'fetchTxsError',
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

  calculateFeeIsh(transaction: IInternalTransaction, ethUsdRate: number) {
    const gasPrice = parseFloat(ethers.utils.formatEther(transaction.gas));
    const gasUsed = parseFloat(transaction.gasUsed);

    const ethFee = gasPrice * gasUsed;
    const usdtFee = ethFee * ethUsdRate;

    console.log({
      message: 'calculateFee',
      details: { usdtFee, ethFee, ethUsdRate, blockNumber: transaction.blockNumber }
    });

    return usdtFee.toFixed(2);
  }
}