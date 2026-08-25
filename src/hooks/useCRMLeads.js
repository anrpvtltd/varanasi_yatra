import { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../services/crmApi';
import { INITIAL_MANUAL_LEAD } from '../constants/crm';
import { computeTripReadiness } from '../utils/tripReadiness';
import { detectIssues } from '../utils/leadIssues';
import { checkRequirementsReadiness } from '../utils/requirementsEngine';


export function useCRMLeads(token, isAuthenticated, handleLogout) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [profileTab, setProfileTab] = useState('overview');
    const [isSaving, setIsSaving] = useState(false);

    // States for Manual Lead creation
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualLead, setManualLead] = useState(INITIAL_MANUAL_LEAD);

    // Filter and Search States
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [missionFilter, setMissionFilter] = useState('All');

    // Task Completion Tracking (session level)
    const [completedTaskIds, setCompletedTaskIds] = useState(new Set());

    const handleToggleComplete = useCallback((leadId) => {
        setCompletedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) {
                next.delete(leadId);
            } else {
                next.add(leadId);
            }
            return next;
        });
    }, []);

    const fetchLeads = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError('');
            const resData = await crmApi.fetchEnquiries(token);
            if (resData.success) {
                setLeads(resData.data);
            } else {
                setError(resData.message || 'Data fetch error.');
            }
        } catch (err) {
            setError(err.message || 'Backend engine connection failed.');
            if (err.message && err.message.includes('401')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [token, handleLogout]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        }
    }, [isAuthenticated, fetchLeads]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setSelectedLead(prev => {
            if (!prev) return null;
            const updated = { ...prev, [name]: value };
            if (name === 'totalAmount' || name === 'advanceAmount') {
                const totalVal = name === 'totalAmount' ? value : updated.totalAmount;
                const advanceVal = name === 'advanceAmount' ? value : updated.advanceAmount;
                const total = Number(totalVal) || 0;
                const advance = Number(advanceVal) || 0;
                updated.remainingAmount = total - advance;
            }
            return updated;
        });
    }, []);

    const handleSaveChanges = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedLead) return;
        try {
            setIsSaving(true);
            const resData = await crmApi.updateEnquiry(token, selectedLead._id, selectedLead);
            if (resData.success) {
                alert('✅ CRM Master Lead Updated Successfully!');
                setSelectedLead(null);
                fetchLeads();
            } else {
                alert('❌ Save operations error: ' + (resData.message || 'Failed'));
            }
        } catch (err) {
            alert('❌ Engine connection failed: ' + (err.message || 'Failed'));
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedLead, fetchLeads]);

    const handleManualInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setManualLead(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'totalAmount' || name === 'advanceAmount') {
                const totalVal = name === 'totalAmount' ? value : updated.totalAmount;
                const advanceVal = name === 'advanceAmount' ? value : updated.advanceAmount;
                const total = Number(totalVal) || 0;
                const advance = Number(advanceVal) || 0;
                updated.remainingAmount = total - advance;
            }
            return updated;
        });
    }, []);

    const handleManualSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!manualLead.name || !manualLead.mobile) {
            alert('❌ Name and Mobile number are required!');
            return;
        }
        try {
            setIsSavingManual(true);
            const resData = await crmApi.createManualEnquiry(token, manualLead);
            if (resData.success) {
                alert('🎉 Offline Manual Lead Created Successfully!');
                setIsManualOpen(false);
                setManualLead(INITIAL_MANUAL_LEAD);
                fetchLeads();
            } else {
                alert(`❌ Error creating manual lead: ${resData.message || 'Operation failed'}`);
            }
        } catch (err) {
            alert('❌ Backend engine connection failed: ' + (err.message || 'Failed'));
        } finally {
            setIsSavingManual(false);
        }
    }, [token, manualLead, fetchLeads]);

    // Derived Status Summary Card Data
    const stats = useMemo(() => {
        const totalLeads = leads.length;
        const pendingLeads = leads.filter(l => l.status === 'Pending').length;
        const inProgressLeads = leads.filter(l => l.status === 'In-Progress').length;
        const confirmedLeads = leads.filter(l => l.status === 'Confirmed').length;
        const tripStartedLeads = leads.filter(l => l.status === 'Trip Started').length;
        const completedLeads = leads.filter(l => l.status === 'Completed').length;
        const cancelledLeads = leads.filter(l => l.status === 'Cancelled').length;

        const totalCashInHand = leads.reduce((sum, l) => sum + (l.advanceAmount || 0), 0);
        const totalOutstanding = leads.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

        const convertedCount = confirmedLeads + tripStartedLeads + completedLeads;
        const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0.0";

        return {
            totalLeads,
            pendingLeads,
            inProgressLeads,
            confirmedLeads,
            tripStartedLeads,
            completedLeads,
            cancelledLeads,
            totalCashInHand,
            totalOutstanding,
            conversionRate
        };
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            // 1. Status Filter
            const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

            // 2. Mission Filter
            let matchesMission = true;
            if (missionFilter === 'followups') {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                matchesMission = (lead.status === 'In-Progress' || lead.status === 'Pending') &&
                    lead.followUpDate && lead.followUpDate <= todayStr;
            } else if (missionFilter === 'calls') {
                matchesMission = lead.status === 'Pending' && (!lead.statusHistory || lead.statusHistory.length <= 1);
            } else if (missionFilter === 'ready_quote') {
                matchesMission = checkRequirementsReadiness(lead).isQuoteReady && lead.status !== 'Completed' && lead.status !== 'Cancelled';
            } else if (missionFilter === 'trips') {
                const r = computeTripReadiness(lead);
                matchesMission = lead.status === 'Confirmed' && r && r.status !== 'READY';
            } else if (missionFilter === 'issues') {
                matchesMission = detectIssues(lead).hasIssue;
            }


            // 3. Search Query
            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchesStatus && matchesMission;

            const matchesSearch =
                (lead.name && lead.name.toLowerCase().includes(q)) ||
                (lead.mobile && lead.mobile.includes(q)) ||
                (lead.email && lead.email.toLowerCase().includes(q)) ||
                (lead.pickup && lead.pickup.toLowerCase().includes(q)) ||
                (lead.destination && lead.destination.toLowerCase().includes(q)) ||
                (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(q)) ||
                (lead.vehicleNumber && lead.vehicleNumber.toLowerCase().includes(q)) ||
                (lead.driverName && lead.driverName.toLowerCase().includes(q)) ||
                (lead.driverMobile && lead.driverMobile.includes(q)) ||
                (lead.status && lead.status.toLowerCase().includes(q)) ||
                (lead._id && lead._id.toLowerCase().includes(q));

            return matchesStatus && matchesMission && matchesSearch;
        });
    }, [leads, statusFilter, missionFilter, searchQuery]);

    return {
        leads,
        loading,
        error,
        selectedLead,
        setSelectedLead,
        profileTab,
        setProfileTab,
        isSaving,
        isManualOpen,
        setIsManualOpen,
        isSavingManual,
        manualLead,
        setManualLead,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        missionFilter,
        setMissionFilter,
        completedTaskIds,
        handleToggleComplete,
        fetchLeads,
        handleInputChange,
        handleSaveChanges,
        handleManualInputChange,
        handleManualSubmit,
        stats,
        filteredLeads
    };
}
