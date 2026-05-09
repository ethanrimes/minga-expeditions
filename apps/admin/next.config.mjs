/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Next to transpile workspace packages so they can be authored as
  // plain TS without per-package build steps.
  transpilePackages: ['@minga/supabase', '@minga/types'],
  images: {
    // Cover photos live in the public Supabase storage bucket. The hostname
    // is read from env at runtime so swapping projects requires no code change.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
