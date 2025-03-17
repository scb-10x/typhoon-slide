'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useTranslation } from "@/lib/i18n-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Animated components for hero section
const HeroGradient = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 blur-3xl opacity-70" />
    <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
  </div>
);

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Typhoon Slide Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold">{t('app.title')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link 
              href="/app" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              {t('app.openApp')} <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <HeroGradient />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              {t('hero.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8"
            >
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t('hero.getStarted')} <FiArrowRight />
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <Link 
                href="/app" 
                className="px-8 py-3 rounded-lg bg-white text-indigo-600 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {t('editor.tryTyphoonSlide')} <FiArrowRight />
              </Link>
            </div>
            <Image 
              src="/screenshot.png" 
              alt="Typhoon Present Preview" 
              width={1200} 
              height={675}
              className="w-full h-auto"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('callToAction.title')}</h2>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">{t('callToAction.subtitle')}</p>
          <Link 
            href="/app" 
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-white text-indigo-600 text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {t('callToAction.startCreating')} <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <a 
              href="https://opentyphoon.ai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t('footer.builtWith')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
