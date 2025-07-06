import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Edu4.AI - AI-Powered Safe Tutoring',
    template: '%s | Edu4.AI',
  },
  description: 'AI-powered tutoring platform that provides safe, personalized educational assistance to students.',
  keywords: ['AI', 'tutoring', 'education', 'learning', 'safe AI', 'student help'],
  authors: [{ name: 'Edu4.AI Team' }],
  creator: 'Edu4.AI',
  publisher: 'Edu4.AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Edu4.AI - AI-Powered Safe Tutoring',
    description: 'AI-powered tutoring platform that provides safe, personalized educational assistance to students.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Edu4.AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title: 'Edu4.AI - AI-Powered Safe Tutoring',
    description: 'AI-powered tutoring platform that provides safe, personalized educational assistance to students.',
    card: 'summary_large_image',
    creator: '@edu4ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}