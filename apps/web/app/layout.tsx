'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/lib/wallet-context';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          {children}
          <Toaster position="top-right" />
        </WalletContextProvider>
      </body>
    </html>
  );
}
