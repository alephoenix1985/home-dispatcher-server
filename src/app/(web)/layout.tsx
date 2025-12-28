import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
    title: 'Home Server',
    description: 'IoT Home Automation Hub',
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={inter.className}>
            {children}
        </div>
    );
}
