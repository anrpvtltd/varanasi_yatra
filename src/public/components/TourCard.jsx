import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function TourCard({ tour }) {
    const {
        slug,
        title,
        tagline,
        duration,
        image,
        badge,
        startingPrice,
        priceNote,
        inclusions,
        highlights
    } = tour;

    return (
        <article className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:border-amber-500/40">
            <Link to={`/tours/${slug}`} className="block relative aspect-[16/10] overflow-hidden">
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
                    <span className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-sm text-stone-100 text-xs px-2.5 py-1 rounded-md font-semibold border border-stone-700/40">
                        {duration}
                    </span>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                    <span className="text-[11px] font-bold tracking-widest text-amber-700 uppercase">
                        {tagline}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors mt-0.5 leading-snug">
                        <Link to={`/tours/${slug}`}>
                            {title}
                        </Link>
                    </h3>
                </div>

                {/* Pricing row */}
                {startingPrice && (
                    <div className="mb-3 flex items-baseline gap-1.5">
                        <span className="text-xs text-stone-500 font-medium">Starting</span>
                        <span className="text-base font-serif font-black text-stone-900">{startingPrice}</span>
                        {priceNote && (
                            <span className="text-[11px] text-stone-500 font-normal">({priceNote})</span>
                        )}
                    </div>
                )}

                {/* Highlights pill tags */}
                {highlights && highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {highlights.slice(0, 3).map((hl, idx) => (
                            <span
                                key={idx}
                                className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium"
                            >
                                ✓ {hl}
                            </span>
                        ))}
                    </div>
                )}

                {/* Inclusions summary */}
                {inclusions && (
                    <div className="text-[11px] text-stone-600 bg-amber-50/50 rounded-xl p-2.5 mb-4 border border-amber-100/80 mt-auto">
                        <span className="font-bold text-amber-900 block mb-1">Trip Includes:</span>
                        <p className="line-clamp-2 leading-relaxed text-stone-700">
                            {inclusions.slice(0, 4).join(' • ')}
                        </p>
                    </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <Link
                        to={`/tours/${slug}`}
                        className="text-xs font-bold text-stone-900 group-hover:text-amber-700 inline-flex items-center gap-1 transition-colors"
                    >
                        <span>View Itinerary</span>
                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <Link
                        to={`/plan-your-trip?tour=${slug}`}
                        className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                        Customize Plan
                    </Link>
                </div>
            </div>
        </article>
    );
}
