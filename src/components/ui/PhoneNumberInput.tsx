import React, { useState, useEffect } from 'react'
import { ChevronDown, Phone } from 'lucide-react'
import { COUNTRY_CODES, validatePhoneNumber, type CountryCode, type PhoneValidationResult } from '../../lib/phoneValidation'

interface PhoneNumberInputProps {
  value?: string
  countryCode?: string
  onChange: (phoneNumber: string, countryCode: string) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function PhoneNumberInput({
  value = '',
  countryCode = '+91',
  onChange,
  onValidationChange,
  placeholder = 'Enter phone number',
  className = '',
  required = false,
  disabled = false
}: PhoneNumberInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find(cc => cc.code === countryCode) || COUNTRY_CODES[0]
  )
  const [phoneNumber, setPhoneNumber] = useState(value || '')

  // Initialize with proper value on mount
  useEffect(() => {
    if (value !== undefined) {
      setPhoneNumber(value || '')
    }
  }, [])

  // Sync internal state with external value prop
  useEffect(() => {
    console.log('PhoneNumberInput: value prop changed', { value, phoneNumber });
    // Always update internal state when prop changes, but avoid infinite loops
    if (value !== undefined && value !== phoneNumber) {
      setPhoneNumber(value || '')
    }
  }, [value])
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null)

  // Update selected country when countryCode prop changes
  useEffect(() => {
    const country = COUNTRY_CODES.find(cc => cc.code === countryCode)
    if (country) {
      setSelectedCountry(country)
    }
  }, [countryCode])

  // Validate phone number when it changes
  useEffect(() => {
    if (phoneNumber.trim()) {
      const result = validatePhoneNumber(phoneNumber, selectedCountry.code)
      setValidationResult(result)
      onValidationChange?.(result.isValid, result.error)
    } else {
      setValidationResult(null)
      onValidationChange?.(true)
    }
  }, [phoneNumber, selectedCountry.code, onValidationChange])

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    onChange(phoneNumber, country.code)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d]/g, '') // Only allow digits
    setPhoneNumber(newValue)
    onChange(newValue, selectedCountry.code)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      <div className="flex">
        {/* Country Code Dropdown */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className={`
            flex items-center justify-between px-3 py-2 border border-r-0 rounded-l-md
            bg-gray-50 text-gray-700 text-sm font-medium
            hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${validationResult && !validationResult.isValid ? 'border-red-300' : 'border-gray-300'}
          `}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{selectedCountry.flag}</span>
            <span>{selectedCountry.code}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              w-full pl-10 pr-3 py-2 border rounded-r-md text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${validationResult && !validationResult.isValid 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
              }
              ${className}
            `}
          />
        </div>
      </div>

      {/* Country Code Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {COUNTRY_CODES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm text-left
                hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                ${selectedCountry.code === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{country.flag}</span>
                <div>
                  <div className="font-medium">{country.name}</div>
                  <div className="text-xs text-gray-500">
                    {country.code} • {country.minLength}-{country.maxLength} digits
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Ex: {country.example}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation Messages */}
      {validationResult && !validationResult.isValid && (
        <p className="mt-1 text-xs text-red-600">
          {validationResult.error}
        </p>
      )}
      
      {validationResult && validationResult.isValid && phoneNumber.trim() && (
        <p className="mt-1 text-xs text-green-600">
          ✓ Valid {selectedCountry.name} phone number
        </p>
      )}

      {/* Help Text */}
      {!validationResult && phoneNumber.trim() === '' && (
        <p className="mt-1 text-xs text-gray-500">
          Enter your phone number (digits only)
        </p>
      )}
    </div>
  )
}
