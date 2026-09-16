import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCRMLeads } from '../hooks/useCRMLeads';
import CEOCommandCenter from './crm/dashboard/CEOCommandCenter';
import ManagerOperationsCenter from './crm/dashboard/ManagerOperationsCenter';
import CEOBookingWorkspace from './crm/ceo/CEOBookingWorkspace';
import CEOBookingDrawer from './crm/ceo/CEOBookingDrawer';
import CEOFinancialWorkspace from './crm/ceo/CEOFinancialWorkspace';
import CEOReportsWorkspace from './crm/ceo/CEOReportsWorkspace';
import CEOOperationsPanel from './crm/CEOOperationsPanel';
import LeadProfileDrawer from './crm/shared/LeadProfileDrawer';
import ManualLeadDrawer from './crm/shared/ManualLeadDrawer';
import QuoteBuilderModal from './crm/shared/QuoteBuilderModal';
import BookingDetailsDrawer from './crm/shared/BookingDetailsDrawer';
import VendorManagement from './crm/vendor/VendorManagement';
import AutomationCenterModal from './crm/automation/AutomationCenterModal';
import DocumentCenterModal from './crm/documents/DocumentCenterModal';
import { CRMAppShell } from './crm/shell';
import CRMLoginScreen from './crm/auth/CRMLoginScreen';
import { CRMShellSkeleton } from './crm/ui/Skeleton';
import ChangePasswordModal from './crm/shared/ChangePasswordModal';
import Customer360Workspace from './crm/customer/Customer360Workspace';
import CustomerCommunicationWorkspace from './crm/communication/CustomerCommunicationWorkspace';
import ManagerReportsWorkspace from './crm/reports/ManagerReportsWorkspace';
import CEOTeamWorkspace from './crm/ceo/CEOTeamWorkspace';
import HotelPartnerWorkspace from './crm/ceo/HotelPartnerWorkspace';
import QRNetworkWorkspace from './crm/ceo/qr/QRNetworkWorkspace';
import TeamLeaderWorkspace from './crm/team-leader/TeamLeaderWorkspace';
import TeamMemberWorkspace from './crm/team-member/TeamMemberWorkspace';
import ManagerHunterProspects from './crm/manager/ManagerHunterProspects';
import CRMErrorBoundary from './crm/shared/CRMErrorBoundary';
import { safeDateToISOString } from '../utils/dateUtils';

const AIControlCenter = React.lazy(() => import('./crm/ceo/ai/AIControlCenter'));

