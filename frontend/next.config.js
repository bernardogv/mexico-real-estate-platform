/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    // These are all the locales you want to support
    locales: ['es', 'en'],
    // This is the default locale you want to be used when visiting a non-locale prefixed path
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'es',
  },
  images: {
    domains: ['localhost', 'example.com'], // Add any domains you'll load images from
  },
};

module.exports = nextConfig;
