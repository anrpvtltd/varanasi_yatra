import React from 'react';

/**
 * Standard CRM Button Component
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | md | lg
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon = null,
    iconPosition = 'left',
    isLoading = false,
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    onClick,
    ...rest
}) {
    const isSpinnerActive = isLoading || loading;
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const sizeClasses = {
        sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
        md: 'text-xs font-semibold px-3.5 py-2 rounded-lg gap-2',
        lg: 'text-sm font-semibold px-4.5 py-2.5 rounded-xl gap-2.5'
    };

    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow focus:ring-blue-500 border border-blue-700/20 active:bg-blue-800',
        secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:border-slate-300 focus:ring-slate-400 active:bg-slate-100',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-slate-300',
        danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 focus:ring-rose-400 active:bg-rose-200',
        navy: 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs focus:ring-slate-700 border border-slate-700'
    };

    return (
        <button
            type={type}
            disabled={disabled || isSpinnerActive}
            onClick={onClick}
            className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
            {...rest}
        >
            {isSpinnerActive ? (
                <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : icon && iconPosition === 'left' ? (
                <span className="shrink-0 flex items-center">{icon}</span>
            ) : null}

            <span>{children}</span>

            {!isSpinnerActive && icon && iconPosition === 'right' ? (
                <span className="shrink-0 flex items-center">{icon}</span>
            ) : null}
        </button>
    );
}
