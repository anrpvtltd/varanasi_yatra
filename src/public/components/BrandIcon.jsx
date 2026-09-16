import React from 'react';

import iconHome from '../../assets/brand/icons/icon-home.png';
import iconTours from '../../assets/brand/icons/icon-tours.png';
import iconStay from '../../assets/brand/icons/icon-stay.png';
import iconTransport from '../../assets/brand/icons/icon-transport.png';
import iconPuja from '../../assets/brand/icons/icon-puja.png';
import iconGuide from '../../assets/brand/icons/icon-guide.png';
import iconBlog from '../../assets/brand/icons/icon-blog.png';
import iconGallery from '../../assets/brand/icons/icon-gallery.png';
import iconContact from '../../assets/brand/icons/icon-contact.png';
import iconSupport from '../../assets/brand/icons/icon-support.png';

const ICON_MAP = {
    home: { src: iconHome, label: 'Home' },
    tours: { src: iconTours, label: 'Tours' },
    stay: { src: iconStay, label: 'Stay' },
    hotel: { src: iconStay, label: 'Stay' },
    transport: { src: iconTransport, label: 'Transport' },
    cab: { src: iconTransport, label: 'Transport' },
    puja: { src: iconPuja, label: 'Puja & Rituals' },
    rituals: { src: iconPuja, label: 'Puja & Rituals' },
    darshan: { src: iconPuja, label: 'Puja & Rituals' },
    guide: { src: iconGuide, label: 'Guide' },
    blog: { src: iconBlog, label: 'Blog' },
    gallery: { src: iconGallery, label: 'Gallery' },
    contact: { src: iconContact, label: 'Contact' },
    support: { src: iconSupport, label: 'Support' }
};

/**
 * Official Kashi-Vashi Brand Icon Component
 * Renders the verified brand icon set from official design system
 */
export default function BrandIcon({
    name = 'home',
    size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
    className = '',
    alt = ''
}) {
    const key = String(name).toLowerCase();
    const item = ICON_MAP[key] || ICON_MAP.home;

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    return (
        <img
            src={item.src}
            alt={alt || item.label}
            className={`inline-block object-contain ${sizeClasses[size] || sizeClasses.md} ${className}`}
            loading="lazy"
        />
    );
}

export { ICON_MAP };
