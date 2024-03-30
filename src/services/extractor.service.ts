import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { config } from '../../config/config';

export interface ITransaction {
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

  async fetchTxs(startBlock: number, endBlock: number) {
    try {
      const res = await this.client.get<{ result: ITransaction[] }>(`?module=account&action=tokentx&address=${this.uniswapUsdcAddress}&page=1&offset=100&startblock=${startBlock}&endblock=${endBlock}&sort=asc`);
  
      const transactions = res.data.result;
      return transactions;
    } catch (error: any) {
      throw 'ERROR_FETCH_TXS'
    }
  }

  async fetchLatestBlockNumber(): Promise<number> {
    try {
      const res = await this.client.get<{ result: string }>(`?module=proxy&action=eth_blockNumber`);

      const blockNumber = ethers.getNumber(res.data.result);
      return blockNumber;
    } catch (error: any) {
      throw 'ERROR_BLOCK_NUMBER';
    }
  }

  async init() {
    const latestBlock = await this.fetchLatestBlockNumber();
    return this.fetchTxs(latestBlock - 1000, latestBlock);
  }
}