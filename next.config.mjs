/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] = 'react-native-web/dist/exports/AsyncStorage';
    return config;
  },
};

export default nextConfig;
