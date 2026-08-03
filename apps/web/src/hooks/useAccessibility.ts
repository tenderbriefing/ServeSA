import { useState, useEffect } from 'react'

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  voiceControl: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  screenReader: false,
  keyboardNavigation: false,
  voiceControl: false,
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('accessibilitySettings')
    if (storedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) })
    }
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement

    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (settings.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    if (settings.screenReader) {
      root.setAttribute('aria-live', 'polite')
    } else {
      root.removeAttribute('aria-live')
    }

    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }

    // Save settings to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return {
    settings,
    updateSetting,
    resetSettings,
  }
}
