/**
 * Centralized Brand Configuration & Official Business Contact Constants
 * Kashi-Vashi — Single Source of Truth
 */

export const BRAND_NAME = 'Kashi-Vashi';
export const BRAND_NAME_DEVANAGARI = 'काशी Vashi';
export const BRAND_TAGLINE = 'Spiritual & Heritage Journeys';
export const BRAND_TAGLINE_HINDI = 'यात्रा नहीं, अनुभव है';
export const BRAND_TAGLINE_HINDI_ALT = 'आस्था से अनुभव तक';
export const BRAND_MOTTO = 'Explore • Pray • Experience';

export const BRAND_COLORS = {
    teal: '#0E4A4F',
    saffron: '#F58220',
    terracotta: '#B5522D',
    gold: '#D4AF37',
    beige: '#F8F5EC',
    brown: '#3E2C1C'
};

export const BRAND_TYPOGRAPHY = {
    primaryHindi: 'Noto Serif Devanagari, serif',
    primaryEnglish: 'Playfair Display, serif',
    secondary: 'Playfair Display, serif',
    body: 'Plus Jakarta Sans, sans-serif'
};

export const DISPLAY_PHONE = '+91 84005 54029';
export const PHONE_URL = 'tel:+918400554029';

export const DISPLAY_WHATSAPP = '+91 81497 83494';
export const WHATSAPP_RAW_NUMBER = '918149783494';
export const WHATSAPP_DEFAULT_MESSAGE = 'Namaste Kashi-Vashi! I need assistance.';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

export const EMAIL = 'info.varanasi.yatra@gmail.com';
export const EMAIL_URL = 'mailto:info.varanasi.yatra@gmail.com';

export const INSTAGRAM_HANDLE = '@info.varanasi.yatra';
export const INSTAGRAM_URL = 'https://www.instagram.com/info.varanasi.yatra/';

export const WEBSITE_URL = 'https://varanasiyatra.com';

export const BRAND_CONFIG = {
    name: BRAND_NAME,
    nameDevanagari: BRAND_NAME_DEVANAGARI,
    tagline: BRAND_TAGLINE,
    taglineHindi: BRAND_TAGLINE_HINDI,
    taglineHindiAlt: BRAND_TAGLINE_HINDI_ALT,
    motto: BRAND_MOTTO,
    colors: BRAND_COLORS,
    typography: BRAND_TYPOGRAPHY,
    phone: DISPLAY_PHONE,
    phoneUrl: PHONE_URL,
    whatsapp: DISPLAY_WHATSAPP,
    whatsappUrl: WHATSAPP_URL,
    email: EMAIL,
    emailUrl: EMAIL_URL,
    instagram: INSTAGRAM_HANDLE,
    instagramUrl: INSTAGRAM_URL,
    website: WEBSITE_URL
};

export default BRAND_CONFIG;
