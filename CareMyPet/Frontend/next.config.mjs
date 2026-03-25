/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // NEW
  // output: "export",
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
