export type Plan = {
  id: number
  name: string
  price: number
  daily: number
  total: number
  durationDays: number
  popular?: boolean
}

// Construction tier labels — grouped by phase
export const PLAN_TIERS: Record<number, { phase: string; label: string; color: string }> = {
  1:  { phase: 'Foundation', label: 'F-01', color: 'text-stone-400' },
  2:  { phase: 'Foundation', label: 'F-02', color: 'text-stone-400' },
  3:  { phase: 'Foundation', label: 'F-03', color: 'text-stone-400' },
  4:  { phase: 'Structure',  label: 'S-01', color: 'text-primary' },
  5:  { phase: 'Structure',  label: 'S-02', color: 'text-primary' },
  6:  { phase: 'Structure',  label: 'S-03', color: 'text-primary' },
  7:  { phase: 'Framework',  label: 'FW-01', color: 'text-sky-400' },
  8:  { phase: 'Framework',  label: 'FW-02', color: 'text-sky-400' },
  9:  { phase: 'Framework',  label: 'FW-03', color: 'text-sky-400' },
  10: { phase: 'Skyline',    label: 'SK-01', color: 'text-amber-400' },
  11: { phase: 'Skyline',    label: 'SK-02', color: 'text-amber-400' },
  12: { phase: 'Skyline',    label: 'SK-03', color: 'text-amber-400' },
}

// All plans run 90 days. Daily returns scale from ₦800/day at entry level.
// Total = daily × 90
export const PLANS: Plan[] = [
  { id: 1,  name: 'Foundation F-01', price: 3000,   daily: 800,    total: 72000,    durationDays: 90 },
  { id: 2,  name: 'Foundation F-02', price: 6000,   daily: 1400,   total: 126000,   durationDays: 90 },
  { id: 3,  name: 'Foundation F-03', price: 10000,  daily: 2800,   total: 252000,   durationDays: 90 },
  { id: 4,  name: 'Structure S-01',  price: 15000,  daily: 4200,   total: 378000,   durationDays: 90 },
  { id: 5,  name: 'Structure S-02',  price: 20000,  daily: 5600,   total: 504000,   durationDays: 90 },
  { id: 6,  name: 'Structure S-03',  price: 30000,  daily: 8400,   total: 756000,   durationDays: 90, popular: true },
  { id: 7,  name: 'Framework FW-01', price: 50000,  daily: 14000,  total: 1260000,  durationDays: 90 },
  { id: 8,  name: 'Framework FW-02', price: 80000,  daily: 22400,  total: 2016000,  durationDays: 90 },
  { id: 9,  name: 'Framework FW-03', price: 100000, daily: 28000,  total: 2520000,  durationDays: 90 },
  { id: 10, name: 'Skyline SK-01',   price: 200000, daily: 56000,  total: 5040000,  durationDays: 90 },
  { id: 11, name: 'Skyline SK-02',   price: 300000, daily: 84000,  total: 7560000,  durationDays: 90 },
  { id: 12, name: 'Skyline SK-03',   price: 500000, daily: 140000, total: 12600000, durationDays: 90 },
]

export const SITE = {
  name: 'C.I.Limited',
  short: 'C.I.L',
  tagline: 'Construction Investment Limited',
  signInBonus: 100,
  welcomeBonus: 600,
  investmentBonusPercent: 10,
  minWithdrawal: 1000,
  minDeposit: 3000,
  withdrawalCharge: 18,
  referralLevel1: 20,
  referralLevel2: 3,
  promoterLevel1: 30,
  withdrawalHours: '9 AM – 5 PM',
  withdrawalProcessingTime: '0 – 1 hour',
  inviteCode: 'CILXQ7',
  telegramGroup: 'https://t.me/cilsupport',
  telegramChannel: 'https://t.me/cilimited',
  telegramSupport: 'cilsupport',
  paymentExpiryMinutes: 30,

  // Stake & Spin
  stakeMin: 500,
  stakeMax: 50000,
  // House win probability as a fraction (0.70 = 70% chance user loses)
  stakeHouseEdge: 0.70,
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
