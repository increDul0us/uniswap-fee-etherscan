import { ethers } from 'ethers';

export function calculateFee(gasPrice: string, gasUsed: string, ethUsdRate: number) {
  const ethFee = parseFloat(ethers.utils.formatEther(gasPrice)) * parseFloat(gasUsed);
  const usdtFee = ethFee * ethUsdRate;
  return usdtFee.toFixed(2);
}