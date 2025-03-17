module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
  },
  fallbackLng: {
    default: ['en'],
  },
  nonExplicitSupportedLngs: true,
  debug: process.env.NODE_ENV === 'development',
}; 