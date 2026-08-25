import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCRMLeads } from '../hooks/useCRMLeads';
import CEOCommandCenter from './crm/dashboard/CEOCommandCenter';
import ManagerOperationsCenter from './crm/dashboard/ManagerOperationsCenter';
import LeadProfileDrawer from './crm/shared/LeadProfileDrawer';
import ManualLeadDrawer from './crm/shared/ManualLeadDrawer';
import QuoteBuilderModal from './crm/shared/QuoteBuilderModal';
import BookingDetailsDrawer from './crm/shared/BookingDetailsDrawer';
import VendorManagement from './crm/vendor/VendorManagement';
import AutomationCenterModal from './crm/automation/AutomationCenterModal';
import DocumentCenterModal from './crm/documents/DocumentCenterModal';

export default function AdminCRM() {
    const [currentTab, setCurrentTab] = React.useState('DASHBOARD');
    const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = React.useState(false);
    const [quoteTargetLead, setQuoteTargetLead] = React.useState(null);
    const [selectedBooking, setSelectedBooking] = React.useState(null);
    const [isBookingDrawerOpen, setIsBookingDrawerOpen] = React.useState(false);
    const [isAutomationOpen, setIsAutomationOpen] = React.useState(false);
    const [isDocumentCenterOpen, setIsDocumentCenterOpen] = React.useState(false);

    const handleOpenQuoteBuilder = (lead) => {
        setQuoteTargetLead(lead);
        setIsQuoteBuilderOpen(true);
    };

    const handleOpenBooking = (booking) => {
        setSelectedBooking(booking);
        setIsBookingDrawerOpen(true);
    };



    const {
        isAuthenticated,
        token,
        user,
        loginMode,
        setLoginMode,
        email,
        setEmail,
        password,
        setPassword,
        isAuthenticating,
        handleLogout,
        handleLoginSubmit
    } = useAuth();

    const {
        selectedLead,
        setSelectedLead,
        profileTab,
        setProfileTab,
        isSaving,
        isManualOpen,
        setIsManualOpen,
        isSavingManual,
        manualLead,
        fetchLeads,
        handleInputChange,
        handleSaveChanges,
        handleManualInputChange,
        handleManualSubmit
    } = useCRMLeads(token, isAuthenticated, handleLogout);


    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 select-none">
                {loginMode === null ? (
                    <div className="w-full max-w-4xl text-center space-y-8 py-8 animate-fadeIn">
                        <div className="space-y-2">
                            <span className="text-5xl block mb-4">🚩</span>
                            <h2 className="text-3.5xl font-serif font-extrabold text-amber-100 uppercase tracking-widest">
                                Banaras Yatra
                            </h2>
                            <p className="text-amber-500 text-xs font-bold tracking-widest uppercase">
                                Operations Portal
                            </p>
                            <p className="text-stone-400 text-sm max-w-md mx-auto">
                                Select your authorized access level
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mx-auto mt-8">
                            {/* Card 1: EXECUTIVE ACCESS */}
                            <div className="bg-stone-950 p-8 rounded-3xl border border-amber-500/20 shadow-2xl flex flex-col justify-between items-center text-center hover:border-amber-500/40 transition duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all"></div>
                                <div className="space-y-4 z-10">
                                    <span className="text-5xl block">👑</span>
                                    <h3 className="text-xl font-serif font-bold text-amber-100 uppercase tracking-wider">
                                        EXECUTIVE ACCESS
                                    </h3>
                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                                        CEO / Owner
                                    </p>
                                    <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                                        Full operational and business oversight.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLoginMode('CEO')}
                                    className="w-full mt-8 bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer z-10 outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    PROCEED TO LOGIN
                                </button>
                            </div>

                            {/* Card 2: OPERATIONS ACCESS */}
                            <div className="bg-stone-950 p-8 rounded-3xl border border-stone-850 shadow-2xl flex flex-col justify-between items-center text-center hover:border-stone-700 transition duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-stone-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-stone-500/10 transition-all"></div>
                                <div className="space-y-4 z-10">
                                    <span className="text-5xl block">👥</span>
                                    <h3 className="text-xl font-serif font-bold text-stone-100 uppercase tracking-wider">
                                        OPERATIONS ACCESS
                                    </h3>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                                        Manager / Team
                                    </p>
                                    <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                                        Manage assigned leads and daily operations.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLoginMode('TEAM')}
                                    className="w-full mt-8 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-750 text-stone-100 py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer border border-stone-800 z-10 outline-none focus:ring-1 focus:ring-stone-650"
                                >
                                    PROCEED TO LOGIN
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={() => {
                                    try {
                                        window.close();
                                    } catch {
                                        window.location.href = '/';
                                    }
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 100);
                                }}
                                className="inline-flex items-center space-x-2 text-stone-400 hover:text-orange-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer mt-8 select-none focus:outline-none focus:underline"
                            >
                                <span>← BACK TO WEBSITE</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-stone-950 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-500/20 relative overflow-hidden animate-fadeIn">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <span className="text-4xl block mb-4">🚩</span>
                        <h2 className="text-2xl font-serif font-bold text-amber-100 uppercase tracking-widest mb-1">
                            Banaras Yatra
                        </h2>

                        {loginMode === 'CEO' ? (
                            <div className="mb-8">
                                <h3 className="text-amber-500 font-serif font-bold tracking-widest text-sm uppercase">
                                    👑 EXECUTIVE ACCESS
                                </h3>
                                <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                                    CEO / OWNER LOGIN
                                </p>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <h3 className="text-stone-300 font-serif font-bold tracking-widest text-sm uppercase">
                                    👥 OPERATIONS ACCESS
                                </h3>
                                <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                                    MANAGER / TEAM LOGIN
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block ml-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter Registered Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 border border-stone-800 rounded-xl text-stone-100 bg-stone-900/60 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-xs placeholder-stone-600 text-left"
                                />
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block ml-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter Access Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 border border-stone-800 rounded-xl text-stone-100 bg-stone-900/60 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-xs placeholder-stone-600 text-left"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isAuthenticating}
                                    className={`w-full text-white py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer ${
                                        loginMode === 'CEO'
                                            ? 'bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600'
                                            : 'bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-750 border border-stone-800'
                                    }`}
                                >
                                    {isAuthenticating ? 'VERIFYING...' : loginMode === 'CEO' ? '[ SECURE LOGIN ]' : '[ LOGIN TO OPERATIONS ]'}
                                </button>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode(null); setEmail(''); setPassword(''); }}
                                    className="text-stone-400 hover:text-orange-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none focus:outline-none focus:underline"
                                >
                                    ← Back to Access Selection
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-8 text-slate-700 text-left font-sans antialiased space-y-4">
            
            {/* SYSTEM MODULE NAVIGATION BAR */}
            <div className="bg-stone-900 text-white p-3.5 rounded-2xl flex flex-wrap justify-between items-center shadow-lg">
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setCurrentTab('DASHBOARD')}
                        className={`px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wider transition cursor-pointer ${
                            currentTab === 'DASHBOARD'
                                ? 'bg-amber-500 text-stone-950 shadow-md'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                    >
                        📊 CRM Operations & Lead Engine
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentTab('VENDORS')}
                        className={`px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wider transition cursor-pointer ${
                            currentTab === 'VENDORS'
                                ? 'bg-amber-500 text-stone-950 shadow-md'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                    >
                        🏨 Vendor & Service Master
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAutomationOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wider transition cursor-pointer bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 hover:border-orange-500/70"
                    >
                        ⚡ Automation Center
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsDocumentCenterOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-serif font-extrabold tracking-wider transition cursor-pointer bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-500/70"
                    >
                        📄 Document Engine
                    </button>
                </div>
                <div className="text-xs text-amber-200 font-bold px-3 py-1 bg-stone-800/80 rounded-xl border border-stone-700">
                    Logged in as: <span className="text-amber-400">{user?.role || 'Team Member'}</span> ({user?.name || 'User'})
                </div>
            </div>

            {/* TAB 1: CRM DASHBOARD */}
            {currentTab === 'DASHBOARD' && (
                user && user.role === 'CEO' ? (
                    <CEOCommandCenter
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                        onOpenQuote={(lead) => handleOpenQuoteBuilder(lead)}
                    />
                ) : (
                    <ManagerOperationsCenter
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                        onOpenQuote={(lead) => handleOpenQuoteBuilder(lead)}
                    />
                )
            )}

            {/* TAB 2: VENDOR & SERVICE MANAGEMENT */}
            {currentTab === 'VENDORS' && (
                <VendorManagement token={token} user={user} />
            )}

            {/* Shared Side Drawers */}
            <LeadProfileDrawer
                selectedLead={selectedLead}
                setSelectedLead={setSelectedLead}
                profileTab={profileTab}
                setProfileTab={setProfileTab}
                handleInputChange={handleInputChange}
                handleSaveChanges={handleSaveChanges}
                isSaving={isSaving}
                user={user}
                onOpenQuoteBuilder={handleOpenQuoteBuilder}
            />

            <ManualLeadDrawer
                isManualOpen={isManualOpen}
                setIsManualOpen={setIsManualOpen}
                manualLead={manualLead}
                handleManualInputChange={handleManualInputChange}
                handleManualSubmit={handleManualSubmit}
                isSavingManual={isSavingManual}
                user={user}
            />

            <QuoteBuilderModal
                isOpen={isQuoteBuilderOpen}
                onClose={() => setIsQuoteBuilderOpen(false)}
                lead={quoteTargetLead || selectedLead}
                token={token}
                user={user}
                onQuoteGenerated={() => fetchLeads()}
                onOpenBooking={handleOpenBooking}
            />

            <BookingDetailsDrawer
                isOpen={isBookingDrawerOpen}
                onClose={() => setIsBookingDrawerOpen(false)}
                booking={selectedBooking}
                token={token}
                user={user}
                onBookingUpdated={(updated) => {
                    setSelectedBooking(updated);
                    fetchLeads();
                }}
            />

            <AutomationCenterModal
                isOpen={isAutomationOpen}
                onClose={() => setIsAutomationOpen(false)}
                token={token}
                userRole={user?.role}
            />

            <DocumentCenterModal
                isOpen={isDocumentCenterOpen}
                onClose={() => setIsDocumentCenterOpen(false)}
                token={token}
                userRole={user?.role}
            />
        </div>
    );
}