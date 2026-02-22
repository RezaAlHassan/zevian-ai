export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './Instructions/**/*.{md,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Moon Design System v1 Colors
                primary: '#5C62F5',
                piccolo: '#5C62F5',
                hit: '#FFD000',
                roshi: '#0D9B54',
                dodoria: '#EF5451',
                krillin: '#FF8F1F',
                goku: '#F9FAFB',
                gohan: '#F3F4F6',
                bulma: '#111827',
                trunks: '#6B7280',
                beerus: '#E5E7EB',
                goten: '#FFFFFF',
                popo: '#000000',
                heles: 'rgba(0, 0, 0, 0.04)', // hover overlay
                jiren: 'rgba(0, 0, 0, 0.08)', // active overlay
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                moon: ['DM Sans', 'sans-serif'],
            },
            fontSize: {
                'moon-48': ['3rem', { lineHeight: '3.5rem' }],
                'moon-40': ['2.5rem', { lineHeight: '3rem' }],
                'moon-32': ['2rem', { lineHeight: '2.5rem' }],
                'moon-24': ['1.5rem', { lineHeight: '2rem' }],
                'moon-20': ['1.25rem', { lineHeight: '1.75rem' }],
                'moon-18': ['1.125rem', { lineHeight: '1.75rem' }],
                'moon-16': ['1rem', { lineHeight: '1.5rem' }],
                'moon-14': ['0.875rem', { lineHeight: '1.25rem' }],
                'moon-12': ['0.75rem', { lineHeight: '1rem' }],
            },
            borderRadius: {
                'moon-i-xs': '4px',
                'moon-i-sm': '8px',
                'moon-i-md': '12px',
                'moon-s-xs': '4px',
                'moon-s-sm': '8px',
                'moon-s-md': '12px',
                'moon-s-lg': '16px',
                'moon-s-xl': '20px',
                'moon-s-2xl': '24px',
            },
            boxShadow: {
                'moon-xs': '0 2px 4px rgba(0,0,0,0.08)',
                'moon-sm': '0 4px 8px rgba(0,0,0,0.10)',
                'moon-md': '0 8px 16px rgba(0,0,0,0.12)',
                'moon-lg': '0 16px 32px rgba(0,0,0,0.14)',
                'moon-xl': '0 24px 48px rgba(0,0,0,0.16)',
            },
        },
    },
    plugins: [],
};
