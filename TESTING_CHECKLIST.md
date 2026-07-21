# C.I.Limited End-to-End Testing Checklist

After all fixes, verify every user journey works correctly without broken chains.

## User Authentication & Onboarding
- [ ] Sign up with email → account created
- [ ] Verify email link works
- [ ] Sign in bonus (₦1,000) appears in wallet balance immediately
- [ ] Profile page shows correct balance and frozen balance
- [ ] Dashboard loads without errors

## Deposit Flow
- [ ] User initiates deposit → shown available bank account
- [ ] Admin marks deposit as "pending" in admin panel
- [ ] User's transaction history shows deposit as "pending"
- [ ] Admin approves deposit → user balance is **INSTANTLY credited** (FIXED BUG)
- [ ] Deposit shows as "completed" in transaction history
- [ ] User's `totalDeposited` increases
- [ ] User's balance widget reflects the deposit

## Investment Purchase
- [ ] User selects plan and completes purchase
- [ ] Balance deducts investment amount immediately
- [ ] 10% investment bonus (e.g., ₦400 for ₦4k plan) credits to balance
- [ ] Bonus appears in transaction history
- [ ] Daily earnings start appearing in "Today" earnings card
- [ ] Frozen balance unfreeze immediately after first investment
- [ ] Referral earnings (from referrals of this user) move from frozen → live balance

## Daily Earnings & Income
- [ ] Daily earnings calculated at 21% (e.g., ₦840/day for ₦4k plan)
- [ ] Earnings appear in transaction history each day
- [ ] Balance increases accordingly
- [ ] "Today", "Yesterday", "Week", "Month" cards show correct earnings breakdown
- [ ] `totalEarned` increases with daily income

## Referral Income
- [ ] Referred user makes first deposit
- [ ] Referrer immediately receives 21% commission
- [ ] Commission shows in transaction history
- [ ] Referrer's balance increases
- [ ] Team/referral page shows correct referral count and earnings
- [ ] Only paid once per referral (no duplicate payments on subsequent investments)

## Withdrawal
- [ ] Outside 9 AM–5 PM: "Withdrawal Unavailable" message shown
- [ ] Countdown timer shows time until 9 AM (Nigeria time)
- [ ] After 23-hour cooldown: "Please try again in Xh Ym" message
- [ ] Within window + past cooldown: withdrawal request succeeds
- [ ] Balance frozen immediately (deducted)
- [ ] Transaction created with "pending" status
- [ ] User sees last withdrawal time and cooldown countdown

## Admin Actions
- [ ] Admin adjusts user balance (e.g., ₦+1000) → balance increases immediately (FIXED BUG)
- [ ] Admin adjusts negative (₦-500) → balance decreases (no totalEarned change)
- [ ] Transaction history shows admin adjustments
- [ ] Admin rejects withdrawal → balance refunded and unfrozen (FIXED BUG)
- [ ] Withdrawal rejection shows in transaction history as "refund"

## Gift Codes
- [ ] User redeems gift code → credited immediately
- [ ] Balance updates without needing dashboard refresh
- [ ] Transaction shows gift code redemption
- [ ] Already-redeemed code shows error on retry

## Lucky Draw (if active)
- [ ] Slot entries deduct balance correctly
- [ ] Winners credited with prizes
- [ ] Transaction history shows all entries and wins
- [ ] Draw winners show in admin panel

## Data Consistency Checks
- [ ] User balance = all credits - all debits
- [ ] `totalEarned` = all earning-type transactions
- [ ] `totalDeposited` = all approved deposits
- [ ] `totalWithdrawn` = all approved withdrawals
- [ ] `frozenBalance` = 0 after first investment (unfrozen)
- [ ] Account never shows negative balance
- [ ] Transaction history complete for all actions

## Admin Dashboard
- [ ] Overview stats show correct totals
- [ ] Financials tab shows aggregates
- [ ] Users tab shows all users with correct balance
- [ ] Withdrawals tab shows pending + approved
- [ ] Deposits tab shows pending + completed
- [ ] Transactions filtered correctly by type
- [ ] No SQL errors in browser console

## Mobile & Responsive
- [ ] All pages render correctly on mobile (370px width)
- [ ] Buttons are clickable and responsive
- [ ] Numbers formatted correctly with ₦ and commas
- [ ] Countdown timers work without stalling

## Critical Bugs (Already Fixed)
- [x] Admin adjust balance now updates totalEarned
- [x] Withdrawal rejection now updates totalEarned
- [x] Gift code credit uses upsert so wallet row always exists
- [x] Removed unused admin tabs (Gift Codes, Promoter Codes, Milestones)

---

**After completing this checklist, the platform should be production-ready with no broken balance chains.**
