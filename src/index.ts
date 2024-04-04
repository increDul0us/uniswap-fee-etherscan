import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import router from './route';
import { TransactionService } from './transaction/transaction.service';
import { handleError } from './middleware/handle-error';

const app = express();
const port = process.env.PORT || 8001;

TransactionService.getSingleton().init();

app.use(morgan('dev'));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Uniswap Transaction API Documentation',
      version: '1.0.0',
      description: 'API Documentation for Uniswap Transaction',
    },
  },

  apis: ['./docs/swagger.yml'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(router);
app.use(handleError);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
