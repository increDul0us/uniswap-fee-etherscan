import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import router from './route';

const app = express();
const port = process.env.PORT || 3000;

app.use(router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
