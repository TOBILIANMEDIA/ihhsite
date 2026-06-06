export type Plan = {
  id: number
  name: string
  price: number
  daily: number
  total: number
  durationDays: number
  popular?: boolean
}

export const PLANS: Plan[] = [
  { id: 1, name: 'VIP 1', price: 3000, daily: 1000, total: 30000, durationDays: 30 },
  { id: 2, name: 'VIP 2', price: 5000, daily: 1670, total: 50100, durationDays: 30 },
  { id: 3, name: 'VIP 3', price: 10000, daily: 3334, total: 100020, durationDays: 30, popular: true },
  { id: 4, name: 'VIP 4', price: 15000, daily: 5000, total: 150000, durationDays: 30 },
  { id: 5, name: 'VIP 5', price: 20000, daily: 6667, total: 200010, durationDays: 30 },
  { id: 6, name: 'VIP 6', price: 30000, daily: 10000, total: 300000, durationDays: 30 },
  { id: 7, name: 'VIP 7', price: 50000, daily: 16666, total: 499980, durationDays: 30 },
  { id: 8, name: 'VIP 8', price: 80000, daily: 26666, total: 800000, durationDays: 30 },
  { id: 9, name: 'VIP 9', price: 100000, daily: 33333, total: 1000000, durationDays: 30 },
  { id: 10, name: 'VIP 10', price: 200000, daily: 66666, total: 2000000, durationDays: 30 },
  { id: 11, name: 'VIP 11', price: 300000, daily: 100000, total: 3000000, durationDays: 30 },
  { id: 12, name: 'VIP 12', price: 500000, daily: 166666, total: 5000000, durationDays: 30 },
]

export const SITE = {
  name: 'incomehh',
  short: 'IHH',
  tagline: 'Investment Platform',
  signInBonus: 100,
  welcomeBonus: 900,
  investmentBonusPercent: 10,
  minWithdrawal: 1000,
  minDeposit: 3000,
  withdrawalCharge: 18,
  referralLevel1: 20,
  referralLevel2: 3,
  promoterLevel1: 40,
  withdrawalHours: '9 AM to 8 PM Daily',
  inviteCode: 'IHHXQ7',
  telegramGroup: 'https://t.me/ihhsupport',
  telegramChannel: 'https://t.me/incomehh',
  telegramSupport: 'ihhsupport',
  paymentExpiryMinutes: 30,

  // Stake & Spin
  stakeMin: 500,
  stakeMax: 50000,
  // House win probability as a fraction (0.55 = 55% chance user loses)
  stakeHouseEdge: 0.55,
  // Multipliers applied to stake on win
  stakeMultipliers: [1.5, 1.8, 2.0, 2.5, 3.0] as number[],

  // Lucky Draw
  luckyDrawSlotCost: 200,     // cost to buy one extra slot
  luckyDrawFreePerInvestment: 1, // free slots per active investment per day
  luckyDrawPrizeShares: [0.5, 0.3, 0.2] as number[], // 50/30/20 split for top 3

  // Lock Vault tiers: { days, bonusPercent, earlyPenaltyPercent }
  vaultTiers: [
    { days: 7,  bonusPercent: 8,  penaltyPercent: 10 },
    { days: 14, bonusPercent: 18, penaltyPercent: 10 },
    { days: 30, bonusPercent: 40, penaltyPercent: 10 },
  ] as { days: number; bonusPercent: number; penaltyPercent: number }[],
  vaultMin: 1000,

  // Feature flags (admin can toggle via site_settings table)
  features: {
    stakeAndSpin: true,
    luckyDraw: true,
    lockVault: true,
    flashMissions: false,   // scaffold only — off by default
    referralRace: false,    // scaffold only — off by default
  },
}

export function formatNaira(value: number): string {
  return '₦' + value.toLocaleString('en-NG')
}
