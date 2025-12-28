import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {CoreProvider} from 'psf-core-next/providers/core.provider';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
    title: 'Home Server',
    description: 'IoT Home Automation Hub',
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={inter.className}>
            <CoreProvider
                translationConfig={{
                    componentsToLoad: ['common', 'home'],
                }}
            >
                {children}
            </CoreProvider>
        </div>
    );
}
