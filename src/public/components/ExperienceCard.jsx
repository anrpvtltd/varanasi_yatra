import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function ExperienceCard({ experience }) {
    const {
        slug,
        title,
        subtitle,
        image,
        duration,
        timings,
        badge,
        shortDesc
    } = experience;

    return (
        <article className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:border-amber-500/40">
            <Link to={`/experiences/${slug}`} className="block relative aspect-[16/10] overflow-hidden">
                <ImageWithSkeleton
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {badge && (
                    <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-sm text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-stone-700/60 shadow-sm">
                        {badge}
                    </span>
                )}
                {duration && (
                    <span className="absolute bottom-3 right-3 bg-stone-950/75 backdrop-blur-sm text-stone-200 text-xs px-2.5 py-0.5 rounded-md font-medium border border-stone-700/40">
                        ⏱ {duration}
                    </span>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                    <span className="text-[11px] font-bold tracking-widest text-amber-700 uppercase">
                        {subtitle}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors mt-0.5 leading-snug">
                        <Link to={`/experiences/${slug}`}>
                            {title}
                        </Link>
                    </h3>
                </div>

                <p className="text-stone-600 text-xs leading-relaxed line-clamp-2 mb-4 flex-grow">
                    {shortDesc}
                </p>

                {timings && (
                    <div className="text-[11px] text-stone-500 bg-stone-50 rounded-lg px-2.5 py-1.5 mb-4 border border-stone-100 flex items-center justify-between">
                        <span className="font-medium text-stone-700">Best Timing:</span>
                        <span className="font-medium text-stone-600 truncate ml-2">{timings}</span>
                    </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <Link
                        to={`/experiences/${slug}`}
                        className="text-xs font-bold text-stone-900 group-hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
                    >
                        <span>Explore Experience</span>
                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <Link
                        to={`/plan-your-trip?experience=${slug}`}
                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-200"
                    >
                        Book / Plan
                    </Link>
                </div>
            </div>
        </article>
    );
}
