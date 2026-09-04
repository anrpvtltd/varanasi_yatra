import React, { useState, useRef, useEffect } from 'react';
import { SearchInput } from '../ui/Input';

/**
 * Modern Clean Top Navigation Header
 */
export default function TopHeader({
    title = 'Dashboard',
    breadcrumb = 'Operations',
    searchQuery = '',
    onSearchChange,
    onOpenMobileMenu,
    user,
    alertCount = 0,
    alerts = [],
    onSelectItem,
    onLogout,
    onChangePassword
}) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const profileRef = useRef(null);
    const isCEO = user?.role === 'CEO';

    // Click outside profile dropdown to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 h-16 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
            {/* LEFT: Mobile Toggle & Contextual Breadcrumb */}
            <div className="flex items-center space-x-3 shrink-0">
                {/* Mobile Menu Button */}
                <button
                    type="button"
                    onClick={onOpenMobileMenu}
                    className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Open sidebar menu"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {/* Page Title & Breadcrumb */}
                <div className="text-left">
                    <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
                        <span>{isCEO ? 'Executive' : 'Operations'}</span>
                        <span>/</span>
                        <span className="text-slate-600 font-semibold capitalize">{breadcrumb}</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                        {title}
                    </h2>
                </div>
            </div>

            {/* CENTER: Global Search Field */}
            <div className="flex-1 max-w-md hidden md:block">
                <SearchInput
                    value={searchQuery}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    placeholder="Search customers, trips, quotes..."
                    size="md"
                    className="w-full"
                />
            </div>

            {/* RIGHT: Actions, Alert Badge & User Profile */}
            {/* RIGHT: Actions, Alert Badge & User Profile */}
            <div className="flex items-center space-x-3 shrink-0">
                {/* Notification / Alert Indicator with Operational Popover */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer relative"
                        title="Alerts & System Notifications"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                        {alertCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                {alertCount > 9 ? '9+' : alertCount}
                            </span>
                        )}
                    </button>

                    {/* Alerts Popover Menu */}
                    {isAlertsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.15)] border border-slate-200/90 py-2 z-40 animate-fadeIn text-left">
                            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                    Operational Alerts ({alertCount})
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                    Real-time
                                </span>
                            </div>

                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                                {alerts && alerts.length > 0 ? (
                                    alerts.map((a, i) => (
                                        <div
                                            key={a.id || `alert-${i}`}
                                            onClick={() => {
                                                setIsAlertsOpen(false);
                                                if (a.targetNav && onSelectItem) onSelectItem(a.targetNav);
                                            }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer transition flex items-start space-x-2.5"
                                        >
                                            <span className="text-base shrink-0">{a.icon || '🔔'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{a.subtitle || a.message}</p>
                                                <span className="text-[9px] text-slate-400 mt-0.5 block">{a.time || 'Immediate action due'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">
                                        <span className="text-2xl block mb-1">✅</span>
                                        All operational tasks up to date.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* User Avatar & Dropdown Menu */}
                <div className="relative" ref={profileRef}>
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer select-none text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xs font-bold text-slate-800 block leading-tight">
                                {user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                                {isCEO ? 'CEO / Owner' : 'Operations Manager'}
                            </span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] border border-slate-200 py-1.5 z-30 animate-fadeIn text-left">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Logged In User'}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Authenticated CRM Session'}</p>
                                <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                                    {user?.role || 'User'}
                                </span>
                            </div>

                            <div className="py-1">
                                <a
                                    href="/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition"
                                >
                                    <span>🌐</span>
                                    <span>Open Public Website</span>
                                </a>

                                {onChangePassword && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            onChangePassword();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer text-left"
                                    >
                                        <span>🔑</span>
                                        <span>Change Password</span>
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        if (onLogout) onLogout();
                                    }}
                                    className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer text-left"
                                >
                                    <span>🔒</span>
                                    <span>Log Out Session</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
