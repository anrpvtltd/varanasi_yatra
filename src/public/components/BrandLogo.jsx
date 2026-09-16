import React from 'react';
import logoImg from '../../assets/logo.png';
import logoHorizontalDark from '../../assets/brand/logo-horizontal-dark.png';
import logoHorizontalLight from '../../assets/brand/logo-horizontal-light.png';
import appIcon from '../../assets/brand/app-icon.png';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_TAGLINE_HINDI } from '../../shared/config/brand';

/**
 * BrandLogo — Standardized Official Kashi Vashi Brand Logo Component
 * Supports:
 * - 'emblem' (default circular emblem)
 * - 'horizontal' (banner logo with emblem + wordmark + tagline)
 * - 'app-icon' (squircle app icon)
 * - 'text' (emblem + styled Noto Serif Devanagari & Playfair Display text)
 */
export default function BrandLogo({
    variant = 'text',
    theme = 'dark',
    size = 'md',
    showTagline = true,
    className = ''
}) {
    if (variant === 'horizontal') {
        const src = theme === 'light' ? logoHorizontalLight : logoHorizontalDark;
        const hClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10';
        return (
            <img
                src={src}
                alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
                className={`w-auto object-contain ${hClass} ${className}`}
            />
        );
    }

    if (variant === 'app-icon') {
        const dimClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';
        return (
            <img
                src={appIcon}
                alt={`${BRAND_NAME} App Icon`}
                className={`rounded-2xl object-contain shadow-md ${dimClass} ${className}`}
            />
        );
    }

    if (variant === 'emblem') {
        const dimClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
        return (
            <img
                src={logoImg}
                alt={`${BRAND_NAME} Emblem`}
                className={`object-contain ${dimClass} ${className}`}
            />
        );
    }

    // Default: 'text' combo with circular emblem + official typography
    const emblemDim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-13 h-13' : 'w-10 h-10';
    const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
    const tagSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[9.5px]';

    const isLight = theme === 'light';

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <img
                src={logoImg}
                alt={`${BRAND_NAME} Emblem`}
                className={`object-contain shrink-0 drop-shadow-sm ${emblemDim}`}
            />
            <div className="flex flex-col justify-center leading-none">
                <div className="flex items-baseline space-x-1.5">
                    <span
                        className={`font-hindi font-bold ${titleSize} ${
                            isLight ? 'text-[#3E2C1C]' : 'text-brand-saffron'
                        }`}
                    >
                        काशी
                    </span>
                    <span
                        className={`font-serif font-bold ${titleSize} tracking-tight ${
                            isLight ? 'text-brand-teal' : 'text-stone-100'
                        }`}
                    >
                        Vashi
                    </span>
                    {/* Sacred Flame accent indicator */}
                    <span className="text-brand-saffron text-xs -ml-0.5 animate-pulse" aria-hidden="true">
                        🔥
                    </span>
                </div>
                {showTagline && (
                    <span
                        className={`font-serif font-normal ${tagSize} tracking-wider uppercase mt-1 ${
                            isLight ? 'text-brand-teal/85' : 'text-amber-400/90'
                        }`}
                    >
                        {BRAND_TAGLINE}
                    </span>
                )}
            </div>
        </div>
    );
}
