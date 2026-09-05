import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function GuideCard({ guide }) {
    const {
        slug,
        title,
        category,
        readTime,
        image,
        excerpt
    } = guide;

    return (
        <article className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:border-amber-500/40">
            <Link to={`/travel-guide/${slug}`} className="block relative aspect-[16/10] overflow-hidden">
                <ImageWithSkeleton
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {category && (
                    <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-sm text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-stone-700/60 shadow-sm">
                        {category}
                    </span>
                )}
                {readTime && (
                    <span className="absolute bottom-3 right-3 bg-stone-950/75 backdrop-blur-sm text-stone-200 text-xs px-2.5 py-0.5 rounded-md font-medium border border-stone-700/40">
                        📖 {readTime}
                    </span>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                    <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">
                        Travel Guide
                    </span>
                    <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors mt-0.5 leading-snug">
                        <Link to={`/travel-guide/${slug}`}>
                            {title}
                        </Link>
                    </h3>
                </div>

                <p className="text-stone-600 text-xs leading-relaxed line-clamp-3 mb-4 flex-grow">
                    {excerpt}
                </p>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <Link
                        to={`/travel-guide/${slug}`}
                        className="text-xs font-bold text-stone-900 group-hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
                    >
                        <span>Read Full Guide</span>
                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                        Verified 2026
                    </span>
                </div>
            </div>
        </article>
    );
}
