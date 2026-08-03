'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityContextType {
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  toggleHighContrast: () => void
  toggleLargeText: () => void
  toggleScreenReader: () => void
  toggleKeyboardNavigation: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast') === 'true'
    const savedLargeText = localStorage.getItem('largeText') === 'true'
    const savedScreenReader = localStorage.getItem('screenReader') === 'true'
    const savedKeyboardNavigation = localStorage.getItem('keyboardNavigation') === 'true'

    setHighContrast(savedHighContrast)
    setLargeText(savedLargeText)
    setScreenReader(savedScreenReader)
    setKeyboardNavigation(savedKeyboardNavigation)
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement
    
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    if (largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }
    
    if (screenReader) {
      root.classList.add('screen-reader-friendly')
    } else {
      root.classList.remove('screen-reader-friendly')
    }
    
    if (keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }
  }, [highContrast, largeText, screenReader, keyboardNavigation])

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('highContrast', newValue.toString())
  }

  const toggleLargeText = () => {
    const newValue = !largeText
    setLargeText(newValue)
    localStorage.setItem('largeText', newValue.toString())
  }

  const toggleScreenReader = () => {
    const newValue = !screenReader
    setScreenReader(newValue)
    localStorage.setItem('screenReader', newValue.toString())
  }

  const toggleKeyboardNavigation = () => {
    const newValue = !keyboardNavigation
    setKeyboardNavigation(newValue)
    localStorage.setItem('keyboardNavigation', newValue.toString())
  }

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        largeText,
        screenReader,
        keyboardNavigation,
        toggleHighContrast,
        toggleLargeText,
        toggleScreenReader,
        toggleKeyboardNavigation,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
