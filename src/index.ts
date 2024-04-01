import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { TransactionService } from './transaction.service';
import sequelize from './db';
import { getTransactionFee } from './transaction.controller';
sequelize.sync().then(ts=> TransactionService.getSingleton().poll()); // todo remove this

const app = express();
const port = process.env.PORT || 3000;

app.get('/transaction/:hash/fee', getTransactionFee);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
