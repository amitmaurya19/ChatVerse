/** @type {import('next').NextConfig} */
const nextConfig = {
  // This webpack configuration helps resolve "Module not found" errors for server-side modules
  // and optional dependencies of the mongodb driver.
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
