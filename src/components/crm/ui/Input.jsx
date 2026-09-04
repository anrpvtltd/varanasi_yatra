import React from 'react';

/**
 * Standard CRM Input Component
 */
export function Input({
    label,
    error,
    helperText,
    icon = null,
    className = '',
    inputClassName = '',
    id,
    disabled = false,
    required = false,
    ...rest
}) {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`flex flex-col space-y-1.5 text-left ${className}`}>
            {label && (
                <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{label} {required && <span className="text-rose-500">*</span>}</span>
                </label>
            )}
            <div className="relative flex items-center">
                {icon && (
                    <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    disabled={disabled}
                    required={required}
                    className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs rounded-lg border transition-colors outline-none
                        ${icon ? 'pl-9 pr-3' : 'px-3'} py-2
                        ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' : 'border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
                        disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                        ${inputClassName}`}
                    {...rest}
                />
            </div>
            {error ? (
                <span className="text-[11px] text-rose-600 font-medium">{error}</span>
            ) : helperText ? (
                <span className="text-[11px] text-slate-500">{helperText}</span>
            ) : null}
        </div>
    );
}

/**
 * Standard CRM Search Input Component with search icon and clear button
 */
export function SearchInput({
    value = '',
    onChange,
    onClear,
    placeholder = 'Search...',
    className = '',
    inputClassName = '',
    size = 'md',
    ...rest
}) {
    const sizeClasses = {
        sm: 'py-1.5 pl-8 pr-7 text-xs',
        md: 'py-2 pl-9 pr-8 text-xs',
        lg: 'py-2.5 pl-10 pr-9 text-sm'
    };

    return (
        <div className={`relative flex items-center ${className}`}>
            <span className="absolute left-3 pointer-events-none text-slate-400 flex items-center">
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            </span>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none ${sizeClasses[size] || sizeClasses.md} ${inputClassName}`}
                {...rest}
            />
            {value && (
                <button
                    type="button"
                    onClick={onClear || (() => onChange && onChange({ target: { value: '' } }))}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
                    aria-label="Clear search"
                >
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </button>
            )}
        </div>
    );
}

/**
 * Standard CRM Select Dropdown
 */
export function Select({
    label,
    error,
    helperText,
    options = [],
    className = '',
    selectClassName = '',
    id,
    disabled = false,
    required = false,
    children,
    ...rest
}) {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`flex flex-col space-y-1.5 text-left ${className}`}>
            {label && (
                <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{label} {required && <span className="text-rose-500">*</span>}</span>
                </label>
            )}
            <div className="relative flex items-center">
                <select
                    id={selectId}
                    disabled={disabled}
                    required={required}
                    className={`w-full appearance-none bg-white text-slate-900 text-xs rounded-lg border border-slate-200/90 pl-3 pr-8 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors outline-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${error ? 'border-rose-400 focus:border-rose-500' : ''} ${selectClassName}`}
                    {...rest}
                >
                    {children || options.map((opt) => (
                        <option key={opt.value ?? opt} value={opt.value ?? opt}>
                            {opt.label ?? opt}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-slate-400 flex items-center">
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </div>
            {error ? (
                <span className="text-[11px] text-rose-600 font-medium">{error}</span>
            ) : helperText ? (
                <span className="text-[11px] text-slate-500">{helperText}</span>
            ) : null}
        </div>
    );
}

/**
 * Standard CRM TextArea Component
 */
export function TextArea({
    label,
    error,
    helperText,
    className = '',
    textareaClassName = '',
    id,
    disabled = false,
    required = false,
    rows = 3,
    ...rest
}) {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`flex flex-col space-y-1.5 text-left ${className}`}>
            {label && (
                <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{label} {required && <span className="text-rose-500">*</span>}</span>
                </label>
            )}
            <textarea
                id={textareaId}
                rows={rows}
                disabled={disabled}
                required={required}
                className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs rounded-lg border px-3 py-2 transition-colors outline-none
                    ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' : 'border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
                    disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                    ${textareaClassName}`}
                {...rest}
            />
            {error ? (
                <span className="text-[11px] text-rose-600 font-medium">{error}</span>
            ) : helperText ? (
                <span className="text-[11px] text-slate-500">{helperText}</span>
            ) : null}
        </div>
    );
}

export const FormInput = Input;

export default Input;
