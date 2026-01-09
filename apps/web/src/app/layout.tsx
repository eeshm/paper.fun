'use client';

import { Providers } from './providers';
import Header from '@/components/header';

export const metadata = {
    title: 'Solana Paper Trading',
    description: 'Real‑time paper trading on SOL/USD',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full bg-gray-50 dark:bg-gray-900">
            <body className="h-full flex flex-col">
                <Providers>
                    <Header />
                    <main className="flex-1 container mx-auto p-4">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
