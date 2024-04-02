'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      hash: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      blockNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timeStamp: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nonce: {
        type: Sequelize.STRING,
        allowNull: false
      },
      blockHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      from: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contractAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      to: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tokenName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tokenSymbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tokenDecimal: {
        type: Sequelize.STRING,
        allowNull: false
      },
      transactionIndex: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gas: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gasPrice: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gasUsed: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cumulativeGasUsed: {
        type: Sequelize.STRING,
        allowNull: false
      },
      input: {
        type: Sequelize.STRING,
        allowNull: false
      },
      confirmations: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fee: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('transactions', ['blockNumber']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};
