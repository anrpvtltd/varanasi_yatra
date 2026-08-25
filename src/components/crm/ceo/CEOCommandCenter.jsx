import React from 'react';
import DashboardHeader from '../shared/DashboardHeader';
import CEOKPICards from './CEOKPICards';
import ExecutivePipelineChart from './ExecutivePipelineChart';
import RevenueOverviewChart from './RevenueOverviewChart';
import BusinessAttentionPanel from './BusinessAttentionPanel';
import CRMSearchBar from '../shared/CRMSearchBar';
import LeadTable from '../shared/LeadTable';

export default function CEOCommandCenter({
    stats,
    filteredLeads,
    loading,
    error,
    user,
    onAddLead,
    onSync,
    onLogout,
    onOpenLead,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter
}) {
    return (
        <>
            <DashboardHeader
                title="Banaras Yatra Executive Control Center"
                subtitle="Full Executive Dashboard & Company Financial Command Panel"
                onAddLead={onAddLead}
                onSync={onSync}
                onLogout={onLogout}
                userIcon="👑"
            />
            <CEOKPICards
                stats={stats}
            />

            {/* Responsive Grid: Pipeline Chart + Revenue Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ExecutivePipelineChart
                    stats={stats}
                />
                <RevenueOverviewChart
                    cash={stats.totalCashInHand}
                    outstanding={stats.totalOutstanding}
                />
            </div>

            <BusinessAttentionPanel
                pendingCount={stats.pendingLeads}
                outstandingAmount={stats.totalOutstanding}
                confirmedCount={stats.confirmedLeads}
            />

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
