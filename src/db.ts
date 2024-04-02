import { Sequelize } from 'sequelize-typescript';
import { config } from '../config/config';

const sequelize = new Sequelize({
  ...config.database,
});

export default sequelize;
