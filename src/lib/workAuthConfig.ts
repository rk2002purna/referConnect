// Country-specific work authorization options
export interface WorkAuthOption {
  value: string
  label: string
  description?: string
}

export interface CountryWorkAuthConfig {
  countryCode: string
  countryName: string
  options: WorkAuthOption[]
}

export const COUNTRY_WORK_AUTH_CONFIGS: CountryWorkAuthConfig[] = [
  {
    countryCode: '+91',
    countryName: 'India',
    options: [
      { value: 'indian_citizen', label: 'Indian Citizen', description: 'Citizen of India' },
      { value: 'indian_nri', label: 'NRI (Non-Resident Indian)', description: 'Indian citizen living abroad' },
      { value: 'indian_oci', label: 'OCI (Overseas Citizen of India)', description: 'Overseas Citizen of India' },
      { value: 'indian_pio', label: 'PIO (Person of Indian Origin)', description: 'Person of Indian Origin' },
      { value: 'work_permit_india', label: 'Work Permit (India)', description: 'Valid work permit for India' },
      { value: 'requires_sponsorship_india', label: 'Requires Sponsorship', description: 'Needs visa sponsorship for India' }
    ]
  },
  {
    countryCode: '+1',
    countryName: 'United States',
    options: [
      { value: 'us_citizen', label: 'US Citizen', description: 'Citizen of the United States' },
      { value: 'us_permanent_resident', label: 'Permanent Resident (Green Card)', description: 'Lawful permanent resident' },
      { value: 'h1b', label: 'H1B Visa', description: 'H1B specialty occupation visa' },
      { value: 'f1_opt', label: 'F1 OPT', description: 'F1 student with Optional Practical Training' },
      { value: 'l1', label: 'L1 Visa', description: 'L1 intracompany transfer visa' },
      { value: 'other_us_visa', label: 'Other US Visa', description: 'Other valid US work visa' },
      { value: 'requires_sponsorship_us', label: 'Requires Sponsorship', description: 'Needs H1B or other visa sponsorship' }
    ]
  },
  {
    countryCode: '+44',
    countryName: 'United Kingdom',
    options: [
      { value: 'uk_citizen', label: 'UK Citizen', description: 'British citizen' },
      { value: 'uk_ilr', label: 'Indefinite Leave to Remain (ILR)', description: 'Permanent residence in UK' },
      { value: 'tier2', label: 'Tier 2 Visa', description: 'Skilled worker visa' },
      { value: 'tier1', label: 'Tier 1 Visa', description: 'High-value migrant visa' },
      { value: 'graduate_route', label: 'Graduate Route Visa', description: 'Post-study work visa' },
      { value: 'other_uk_visa', label: 'Other UK Visa', description: 'Other valid UK work visa' },
      { value: 'requires_sponsorship_uk', label: 'Requires Sponsorship', description: 'Needs UK visa sponsorship' }
    ]
  },
  {
    countryCode: '+49',
    countryName: 'Germany',
    options: [
      { value: 'german_citizen', label: 'German Citizen', description: 'Citizen of Germany' },
      { value: 'eu_citizen', label: 'EU Citizen', description: 'Citizen of EU member state' },
      { value: 'blue_card', label: 'EU Blue Card', description: 'Highly qualified worker permit' },
      { value: 'work_permit_germany', label: 'Work Permit (Germany)', description: 'Valid work permit for Germany' },
      { value: 'student_work', label: 'Student Work Permit', description: 'Work permit for students' },
      { value: 'requires_sponsorship_germany', label: 'Requires Sponsorship', description: 'Needs German visa sponsorship' }
    ]
  },
  {
    countryCode: '+86',
    countryName: 'China',
    options: [
      { value: 'chinese_citizen', label: 'Chinese Citizen', description: 'Citizen of China' },
      { value: 'work_permit_china', label: 'Work Permit (China)', description: 'Valid work permit for China' },
      { value: 'foreign_expert', label: 'Foreign Expert', description: 'Foreign expert certificate' },
      { value: 'student_visa_china', label: 'Student Visa', description: 'Student visa with work rights' },
      { value: 'requires_sponsorship_china', label: 'Requires Sponsorship', description: 'Needs Chinese visa sponsorship' }
    ]
  }
]

export function getWorkAuthConfig(countryCode: string): CountryWorkAuthConfig {
  return COUNTRY_WORK_AUTH_CONFIGS.find(config => config.countryCode === countryCode) || 
         COUNTRY_WORK_AUTH_CONFIGS[0] // Default to India
}

export function getWorkAuthOptions(countryCode: string): WorkAuthOption[] {
  const config = getWorkAuthConfig(countryCode)
  return config.options
}
