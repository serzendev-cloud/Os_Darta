// ========================================
// SaaS Product Brand & Company Configuration
// Single Source of Truth for SaaS Landing & Metadata
// Traceability: WP-SAAS-LANDING-002 | WP-SAAS-COMPANY-CONTACT-EXECUTION-001
// ========================================

/**
 * Company Brand Identity (LOCKED / FINAL)
 * SERZEN DEV is the technology company identity.
 */
export const COMPANY_CONFIG = {
  name: 'SERZEN DEV',
  url: 'https://github.com/serzendev-cloud',
  attribution: 'A product by SERZEN DEV',
  legalName: 'SERZEN DEV Technology Cloud',
} as const;

/**
 * SaaS Product Brand Identity (CONFIGURABLE)
 * Product name can be updated via environment variable NEXT_PUBLIC_PRODUCT_NAME.
 * Contact information is stored in PostgreSQL platform_settings table and fetched dynamically.
 */
export const SAAS_PRODUCT_CONFIG = {
  name: process.env.NEXT_PUBLIC_PRODUCT_NAME || "Ma'had Manager",
  tagline: 'Platform SaaS Manajemen Pesantren Terpadu',
  subtitle: 'Solusi Digitalisasi Pesantren, Akademik, Keuangan, & Website Publik dalam Satu Cloud Engine',
  description:
    'Platform SaaS terpadu untuk tata kelola kesantrian, akademik formal & diniyah, kesehatan (UKS), kedisiplinan (E-Tatib), keuangan SPP otomatis, dan website publik pesantren.',
} as const;
