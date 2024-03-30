import { Sequelize } from 'sequelize-typescript';
import { config } from '../config/config';
import { Transaction } from './model/transaction.model';

const sequelize = new Sequelize({
  ...config.database,
  sync: {force: false }, // todo: introduce db migrations
  models: [Transaction],
});

export default sequelize;
