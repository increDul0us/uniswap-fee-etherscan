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

  async getEthUsdRate(transactionTimestamp: string): Promise<number> {
    try {
      const transactionDate = new Date(parseInt(transactionTimestamp) * 1000);
      const startTime = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate()).getTime();
      const endTime = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate() + 1).getTime();

      const response = await this.client.get(`https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1`);

      const ethUsdRate = parseFloat(response.data[0][4]);

      console.log({
        message: 'getEthUsdRate',
        details: { ethUsdRate, transactionTimestamp }
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