/**
 * Internationalization Configuration
 * Sprint 5/7 - Enterprise i18n Setup
 * 
 * Configures next-intl for multi-language support
 */

import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'ar', 'hi'];
export const defaultLocale = 'en';

// Locale display names
export const localeNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
};

// RTL locales
export const rtlLocales = ['ar'];

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
