import { calculateFee } from './util';

describe('calculateFee', () => {
  it('should calculate the fee correctly', () => {
    const expectedFee = '2.10';
    const fee = calculateFee('50000000000', '21000', 2000);

    expect(fee).toEqual(expectedFee);
  });
});
