import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-provider";
import Link from 'next/link';
import { FaGithub, FaDiscord, FaXTwitter } from 'react-icons/fa6';
import { SiHuggingface } from 'react-icons/si';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Typhoon Slide",
  description: "Create engaging slide decks in minutes with Typhoon Slide's AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">{children}</main>
            <footer className="bg-gray-50 border-t border-gray-200 py-8">
              <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
                  <Link href="https://opentyphoon.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                    #BuiltWithTyphoon
                  </Link>
                  <Link href="https://opentyphoon.ai/tac" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                    Terms and Conditions
                  </Link>
                </div>
                <div className="flex items-center space-x-5">
                  <Link href="https://github.com/scb-10x" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <FaGithub size={20} />
                  </Link>
                  <Link href="https://discord.gg/9F6nrFXyNt" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <FaDiscord size={20} />
                  </Link>
                  <Link href="https://huggingface.co/scb10x" target="_blank" rel="noopener noreferrer" aria-label="Hugging Face" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <SiHuggingface size={20} />
                  </Link>
                  <Link href="https://x.com/opentyphoon" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <FaXTwitter size={20} />
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
