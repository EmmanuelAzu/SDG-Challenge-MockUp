/**
 * ILLUSTRATIVE South African tax figures for the First Payslip simulator.
 * `verified: false` means the team has NOT checked these against the current SARS tables, so the UI labels
 * everything "Illustrative figures". Update these numbers (and flip `verified`) after checking sars.gov.za.
 */
export const TAX_ZA = {
  verified: false,
  taxYear: 'illustrative, based on a recent tax year',
  source: 'https://www.sars.gov.za/',
  /** Annual taxable income brackets: tax = base + rate × (income − over) */
  brackets: [
    { over: 0, base: 0, rate: 0.18 },
    { over: 237_100, base: 42_678, rate: 0.26 },
    { over: 370_500, base: 77_362, rate: 0.31 },
    { over: 512_800, base: 121_475, rate: 0.36 },
    { over: 673_000, base: 179_147, rate: 0.39 },
    { over: 857_900, base: 251_258, rate: 0.41 },
    { over: 1_817_000, base: 644_489, rate: 0.45 },
  ],
  primaryRebate: 17_235,
  uif: { rate: 0.01, monthlyCeiling: 17_712 },
  /** Retirement contributions are deductible up to this share of income and annual cap. */
  retirement: { maxShare: 0.275, annualCap: 350_000, sliderMaxPct: 15 },
} as const;
