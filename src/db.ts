import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  username: 'username',
  password: 'password',
  database: 'database',
  logging: false,
});

export default sequelize;
