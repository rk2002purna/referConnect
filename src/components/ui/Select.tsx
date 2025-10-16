import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
  name?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export const Select = ({ value, onValueChange, children, className = '', disabled = false, name }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedValue(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleItemClick = (itemValue: string) => {
    setSelectedValue(itemValue)
    onValueChange?.(itemValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: handleToggle,
              onKeyDown: handleKeyDown,
              isOpen,
              disabled,
              selectedValue
            })
          }
          if (child.type === SelectContent) {
            if (isOpen) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onItemClick: handleItemClick,
                selectedValue
              })
            }
            return null
          }
        }
        return child
      })}
    </div>
  )
}

export const SelectTrigger = ({ children, className = '', onClick, onKeyDown, isOpen, disabled, selectedValue }: SelectTriggerProps & { onClick?: () => void; onKeyDown?: (event: React.KeyboardEvent) => void; isOpen?: boolean; disabled?: boolean; selectedValue?: string }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectValue) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue
          })
        }
        return child
      })}
      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}

export const SelectContent = ({ children, className = '', onItemClick, selectedValue }: SelectContentProps & { onItemClick?: (value: string) => void; selectedValue?: string }) => {
  return (
    <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          const childProps = child.props as any
          return React.cloneElement(child as React.ReactElement<any>, {
            onClick: () => onItemClick?.(childProps.value),
            isSelected: childProps.value === selectedValue
          })
        }
        return child
      })}
    </div>
  )
}

export const SelectItem = ({ value, children, className = '', onClick, isSelected }: SelectItemProps & { onClick?: () => void; isSelected?: boolean }) => {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export const SelectValue = ({ placeholder, className = '', selectedValue }: SelectValueProps & { selectedValue?: string }) => {
  return <span className={className}>{selectedValue || placeholder || 'Select an option'}</span>
}
