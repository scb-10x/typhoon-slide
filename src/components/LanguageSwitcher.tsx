'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { FiGlobe } from 'react-icons/fi';

type Language = {
  code: string;
  name: string;
};

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'th', name: 'ไทย' },
];

export default function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current language from localStorage or default to 'en'
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang);

    // Update the URL without duplicating parameters
    const { pathname, search } = window.location;
    const urlParams = new URLSearchParams(search);

    // Replace any existing lang parameter
    urlParams.set('lang', lang);

    // Create the new URL and navigate to it
    const newSearch = urlParams.toString();
    window.location.href = `${pathname}${newSearch ? `?${newSearch}` : ''}`;

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 md:py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('navigation.language')}
        id="language-switcher-button"
      >
        <FiGlobe className="w-4 h-4" />
        <span className="hidden sm:inline-block">{languages.find(l => l.code === currentLang)?.name}</span>
        <span className="sm:hidden">{currentLang.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 md:right-0 right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-1 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`w-full text-left px-4 py-3 md:py-2 hover:bg-gray-100 ${
                currentLang === language.code ? 'bg-gray-50 font-medium' : ''
              }`}
              onClick={() => changeLanguage(language.code)}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 