export default interface IConfig {
  database: {
    dialect: Dialect;
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    logging: boolean;
  }
  etherscan: {
    baseUrl: string,
    apiKey: string,
  }
}