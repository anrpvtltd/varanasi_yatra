import React, { useState, useCallback } from 'react';
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
        isCheckingSession,
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

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTriggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
        fetchLeads();
    }, [fetchLeads]);

    const onSaveLeadChanges = async (e) => {
        await handleSaveChanges(e);
        handleTriggerRefresh();
    };

    const onSubmitManualLead = async (e) => {
        await handleManualSubmit(e);
        handleTriggerRefresh();
    };

    // 🔄 SHOW SESSION CHECK LOADING STATE (NO BLANK SCREEN & NO LOGIN FLASH)
    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 select-none">
                <div className="text-center space-y-4 animate-fadeIn">
                    <span className="text-4xl block animate-bounce">🚩</span>
                    <h3 className="text-lg font-serif font-bold text-amber-100 uppercase tracking-widest">
                        Banaras Yatra CRM
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-xs text-amber-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Checking session...</span>
                    </div>
                </div>
            </div>
        );
    }

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
                                    LOGIN AS CEO
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
                                    LOGIN AS MANAGER
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
                    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fadeIn">
                        <div className="space-y-2">
                            <span className="text-4xl block">
                                {loginMode === 'CEO' ? '👑' : '👥'}
                            </span>
                            <h2 className="text-xl font-serif font-extrabold text-amber-100 tracking-wider">
                                {loginMode === 'CEO' ? 'CEO Executive Authentication' : 'Manager Console Access'}
                            </h2>
                            <p className="text-xs text-stone-400">
                                Enter your credentials to access the console
                            </p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left pt-2">
                            <div>
                                <label className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1.5">
                                    Official Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={loginMode === 'CEO' ? 'ceo@banarasyatra.com' : 'manager@banarasyatra.com'}
                                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isAuthenticating}
                                className={`w-full py-3.5 rounded-xl font-serif font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md ${
                                    isAuthenticating
                                        ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                                        : loginMode === 'CEO'
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 cursor-pointer shadow-amber-900/20'
                                            : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 cursor-pointer shadow-amber-900/20'
                                }`}
                            >
                                {isAuthenticating ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
                            </button>

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode(null); setEmail(''); setPassword(''); }}
                                    className="text-stone-500 hover:text-stone-300 text-[10px] font-bold uppercase tracking-widest transition cursor-pointer select-none"
                                >
                                    ← Change Access Level
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
            <div className="bg-stone-900 text-white p-3.5 rounded-2xl flex flex-wrap justify-between items-center gap-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
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
                
                <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-amber-400 block">{user?.name}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">{user?.role} Session Active</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3.5 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                    >
                        <span>🔒</span>
                        <span>Log Out</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: CRM DASHBOARD */}
            {currentTab === 'DASHBOARD' && (
                user && user.role === 'CEO' ? (
                    <CEOCommandCenter
                        token={token}
                        user={user}
                        refreshTrigger={refreshTrigger}
                        onRefresh={handleTriggerRefresh}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                        onOpenQuote={(lead) => handleOpenQuoteBuilder(lead)}
                        onAddLead={() => setIsManualOpen(true)}
                        onLogout={handleLogout}
                    />
                ) : (
                    <ManagerOperationsCenter
                        token={token}
                        user={user}
                        refreshTrigger={refreshTrigger}
                        onRefresh={handleTriggerRefresh}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                        onOpenQuote={(lead) => handleOpenQuoteBuilder(lead)}
                        onAddLead={() => setIsManualOpen(true)}
                        onLogout={handleLogout}
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
                handleSaveChanges={onSaveLeadChanges}
                isSaving={isSaving}
                user={user}
                onOpenQuoteBuilder={handleOpenQuoteBuilder}
            />

            <ManualLeadDrawer
                isManualOpen={isManualOpen}
                setIsManualOpen={setIsManualOpen}
                manualLead={manualLead}
                handleManualInputChange={handleManualInputChange}
                handleManualSubmit={onSubmitManualLead}
                isSavingManual={isSavingManual}
                user={user}
            />

            <QuoteBuilderModal
                isOpen={isQuoteBuilderOpen}
                onClose={() => setIsQuoteBuilderOpen(false)}
                lead={quoteTargetLead || selectedLead}
                token={token}
                user={user}
                onQuoteGenerated={handleTriggerRefresh}
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
                    handleTriggerRefresh();
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