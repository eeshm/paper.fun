import React, { ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

// Default to devnet; can be overridden via NEXT_PUBLIC_SOLANA_NETWORK env var
const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const endpoint = clusterApiUrl(network as any);

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
