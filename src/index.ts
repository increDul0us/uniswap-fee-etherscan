import express from 'express';
import { ExtractorService } from './services/extractor.service';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

ExtractorService.getSingleton().init();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
