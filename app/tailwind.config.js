/**
 * Tailwind CSS Configuration - Retea Design System
 *
 * Integra los design tokens del sistema de diseño de Retea
 * con TailwindCSS para uso en componentes Svelte.
 */

import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // ============================================
      // COLORS - Design Tokens de Retea
      // ============================================
      colors: {
        // Primary (Brand Teal)
        primary: {
          50: '#9dd9d2',
          100: '#79bcb8',
          200: '#5ec2b7',
          400: '#2ca6a4',
          DEFAULT: '#3aa7a3', // Main brand color
          500: '#3aa7a3',
          600: '#2e8583',
          700: '#236866',
          800: '#1a4f4d',
          900: '#0f3231'
        },

        // Neutral (Grays)
        neutral: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#333333', // Logo color
          900: '#1f2937',
          950: '#0f1419'
        },

        // Semantic Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          DEFAULT: '#10b981',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b'
        },

        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f'
        },

        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          DEFAULT: '#ef4444',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d'
        },

        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          DEFAULT: '#3b82f6',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        }
      },

      // ============================================
      // TYPOGRAPHY - Font Family
      // ============================================
      fontFamily: {
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          ...fontFamily.sans
        ],
        heading: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          ...fontFamily.sans
        ],
        mono: ['Fira Code', 'Consolas', 'Monaco', ...fontFamily.mono]
      },

      // ============================================
      // TYPOGRAPHY - Font Sizes (Modular Scale 1.25)
      // ============================================
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
        base: ['1rem', { lineHeight: '1.5' }],       // 16px
        md: ['1.125rem', { lineHeight: '1.625' }],   // 18px
        lg: ['1.25rem', { lineHeight: '1.5' }],      // 20px
        xl: ['1.5rem', { lineHeight: '1.2' }],       // 24px
        '2xl': ['1.875rem', { lineHeight: '1.2' }],  // 30px
        '3xl': ['2.25rem', { lineHeight: '1.2' }],   // 36px
        '4xl': ['3rem', { lineHeight: '1.1' }],      // 48px
        '5xl': ['3.75rem', { lineHeight: '1.1' }],   // 60px
        '6xl': ['4.5rem', { lineHeight: '1.1' }]     // 72px
      },

      // ============================================
      // SPACING - Base 4px Scale
      // ============================================
      spacing: {
        'px': '1px',
        '0': '0',
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '1.5': '0.375rem',  // 6px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '7': '1.75rem',     // 28px
        '8': '2rem',        // 32px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
        '14': '3.5rem',     // 56px
        '16': '4rem',       // 64px
        '20': '5rem',       // 80px
        '24': '6rem'        // 96px
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        none: '0',
        xs: '0.125rem',   // 2px
        sm: '0.25rem',    // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
        full: '9999px'
      },

      // ============================================
      // BOX SHADOW
      // ============================================
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
        // Custom shadows con primary color
        'primary': '0 4px 14px 0 rgba(42, 166, 164, 0.2)',
        'primary-lg': '0 10px 30px 0 rgba(42, 166, 164, 0.3)'
      },

      // ============================================
      // TRANSITIONS - Durations & Easings
      // ============================================
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '250ms',
        normal: '250ms',
        moderate: '350ms',
        slow: '500ms'
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)'
      },

      // ============================================
      // ANIMATIONS - Keyframes
      // ============================================
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },

      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0, 0, 0.2, 1) forwards',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'slide-up': 'slideUp 250ms cubic-bezier(0.2, 0, 0, 1) forwards',
        'slide-down': 'slideDown 250ms cubic-bezier(0.2, 0, 0, 1) forwards',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },

      // ============================================
      // LAYOUT - Container Max Widths
      // ============================================
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px'
      },

      // ============================================
      // Z-INDEX Scale
      // ============================================
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        notification: '1080'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
};
