import express from 'express';
import { ExtractorService } from './services/extractor.service';
import { PriceService } from './services/price.service';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// ExtractorService.getSingleton().init();
PriceService.getSingleton().getEthUsdConversionRate('1711761887');

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
