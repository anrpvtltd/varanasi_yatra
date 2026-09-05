import React from 'react';

const DEFAULT_TITLE = 'Varanasi Yatra — Spiritual Pilgrimage & Custom Tours in Kashi';
const DEFAULT_DESC = 'Experience Varanasi like a local with personalized spiritual tours, Kashi Vishwanath darshan, sunrise Ganges boat cruises, Sarnath heritage, and handpicked hotels.';
const BASE_DOMAIN = 'https://varanasiyatra.com';
const DEFAULT_IMAGE = `${BASE_DOMAIN}/og-banner.png`;

export default function SEO({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESC,
    canonicalPath = '',
    ogType = 'website',
    ogImage = DEFAULT_IMAGE,
    noIndex = false,
    schema = null
}) {
    const canonicalUrl = canonicalPath ? `${BASE_DOMAIN}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}` : BASE_DOMAIN;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_DOMAIN}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;

    return (
        <>
            {/* React 19 Document Metadata Hoisting */}
            <title>{title.includes('Varanasi Yatra') ? title : `${title} | Varanasi Yatra`}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />
            <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />

            {/* Open Graph Tags */}
            <meta property="og:site_name" content="Varanasi Yatra" />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullOgImage} />

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullOgImage} />

            {/* JSON-LD Structured Data Schema */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </>
    );
}
