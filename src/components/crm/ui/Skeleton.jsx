import React from 'react';

/**
 * Base Shimmer Skeleton Element
 */
export function Skeleton({ className = '', variant = 'default', ...props }) {
    const variantClasses = {
        default: 'bg-slate-200/80',
        dark: 'bg-slate-800/80',
        subtle: 'bg-slate-100',
        amber: 'bg-amber-100/70',
        blue: 'bg-blue-100/70'
    };

    return (
        <div
            className={`animate-pulse rounded-md ${variantClasses[variant] || variantClasses.default} ${className}`}
            {...props}
        />
    );
}

/**
 * KPI Stat Card Skeleton
 */
export function KPICardSkeleton({ className = '' }) {
    return (
        <div className={`bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 min-w-0 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <Skeleton className="h-3 w-36" />
        </div>
    );
}

/**
 * Table Rows Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 6, className = '' }) {
    return (
        <div className={`bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden ${className}`}>
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={`th-${i}`} className={`h-3.5 ${i === 0 ? 'w-32' : 'w-20'}`} />
                ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={`tr-${r}`} className="px-4 py-3.5 flex items-center gap-4">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton
                                key={`td-${r}-${c}`}
                                className={`h-4 ${c === 0 ? 'w-36' : c === cols - 1 ? 'w-16' : 'w-24'}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Drawer Skeleton
 */
export function DrawerSkeleton({ className = '' }) {
    return (
        <div className={`h-full flex flex-col justify-between p-6 space-y-6 bg-white ${className}`}>
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-3.5 w-28" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <div className="space-y-3 pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 pt-4">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
        </div>
    );
}

/**
 * Financial Card Skeleton
 */
export function FinancialCardSkeleton({ className = '' }) {
    return (
        <div className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
        </div>
    );
}

/**
 * Dashboard Workspace Skeleton
 */
export function DashboardSkeleton({ _isCEO = false }) {
    return (
        <div className="space-y-6 animate-fadeIn select-none">
            {/* Action Banner Skeleton */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-52" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-xl" />
                    <Skeleton className="h-9 w-32 rounded-xl" />
                </div>
            </div>

            {/* Quick Intelligence Bar Skeleton */}
            <div className="bg-slate-900 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <Skeleton className="h-4 w-40" variant="dark" />
                    <Skeleton className="h-4 w-28" variant="dark" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={`quick-${i}`} className="space-y-1.5">
                            <Skeleton className="h-3 w-20" variant="dark" />
                            <Skeleton className="h-5 w-24" variant="dark" />
                        </div>
                    ))}
                </div>
            </div>

            {/* 6 Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <KPICardSkeleton key={`kpi-${i}`} />
                ))}
            </div>

            {/* Trend or Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`item-${i}`} className="flex items-center justify-between py-2 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-3.5 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-16 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Complete Application Shell Skeleton (Shown during session check / initial load)
 */
export function CRMShellSkeleton() {
    return (
        <div className="h-screen w-screen overflow-hidden flex bg-slate-50/70 antialiased select-none animate-fadeIn">
            {/* Sidebar Skeleton (Left) */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-900 border-r border-slate-800/80 w-64 p-4 shrink-0">
                <div className="space-y-6">
                    {/* Brand */}
                    <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/80">
                        <Skeleton className="w-9 h-9 rounded-xl" variant="dark" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" variant="dark" />
                            <Skeleton className="h-2.5 w-16" variant="dark" />
                        </div>
                    </div>
                    {/* Role indicator */}
                    <Skeleton className="h-6 w-full rounded-full" variant="dark" />
                    {/* Navigation Items */}
                    <div className="space-y-2 pt-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={`nav-${i}`} className="flex items-center space-x-3 px-2 py-2">
                                <Skeleton className="w-4 h-4 rounded" variant="dark" />
                                <Skeleton className="h-3.5 w-24" variant="dark" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* User profile bottom */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" variant="dark" />
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-20" variant="dark" />
                        <Skeleton className="h-2.5 w-28" variant="dark" />
                    </div>
                </div>
            </div>

            {/* Main Canvas Skeleton (Right) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Skeleton */}
                <header className="bg-white border-b border-slate-200/80 h-16 px-6 flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-44" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-9 w-64 rounded-xl hidden md:block" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                {/* Main Scrollable Canvas */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <DashboardSkeleton />
                    </div>
                </main>
            </div>
        </div>
    );
}
