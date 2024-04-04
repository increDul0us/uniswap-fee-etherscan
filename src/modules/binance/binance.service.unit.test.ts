import sinon from 'sinon';
import { BinanceService } from './binance.service';

describe('BinanceService', () => {
  let binanceService: BinanceService;
  let axiosStub: sinon.SinonStub;

  beforeEach(() => {
    binanceService = BinanceService.getSingleton();
    axiosStub = sinon.stub(binanceService['client'], 'get');
  });

  afterEach(() => {
    axiosStub.restore();
  });
  describe('getEthUsdRates', () => {
    console.log('start')
    it('should return the ETH to USD rate for a given timestamp', async () => {
      const startTime = '1712211110';
      const endTime = '1712211120';

      axiosStub.resolves({ data: [[1617261600000, '123', '456', '789', '2000', '123456']] });

      const ethUsdRate = await binanceService.getEthUsdRates(startTime, endTime);

      expect(ethUsdRate).toEqual([{"ethUsdRate": 2000, "timestamp": 1617261600000}]);
      expect(axiosStub.calledOnceWithExactly(`/v3/klines?symbol=ETHUSDT&interval=1m&startTime=${1712211050000}&endTime=${1712211180000}&limit=1000`)).toBeTruthy();
    });

    it('should throw an error if the API call fails', async () => {
      const startTime = '1712211110';
      const endTime = '1712211120';

      axiosStub.rejects(new Error('Request failed'));

      try {
        await binanceService.getEthUsdRates(startTime, endTime);
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error: any) {
        expect(error.message).toEqual('ETH_PRICE_ERROR');
      }
      expect(axiosStub.calledOnceWithExactly(`/v3/klines?symbol=ETHUSDT&interval=1m&startTime=${1712211050000}&endTime=${1712211180000}&limit=1000`)).toBeTruthy();
    });
  });
});
