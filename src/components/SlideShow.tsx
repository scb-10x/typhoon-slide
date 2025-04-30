'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiArrowRight
} from 'react-icons/fi';
import MDXSlide from './MDXSlide';

interface SlideShowProps {
  slides: React.ReactNode[];
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
}

export default function SlideShow({ slides, currentSlide, setCurrentSlide }: SlideShowProps) {

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Reset to first slide when slides change completely
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  // Determine if we're in fullscreen by checking container dimensions
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const checkDimensions = () => {
      // Check if width is significantly larger than normal slide width
      setIsWide(window.innerWidth > 1000);
    };

    checkDimensions();
    window.addEventListener('resize', checkDimensions);
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden flex items-center justify-center" id="slide-show-container">
      {/* Slide Number Indicator */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 px-3 py-1 bg-gray-100/70 backdrop-blur-sm rounded-full shadow-sm text-xs font-medium text-gray-700" id="slide-counter">
          <span className="text-[clamp(0.75rem,1.5vw,1rem)] font-medium">{currentSlide + 1}/{slides.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.4
          }}
          className={`slide-container h-full w-full flex items-center justify-center ${isWide ? 'scale-[0.95]' : ''}`}
          style={{
            fontSize: `calc(1rem + ${Math.min(window.innerWidth / 1200, window.innerHeight / 800) * 0.5}rem)`
          }}
        >
          <MDXSlide content={slides[currentSlide]} />
        </motion.div>
      </AnimatePresence>

      {/* Controls - Simplified for compact view */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevSlide}
          disabled={currentSlide === 0}
          className="p-[clamp(0.5rem,1vw,0.75rem)] rounded-full bg-white/80 backdrop-blur-sm text-gray-700 disabled:opacity-40 shadow-sm disabled:shadow-none"
          aria-label="Previous slide"
          id="slide-prev-button"
        >
          <FiArrowLeft className="w-[clamp(0.75rem,1.5vw,1.25rem)] h-[clamp(0.75rem,1.5vw,1.25rem)]" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goToNextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-[clamp(0.5rem,1vw,0.75rem)] rounded-full bg-white/80 backdrop-blur-sm text-gray-700 disabled:opacity-40 shadow-sm disabled:shadow-none"
          aria-label="Next slide"
          id="slide-next-button"
        >
          <FiArrowRight className="w-[clamp(0.75rem,1.5vw,1.25rem)] h-[clamp(0.75rem,1.5vw,1.25rem)]" />
        </motion.button>
      </div>
    </div>
  );
} 