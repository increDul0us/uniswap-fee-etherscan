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
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
  
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
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });

    it('fetchIntTxByHash handles NOTOK response', async () => {
      const hash = '0x123abc';
  
      axiosStub.resolves({ data: { message: 'NOTOK', result: [] } });
  
      const transactions = await etherscanService.fetchIntTxByHash(hash);
  
      expect(transactions).toHaveLength(0);
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });

    it('fetchIntTxByHash handles empty response', async () => {
      const hash = '0x123abc';
  
      axiosStub.resolves({ data: { message: 'OK', result: [] } });
  
      const transactions = await etherscanService.fetchIntTxByHash(hash);
  
      expect(transactions).toHaveLength(0);
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=txlistinternal&txhash=${hash}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
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
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=tokentx&address=${etherscanService['address']}&startblock=${startBlock}&endblock=${endBlock}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
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
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=tokentx&address=${etherscanService['address']}&startblock=${startBlock}&endblock=${endBlock}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  
    it('fetchTransferTxs handles NOTOK response', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
  
      axiosStub.resolves({ data: { message: 'NOTOK', result: [] } });
  
      const transactions = await etherscanService.fetchTransferTxs(startBlock, endBlock);
  
      expect(transactions).toHaveLength(0);
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=tokentx&address=${etherscanService['address']}&startblock=${startBlock}&endblock=${endBlock}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  
    it('fetchTransferTxs handles empty response', async () => {
      const startBlock = 1000;
      const endBlock = 2000;
  
      axiosStub.resolves({ data: { message: 'OK', result: [] } });
  
      const transactions = await etherscanService.fetchTransferTxs(startBlock, endBlock);
  
      expect(transactions).toHaveLength(0);
      expect(axiosStub.calledOnceWithExactly(`?module=account&action=tokentx&address=${etherscanService['address']}&startblock=${startBlock}&endblock=${endBlock}&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
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
      expect(axiosStub.calledOnceWithExactly(`?module=proxy&action=eth_blockNumber&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  
    it('fetchLatestBlockNumber handles failed response', async () => {
      axiosStub.rejects(new Error('Request failed'));
      try {
        await etherscanService.fetchLatestBlockNumber()
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('BLOCK_NUMBER_ERROR');
      }
      expect(axiosStub.calledOnceWithExactly(`?module=proxy&action=eth_blockNumber&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  });

  describe('getBlockNumberFromTimestamp', () => {
    afterEach(() => {
      axiosStub.resetHistory();
    });
  
    it('getBlockNumberFromTimestamp returns the latest block number', async () => {
      const latestBlockNumber = 10000;
      const timestamp = '1617261600000';
  
      axiosStub.resolves({ data: { result: latestBlockNumber.toString() } });
  
      const blockNumber = await etherscanService.getBlockNumberFromTimestamp(timestamp);
  
      expect(blockNumber).toEqual(latestBlockNumber);
      expect(axiosStub.calledOnceWithExactly(`?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  
    it('getBlockNumberFromTimestamp handles failed response', async () => {
      const timestamp = '1617261600000';
      axiosStub.rejects(new Error('Request failed'));
      try {
        await etherscanService.getBlockNumberFromTimestamp(timestamp)
        throw new Error('Test failed: Expected error was not thrown')
      } catch (error) {
        expect(error).toEqual('BLOCK_NUMBER_FROM_TIMESTAMP_ERROR');
      }
      expect(axiosStub.calledOnceWithExactly(`?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${etherscanService['apiKey']}`)).toBeTruthy();
    });
  });
});
