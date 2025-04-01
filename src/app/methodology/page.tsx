'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useTranslation } from "@/lib/i18n-provider";

// Flow chart components
const FlowBox = ({ title, description, step, className, children }: {
  title: string;
  description: string;
  step: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={`rounded-lg p-5 shadow-md relative ${className || 'bg-indigo-50'}`}>
    <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
      {step}
    </div>
    <h3 className="font-bold mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
    {children}
  </div>
);

const FlowArrow = ({ direction = 'down' }: { direction?: 'down' | 'right' }) => {
  if (direction === 'right') {
    return (
      <div className="flex items-center justify-center w-16 h-8">
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M39.7071 8.70711C40.0976 8.31658 40.0976 7.68342 39.7071 7.29289L33.3431 0.928932C32.9526 0.538408 32.3195 0.538408 31.9289 0.928932C31.5384 1.31946 31.5384 1.95262 31.9289 2.34315L37.5858 8L31.9289 13.6569C31.5384 14.0474 31.5384 14.6805 31.9289 15.0711C32.3195 15.4616 32.9526 15.4616 33.3431 15.0711L39.7071 8.70711ZM0 9H39V7H0V9Z" fill="#6366F1" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-12">
      <svg width="16" height="40" viewBox="0 0 16 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.29289 39.7071C7.68342 40.0976 8.31658 40.0976 8.70711 39.7071L15.0711 33.3431C15.4616 32.9526 15.4616 32.3195 15.0711 31.9289C14.6805 31.5384 14.0474 31.5384 13.6569 31.9289L8 37.5858L2.34315 31.9289C1.95262 31.5384 1.31946 31.5384 0.928932 31.9289C0.538408 32.3195 0.538408 32.9526 0.928932 33.3431L7.29289 39.7071ZM7 0V39H9V0H7Z" fill="#6366F1" />
      </svg>
    </div>
  );
};

export default function MethodologyPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const { t } = useTranslation();

  const steps = [
    {
      key: "understanding",
      backgroundColor: "bg-blue-50",
      borderColor: "border-blue-500"
    },
    {
      key: "planning",
      backgroundColor: "bg-purple-50",
      borderColor: "border-purple-500"
    },
    {
      key: "extracting",
      backgroundColor: "bg-green-50",
      borderColor: "border-green-500"
    },
    {
      key: "generating",
      backgroundColor: "bg-amber-50",
      borderColor: "border-amber-500"
    },
    {
      key: "refining",
      backgroundColor: "bg-rose-50",
      borderColor: "border-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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
            <span className="text-xl font-semibold">{t('methodology.pageTitle')}</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiArrowLeft /> {t('methodology.backToHome')}
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Title Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            {t('methodology.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            {t('methodology.subtitle')}
          </motion.p>
        </div>

        {/* Main Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="p-8 rounded-xl bg-white shadow-xl">
            <div className="flex flex-col gap-4">
              {/* Step 1 */}
              <div
                className={`cursor-pointer transition-all duration-300 ${activeStep === 0 ? 'scale-105' : 'opacity-90'}`}
                onClick={() => setActiveStep(0)}
              >
                <FlowBox
                  step="1"
                  title={t(`methodology.steps.understanding.title`)}
                  description={t(`methodology.steps.understanding.description`)}
                  className={`${steps[0].backgroundColor} border-l-4 ${steps[0].borderColor}`}
                />
              </div>

              <FlowArrow />

              {/* Step 2 */}
              <div
                className={`cursor-pointer transition-all duration-300 ${activeStep === 1 ? 'scale-105' : 'opacity-90'}`}
                onClick={() => setActiveStep(1)}
              >
                <FlowBox
                  step="2"
                  title={t(`methodology.steps.planning.title`)}
                  description={t(`methodology.steps.planning.description`)}
                  className={`${steps[1].backgroundColor} border-l-4 ${steps[1].borderColor}`}
                />
              </div>

              <FlowArrow />

              {/* Step 3 */}
              <div className="grid grid-cols-5 gap-4 relative">
                <div className="col-span-2">
                  <div
                    className={`cursor-pointer transition-all duration-300 ${activeStep === 2 ? 'scale-105' : 'opacity-90'}`}
                    onClick={() => setActiveStep(2)}
                  >
                    <FlowBox
                      step="3"
                      title={t(`methodology.steps.extracting.title`)}
                      description={t(`methodology.steps.extracting.description`)}
                      className={`${steps[2].backgroundColor} border-l-4 ${steps[2].borderColor}`}
                    />
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <FlowArrow direction="right" />
                </div>

                <div className="col-span-2">
                  <div
                    className={`cursor-pointer transition-all duration-300 ${activeStep === 3 ? 'scale-105' : 'opacity-90'}`}
                    onClick={() => setActiveStep(3)}
                  >
                    <FlowBox
                      step="4"
                      title={t(`methodology.steps.generating.title`)}
                      description={t(`methodology.steps.generating.description`)}
                      className={`${steps[3].backgroundColor} border-l-4 ${steps[3].borderColor}`}
                    />
                  </div>
                </div>
              </div>

              <FlowArrow />

              {/* Step 5 */}
              <div
                className={`cursor-pointer transition-all duration-300 ${activeStep === 4 ? 'scale-105' : 'opacity-90'}`}
                onClick={() => setActiveStep(4)}
              >
                <FlowBox
                  step="5"
                  title={t(`methodology.steps.refining.title`)}
                  description={t(`methodology.steps.refining.description`)}
                  className={`${steps[4].backgroundColor} border-l-4 ${steps[4].borderColor}`}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step Detail Card */}
        <div className="max-w-3xl mx-auto">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-lg rounded-lg p-8 border-l-4 border-indigo-500"
          >
            <h2 className="text-2xl font-bold mb-4">{t(`methodology.steps.${steps[activeStep].key}.title`)}</h2>
            <p className="text-gray-700 mb-6">{t(`methodology.steps.${steps[activeStep].key}.description`)}</p>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">{t('methodology.technicalDetails')}</h3>
              <p className="text-gray-600">{t(`methodology.steps.${steps[activeStep].key}.content`)}</p>
            </div>
          </motion.div>

          {/* Call-to-Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12"
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('methodology.tryItYourself')} <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 