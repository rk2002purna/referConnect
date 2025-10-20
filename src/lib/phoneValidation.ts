// Phone number validation utilities
export interface CountryCode {
  code: string
  name: string
  flag: string
  minLength: number
  maxLength: number
  pattern: RegExp
  example: string
}

export const COUNTRY_CODES: CountryCode[] = [
  {
    code: '+91',
    name: 'India',
    flag: '🇮🇳',
    minLength: 10,
    maxLength: 10,
    pattern: /^[6-9]\d{9}$/,
    example: '9876543210'
  },
  {
    code: '+1',
    name: 'United States',
    flag: '🇺🇸',
    minLength: 10,
    maxLength: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    example: '5551234567'
  },
  {
    code: '+44',
    name: 'United Kingdom',
    flag: '🇬🇧',
    minLength: 10,
    maxLength: 11,
    pattern: /^[1-9]\d{9,10}$/,
    example: '7700123456'
  },
  {
    code: '+49',
    name: 'Germany',
    flag: '🇩🇪',
    minLength: 10,
    maxLength: 12,
    pattern: /^[1-9]\d{9,11}$/,
    example: '15123456789'
  },
  {
    code: '+33',
    name: 'France',
    flag: '🇫🇷',
    minLength: 9,
    maxLength: 10,
    pattern: /^[1-9]\d{8,9}$/,
    example: '123456789'
  },
  {
    code: '+86',
    name: 'China',
    flag: '🇨🇳',
    minLength: 11,
    maxLength: 11,
    pattern: /^1[3-9]\d{9}$/,
    example: '13812345678'
  },
  {
    code: '+81',
    name: 'Japan',
    flag: '🇯🇵',
    minLength: 10,
    maxLength: 11,
    pattern: /^[789]0\d{8,9}$/,
    example: '9012345678'
  },
  {
    code: '+61',
    name: 'Australia',
    flag: '🇦🇺',
    minLength: 9,
    maxLength: 9,
    pattern: /^[2-478]\d{8}$/,
    example: '412345678'
  },
  {
    code: '+55',
    name: 'Brazil',
    flag: '🇧🇷',
    minLength: 10,
    maxLength: 11,
    pattern: /^[1-9]\d{9,10}$/,
    example: '11987654321'
  },
  {
    code: '+7',
    name: 'Russia',
    flag: '🇷🇺',
    minLength: 10,
    maxLength: 10,
    pattern: /^[3-9]\d{9}$/,
    example: '9123456789'
  },
  {
    code: '+39',
    name: 'Italy',
    flag: '🇮🇹',
    minLength: 9,
    maxLength: 10,
    pattern: /^[3]\d{8,9}$/,
    example: '3123456789'
  },
  {
    code: '+34',
    name: 'Spain',
    flag: '🇪🇸',
    minLength: 9,
    maxLength: 9,
    pattern: /^[6-9]\d{8}$/,
    example: '612345678'
  }
]

export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  formattedNumber?: string
  countryCode?: CountryCode
}

export function validatePhoneNumber(phoneNumber: string, countryCode: string): PhoneValidationResult {
  // Remove all non-digit characters except +
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '')
  
  // Find the country code
  const country = COUNTRY_CODES.find(cc => cc.code === countryCode)
  if (!country) {
    return {
      isValid: false,
      error: 'Invalid country code'
    }
  }

  // Remove country code from the number if present
  let numberWithoutCode = cleanNumber
  if (cleanNumber.startsWith(countryCode)) {
    numberWithoutCode = cleanNumber.substring(countryCode.length)
  }

  // Check length
  if (numberWithoutCode.length < country.minLength || numberWithoutCode.length > country.maxLength) {
    return {
      isValid: false,
      error: `Phone number must be ${country.minLength}-${country.maxLength} digits for ${country.name}`
    }
  }

  // Check pattern
  if (!country.pattern.test(numberWithoutCode)) {
    return {
      isValid: false,
      error: `Invalid phone number format for ${country.name}. Example: ${country.example}`
    }
  }

  // Format the number
  const formattedNumber = `${countryCode}${numberWithoutCode}`

  return {
    isValid: true,
    formattedNumber,
    countryCode: country
  }
}

export function formatPhoneNumber(phoneNumber: string, countryCode: string): string {
  const result = validatePhoneNumber(phoneNumber, countryCode)
  return result.formattedNumber || phoneNumber
}

export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find(cc => cc.code === code)
}

export function getCountryByName(name: string): CountryCode | undefined {
  return COUNTRY_CODES.find(cc => cc.name.toLowerCase().includes(name.toLowerCase()))
}
