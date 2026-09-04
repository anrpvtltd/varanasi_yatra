import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateCEODashboard } from '../../../utils/dashboardIntelligence';
import FinancialCommandStrip from './FinancialCommandStrip';
import ProfitPerformance from './ProfitPerformance';
import BusinessFunnel from './BusinessFunnel';
import BusinessRiskRadar from './BusinessRiskRadar';
import PerformanceOverview from './PerformanceOverview';

export default function CEOCommandCenter({
    token,
    user,
    refreshTrigger,
    onRefresh,
    onAddLead,
    onLogout
}) {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setAccessDenied(false);
        try {
            const res = await crmApi.fetchCEODashboard(token);
            if (res.success) {
                const computed = calculateCEODashboard({
                    bookings: res.bookings || [],
                    customerPayments: res.customerPayments || [],
                    vendorPayments: res.vendorPayments || [],
                    expenses: res.expenses || [],
                    quotes: res.quotes || [],
                    leads: res.leads || [],
                    vendors: res.vendors || []
                });
                setDashData(computed);
            }
        } catch (err) {
            if (err.message?.includes('403') || err.message?.includes('Forbidden') || err.message?.includes('Access denied')) {
                setAccessDenied(true);
            } else {
                console.error('Failed to load CEO Dashboard:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    if (accessDenied || user?.role !== 'CEO') {
        return (
            <div className="bg-rose-50 border-2 border-rose-200 p-8 rounded-3xl text-center space-y-3 shadow-md max-w-lg mx-auto my-12">
                <span className="text-4xl block">🔒</span>
                <h3 className="text-lg font-serif font-extrabold text-rose-900">403 Forbidden — CEO Access Required</h3>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    This executive intelligence center contains financial revenue, profit margins, and net cash flow algorithms. Access is strictly restricted to CEO / Owner accounts.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="bg-stone-900 text-white p-5 rounded-3xl shadow-xl flex flex-wrap justify-between items-center gap-3 border border-amber-500/20">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">👑</span>
                        <h2 className="text-xl font-serif font-extrabold text-amber-300 tracking-wider">CEO Executive Command Center</h2>
                    </div>
                    <p className="text-xs text-stone-400 font-medium mt-0.5">
                        Real business profit, net cash flow position, operational risk radar, and conversion funnel analytics.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {onAddLead && (
                        <button
                            type="button"
                            onClick={onAddLead}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer border border-amber-400/30"
                        >
                            <span>➕</span>
                            <span>Add Lead Manually</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            loadData();
                            if (typeof onRefresh === 'function') onRefresh();
                        }}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer shadow-md border border-stone-700"
                    >
                        🔄 Refresh Intelligence
                    </button>

                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-extrabold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                        >
                            <span>🔒</span>
                            <span>Log Out</span>
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-stone-400 font-bold text-xs animate-pulse">
                    Computing Financial Margins, Cash Position & Risk Radar...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. FINANCIAL COMMAND STRIP */}
                    <FinancialCommandStrip strip={dashData?.financialCommandStrip || {}} />

                    {/* 2. PROFIT PERFORMANCE & BUSINESS FUNNEL GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfitPerformance performance={dashData?.profitPerformance || {}} />
                        <BusinessFunnel funnel={dashData?.businessFunnel || {}} />
                    </div>

                    {/* 3. OPERATIONAL & FINANCIAL RISK RADAR */}
                    <BusinessRiskRadar risks={dashData?.operationalRiskRadar || []} />

                    {/* 4. PERFORMANCE & VENDOR HEALTH OVERVIEW */}
                    <PerformanceOverview overview={dashData?.performanceOverview || {}} />
                </div>
            )}
        </div>
    );
}
