import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import router from './route';
import { TransactionService } from './transaction/transaction.service';
import { handleError } from './middleware/handle-error';

TransactionService.getSingleton().init();

const app = express();
const port = process.env.PORT || 8001;

app.use(morgan('dev'));
app.use(router);
app.use(handleError);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
