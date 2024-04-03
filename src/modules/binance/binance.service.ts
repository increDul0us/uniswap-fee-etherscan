import axios, { AxiosInstance } from 'axios';

export class BinanceService {
  static singleton: BinanceService;

  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.binance.com/api',
    });
  }

  static getSingleton(): BinanceService {
    if (!BinanceService.singleton) {
      BinanceService.singleton = new BinanceService();
    }
    return BinanceService.singleton;
  }

  /**
   * Retrieves the ETH/USDT exchange rate at a specific timestamp from the Binance API.
   * @param transactionTimestamp The timestamp of the transaction.
   * @returns The ETH/USDT exchange rate.
   * @throws If an error occurs during the fetch.
   */
  async getEthUsdRate(transactionTimestamp: string): Promise<number> {
    try {
      const timestamp = parseInt(transactionTimestamp) * 1000;

      const response = await this.client.get(`https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1s&startTime=${timestamp}&endTime=${timestamp}&limit=1`);

      const ethUsdRate = parseFloat(response.data[0][4]);

      console.log({
        message: 'getEthUsdRate',
        details: { ethUsdRate, transactionTimestamp, data: response.headers }
      });

      return ethUsdRate;
    } catch (error: any) {
      console.error({
        message: 'getEthUsdRateError',
        details: { transactionTimestamp },
        error,
      });
      throw 'ETH_PRICE_ERROR';
    }
  }
}
