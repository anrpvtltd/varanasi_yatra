import React from 'react';

export function CardSkeleton({ count = 3, className = '' }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs animate-pulse">
                    <div className="h-48 bg-stone-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-stone-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-stone-200 rounded w-4/5 mb-3"></div>
                    <div className="h-3 bg-stone-200 rounded w-full mb-1.5"></div>
                    <div className="h-3 bg-stone-200 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-stone-200 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
    );
}

export function DetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-6">
            <div className="h-4 bg-stone-200 rounded w-1/4"></div>
            <div className="h-10 bg-stone-200 rounded w-3/4"></div>
            <div className="h-96 bg-stone-200 rounded-3xl w-full"></div>
            <div className="space-y-3">
                <div className="h-4 bg-stone-200 rounded w-full"></div>
                <div className="h-4 bg-stone-200 rounded w-5/6"></div>
                <div className="h-4 bg-stone-200 rounded w-4/6"></div>
            </div>
        </div>
    );
}

export default function PublicSkeleton({ type = 'card', count = 3, className = '' }) {
    if (type === 'detail') {
        return <DetailSkeleton />;
    }
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <CardSkeleton count={count} className={className} />
        </div>
    );
}
