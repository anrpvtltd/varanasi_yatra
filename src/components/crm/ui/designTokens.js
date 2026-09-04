/**
 * Varanasi Yatra CRM Design System Tokens
 * Standardizes color palettes, typography, spacing, and status semantics across the CRM.
 */

export const CRM_TOKENS = {
    colors: {
        // Primary Brand & Navigation
        navy: {
            950: '#030712',
            900: '#0f172a',
            850: '#151f38',
            800: '#1e293b',
            700: '#334155'
        },
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6',
            600: '#2563eb', // Core action blue
            700: '#1d4ed8'
        },
        surface: {
            app: '#f8fafc', // Light slate canvas
            card: '#ffffff',
            subtle: '#f1f5f9',
            border: '#e2e8f0',
            borderHover: '#cbd5e1'
        },
        text: {
            primary: '#0f172a',
            secondary: '#475569',
            muted: '#94a3b8',
            inverted: '#ffffff'
        },
        // Status Semantics
        success: {
            bg: '#ecfdf5',
            border: '#a7f3d0',
            text: '#065f46',
            dot: '#10b981'
        },
        warning: {
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
            dot: '#f59e0b'
        },
        info: {
            bg: '#eff6ff',
            border: '#bfdbfe',
            text: '#1e40af',
            dot: '#3b82f6'
        },
        danger: {
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            dot: '#ef4444'
        },
        neutral: {
            bg: '#f8fafc',
            border: '#e2e8f0',
            text: '#475569',
            dot: '#94a3b8'
        }
    },
    radii: {
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        full: 'rounded-full'
    },
    shadows: {
        xs: 'shadow-xs',
        card: 'shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        cardHover: 'shadow-[0_4px_12px_rgba(15,23,42,0.08)]',
        drawer: 'shadow-[-4px_0_24px_rgba(15,23,42,0.12)]',
        modal: 'shadow-[0_20px_48px_rgba(15,23,42,0.16)]'
    }
};

export default CRM_TOKENS;
