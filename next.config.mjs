/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statically inject critical public envs so they work in middleware/edge too
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NOVITA_API_KEY: process.env.NOVITA_API_KEY,
    NEXT_PUBLIC_NOVITA_API_KEY: process.env.NEXT_PUBLIC_NOVITA_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'faas-output-image.s3.ap-southeast-1.amazonaws.com',
        pathname: '/prod/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    domains: ['faas-output-image.s3.ap-southeast-1.amazonaws.com', 'qfjptqdkthmejxpwbmvq.supabase.co', 'res.cloudinary.com'],
  },
}

export default nextConfig
