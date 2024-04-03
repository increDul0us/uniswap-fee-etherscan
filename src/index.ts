import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import router from './route';
import { TransactionService } from './transaction/transaction.service';

const app = express();
const port = process.env.PORT || 3000;

app.use(router);

TransactionService.getSingleton().initListeners()

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
