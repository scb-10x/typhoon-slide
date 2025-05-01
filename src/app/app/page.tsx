'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { compileMDX } from 'next-mdx-remote/rsc';
import { FiEdit, FiX, FiChevronsRight, FiLayout, FiMaximize, FiMinimize, FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useMDXComponents } from '@/lib/mdx-components';
import { useTranslation } from "@/lib/i18n-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { FaGithub } from 'react-icons/fa';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), { ssr: false });
const AIChat = dynamic(() => import('@/components/AIChat'), { ssr: false });
const SlideShow = dynamic(() => import('@/components/SlideShow'), { ssr: false });

// Default markdown content for new users
const defaultMarkdown = `# Welcome to Typhoon Slide

Make any slide in minutes with AI

---

## Features

- Write slides in Markdown
- Use "–––" to separate slides
- Supports **bold**, *italic*, and more!

---

## How to Use

1. Edit the markdown on the right
2. See the slides preview on the left
3. Use the AI chat to generate content

---

## That's It!

Start creating your slides now!
`;

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [markdown, setMarkdown] = useState('');
  const [compiledSlides, setCompiledSlides] = useState<React.ReactNode[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showGithubLink, setShowGithubLink] = useState(false);
  const { t } = useTranslation();

  // Get MDX components outside the callback
  const mdxComponents = useMDXComponents();

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

  // Load saved markdown from localStorage on component mount
  useEffect(() => {
    const savedMarkdown = localStorage.getItem('markdown-content');
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    } else {
      setMarkdown(defaultMarkdown);
    }
  }, []);

  const slides = useMemo(() => {
    return markdown
      .split('---')
      .map(slide => slide.trim())
      .filter(Boolean);
  }, [markdown]);

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    // Save to localStorage whenever markdown changes
    localStorage.setItem('markdown-content', value);
  };

  const handleAIContentInsert = (content: string) => {
    // Add console log to debug
    console.log("Received content for insertion:", content);
    console.log("Current markdown before insertion:", markdown);

    // Create the new markdown content
    const separator = markdown.trim().endsWith('---') ? '\n\n' : '\n\n---\n\n';
    const newMarkdown = markdown + separator + content;

    // Log the new markdown before updating state
    console.log("New markdown after insertion:", newMarkdown);

    // Update the state with the new content
    handleMarkdownChange(newMarkdown); // Use handleMarkdownChange to ensure localStorage is updated
  };

  // Function to replace all slides with new content
  const handleReplaceAllSlides = (content: string) => {
    console.log("Replacing all slides with new content");
    // Update the state with the new content
    handleMarkdownChange(content);
  };

  // Function to replace only the current slide with new content
  const handleReplaceThisSlide = (content: string) => {
    console.log("Replacing only current slide with new content");

    if (slides.length === 0) {
      // If there are no slides, just set the content as the first slide
      handleMarkdownChange(content);
      return;
    }

    // Create a new array of slides with the current slide replaced
    const newSlides = [...slides];
    newSlides[currentSlide] = content;

    // Join the slides back together with separators
    const newMarkdown = newSlides.join('\n\n---\n\n');

    // Update the markdown
    handleMarkdownChange(newMarkdown);
  };

  const toggleEditor = () => {
    console.log("Toggling editor. Current state:", isEditorOpen);
    console.log("Current markdown content:", markdown.substring(0, 100) + "...");
    setIsEditorOpen(!isEditorOpen);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Get current markdown content for context passing to AIChat
  const getCurrentSlideContext = () => {
    if (slides.length === 0) {
      return "No slides created yet.";
    }
    const currentSlideContent = slides[currentSlide].trim();
    console.log('currentSlideContent', slides, currentSlide, currentSlideContent)

    return `Current slide content:\n${currentSlideContent || "Empty slide"}`;
  };

  // This function processes the markdown into slides for the preview
  useEffect(() => {
    const renderMarkdown = async () => {
      if (!markdown.trim()) {
        setCompiledSlides([]);
        return;
      }

      try {
        // Split the markdown by slide separators


        // Compile each slide with MDX
        const compiledSlidePromises = slides.map(async (slideContent) => {
          try {
            // Compile the MDX with our custom components
            const { content } = await compileMDX({
              source: slideContent,
              options: {
                parseFrontmatter: true,
                mdxOptions: {
                  development: process.env.NODE_ENV === 'development'
                }
              },
              components: mdxComponents // Components are already defined at the top level
            });

            return content;
          } catch (error) {
            console.error('Error compiling MDX:', error);
            return <div className="text-red-500">Error rendering slide. Check your markdown syntax.</div>;
          }
        });

        const renderedSlides = await Promise.all(compiledSlidePromises);
        setCompiledSlides(renderedSlides);
      } catch (error) {
        console.error('Error rendering slides:', error);
        setCompiledSlides([
          <div key="error" className="text-red-500">Error rendering slides. Please check your markdown syntax.</div>
        ]);
      }
    };

    // Debounce the rendering to avoid excessive compilations
    const timeoutId = setTimeout(renderMarkdown, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  const downloadMdxFile = () => {
    try {
      // Create a blob from the markdown content
      const blob = new Blob([markdown], { type: 'text/markdown' });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'typhoon-slide-presentation.mdx';

      // Programmatically click the anchor to trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show toast notification if available
      console.log('MDX file downloaded');
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header - hidden in fullscreen mode */}
      {!isFullScreen && (
        <header className="backdrop-blur-md bg-white/80 border-b border-gray-200 px-4 py-3 sticky top-0 z-30 flex-shrink-0">
          <div className="max-w-full mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="Typhoon Slide Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('app.title')}
              </h1>
              <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-md">DEMO</span>
            </Link>

            {/* Right side with controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={downloadMdxFile}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center gap-1.5"
                aria-label="Download MDX file"
                title="Download MDX file"
                id="download-mdx-button"
              >
                <FiDownload className="w-4 h-4" />
                <span>{t('editor.download')}</span>
              </button>
              {showGithubLink && (
                <Link
                  href="https://github.com/scb-10x/typhoon-mdx-slide-creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center gap-1.5"
                  id="app-github-source-link"
                  aria-label="View source code on GitHub"
                  title="View source code on GitHub"
                >
                  <FaGithub className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={toggleEditor}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center gap-1.5"
                aria-label={isEditorOpen ? "Close editor" : "Open editor"}
                title={isEditorOpen ? "Close editor" : "Open editor"}
                id="toggle-editor-button"
              >
                {isEditorOpen ? (
                  <>
                    <FiX className="w-4 h-4" /> {t('editor.closeEditor')}
                  </>
                ) : (
                  <>
                    <FiEdit className="w-4 h-4" /> {t('editor.openEditor')}
                  </>
                )}
              </button>
              <button
                onClick={toggleFullScreen}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center gap-1.5"
                aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                id="toggle-fullscreen-button"
              >
                {isFullScreen ? (
                  <>
                    <FiMinimize className="w-4 h-4" /> {t('editor.exitFullscreen')}
                  </>
                ) : (
                  <>
                    <FiMaximize className="w-4 h-4" /> {t('editor.fullScreen')}
                  </>
                )}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isFullScreen ? 'p-0' : 'p-2 md:p-4'} flex flex-col md:flex-row gap-3 max-w-full mx-auto w-full overflow-hidden`}>
        {/* Slide Preview Section - 16:9 aspect ratio */}
        <div className={`flex-grow flex flex-col ${isFullScreen ? 'w-full h-full' : 'w-full md:w-3/4'}`}>
          {!isFullScreen && (
            <div className="flex items-center gap-2 px-1 mb-2 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-800">{t('editor.presentationPreview')}</h2>
              <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {compiledSlides.length} {t('editor.slides')}
              </div>
            </div>
          )}

          <div className={`relative w-full ${isFullScreen ? 'h-screen' : 'flex-grow'} flex items-center justify-center`}>
            <div className={`${isFullScreen ? 'w-screen h-screen absolute inset-0' : 'w-full h-full relative rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 p-0.5'}`}>
              {!isFullScreen && (
                <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 rounded-t-xl flex items-center justify-between px-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                  <button
                    onClick={toggleFullScreen}
                    className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label="Toggle fullscreen"
                  >
                    <FiMaximize className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className={`${isFullScreen ? 'w-full h-full' : 'w-full pt-7'}`} style={isFullScreen ? { height: '100vh', width: '100vw' } : { aspectRatio: '16/9' }}>
                <div className={`${isFullScreen ? 'h-screen w-screen' : 'h-full'} bg-white ${isFullScreen ? '' : 'rounded-lg overflow-hidden border border-gray-200 shadow-inner'}`}>
                  {compiledSlides.length > 0 ? (
                    <div className={`relative ${isFullScreen ? 'h-screen w-screen' : 'h-full'}`}>
                      <SlideShow slides={compiledSlides} setCurrentSlide={(e) => setCurrentSlide(e)} currentSlide={currentSlide} />
                      {isFullScreen && (
                        <button
                          onClick={toggleFullScreen}
                          className="absolute bottom-4 right-4 p-2 bg-gray-800/70 text-white rounded-full hover:bg-gray-700/70 focus:outline-none z-50"
                          aria-label="Exit fullscreen"
                        >
                          <FiMinimize className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <FiLayout className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-center text-sm max-w-md">
                        {t('editor.emptySlideMessage')}
                      </p>
                      <button
                        onClick={toggleEditor}
                        className="mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        {t('editor.openEditor')} <FiChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section - hidden in fullscreen mode */}
        {!isFullScreen && (
          <div className="flex-none flex flex-col w-full md:w-1/4">
            <div className="flex-grow flex flex-col rounded-xl overflow-hidden shadow-xl border border-gray-200 h-[250px] md:h-full">
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-2 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    AI
                  </div>
                  <span className="font-medium text-xs text-gray-800">{t('editor.makeSlides')}</span>
                </div>
                <button
                  onClick={toggleEditor}
                  className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs transform transition-all duration-200 shadow hover:shadow-md flex items-center gap-1"
                >
                  <FiEdit className="w-3 h-3" /> {t('editor.editSlides')}
                </button>
              </div>

              <div className="flex-1 bg-white overflow-hidden min-h-0">
                <AIChat
                  onInsertMarkdown={handleAIContentInsert}
                  onReplaceSlide={handleReplaceThisSlide}
                  onReplaceAllSlides={handleReplaceAllSlides}
                  currentSlideContext={getCurrentSlideContext()}
                />
              </div>
              <footer className="backdrop-blur-md bg-white/80 border-t border-gray-200 py-2 text-center text-xs text-gray-500 flex-shrink-0 mt-auto">
                <div className="px-2 py-1 overflow-auto max-h-24">
                  <p className="italic">
                    Disclaimer: The responses generated by this Artificial Intelligence (AI) system are autonomously constructed and do not necessarily reflect the views or positions of the developing organizations, their affiliates, or any of their employees. These AI-generated responses do not represent those of the organizations. The organizations do not endorse, support, sanction, encourage, verify, or agree with the comments, opinions, or statements generated by this AI. The information produced by this AI is not intended to malign any religion, ethnic group, club, organization, company, individual, anyone, or anything. It is not the intent of the organizations to malign any group or individual. The AI operates based on its programming and training data and its responses should not be interpreted as the explicit intent or opinion of the organizations.
                  </p>
                </div>
              </footer>
            </div>
          </div>
        )}
      </main>

      {/* Editor Overlay - shown when isEditorOpen is true */}
      {isEditorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-2"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] relative border border-gray-200 overflow-hidden">
            <div className="absolute right-3 top-3 z-50">
              <button
                onClick={toggleEditor}
                className="bg-gray-200 rounded-full p-1.5 hover:bg-gray-300 transition-colors"
                aria-label="Close editor"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 h-full overflow-hidden flex flex-col">
              <div className="text-xs text-gray-500 mb-1">
                <span className="font-medium">{t('editor.editingMarkdown')}</span> - {t('editor.changesAutosaved')}
              </div>
              <div className="flex-grow overflow-hidden">
                <MarkdownEditor
                  value={markdown}
                  onChange={handleMarkdownChange}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
