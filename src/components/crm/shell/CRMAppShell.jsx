import React, { useState } from 'react';
import CRMSidebar from './CRMSidebar';
import TopHeader from './TopHeader';

/**
 * Common CRM Application Shell
 * Layout:
 * - Persistent Dark Navy Sidebar (Left)
 * - Clean Top Navigation Header (Top)
 * - Scrollable Workspace Canvas (Center)
 */
export default function CRMAppShell({
    user,
    activeItem = 'DASHBOARD',
    onSelectItem,
    onLogout,
    alertCount = 0,
    alerts = [],
    searchQuery = '',
    onSearchChange,
    onChangePassword,
    children
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Map navigation IDs to clean breadcrumbs and page titles
    const pageMeta = {
        DASHBOARD: {
            title: user?.role === 'CEO' ? 'Executive Command Center' : 'Operations Dashboard',
            breadcrumb: 'Dashboard'
        },
        LEADS: { title: 'Lead Management & Enquiries', breadcrumb: 'Leads' },
        QUOTES: { title: 'Custom Quotations & Packages', breadcrumb: 'Quotes' },
        BOOKINGS: { title: 'Confirmed Bookings & Itineraries', breadcrumb: 'Bookings' },
        PAYMENTS: { title: 'Customer & Vendor Ledger', breadcrumb: 'Payments' },
        TRIPS: { title: 'Active Trip Execution & Vouchers', breadcrumb: 'Trips' },
        CUSTOMERS: { title: 'Customer 360 & History', breadcrumb: 'Customers' },
        COMMUNICATIONS: { title: 'Customer Communications & Reminders', breadcrumb: 'Communications' },
        REPORTS: { title: 'Operational Reporting Center', breadcrumb: 'Reports' },
        RESOURCES: { title: 'Vendor & Resource Master', breadcrumb: 'Resources' },
        FINANCIALS: { title: 'Financial Command & Margins', breadcrumb: 'Financials' },
        OPERATIONS: { title: 'System Automation & Operations', breadcrumb: 'Operations' }
    };

    const currentMeta = pageMeta[activeItem] || {
        title: 'Operations Dashboard',
        breadcrumb: 'Overview'
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex antialiased text-slate-900 font-sans text-left bg-slate-50/70">
            {/* 1. LEFT: Persistent Dark Navy Sidebar (Fixed full height on desktop, drawer on mobile) */}
            <CRMSidebar
                user={user}
                activeItem={activeItem}
                onSelectItem={onSelectItem}
                isOpenMobile={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* 2. MAIN APP COLUMN: Top Header + Independently Scrollable Content */}
            <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <TopHeader
                    title={currentMeta.title}
                    breadcrumb={currentMeta.breadcrumb}
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                    user={user}
                    alertCount={alertCount}
                    alerts={alerts}
                    onSelectItem={onSelectItem}
                    onLogout={onLogout}
                    onChangePassword={onChangePassword}
                />

                {/* 3. CENTER: Scrollable Main Workspace */}
                <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
