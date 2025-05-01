'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import { useTranslation } from "@/lib/i18n-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ReactNode } from 'react';
import { FaGithub } from 'react-icons/fa';
import { useState, useEffect } from 'react';

// Animated background elements
const BackgroundElements = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-primary opacity-5"></div>
    <div className="bg-noise"></div>

    {/* Gradient blobs */}
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{
        opacity: [0.6, 0.8, 0.6],
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-[80px]"
    />
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{
        opacity: [0.6, 0.8, 0.6],
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-500/20 blur-[80px]"
    />
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.03, 1],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-pink-500/20 blur-[64px]"
    />
  </div>
);

// Feature card component with proper TypeScript interface
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  id?: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-start">
    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function HomePage() {
  const { t } = useTranslation();
  const [showGithubLink, setShowGithubLink] = useState(false);

  // Check if current date is after release date for GitHub button
  useEffect(() => {
    const checkDate = () => {
      const releaseDate = new Date('2025-05-08T17:00:01Z');
      setShowGithubLink(new Date() > releaseDate);
    };

    // Check initially
    checkDate();

    // Check every minute
    const interval = setInterval(checkDate, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Typhoon Slide Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold text-gradient-subtle">{t('app.title')}</span>
            <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-md">DEMO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/methodology"
              className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {t('navigation.howItWorks')}
            </Link>
            <LanguageSwitcher />
            {showGithubLink && (
              <Link
                href="https://github.com/scb-10x/typhoon-mdx-slide-creator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                id="github-source-link"
                aria-label="View source code on GitHub"
              >
                <FaGithub className="w-5 h-5" />
              </Link>
            )}
            <Link
              href="/app"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-white hover:shadow-md transition-all button-shine"
              id="header-open-app-button"
            >
              {t('app.openApp')} <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <BackgroundElements />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-4 px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium"
            >
              ✨ {t('hero.tagline')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl font-bold mb-6 text-gradient"
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
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-medium text-white bg-gradient-primary rounded-lg hover:shadow-md transition-all button-shine"
                id="hero-get-started-button"
              >
                {t('hero.getStarted')} <FiArrowRight />
              </Link>
              <Link
                href="/methodology"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-all"
                id="hero-how-it-works-button"
              >
                {t('navigation.howItWorks')}
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <Link
                href="/app"
                className="px-8 py-3 rounded-lg bg-white text-indigo-600 text-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 button-shine"
                id="preview-try-typhoon-button"
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="bg-noise"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gradient-subtle">{t('features.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="animate-float"
            >
              <FeatureCard
                icon={<FiCheck size={24} />}
                title={t('features.feature1.title')}
                description={t('features.feature1.description')}
                id="feature-card-1"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="animate-float-reverse"
            >
              <FeatureCard
                icon={<FiCheck size={24} />}
                title={t('features.feature2.title')}
                description={t('features.feature2.description')}
                id="feature-card-2"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="animate-float"
            >
              <FeatureCard
                icon={<FiCheck size={24} />}
                title={t('features.feature3.title')}
                description={t('features.feature3.description')}
                id="feature-card-3"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-95"></div>
        <div className="bg-noise"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">{t('callToAction.title')}</h2>
            <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">{t('callToAction.subtitle')}</p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-indigo-600 text-lg font-medium shadow-lg hover:shadow-xl transition-all button-shine"
              id="cta-open-app-button"
            >
              {t('callToAction.buttonText')} <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
