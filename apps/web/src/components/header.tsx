import Link from 'next/link';
import { WalletConnect } from '@/components/wallet-connect';

export default function Header() {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
            <Link href="/" className="text-2xl font-bold text-primary">
                Solana Paper Trader
            </Link>
            <WalletConnect />
        </header>
    );
}
