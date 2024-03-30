import { ExtractorService, ITransaction } from './extractor.service';
import { PriceService } from './price.service';

export class RecordService {
  static singleton: RecordService;

  constructor(
    readonly extractorService: ExtractorService,
    readonly priceService: PriceService,
  ) {
    const everyFiveMinutes = 1000 * 60 * 5;
    setInterval(() => this.poll(), everyFiveMinutes); // using setInterval to poll every 5 minutes
  }

  static getSingleton(): RecordService {
    if (!RecordService.singleton) {
      RecordService.singleton = RecordService.createDefault();
    }
    return RecordService.singleton;
  }

  static createDefault() {
    return RecordService.create({
      extractorService: ExtractorService.getSingleton(),
      priceService: PriceService.getSingleton(),
    });
  }

  static create({
    extractorService,
    priceService,
  }: {
    extractorService: ExtractorService,
    priceService: PriceService,
  }) {
    return new RecordService(
      extractorService,
      priceService,
    );
  }
  
  async poll() {
    const latestSavedBlockNumber = null; // todo: fetch from db
    const latestBlockNumber = await this.extractorService.fetchLatestBlockNumber();
    const startBlock = latestSavedBlockNumber ?? latestBlockNumber - 10 ;

    const transactions = await this.extractorService.fetchTxs(19545093, 19545103);
    const transactionsWithFee = await this.mapTransactionsWithFee(transactions);
    // todo: batch transactionsWithFee data to db
  }

  async mapTransactionsWithFee(transactions: ITransaction[]) {
    if(!transactions.length) return transactions

    // we are assuming all transactions within same time frame. Hence, We do not need to keep fetching the eth-usd price for each transactions
   const timeStamp = transactions[0].timeStamp;
   const ethUsdRate = await PriceService.getSingleton().getEthUsdRate(timeStamp);
   console.log({ethUsdRate});

   const transactionsWithFee = transactions.map(transaction => {
     const fee = this.extractorService.calculateFee(transaction, ethUsdRate);
     return { ...transaction, fee }
   });

   return transactionsWithFee;
  }
}