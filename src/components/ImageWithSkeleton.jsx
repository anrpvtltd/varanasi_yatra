import React, { useState } from 'react';

export default function ImageWithSkeleton({ src, alt, className = '', containerClassName = 'h-full w-full', width, height }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`relative overflow-hidden ${containerClassName} ${className}`}>
            {/* Shimmer loading skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 animate-shimmer" />
            )}
            
            {/* Real Image */}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                width={width}
                height={height}
                onLoad={() => setIsLoaded(true)}
                className={`transition-all duration-500 ease-in-out ${containerClassName} ${
                    isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                }`}
            />
        </div>
    );
}
