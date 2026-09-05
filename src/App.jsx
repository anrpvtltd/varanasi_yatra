import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Public Layout Shell
import PublicLayout from './public/layouts/PublicLayout';
import PublicSkeleton from './public/components/PublicSkeleton';

// Public Pages (Lazy Loaded for route-based chunking & ultra-fast LCP)
const HomePage = lazy(() => import('./public/pages/HomePage'));
const ExperiencesHubPage = lazy(() => import('./public/pages/ExperiencesHubPage'));
const ExperienceDetailPage = lazy(() => import('./public/pages/ExperienceDetailPage'));
const ToursHubPage = lazy(() => import('./public/pages/ToursHubPage'));
const TourDetailPage = lazy(() => import('./public/pages/TourDetailPage'));
const DestinationsHubPage = lazy(() => import('./public/pages/DestinationsHubPage'));
const DestinationDetailPage = lazy(() => import('./public/pages/DestinationDetailPage'));
const TravelGuideHubPage = lazy(() => import('./public/pages/TravelGuideHubPage'));
const TravelGuideDetailPage = lazy(() => import('./public/pages/TravelGuideDetailPage'));
const HotelsPage = lazy(() => import('./public/pages/HotelsPage'));
const AboutPage = lazy(() => import('./public/pages/AboutPage'));
const ContactPage = lazy(() => import('./public/pages/ContactPage'));
const PlanYourTripPage = lazy(() => import('./public/pages/PlanYourTripPage'));
const PartnerQRPage = lazy(() => import('./public/pages/PartnerQRPage'));
const NotFoundPage = lazy(() => import('./public/pages/NotFoundPage'));

// 🔒 CODE SPLIT: CRM is lazily loaded so public visitors NEVER download the 860KB+ CRM bundle
const AdminCRM = lazy(() => import('./components/AdminCRM'));

import { captureUtmParameters } from './public/utils/attribution';

// Scroll Restoration Handler & Attribution Tracker
function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        captureUtmParameters();
        if (hash) {
            setTimeout(() => {
                const element = document.getElementById(hash.replace('#', ''));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [pathname, hash]);

    return null;
}

// CRM Loading Fallback
function CRMLoading() {
    return (
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-200">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-xs font-mono tracking-wider uppercase text-stone-400">
                Loading Operations Workspace...
            </span>
        </div>
    );
}

// Public Route Wrapper with PublicLayout and PublicSkeleton fallback
function PublicRoute({ children }) {
    return (
        <PublicLayout>
            <Suspense fallback={<PublicSkeleton type="card" count={2} />}>
                {children}
            </Suspense>
        </PublicLayout>
    );
}

// Legacy Package Route Resolver
function LegacyPackageRedirect() {
    const { pathname } = useLocation();
    const slug = pathname.replace('/packages/', '');
    // Map common legacy packages or redirect to /tours
    return <Navigate to={`/tours/${slug}`} replace />;
}

export default function App() {
    // Check if legacy URL query asked for admin
    const isAdminView = typeof window !== 'undefined' &&
        (window.location.search.includes('admin') || window.location.hash.includes('admin'));

    if (isAdminView) {
        window.location.replace('/operations');
        return null;
    }

    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* 1. PUBLIC MARKETING WEBSITE ROUTES */}
                <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
                
                {/* Experiences */}
                <Route path="/experiences" element={<PublicRoute><ExperiencesHubPage /></PublicRoute>} />
                <Route path="/experiences/:slug" element={<PublicRoute><ExperienceDetailPage /></PublicRoute>} />

                {/* Tours */}
                <Route path="/tours" element={<PublicRoute><ToursHubPage /></PublicRoute>} />
                <Route path="/tours/:slug" element={<PublicRoute><TourDetailPage /></PublicRoute>} />

                {/* Destinations */}
                <Route path="/destinations" element={<PublicRoute><DestinationsHubPage /></PublicRoute>} />
                <Route path="/destinations/:slug" element={<PublicRoute><DestinationDetailPage /></PublicRoute>} />

                {/* Travel Guide */}
                <Route path="/travel-guide" element={<PublicRoute><TravelGuideHubPage /></PublicRoute>} />
                <Route path="/travel-guide/:slug" element={<PublicRoute><TravelGuideDetailPage /></PublicRoute>} />

                {/* Hotels */}
                <Route path="/hotels" element={<PublicRoute><HotelsPage /></PublicRoute>} />

                {/* Company Pages */}
                <Route path="/about" element={<PublicRoute><AboutPage /></PublicRoute>} />
                <Route path="/contact" element={<PublicRoute><ContactPage /></PublicRoute>} />

                {/* Plan Your Trip */}
                <Route path="/plan-your-trip" element={<PublicRoute><PlanYourTripPage /></PublicRoute>} />

                {/* Hotel Partner QR Scan Route */}
                <Route path="/p/:partnerId" element={<PublicRoute><PartnerQRPage /></PublicRoute>} />

                {/* Legacy Route Compatibilities */}
                <Route path="/packages/:id" element={<LegacyPackageRedirect />} />

                {/* 2. INTERNAL CRM ROUTES (Code Split & Isolated - No Public Header/Footer) */}
                <Route
                    path="/operations"
                    element={
                        <Suspense fallback={<CRMLoading />}>
                            <AdminCRM />
                        </Suspense>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <Suspense fallback={<CRMLoading />}>
                            <AdminCRM />
                        </Suspense>
                    }
                />
                <Route
                    path="/crm"
                    element={
                        <Suspense fallback={<CRMLoading />}>
                            <AdminCRM />
                        </Suspense>
                    }
                />

                {/* 3. NOT FOUND (Genuine 404 UI - Eliminates Soft 404) */}
                <Route path="*" element={<PublicRoute><NotFoundPage /></PublicRoute>} />
            </Routes>
        </BrowserRouter>
    );
}