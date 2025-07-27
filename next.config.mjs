/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-side modules from the client-side bundle
      config.externals.push(
        'gcp-metadata',
        'mongodb-client-encryption',
        'net',
        'child_process',
        'fs/promises',
        'tls',
        'dns',
        'timers/promises',
        'fs',
        // Optional dependencies of the mongodb driver
        'kerberos',
        '@mongodb-js/zstd',
        '@aws-sdk/credential-providers',
        'snappy',
        'socks',
        'aws4'
      );
    }

    return config;
  },
};

export default nextConfig;