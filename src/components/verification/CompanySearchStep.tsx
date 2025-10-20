import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Search, Building2, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { verificationAPI } from '../../lib/api'

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

  // Mock companies data - will be replaced with API call when backend is ready
  const mockCompanies: Company[] = [
    { id: 1, name: 'Google', domain: 'google.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 2, name: 'Microsoft', domain: 'microsoft.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 3, name: 'Apple', domain: 'apple.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 4, name: 'Amazon', domain: 'amazon.com', industry: 'E-commerce', size: '10,000+', verified: true },
    { id: 5, name: 'Meta', domain: 'meta.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 6, name: 'Netflix', domain: 'netflix.com', industry: 'Entertainment', size: '1,000-10,000', verified: true },
    { id: 7, name: 'Tesla', domain: 'tesla.com', industry: 'Automotive', size: '1,000-10,000', verified: true },
    { id: 8, name: 'Uber', domain: 'uber.com', industry: 'Transportation', size: '1,000-10,000', verified: true },
    { id: 9, name: 'Airbnb', domain: 'airbnb.com', industry: 'Hospitality', size: '1,000-10,000', verified: true },
    { id: 10, name: 'Stripe', domain: 'stripe.com', industry: 'Fintech', size: '100-1,000', verified: true },
    { id: 11, name: 'Wipro', domain: 'wipro.com', industry: 'IT Services', size: '10,000+', verified: true },
    { id: 12, name: 'Infosys', domain: 'infosys.com', industry: 'IT Services', size: '10,000+', verified: true },
    { id: 13, name: 'TCS', domain: 'tcs.com', industry: 'IT Services', size: '10,000+', verified: true },
    { id: 14, name: 'Accenture', domain: 'accenture.com', industry: 'Consulting', size: '10,000+', verified: true },
    { id: 15, name: 'IBM', domain: 'ibm.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 16, name: 'Oracle', domain: 'oracle.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 17, name: 'Salesforce', domain: 'salesforce.com', industry: 'Technology', size: '10,000+', verified: true },
    { id: 18, name: 'Adobe', domain: 'adobe.com', industry: 'Technology', size: '1,000-10,000', verified: true },
    { id: 19, name: 'Spotify', domain: 'spotify.com', industry: 'Entertainment', size: '1,000-10,000', verified: true },
    { id: 20, name: 'Zoom', domain: 'zoom.us', industry: 'Technology', size: '1,000-10,000', verified: true },
    { id: 21, name: 'NRLord', domain: 'nrlord.com', industry: 'Technology', size: '1-100', verified: true },
  ]

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        const response = await verificationAPI.getVerifiedCompanies()
        const companiesData = response.data.companies
        setCompanies(companiesData)
        setFilteredCompanies(companiesData)
        setError('')
      } catch (error) {
        console.error('Failed to fetch companies:', error)
        setError('Failed to load companies. Please try again.')
        // Fallback to mock data
        setCompanies(mockCompanies)
        setFilteredCompanies(mockCompanies)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setLoading(true)
    
    try {
      if (query.trim() === '') {
        setFilteredCompanies(companies)
      } else {
        // Search via API
        const response = await verificationAPI.getVerifiedCompanies(query)
        const searchResults = response.data.companies
        setFilteredCompanies(searchResults)
      }
    } catch (error) {
      console.error('Search failed:', error)
      // Fallback to local search
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.domain.toLowerCase().includes(query.toLowerCase()) ||
        company.industry?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredCompanies(filtered)
    } finally {
      setLoading(false)
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
          disabled={loading}
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
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
