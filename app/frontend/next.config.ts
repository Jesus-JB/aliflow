import type { NextConfig } from "next";

// La API se sirve bajo el mismo origen que la web (/api/*). Así la cookie de
// sesión es de primera parte, httpOnly y SameSite=Lax, sin CORS ni cookies de
// terceros que los navegadores bloquean.
const API_URL = process.env.ALIFLOW_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
