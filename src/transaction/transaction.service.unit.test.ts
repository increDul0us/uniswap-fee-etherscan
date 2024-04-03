import sinon from 'sinon';
import { TransactionService } from './transaction.service';
import { EtherscanService, BinanceService } from '../modules';
import { Transaction } from './model/transaction.model';
import { RabbitMQService } from '../rmq/rabbitmq.service';

describe('TransactionService', () => {
  let etherscanServiceMock: sinon.SinonStubbedInstance<EtherscanService>;
  let binanceServiceMock: sinon.SinonStubbedInstance<BinanceService>;
  let rmqServiceMock: sinon.SinonStubbedInstance<RabbitMQService>;
  let transactionService: TransactionService;

  beforeEach(() => {
    etherscanServiceMock = sinon.createStubInstance(EtherscanService);
    binanceServiceMock = sinon.createStubInstance(BinanceService);
    rmqServiceMock = sinon.createStubInstance(RabbitMQService);
    transactionService = new TransactionService(etherscanServiceMock, binanceServiceMock, rmqServiceMock);
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
      sinon.restore();
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

      expect(getTransactionFeeFromApiStub.calledOnceWithExactly(hash)).toBeTruthy();
      expect(result).toBe(fee);
    });
  });

  describe('getTransactionFeeFromApi', () => {
    let mapTransactionWithFeeStub: sinon.SinonStub;
  
    const hash = '0x123abc';
    beforeEach(() => {
      mapTransactionWithFeeStub = sinon.stub(transactionService, 'mapTransactionWithFee');
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it('should return transaction fee if found in API response', async () => {
      const internalTransactions = [{ isError: '0', blockNumber: '100' }];
      const transferTransaction = { hash, fee: '10' };
  
      etherscanServiceMock.fetchIntTxByHash.resolves(internalTransactions as any);
      etherscanServiceMock.fetchTransferTxs.resolves([transferTransaction] as any);
      mapTransactionWithFeeStub.resolves(transferTransaction as any);
  
      const result = await transactionService.getTransactionFeeFromApi(hash);
  
      expect(mapTransactionWithFeeStub.calledOnceWithExactly(transferTransaction)).toBeTruthy();
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
      const transferTransaction = { hash: 'otherHash', fee: '10' };
  
      etherscanServiceMock.fetchIntTxByHash.resolves(internalTransactions as any);
      etherscanServiceMock.fetchTransferTxs.resolves([transferTransaction] as any);
      mapTransactionWithFeeStub.resolves(transferTransaction as any);

      try {
        await transactionService.getTransactionFeeFromApi(hash);
        throw new Error('Test failed: Expected error was not thrown');
      } catch (error) {
        expect(error).toBe('TRANSACTION_NOT_FOUND');
      }
    });
  });
  
});
