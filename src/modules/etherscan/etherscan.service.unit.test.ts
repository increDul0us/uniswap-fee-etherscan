import sinon from 'sinon';
import { EtherscanService } from './etherscan.service';

describe('EtherscanService', () => {
  let etherscanService: EtherscanService;
  let axiosStub: sinon.SinonStub;

  beforeAll(() => {
    etherscanService = new EtherscanService('0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640');
    axiosStub = sinon.stub(etherscanService['client'], 'get');
  });

  afterAll(() => {
    axiosStub.restore();
  });

  describe('fetchIntTxByHash', () => {
    afterEach(() => {
      axiosStub.resetHistory();
    });

    it('fetchIntTxByHash returns internal transactions for a given hash', async () => {
      const hash = '0x123abc';
      const internalTransactions = [{}, {}];
  
      axiosStub.resolves({ data: { message: 'OK', result: internalTransactions } });
  
      const transactions = await etherscanService.fetchIntTxByHash(hash);
  
      expect(transactions).toEqual(internalTransactions);
    });

    it('fetchIntTxByHash handles failed response', async () => {
      const hash = '0x123abc';
  
      axiosStub.rejects(new Error('Request failed'));
      try {
        await etherscanService.fetchIntTxByHash(hash)
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('FETCH_TX_BY_HASH_ERROR');
      }
    });

    it('fetchIntTxByHash handles NOTOK response', async () => {
      const hash = '0x123abc';
  
      axiosStub.resolves({ data: { message: 'NOTOK', result: [] } });
  
      const transactions = await etherscanService.fetchIntTxByHash(hash);
  
      expect(transactions).toHaveLength(0);
    });

    it('fetchIntTxByHash handles empty response', async () => {
      const hash = '0x123abc';
  
      axiosStub.resolves({ data: { message: 'OK', result: [] } });
  
      const transactions = await etherscanService.fetchIntTxByHash(hash);
  
      expect(transactions).toHaveLength(0);
    });
  });

  describe('fetchTransferTxs', () => {
    afterEach(() => {
      axiosStub.resetHistory();
    });
  
    it('fetchTransferTxs returns transfer transactions for a given block range', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
      const transferTransactions = [{tokenSymbol: 'USDC'}, {tokenSymbol: 'USDC'}];
  
      axiosStub.resolves({ data: { message: 'OK', result: transferTransactions } });
  
      const transactions = await etherscanService.fetchTransferTxs(startBlock, endBlock);
  
      expect(transactions).toEqual(transferTransactions);
    });
  
    it('fetchTransferTxs handles failed response', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
  
      axiosStub.rejects(new Error('Request failed'));
      try {
        await etherscanService.fetchTransferTxs(startBlock, endBlock)
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('FETCH_TXS_ERROR');
      }
    });
  
    it('fetchTransferTxs handles NOTOK response', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
  
      axiosStub.resolves({ data: { message: 'NOTOK', result: [] } });
  
      const transactions = await etherscanService.fetchTransferTxs(startBlock, endBlock);
  
      expect(transactions).toHaveLength(0);
    });
  
    it('fetchTransferTxs handles empty response', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
  
      axiosStub.resolves({ data: { message: 'OK', result: [] } });
  
      const transactions = await etherscanService.fetchTransferTxs(startBlock, endBlock);
  
      expect(transactions).toHaveLength(0);
    });
  });

  describe('fetchLatestBlockNumber', () => {
    afterEach(() => {
      axiosStub.resetHistory();
    });
  
    it('fetchLatestBlockNumber returns the latest block number', async () => {
      const latestBlockNumber = 10000;
  
      axiosStub.resolves({ data: { result: latestBlockNumber.toString() } });
  
      const blockNumber = await etherscanService.fetchLatestBlockNumber();
  
      expect(blockNumber).toEqual(latestBlockNumber);
    });
  
    it('fetchLatestBlockNumber handles failed response', async () => {
      axiosStub.rejects(new Error('Request failed'));
      try {
        await etherscanService.fetchLatestBlockNumber()
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('BLOCK_NUMBER_ERROR');
      }
    });
  });  

  describe('calculateFee', () => {
    const ethUsdRate = 2000;
  
    it('calculateFee returns the correct fee in USD', () => {
      const transaction = {
        blockNumber: '123',
        timeStamp: '1234567890',
        hash: '0x123abc',
        nonce: '0',
        blockHash: '0x456def',
        from: '0xfromAddress',
        contractAddress: '0xcontractAddress',
        to: '0xtoAddress',
        value: '1000000000000000',
        tokenName: 'SampleToken',
        tokenSymbol: 'ST',
        tokenDecimal: '18',
        transactionIndex: '0',
        gas: '21000',
        gasPrice: '50000000000',
        gasUsed: '21000',
        cumulativeGasUsed: '21000',
        input: '0x',
        confirmations: '10',
      };
  
      const expectedFee = '2.10';
  
      const fee = etherscanService.calculateFee(transaction, ethUsdRate);
  
      expect(fee).toEqual(expectedFee);
    });
  });
  
});
