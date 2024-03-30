import { Sequelize } from 'sequelize-typescript';
import { config } from '../config/config';
import { Transaction } from './model/transaction.model';

console.log(config.database);
const sequelize = new Sequelize({
  ...config.database,
  sync: {force: true, logging: true },
  models: [Transaction],
});

export default sequelize;
