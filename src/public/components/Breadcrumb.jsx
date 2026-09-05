import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <ol className="flex flex-wrap items-center space-x-2 text-xs font-medium text-stone-500">
                <li>
                    <Link to="/" className="hover:text-amber-700 transition-colors flex items-center space-x-1">
                        <span>Home</span>
                    </Link>
                </li>
                {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <li key={idx} className="flex items-center space-x-2">
                            <span className="text-stone-300">/</span>
                            {isLast ? (
                                <span className="text-stone-900 font-semibold" aria-current="page">
                                    {item.name}
                                </span>
                            ) : (
                                <Link to={item.url} className="hover:text-amber-700 transition-colors">
                                    {item.name}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
