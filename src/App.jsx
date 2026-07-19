import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Header & Footer Layout Shell
import Header from './components/Header';
import Footer from './components/Footer';

// Homepage Component Sections
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import Destinations from './components/Destinations';
import Services from './components/Services';
import CompanyValues from './components/CompanyValues';
import FounderMessage from './components/FounderMessage';
import TrustSection from './components/TrustSection';
import Packages from './components/Packages';
import Workflow from './components/Workflow';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import ContactSection from './components/ContactSection';
import FAQ from './components/FAQ';

// Dynamic Template Components (Phase 3 SEO routes)
import DestinationTemplate from './components/DestinationTemplate';
import PackageTemplate from './components/PackageTemplate';

// Naya CRM Component (Admin Portal)
import AdminCRM from './components/AdminCRM';

// 🌟 Scroll Restoration & Hash Anchor scrolling handler
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Delay slightly to let the DOM render sections
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

// 🏠 Homepage wrapper grouping the landing experience components
function Homepage() {
  return (
    <>
      <Hero />
      <AboutUs />
      <Destinations />
      <Services />
      <CompanyValues />
      <FounderMessage />
      <TrustSection />
      <Packages />
      <Workflow />
      <Gallery />
      <Testimonials />
      <ContactSection />
      <FAQ />
    </>
  );
}

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll position to toggle back-to-top shortcut button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if URL search parameters ask for admin dashboard CRM view
  const isAdminView = window.location.search.includes('view=admin');

  if (isAdminView) {
    return <AdminCRM />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <div className="min-h-screen bg-[#faf8f5] font-sans antialiased text-stone-800 selection:bg-orange-600 selection:text-white">

        {/* FLOATING ACTION SUPPORT SHORTCUT GROUP */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
          {/* Back To Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-orange-500 w-11 h-11 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Scroll back to top"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}

          {/* Call Helpline Button */}
          <a
            href="tel:+918400554029"
            className="bg-orange-600 hover:bg-orange-700 text-white w-11 h-11 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border border-orange-500 transform hover:scale-110 active:scale-95"
            aria-label="Call support desk"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M21.384 17.791c-1.115-1.115-2.6-1.115-3.715 0l-.821.821c-.151.151-.377.197-.577.121-2.282-.873-4.14-2.732-5.014-5.014-.076-.2-.03-.426.121-.577l.821-.821c1.115-1.115 1.115-2.6 0-3.715L10.36 6.769C9.245 5.654 7.6 5.654 6.485 6.769l-.821.821c-1.354 1.354-1.815 3.324-1.189 5.176 1.488 4.407 4.966 7.886 9.373 9.373 1.853.626 3.823.165 5.176-1.189l.821-.821c1.115-1.115 1.115-2.6 0-3.715l-1.838-1.838z"/>
            </svg>
          </a>

          {/* WhatsApp Direct Connect Button */}
          <a
            href="https://wa.me/918149783494"
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white w-11 h-11 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border border-emerald-400 transform hover:scale-110 active:scale-95"
            aria-label="Chat on WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.845-4.414 9.848-9.847.002-2.632-1.023-5.105-2.887-6.97C17.152 1.922 14.68 .898 12.01 .898c-5.43 0-9.847 4.414-9.85 9.849-.001 1.932.501 3.815 1.455 5.421L2.642 22.28l6.005-1.574zM17.92 14.87c-.318-.16-1.877-.926-2.162-1.03-.285-.104-.493-.155-.7.156-.207.31-.8.926-.98 1.132-.18.207-.36.233-.678.074-1.69-.844-2.8-1.522-3.922-3.447-.297-.51.297-.474.85-1.583.093-.187.047-.35-.023-.454-.07-.104-.7-1.682-.958-2.306-.252-.603-.509-.522-.7-.522-.181-.001-.389-.001-.597-.001-.207 0-.544.078-.83.392-.285.31-1.088 1.065-1.088 2.597 0 1.532 1.114 3.013 1.27 3.22.155.207 2.193 3.349 5.313 4.699.742.32 1.322.512 1.774.656.745.237 1.423.204 1.959.124.598-.09 1.877-.767 2.137-1.474.26-.707.26-1.316.182-1.443-.078-.127-.285-.207-.604-.367z" />
            </svg>
          </a>
        </div>

        <Header />
        
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/destinations/:id" element={<DestinationTemplate />} />
            <Route path="/packages/:id" element={<PackageTemplate />} />
            
            {/* Dynamic Catch-all Redirect to Home */}
            <Route path="*" element={<Homepage />} />
          </Routes>
        </main>
        
        <Footer />

      </div>
    </BrowserRouter>
  );
}