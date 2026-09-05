import React, { useState } from 'react';

/**
 * ImageWithSkeleton
 * Renders an image with a smooth skeleton shimmer until loaded.
 * Handles priority loading (for LCP hero images) vs lazy loading.
 */
export default function ImageWithSkeleton({
    src,
    alt,
    className = '',
    skeletonClassName = 'h-52 w-full',
    priority = false,
    ...props
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
            {!loaded && !error && (
                <div
                    className={`absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse ${skeletonClassName}`}
                    aria-hidden="true"
                />
            )}
            <img
                src={src}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding={priority ? 'sync' : 'async'}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    setLoaded(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                }`}
                {...props}
            />
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-400 text-xs font-medium">
                    <span>Varanasi Yatra</span>
                </div>
            )}
        </div>
    );
}
