import React from 'react';
import Button from './Button';

/**
 * Standard CRM Empty State Component
 */
export function EmptyState({
    icon = '📂',
    title = 'No records found',
    description = 'There are no records matching your current filter criteria.',
    actionLabel = null,
    onAction = null,
    className = ''
}) {
    return (
        <div className={`p-12 text-center flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto select-none ${className}`}>
            <span className="text-4xl block opacity-60">{icon}</span>
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
            {actionLabel && onAction && (
                <Button size="sm" variant="secondary" onClick={onAction} className="mt-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

/**
 * Standard CRM Loading State Component
 */
export function LoadingState({
    message = 'Loading data...',
    className = ''
}) {
    return (
        <div className={`py-16 text-center flex flex-col items-center justify-center space-y-3 text-slate-500 ${className}`}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <span className="text-xs font-semibold text-slate-600 tracking-wide">{message}</span>
        </div>
    );
}

/**
 * Standard CRM Error State Component
 */
export function ErrorState({
    title = 'Failed to load data',
    message = 'An unexpected error occurred while communicating with the server.',
    onRetry = null,
    className = ''
}) {
    return (
        <div className={`p-8 text-center bg-rose-50/60 border border-rose-200/80 rounded-2xl flex flex-col items-center justify-center space-y-3 max-w-md mx-auto my-6 text-rose-900 ${className}`}>
            <span className="text-3xl block">⚠️</span>
            <div className="space-y-1">
                <h4 className="text-sm font-bold">{title}</h4>
                <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
            </div>
            {onRetry && (
                <Button size="sm" variant="danger" onClick={onRetry} className="mt-2">
                    🔄 Try Again
                </Button>
            )}
        </div>
    );
}

export default EmptyState;
