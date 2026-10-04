import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // OG share cards read these font files at request time
  outputFileTracingIncludes: { '/api/og/**': ['./assets/fonts/**'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
};

export default withSerwist(nextConfig);
