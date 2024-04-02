import { TransactionService } from './transaction.service';
import { EtherscanService, BinanceService } from '../modules';
import { Transaction } from './model/transaction.model';
import sinon from 'sinon';

describe('TransactionService', () => {
  let etherscanServiceMock: sinon.SinonStubbedInstance<EtherscanService>;
  let binanceServiceMock: sinon.SinonStubbedInstance<BinanceService>;
  let transactionService: TransactionService;

  beforeEach(() => {
    etherscanServiceMock = sinon.createStubInstance(EtherscanService);
    binanceServiceMock = sinon.createStubInstance(BinanceService);
    transactionService = new TransactionService(etherscanServiceMock, binanceServiceMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getTransactionFee', () => {
    let getTransactionFeeFromApiStub: sinon.SinonStub;
    let getTransactionStub: sinon.SinonStub;

    const fee = '10';
    beforeEach(() => {
      getTransactionFeeFromApiStub = sinon.stub(transactionService, 'getTransactionFeeFromApi').resolves(fee);
      getTransactionStub = sinon.stub(Transaction, 'findOne');
    });
  
    afterEach(() => {
      getTransactionFeeFromApiStub.restore();
    });

    it('should return transaction fee from the database if it exists', async () => {
      const hash = '0x123abc';

      getTransactionStub.resolves({ fee } as any);

      const result = await transactionService.getTransactionFee(hash);

      expect(result).toBe(fee);
    });

    it('should return transaction fee from API if not found in the database', async () => {
      const hash = '0x123abc';

      getTransactionStub.resolves(null);
      const result = await transactionService.getTransactionFee(hash);

      expect(getTransactionFeeFromApiStub.calledOnceWithExactly(hash))
      expect(result).toBe(fee);
    });
  });

  describe('getTransactionFeeFromApi', () => {
    let mapTransactionsWithFeeStub: sinon.SinonStub;
  
    const hash = '0x123abc';
    beforeEach(() => {
      mapTransactionsWithFeeStub = sinon.stub(transactionService, 'mapTransactionsWithFee');
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it('should return transaction fee if found in API response', async () => {
      const internalTransactions = [{ isError: '0', blockNumber: '100' }];
      const transferTransactions = [{ hash, fee: '10' }];
  
      etherscanServiceMock.fetchIntTxByHash.resolves(internalTransactions as any);
      etherscanServiceMock.fetchTransferTxs.resolves(transferTransactions as any);
      mapTransactionsWithFeeStub.resolves(transferTransactions as any);
  
      const result = await transactionService.getTransactionFeeFromApi(hash);
  
      expect(mapTransactionsWithFeeStub.calledOnceWithExactly(transferTransactions))
      expect(result).toBe('10');
    });
  
    it('should throw error if internal transactions not found', async () => {
      const hash = '0x123abc';
      etherscanServiceMock.fetchIntTxByHash.resolves([]);

      try {
        await transactionService.getTransactionFeeFromApi(hash);
        throw new Error('Test failed: Expected error was not thrown');
      } catch (error) {
        expect(error).toBe('TRANSACTION_NOT_FOUND');
      }
    });
  
    it('should throw error if internal transaction indicates failure', async () => {
      const hash = '0x123abc';
      const internalTransactions = [{ hash, isError: '1', blockNumber: '100' }];
      etherscanServiceMock.fetchIntTxByHash.resolves(internalTransactions as any);

      try {
        await transactionService.getTransactionFeeFromApi(hash);
        throw new Error('Test failed: Expected error was not thrown');
      } catch (error) {
        expect(error).toBe('TRANSACTION_FAILED');
      }
    });
  
    it('should throw error if transaction fee not found in transfer transactions', async () => {
      const hash = '0x123abc';
      const internalTransactions = [{ hash, isError: '0', blockNumber: '100' }];
      const transferTransactions = [{ hash: 'otherHash', fee: '10' }];
  
      etherscanServiceMock.fetchIntTxByHash.resolves(internalTransactions as any);
      etherscanServiceMock.fetchTransferTxs.resolves(transferTransactions as any);
      mapTransactionsWithFeeStub.resolves(transferTransactions as any);

      try {
        await transactionService.getTransactionFeeFromApi(hash);
        throw new Error('Test failed: Expected error was not thrown');
      } catch (error) {
        expect(error).toBe('TRANSACTION_NOT_FOUND');
      }
      expect(mapTransactionsWithFeeStub.calledOnceWithExactly(transferTransactions));
    });
  });
  
});
