import axios, { AxiosInstance } from 'axios';
import { RateT } from './types';
import { ErrorHandler } from '../../utils/error.handler';

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
   * Retrieves the ETH/USDT exchange rates for a specific time range.
   * @param startTime The start timestamp.
   * @param endTime The end timestamp.
   * @returns The ETH/USDT exchange rates and timestamp.
   * @throws If an error occurs during the fetch.
   */
  async getEthUsdRates(startTime: string, endTime: string): Promise<RateT[]> {
    try {
      const interval = 60 * 1000; // 1 minute interval
      const startTimestamp = (parseInt(startTime) * 1000) - interval;
      const endTimestamp = (parseInt(endTime) * 1000) + interval;

      const response = await this.client.get(`/v3/klines?symbol=ETHUSDT&interval=1m&startTime=${startTimestamp}&endTime=${endTimestamp}&limit=1000`);

      const ethUsdRates = response.data.map((entry: any) => {
        return {
          timestamp: parseInt(entry[0]),
          ethUsdRate: parseFloat(entry[4]),
        };
      });

      console.log({
        message: 'getEthUsdRates',
        details: { ethUsdRateLength: ethUsdRates.length, startTimestamp, endTimestamp }
      });

      return ethUsdRates;
    } catch (error: any) {
      throw ErrorHandler.handleCustomError('ETH_PRICE_ERROR', error, { startTime, endTime });
    }
  }

}
