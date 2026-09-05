const BASE_DOMAIN = 'https://varanasiyatra.com';

export const buildOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Varanasi Yatra",
    "alternateName": ["BANARAS YATRA Travel & Tours", "Varanasi Yatra Travel & Tours"],
    "url": BASE_DOMAIN,
    "logo": `${BASE_DOMAIN}/logo.png`,
    "description": "Premier spiritual pilgrimage and customized tour operator in Varanasi, providing verified hotels near the ghats, private river boat cruises, Kashi Vishwanath darshan assistance, and private transport.",
    "telephone": "+918400554029",
    "email": "info.varanasi.yatra@gmail.com",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Varanasi",
        "addressRegion": "Uttar Pradesh",
        "postalCode": "221001",
        "addressCountry": "IN"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "25.3176",
        "longitude": "82.9739"
    },
    "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
    },
    "sameAs": [
        "https://www.instagram.com/info.varanasi.yatra/"
    ],
    "priceRange": "₹₹"
});

export const buildBreadcrumbSchema = (breadcrumbs = []) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": crumb.name,
        "item": crumb.url.startsWith('http') ? crumb.url : `${BASE_DOMAIN}${crumb.url}`
    }))
});

export const buildFAQSchema = (faqList = []) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqList.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
        }
    }))
});
