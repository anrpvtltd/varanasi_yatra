import React from 'react';

export default function SectionHeading({
    badge,
    eyebrow,
    title,
    subtitle,
    description,
    align = 'left',
    as = 'h2',
    className = ''
}) {
    const isCenter = align === 'center';
    const tag = badge || eyebrow;
    const desc = subtitle || description;
    const HeadingTag = as;

    return (
        <div className={`mb-6 ${isCenter ? 'text-center' : 'text-left'} ${className}`}>
            {tag && (
                <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 mb-3`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>{tag}</span>
                </div>
            )}
            <HeadingTag className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 tracking-tight leading-tight">
                {title}
            </HeadingTag>
            <div className={`w-14 h-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mt-3 mb-3 ${isCenter ? 'mx-auto' : ''}`}></div>
            {desc && (
                <p className={`text-stone-600 text-xs sm:text-sm leading-relaxed max-w-2xl ${isCenter ? 'mx-auto' : ''}`}>
                    {desc}
                </p>
            )}
        </div>
    );
}
