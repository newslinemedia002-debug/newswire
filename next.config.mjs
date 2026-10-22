/** @type {import('next').NextConfig} */
const nextConfig = {
  // Classic caching: this app relies on per-route `revalidate` (ISR for the
  // public pages, RSS-backed sections) and `force-dynamic` for authenticated
  // areas, which cacheComponents forbids.
  cacheComponents: false,
};

export default nextConfig;
