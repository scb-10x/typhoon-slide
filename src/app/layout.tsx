import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-provider";
import Link from 'next/link';
import { FaGithub, FaDiscord, FaXTwitter } from 'react-icons/fa6';
import { SiHuggingface } from 'react-icons/si';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Typhoon Slide | Create AI-Powered Presentation Decks",
  description: "Create engaging slide decks in minutes with Typhoon Slide - an AI-powered presentation creator built with Typhoon. Transform ideas into professional presentations with ease.",
  keywords: ["Typhoon AI", "slide deck creator", "AI presentation", "markdown slides", "AI slide generator", "OpenTyphoon", "presentation maker", "MDX slides"],
  authors: [{ name: "Typhoon Team", url: "https://opentyphoon.ai" }],
  creator: "Typhoon",
  publisher: "Typhoon",
  metadataBase: new URL("https://slides.apps.opentyphoon.ai"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Typhoon Slide | Create AI-Powered Presentation Decks",
    description: "Create professional presentations in minutes with AI assistance. Typhoon Slide showcases what's possible with the OpenTyphoon AI platform.",
    url: "https://slides.apps.opentyphoon.ai",
    siteName: "Typhoon Slide",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "Typhoon Slide - AI-Powered Presentation Creator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Typhoon Slide | Create AI-Powered Presentation Decks",
    description: "Create professional presentations in minutes with AI assistance. A showcase of Typhoon's capabilities.",
    images: ["/images/og.jpg"],
    creator: "@opentyphoon",
    site: "@opentyphoon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="json-ld" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Typhoon Slide",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "AI-powered presentation creator built with Typhoon. Create professional slide decks in minutes with the power of AI assistance.",
              "creator": {
                "@type": "Organization",
                "name": "Typhoon",
                "url": "https://opentyphoon.ai"
              },
              "screenshot": "/screenshot.png",
              "softwareHelp": {
                "@type": "CreativeWork",
                "url": "https://slides.apps.opentyphoon.ai"
              }
            }
          `}
        </Script>
        <Script id="gtm-script">
          {`
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-WK925XWL');
    `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WK925XWL"
            height={0} width={0} style={{ display: 'none', visibility: 'hidden' }}></iframe>
        </noscript>

        <I18nProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">{children}</main>
            <footer className="bg-gray-50 border-t border-gray-200 py-8">
              <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
                  <Link href="https://opentyphoon.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 font-medium transition-colors" id="footer-typhoon-link">
                    #BuiltWithTyphoon
                  </Link>
                  <Link href="https://opentyphoon.ai/tac" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors" id="footer-terms-link">
                    Terms and Conditions
                  </Link>
                </div>
                <div className="flex items-center space-x-5">
                  <Link href="https://github.com/scb-10x" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-500 hover:text-gray-800 transition-colors" id="footer-github-link">
                    <FaGithub size={20} />
                  </Link>
                  <Link href="https://discord.gg/9F6nrFXyNt" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-gray-500 hover:text-gray-800 transition-colors" id="footer-discord-link">
                    <FaDiscord size={20} />
                  </Link>
                  <Link href="https://huggingface.co/scb10x" target="_blank" rel="noopener noreferrer" aria-label="Hugging Face" className="text-gray-500 hover:text-gray-800 transition-colors" id="footer-huggingface-link">
                    <SiHuggingface size={20} />
                  </Link>
                  <Link href="https://x.com/opentyphoon" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)" className="text-gray-500 hover:text-gray-800 transition-colors" id="footer-twitter-link">
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
