/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoid double-mount of the WebGL world in dev
  transpilePackages: ["three"],
};

export default nextConfig;
