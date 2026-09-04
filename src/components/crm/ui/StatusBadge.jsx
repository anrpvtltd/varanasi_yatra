import React from 'react';

/**
 * Standard Status Visual Styles Map
 */
const STATUS_STYLES = {
    // 🟢 SUCCESS / COMPLETED / PAID / CONFIRMED
    PAID: { bg: 'bg-emerald-50', border: 'border-emerald-200/90', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
    COMPLETED: { bg: 'bg-emerald-50', border: 'border-emerald-200/90', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    CONFIRMED: { bg: 'bg-emerald-50', border: 'border-emerald-200/90', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmed' },
    WON: { bg: 'bg-emerald-50', border: 'border-emerald-200/90', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Won' },
    ACCEPTED: { bg: 'bg-emerald-50', border: 'border-emerald-200/90', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Accepted' },
    READY: { bg: 'bg-teal-50', border: 'border-teal-200/90', text: 'text-teal-700', dot: 'bg-teal-500', label: 'Ready' },

    // 🟠 WARNING / PENDING / PARTIAL / PREPARING / FOLLOW-UP
    PARTIAL: { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Partial' },
    PENDING: { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Pending' },
    PREPARING: { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Preparing' },
    FOLLOW_UP: { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Follow Up' },
    'FOLLOW-UP': { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Follow Up' },
    HOT: { bg: 'bg-orange-50', border: 'border-orange-200/90', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Hot Lead' },
    UNPAID: { bg: 'bg-amber-50', border: 'border-amber-200/90', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Unpaid' },

    // 🔵 INFO / ACTIVE / IN-PROGRESS / TRIP STARTED / NEW
    NEW: { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'New' },
    'NEW ENQUIRY': { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'New Enquiry' },
    NEW_ENQUIRY: { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'New Enquiry' },
    IN_PROGRESS: { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    'IN-PROGRESS': { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    TRIP_STARTED: { bg: 'bg-indigo-50', border: 'border-indigo-200/90', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Trip Started' },
    'TRIP STARTED': { bg: 'bg-indigo-50', border: 'border-indigo-200/90', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Trip Started' },
    SENT: { bg: 'bg-blue-50', border: 'border-blue-200/90', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Quote Sent' },
    QUOTE: { bg: 'bg-indigo-50', border: 'border-indigo-200/90', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Quoted' },
    QUOTED: { bg: 'bg-indigo-50', border: 'border-indigo-200/90', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Quoted' },

    // 🔴 DANGER / CANCELLED / OVERPAID / LOST / REJECTED
    CANCELLED: { bg: 'bg-rose-50', border: 'border-rose-200/90', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Cancelled' },
    LOST: { bg: 'bg-rose-50', border: 'border-rose-200/90', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Lost' },
    REJECTED: { bg: 'bg-rose-50', border: 'border-rose-200/90', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Rejected' },
    EXPIRED: { bg: 'bg-rose-50', border: 'border-rose-200/90', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Expired' },
    OVERPAID: { bg: 'bg-purple-50', border: 'border-purple-200/90', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Overpaid' },

    // ⚪ NEUTRAL / DRAFT
    DRAFT: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Draft' },
    NOT_STARTED: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Not Started' }
};

/**
 * Standard CRM Badge
 */
export function Badge({
    children,
    variant = 'neutral', // 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'navy'
    size = 'md',
    dot = false,
    className = ''
}) {
    const sizeClasses = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-xs px-3 py-1'
    };

    const variantClasses = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
        info: 'bg-blue-50 text-blue-700 border-blue-200/80',
        danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
        navy: 'bg-slate-900 text-slate-200 border-slate-700'
    };

    const dotColors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
        danger: 'bg-rose-500',
        neutral: 'bg-slate-400',
        navy: 'bg-amber-400'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide uppercase ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />}
            <span>{children}</span>
        </span>
    );
}

/**
 * Standardized Status Badge for Lead, Quote, Booking, Payment, Trip
 */
export default function StatusBadge({
    status = 'PENDING',
    label,
    size = 'md',
    showDot = true,
    className = ''
}) {
    const rawKey = String(status || '').trim().toUpperCase();
    const config = STATUS_STYLES[rawKey] || {
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        label: status || 'Unknown'
    };

    const displayLabel = label || config.label;

    const sizeClasses = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-xs px-3 py-1 font-bold'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide uppercase select-none shrink-0 ${sizeClasses[size] || sizeClasses.md} ${config.bg} ${config.border} ${config.text} ${className}`}>
            {showDot && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
            )}
            <span>{displayLabel}</span>
        </span>
    );
}
