'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import i18next from 'i18next';
import { initReactI18next, useTranslation as useNextI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from '../../public/locales/en/common.json';
import thCommon from '../../public/locales/th/common.json';

// Initialize i18next
i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: enCommon,
      },
      th: {
        common: thCommon,
      },
    },
    defaultNS: 'common',
  });

type I18nContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
};

export const I18nContext = createContext<I18nContextType>({
  language: 'en',
  changeLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useNextI18next();

  useEffect(() => {
    // Get language from URL params first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('language');
    
    const detectedLang = urlLang || storedLang || 'en';
    
    // If URL has a language param that's different from localStorage,
    // update localStorage to match
    if (urlLang && storedLang !== urlLang) {
      localStorage.setItem('language', urlLang);
    }
    
    setLanguage(detectedLang);
    i18next.changeLanguage(detectedLang);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    i18next.changeLanguage(lang);
    
    // Update URL with new language parameter
    const urlParams = new URLSearchParams(window.location.search);
    // Remove old lang parameter if it exists and add the new one
    urlParams.delete('lang');
    urlParams.set('lang', lang);
    const newSearch = urlParams.toString();
    
    // Avoid full page reload by using router.push
    router.push(`${pathname}${newSearch ? `?${newSearch}` : ''}`);
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
} 