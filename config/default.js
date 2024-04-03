module.exports = {
  database: {
    dialect: 'postgres',
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    logging: false,
    host: process.env.PG_HOST,
    port: 5432,
  },
  etherscan: {
    baseUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHER_SCAN_API_KEY,
  },
  rabbitMqUrl: process.env.RABBIT_MQ_URL,
}