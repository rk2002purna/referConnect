// Country-specific salary configurations
export interface SalaryConfig {
  currency: string
  currencySymbol: string
  format: 'annual' | 'lpa' | 'monthly'
  ranges: Array<{
    label: string
    min: number
    max: number
  }>
}

export const COUNTRY_SALARY_CONFIGS: Record<string, SalaryConfig> = {
  '+91': { // India
    currency: 'INR',
    currencySymbol: '₹',
    format: 'lpa',
    ranges: [
      { label: 'Under 3 LPA', min: 0, max: 300000 },
      { label: '3-5 LPA', min: 300000, max: 500000 },
      { label: '5-8 LPA', min: 500000, max: 800000 },
      { label: '8-12 LPA', min: 800000, max: 1200000 },
      { label: '12-20 LPA', min: 1200000, max: 2000000 },
      { label: '20+ LPA', min: 2000000, max: 10000000 }
    ]
  },
  '+1': { // United States
    currency: 'USD',
    currencySymbol: '$',
    format: 'annual',
    ranges: [
      { label: 'Under $30k', min: 0, max: 30000 },
      { label: '$30k - $50k', min: 30000, max: 50000 },
      { label: '$50k - $75k', min: 50000, max: 75000 },
      { label: '$75k - $100k', min: 75000, max: 100000 },
      { label: '$100k - $150k', min: 100000, max: 150000 },
      { label: '$150k+', min: 150000, max: 1000000 }
    ]
  },
  '+44': { // United Kingdom
    currency: 'GBP',
    currencySymbol: '£',
    format: 'annual',
    ranges: [
      { label: 'Under £25k', min: 0, max: 25000 },
      { label: '£25k - £40k', min: 25000, max: 40000 },
      { label: '£40k - £60k', min: 40000, max: 60000 },
      { label: '£60k - £80k', min: 60000, max: 80000 },
      { label: '£80k - £100k', min: 80000, max: 100000 },
      { label: '£100k+', min: 100000, max: 500000 }
    ]
  },
  '+49': { // Germany
    currency: 'EUR',
    currencySymbol: '€',
    format: 'annual',
    ranges: [
      { label: 'Under €30k', min: 0, max: 30000 },
      { label: '€30k - €50k', min: 30000, max: 50000 },
      { label: '€50k - €70k', min: 50000, max: 70000 },
      { label: '€70k - €90k', min: 70000, max: 90000 },
      { label: '€90k - €120k', min: 90000, max: 120000 },
      { label: '€120k+', min: 120000, max: 300000 }
    ]
  },
  '+86': { // China
    currency: 'CNY',
    currencySymbol: '¥',
    format: 'annual',
    ranges: [
      { label: 'Under ¥100k', min: 0, max: 100000 },
      { label: '¥100k - ¥200k', min: 100000, max: 200000 },
      { label: '¥200k - ¥300k', min: 200000, max: 300000 },
      { label: '¥300k - ¥500k', min: 300000, max: 500000 },
      { label: '¥500k - ¥800k', min: 500000, max: 800000 },
      { label: '¥800k+', min: 800000, max: 2000000 }
    ]
  }
}

export function getSalaryConfig(countryCode: string): SalaryConfig {
  return COUNTRY_SALARY_CONFIGS[countryCode] || COUNTRY_SALARY_CONFIGS['+91'] // Default to India
}

export function formatSalaryAmount(amount: number, config: SalaryConfig): string {
  if (config.format === 'lpa') {
    // Convert to LPA (Lakhs Per Annum) for India
    const lpa = amount / 100000
    return `${config.currencySymbol}${lpa.toFixed(1)} LPA`
  } else if (config.format === 'annual') {
    return `${config.currencySymbol}${amount.toLocaleString()}`
  } else {
    return `${config.currencySymbol}${amount.toLocaleString()}`
  }
}