export default function AdminCRM() {
    const [activeNav, setActiveNav] = useState(() => {
        try {
            return sessionStorage.getItem('crm_active_nav') || 'DASHBOARD';
        } catch {
            return 'DASHBOARD';
        }
    });
    const [globalSearch, setGlobalSearch] = useState('');
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
        handleLogout,
        setAuthSession
    } = useAuth();

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const isFirstLoginForced = Boolean(user?.passwordChangeRequired);

    const handlePasswordChanged = () => {
        const updatedUser = { ...user, passwordChangeRequired: false };
        setAuthSession({ user: updatedUser, token });
        setIsChangePasswordOpen(false);
    };

    const {
        leads,
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
        handleManualSubmit,
        handleClearManualDraft
    } = useCRMLeads(token, isAuthenticated, handleLogout, activeNav);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTriggerRefresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
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

    // Real operational alerts derived from real CRM system data
    const operationalAlerts = React.useMemo(() => {
        const alerts = [];
        (leads || []).forEach((l) => {
            if (l.status === 'HOT' || l.status === 'Hot') {
                alerts.push({
                    id: `lead_${l._id}`,
                    title: `🔥 Hot Lead: ${l.name}`,
                    message: `Enquiry for ${l.destination || 'Varanasi'} · ${l.mobile || 'No Phone'}`,
                    time: safeDateToISOString(l.updatedAt || l.createdAt || new Date()),
                    unread: true
                });
            } else if (l.status === 'FOLLOW_UP') {
                alerts.push({
                    id: `lead_fu_${l._id}`,
                    title: `⏰ Action Due: ${l.name}`,
                    message: `Follow-up required for ${l.name}`,
                    time: safeDateToISOString(l.updatedAt || l.createdAt || new Date()),
                    unread: false
                });
            }
        });
        return alerts.slice(0, 6);
    }, [leads]);

    // 🔄 SKELETON CRM SHELL LOADING STATE (NO BLANK SCREEN & NO LOGIN FLASH)
    if (isCheckingSession) {
        return <CRMShellSkeleton userRole={user?.role} />;
    }

    // 🔒 POLISHED SPLIT-SCREEN ANIMATED LOGIN (PART B)
    if (!isAuthenticated) {
        return <CRMLoginScreen onLoginSuccess={setAuthSession} />;
    }

    const handleNavSelect = (id) => {
        setActiveNav(id);
        try {
            sessionStorage.setItem('crm_active_nav', id);
        } catch {}
    };

    const renderMainWorkspace = () => {
        const role = (user?.role || '').toUpperCase();
        const isCEO = role === 'CEO';

        if (isCEO) {
            if (activeNav === 'RESOURCES') {
                return <VendorManagement token={token} user={user} />;
            }
            if (activeNav === 'BOOKINGS') {
                return (
                    <CEOBookingWorkspace
                        token={token}
                        user={user}
                        refreshTrigger={refreshTrigger}
                        onRefresh={handleTriggerRefresh}
                    />
                );
            }
            if (activeNav === 'FINANCIALS') {
                return (
                    <CEOFinancialWorkspace
                        token={token}
                        user={user}
                        refreshTrigger={refreshTrigger}
                        onRefresh={handleTriggerRefresh}
                        onOpenBooking={handleOpenBooking}
                    />
                );
            }
            if (activeNav === 'REPORTS') {
                return (
                    <CEOReportsWorkspace
                        token={token}
                        user={user}
                        refreshTrigger={refreshTrigger}
                        onRefresh={handleTriggerRefresh}
                    />
                );
            }
            if (activeNav === 'OPERATIONS') {
                return (
                    <CEOOperationsPanel
                        token={token}
                        user={user}
                    />
                );
            }
            if (activeNav === 'TEAM') {
                return (
                    <CEOTeamWorkspace
                        token={token}
                        user={user}
                    />
                );
            }
            if (activeNav === 'QR_NETWORK') {
                return (
                    <QRNetworkWorkspace
                        token={token}
                        user={user}
                    />
                );
            }
            if (activeNav === 'HOTEL_PARTNERS') {
                return (
                    <HotelPartnerWorkspace
                        token={token}
                        user={user}
                    />
                );
            }
            if (activeNav === 'AI_CONTROL_CENTER') {
                return (
                    <React.Suspense fallback={<CRMShellSkeleton />}>
                        <AIControlCenter
                            token={token}
                            user={user}
                        />
                    </React.Suspense>
                );
            }
            if (activeNav === 'CUSTOMERS') {
                return (
                    <Customer360Workspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                    />
                );
            }
            if (activeNav === 'COMMUNICATIONS') {
                return (
                    <CustomerCommunicationWorkspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                    />
                );
            }
            // Default CEO Dashboard
            return (
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
            );
        }

        // Team Leader Workspace Branch
        if (role === 'TEAM_LEADER') {
            if (activeNav === 'CUSTOMERS') {
                return (
                    <Customer360Workspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                    />
                );
            }
            if (activeNav === 'COMMUNICATIONS') {
                return (
                    <CustomerCommunicationWorkspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                    />
                );
            }
            return (
                <TeamLeaderWorkspace
                    token={token}
                    user={user}
                />
            );
        }

        // Team Member Workspace Branch
        if (role === 'TEAM_MEMBER') {
            if (activeNav === 'CUSTOMERS') {
                return (
                    <Customer360Workspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                        onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                    />
                );
            }
            if (activeNav === 'COMMUNICATIONS') {
                return (
                    <CustomerCommunicationWorkspace
                        token={token}
                        user={user}
                        onOpenBooking={handleOpenBooking}
                    />
                );
            }
            return (
                <TeamMemberWorkspace
                    token={token}
                    user={user}
                />
            );
        }

        // Manager / Operations view mapping
        if (activeNav === 'CUSTOMERS') {
            return (
                <Customer360Workspace
                    token={token}
                    user={user}
                    onOpenBooking={handleOpenBooking}
                    onOpenLead={(lead) => { setSelectedLead(lead); setProfileTab('overview'); }}
                />
            );
        }

        if (activeNav === 'COMMUNICATIONS') {
            return (
                <CustomerCommunicationWorkspace
                    token={token}
                    user={user}
                    onOpenBooking={handleOpenBooking}
                />
            );
        }

        if (activeNav === 'REPORTS') {
            return (
                <ManagerReportsWorkspace
                    token={token}
                    user={user}
                    onOpenDocumentCenter={() => setIsDocumentCenterOpen(true)}
                />
            );
        }

        if (activeNav === 'QR_NETWORK') {
            return (
                <QRNetworkWorkspace
                    token={token}
                    user={user}
                />
            );
        }

        if (activeNav === 'AI_PROSPECTS') {
            return (
                <ManagerHunterProspects
                    token={token}
                    user={user}
                    onOpenLead={(lead) => {
                        setSelectedLead(lead);
                        setProfileTab('overview');
                        setActiveNav('LEADS');
                    }}
                    onRefresh={handleTriggerRefresh}
                />
            );
        }

        let stage = 'ALL';
        if (activeNav === 'LEADS') stage = 'LEAD';
        else if (activeNav === 'QUOTES') stage = 'QUOTE';
        else if (activeNav === 'BOOKINGS') stage = 'BOOKING';
        else if (activeNav === 'PAYMENTS') stage = 'PAYMENT';
        else if (activeNav === 'TRIPS') stage = 'TRIP';

        return (
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
                externalStageFilter={stage}
                externalSearchQuery={globalSearch}
            />
        );
    };

    return (
        <CRMAppShell
            user={user}
            activeItem={activeNav}
            onSelectItem={handleNavSelect}
            onLogout={handleLogout}
            onAddLead={() => setIsManualOpen(true)}
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
            alertCount={operationalAlerts.length}
            alerts={operationalAlerts}
            onChangePassword={() => setIsChangePasswordOpen(true)}
        >
            <CRMErrorBoundary
                name={`${activeNav} Workspace`}
                onReset={(newNav) => handleNavSelect(newNav || 'DASHBOARD')}
            >
                {renderMainWorkspace()}
            </CRMErrorBoundary>

            {/* Shared Side Drawers */}
            <CRMErrorBoundary name="Lead Profile Drawer">
                <LeadProfileDrawer
                    selectedLead={selectedLead}
                    setSelectedLead={setSelectedLead}
                    profileTab={profileTab}
                    setProfileTab={setProfileTab}
                    handleInputChange={handleInputChange}
                    handleSaveChanges={onSaveLeadChanges}
                    isSaving={isSaving}
                    user={user}
                    token={token}
                    onOpenQuoteBuilder={handleOpenQuoteBuilder}
                />
            </CRMErrorBoundary>

            <ManualLeadDrawer
                isManualOpen={isManualOpen}
                setIsManualOpen={setIsManualOpen}
                manualLead={manualLead}
                handleManualInputChange={handleManualInputChange}
                handleManualSubmit={onSubmitManualLead}
                handleClearManualDraft={handleClearManualDraft}
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

            {user?.role === 'CEO' ? (
                <CEOBookingDrawer
                    isOpen={isBookingDrawerOpen}
                    onClose={() => setIsBookingDrawerOpen(false)}
                    booking={selectedBooking}
                    token={token}
                    user={user}
                    onBookingUpdated={() => {
                        handleTriggerRefresh();
                    }}
                />
            ) : (
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
            )}

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

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordOpen || isFirstLoginForced}
                isForced={isFirstLoginForced}
                onClose={() => setIsChangePasswordOpen(false)}
                onSuccess={handlePasswordChanged}
                token={token}
            />
        </CRMAppShell>
    );
}