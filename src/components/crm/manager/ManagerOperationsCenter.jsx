import React from 'react';
import DashboardHeader from '../shared/DashboardHeader';
import ManagerKPICards from './ManagerKPICards';
import TodaysMission from './TodaysMission';
import TopPriorityActions from './TopPriorityActions';
import TripReadinessPanel from './TripReadinessPanel';
import CustomerIssueAlerts from './CustomerIssueAlerts';
import OperationsPipelineChart from './OperationsPipelineChart';
import ManagerPriorityActions from './ManagerPriorityActions';
import ActiveUpcomingTripsList from './ActiveUpcomingTripsList';
import CRMSearchBar from '../shared/CRMSearchBar';
import LeadTable from '../shared/LeadTable';

export default function ManagerOperationsCenter({
    stats = {},
    leads = [],
    filteredLeads = [],
    loading = false,
    error = '',
    user = null,
    onAddLead = () => {},
    onSync = () => {},
    onLogout = () => {},
    onOpenLead = () => {},
    searchQuery = '',
    setSearchQuery = () => {},
    statusFilter = 'All',
    setStatusFilter = () => {},
    missionFilter = 'All',
    setMissionFilter = () => {},
    completedTaskIds = new Set(),
    handleToggleComplete = () => {}
}) {
    const handleCategoryClick = (key) => {
        if (missionFilter === key) {
            setMissionFilter('All');
        } else {
            setMissionFilter(key);
        }
    };

    return (
        <>
            <DashboardHeader
                title="Banaras Yatra Operations Console"
                subtitle="Manager Operations & Daily Dispatch Activity Control Panel"
                onAddLead={onAddLead}
                onSync={onSync}
                onLogout={onLogout}
                userIcon="👥"
            />

            {/* 1. Manager KPI Cards */}
            <ManagerKPICards
                stats={stats}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            {/* 2. Today's Mission */}
            <TodaysMission
                leads={leads}
                completedTaskIds={completedTaskIds}
                onCategoryClick={handleCategoryClick}
                activeCategory={missionFilter}
            />

            {/* 3. Top Priority Actions */}
            <div className="mb-6">
                <TopPriorityActions
                    leads={leads}
                    completedTaskIds={completedTaskIds}
                    onToggleComplete={handleToggleComplete}
                    onOpenLead={onOpenLead}
                />
            </div>

            {/* 4. Trip Readiness & 5. Customer Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <TripReadinessPanel
                    leads={leads}
                    onOpenLead={onOpenLead}
                />
                <CustomerIssueAlerts
                    leads={leads}
                    onOpenLead={onOpenLead}
                />
            </div>

            {/* 6. Operations Pipeline Chart */}
            <OperationsPipelineChart
                stats={stats}
            />

            {/* 7. Existing Priority Actions & 8. Active / Upcoming Trips */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ManagerPriorityActions
                    pendingCount={stats.pendingLeads}
                    inProgressCount={stats.inProgressLeads}
                    confirmedCount={stats.confirmedLeads}
                />
                <ActiveUpcomingTripsList
                    leads={leads}
                />
            </div>

            {/* Custom search indicator if mission filter is active */}
            {Boolean(missionFilter && missionFilter !== 'All') && (
                <div className="mb-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs font-semibold text-amber-800 inline-flex items-center space-x-1.5 animate-fadeIn">
                    <span>💡 Filtering results by Category: <strong>{(missionFilter || '').toUpperCase()}</strong></span>
                    <button
                        onClick={() => setMissionFilter('All')}
                        className="text-amber-500 hover:text-amber-800 font-bold ml-1 cursor-pointer"
                    >
                        [Clear Filter]
                    </button>
                </div>
            )}

            {/* 9. Search Bar & 10. Lead Table */}
            <CRMSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                filteredCount={filteredLeads.length}
            />

            <LeadTable
                filteredLeads={filteredLeads}
                loading={loading}
                error={error}
                user={user}
                onOpenLead={onOpenLead}
            />
        </>
    );
}
