import React from 'react';

/**
 * Standard CRM Table Container
 */
export function TableContainer({ children, className = '' }) {
    return (
        <div className={`w-full overflow-hidden bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}>
            <div className="w-full overflow-x-auto">
                {children}
            </div>
        </div>
    );
}

/**
 * Standard CRM Table
 */
export function Table({ children, className = '' }) {
    return (
        <table className={`w-full text-left border-collapse text-xs ${className}`}>
            {children}
        </table>
    );
}

/**
 * Table Header Wrapper
 */
export function TableHeader({ children, className = '' }) {
    return (
        <thead className={`bg-slate-50/90 border-b border-slate-200/80 sticky top-0 z-10 select-none ${className}`}>
            {children}
        </thead>
    );
}

/**
 * Table Head Cell (th)
 */
export function TableHead({ children, className = '', align = 'left', ...rest }) {
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <th
            className={`px-3.5 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${alignClasses[align] || alignClasses.left} ${className}`}
            {...rest}
        >
            {children}
        </th>
    );
}

/**
 * Table Body Wrapper
 */
export function TableBody({ children, className = '' }) {
    return (
        <tbody className={`divide-y divide-slate-100/90 bg-white ${className}`}>
            {children}
        </tbody>
    );
}

/**
 * Table Row
 */
export function TableRow({ children, className = '', onClick, isSelected = false, ...rest }) {
    return (
        <tr
            onClick={onClick}
            className={`transition-colors duration-100
                ${onClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/80'}
                ${isSelected ? 'bg-blue-50/60 font-medium' : ''}
                ${className}`}
            {...rest}
        >
            {children}
        </tr>
    );
}

/**
 * Table Cell (td)
 */
export function TableCell({ children, className = '', align = 'left', ...rest }) {
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <td
            className={`px-3.5 py-2.5 text-xs text-slate-700 ${alignClasses[align] || alignClasses.left} ${className}`}
            {...rest}
        >
            {children}
        </td>
    );
}

/**
 * Table Empty State Row
 */
export function TableEmpty({
    colSpan = 6,
    title = 'No records found',
    description = 'Try changing your search query or stage filters.',
    icon = '📋'
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <span className="text-3xl block opacity-60">{icon}</span>
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
            </td>
        </tr>
    );
}

/**
 * Table Loading Skeleton Rows
 */
export function TableLoading({ colSpan = 6, rows = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td colSpan={colSpan} className="px-3.5 py-3">
                        <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}

/**
 * Table Pagination Bar
 */
export function TablePagination({
    currentPage = 1,
    totalPages = 1,
    totalRecords = 0,
    pageSize = 10,
    onPageChange,
    className = ''
}) {
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200/80 text-xs text-slate-600 ${className}`}>
            <span className="text-slate-500">
                Showing <strong className="text-slate-800 font-semibold">{startRecord}</strong> to <strong className="text-slate-800 font-semibold">{endRecord}</strong> of <strong className="text-slate-800 font-semibold">{totalRecords}</strong> results
            </span>

            <div className="flex items-center space-x-1.5">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange && onPageChange(currentPage - 1)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    ← Prev
                </button>
                <span className="px-3 py-1 font-semibold text-slate-700">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange && onPageChange(currentPage + 1)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}

export default Table;
