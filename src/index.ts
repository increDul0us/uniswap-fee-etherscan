import express from 'express';
import { ExtractorService } from './services/extractor.service';
import { PriceService } from './services/price.service';
import { RecordService } from './services/record.service';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// ExtractorService.getSingleton().init();
// PriceService.getSingleton().getEthUsdConversionRate('1711761887');
RecordService.getSingleton().poll();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
