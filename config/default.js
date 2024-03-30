module.exports = {
  database: {
    dialect: 'postgres',
    username: 'uniswap',
    password: 'uniswap',
    database: 'uniswap',
    logging: false,
    host: 'postgres-db',
    port: 5432,
  },
  etherscan: {
    baseUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHER_SCAN_API_KEY,
  }
}