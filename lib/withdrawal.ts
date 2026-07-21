export type WithdrawalCharges = {
  fixedFeeNaira: number
  percentageFee: number
}

/**
 * Calculate total withdrawal fee for a given amount
 * @param amount - Withdrawal amount in Naira
 * @param charges - Withdrawal charges config (fixed + percentage)
 * @returns Total fee to deduct
 */
export function calculateWithdrawalFee(amount: number, charges: WithdrawalCharges): number {
  const percentageFee = Math.round((amount * charges.percentageFee) / 100)
  return charges.fixedFeeNaira + percentageFee
}
