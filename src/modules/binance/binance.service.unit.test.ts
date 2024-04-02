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

  describe('getEthUsdRate', () => {
    it('should return the ETH to USD rate for a given timestamp', async () => {
      const expectedRate = 2000;
      const transactionTimestamp = '1617261600';

      axiosStub.resolves({ data: [[1617261600000, '123', '456', '789', expectedRate, '123456']] });

      const ethUsdRate = await binanceService.getEthUsdRate(transactionTimestamp);

      expect(ethUsdRate).toEqual(expectedRate);
    });

    it('should throw an error if the API call fails', async () => {
      const transactionTimestamp = '1617261600';

      axiosStub.rejects(new Error('Request failed'));

      try {
        await binanceService.getEthUsdRate(transactionTimestamp);
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('ETH_PRICE_ERROR');
      }
    });
  });
});
