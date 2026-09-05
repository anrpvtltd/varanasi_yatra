import React from 'react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import FloatingSupport from '../components/FloatingSupport';

export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#faf8f5] text-stone-800 font-sans antialiased selection:bg-amber-600 selection:text-white">
            <PublicHeader />
            <main id="main-content" className="flex-grow">
                {children}
            </main>
            <PublicFooter />
            <FloatingSupport />
        </div>
    );
}
