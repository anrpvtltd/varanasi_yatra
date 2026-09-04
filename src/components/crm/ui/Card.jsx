import React from 'react';

/**
 * Standard CRM White Card
 */
export function Card({
    children,
    className = '',
    padding = 'p-5',
    onClick,
    hover = false,
    ...rest
}) {
    return (
        <div
            onClick={onClick}
            className={`bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] text-left transition-all duration-150
                ${hover ? 'hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-slate-300/90 cursor-pointer' : ''}
                ${padding} ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
}

/**
 * Card Header with title, subtitle, and action buttons
 */
export function CardHeader({
    title,
    subtitle,
    action,
    className = '',
    children
}) {
    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4 ${className}`}>
            <div>
                {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                {children}
            </div>
            {action && <div className="flex items-center space-x-2 shrink-0">{action}</div>}
        </div>
    );
}

/**
 * Standard CRM KPI Metric Card
 */
export function KPICard({
    label,
    title,
    value,
    subtitle,
    subtext,
    icon = null,
    badge = null,
    trend = null, // { value: '+12%', isPositive: true }
    variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'blue'
    className = '',
    valueColor,
    onClick
}) {
    const cardLabel = label || title || '';
    const cardSubtext = subtext || subtitle || '';

    const variantTextColors = {
        default: 'text-slate-900',
        success: 'text-emerald-700',
        warning: 'text-amber-700',
        danger: 'text-rose-700',
        blue: 'text-blue-700'
    };

    const resolvedColor = valueColor || variantTextColors[variant] || 'text-slate-900';

    return (
        <Card
            onClick={onClick}
            hover={Boolean(onClick)}
            padding="p-4"
            className={`flex flex-col justify-between space-y-2 min-w-0 overflow-hidden ${className}`}
        >
            <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate block min-w-0" title={cardLabel}>
                    {cardLabel}
                </span>
                {icon && (
                    <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center shrink-0">
                        {icon}
                    </div>
                )}
            </div>

            <div className="flex items-baseline justify-between gap-2 pt-0.5 min-w-0">
                <span className={`text-lg sm:text-xl font-bold tracking-tight truncate block min-w-0 ${resolvedColor}`} title={String(value)}>
                    {value}
                </span>
                {badge && (
                    <span className="shrink-0">{badge}</span>
                )}
                {trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 ${
                        trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>

            {cardSubtext && (
                <span className="text-[11px] text-slate-400 font-medium block truncate min-w-0" title={cardSubtext}>
                    {cardSubtext}
                </span>
            )}
        </Card>
    );
}

export default Card;
