import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Search, Building2, CheckCircle, ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react'
import { getApiBaseUrl, verificationAPI } from '../../lib/api'

interface Company {
  id: number
  name: string
  domain: string
  industry?: string
  size?: string
  verified: boolean
}

interface CompanySearchStepProps {
  onCompanySelect: (company: Company) => void
  onPrevious?: () => void
  onNext?: () => void
}

export function CompanySearchStep({ onCompanySelect, onPrevious, onNext }: CompanySearchStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [error, setError] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)


  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        console.log('Fetching companies from API...')
        const apiBaseUrl = getApiBaseUrl()
        console.log('API Base URL:', apiBaseUrl)
        console.log('Full URL:', `${apiBaseUrl}/verification/companies`)
        const response = await verificationAPI.getVerifiedCompanies()
        console.log('API Response:', response)
        const companiesData = response.data.companies
        console.log('Companies data:', companiesData)
        setCompanies(companiesData)
        setFilteredCompanies(companiesData)
        setError('')
        console.log('Successfully loaded companies from database')
      } catch (error) {
        console.error('Failed to fetch companies from API:', error)
        console.error('Error details:', {
          message: (error as any).message,
          status: (error as any).response?.status,
          statusText: (error as any).response?.statusText,
          data: (error as any).response?.data
        })
        setError(`Failed to load companies from database: ${(error as any).message || 'Unknown error'}`)
        // No fallback - show error to user
        setCompanies([])
        setFilteredCompanies([])
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        setLoading(true)
        
        try {
          if (query.trim() === '') {
            setFilteredCompanies(companies)
          } else {
            // Search via API
            console.log('Searching companies via API with query:', query)
            console.log('Search URL:', `${getApiBaseUrl()}/verification/companies?query=${query}`)
            const response = await verificationAPI.getVerifiedCompanies(query)
            console.log('Search API Response:', response)
            const searchResults = response.data.companies
            console.log('Search results:', searchResults)
            setFilteredCompanies(searchResults)
          }
        } catch (error) {
          console.error('Search API failed:', error)
          console.error('Search error details:', {
            message: (error as any).message,
            status: (error as any).response?.status,
            statusText: (error as any).response?.statusText,
            data: (error as any).response?.data
          })
          // No fallback - show error
          setError(`Search failed: ${(error as any).message || 'Unknown error'}`)
          setFilteredCompanies([])
        } finally {
          setLoading(false)
        }
      }, 300) // 300ms delay
    },
    [companies]
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setError('') // Clear any previous errors
    
    // If query is empty, show all companies immediately
    if (query.trim() === '') {
      setFilteredCompanies(companies)
      setLoading(false)
    } else {
      // For non-empty queries, use debounced search
      debouncedSearch(query)
    }
  }

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    setError('')
  }

  const handleContinue = () => {
    if (selectedCompany) {
      onCompanySelect(selectedCompany)
      if (onNext) onNext()
    } else {
      setError('Please select a company to continue')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Find Your Company
        </h3>
        <p className="text-gray-600">
          Search for your company to verify your email domain
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search for your company..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Company List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {loading && searchQuery ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
            <span className="text-gray-500">Searching companies...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No companies found matching your search</p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className={`cursor-pointer transition-all ${
                selectedCompany?.id === company.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleCompanySelect(company)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{company.name}</h4>
                      <p className="text-sm text-gray-500">{company.domain}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {company.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {company.industry}
                          </Badge>
                        )}
                        {company.size && (
                          <Badge variant="outline" className="text-xs">
                            {company.size} employees
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {company.verified && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    )}
                    {selectedCompany?.id === company.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        
        <div className="flex-1" />
        
        <Button 
          onClick={handleContinue}
          disabled={!selectedCompany}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save and Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
