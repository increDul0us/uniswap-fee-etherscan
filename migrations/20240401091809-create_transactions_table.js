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
