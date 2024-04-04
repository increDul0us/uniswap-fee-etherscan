import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'transactions',
})
export class Transaction extends Model<InferAttributes<Transaction>, InferCreationAttributes<Transaction>> {
  @Column({
    primaryKey: true,
    allowNull: false,
  })
  hash!: string;

  @Column(DataType.STRING)
  blockNumber!: string;

  @Column(DataType.STRING)
  timeStamp!: string;

  @Column(DataType.STRING)
  nonce!: string;

  @Column(DataType.STRING)
  blockHash!: string;

  @Column(DataType.STRING)
  gas!: string;

  @Column(DataType.STRING)
  gasPrice!: string;

  @Column(DataType.STRING)
  gasUsed!: string;

  @Column(DataType.STRING)
  cumulativeGasUsed!: string;

  @Column(DataType.STRING)
  fee!: string;
}