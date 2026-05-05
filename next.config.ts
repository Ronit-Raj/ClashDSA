import type { NextConfig } from "next";

// Server-side only — never exposed to the browser bundle.
// Set BACKEND_URL in .env.local to point at your backend server.
const backendUrl = process.env.BACKEND_URL ?? "http://57.158.25.157:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Every /v1/api/* request from the browser is transparently
        // forwarded by the Next.js dev/prod server to the real backend.
        // Because the browser only ever talks to localhost the cookie is
        // same-origin and Secure/SameSite constraints never apply.
        source: "/v1/api/:path*",
        destination: `${backendUrl}/v1/api/:path*`,
      },
      {
        // Problem statements are static backend HTML files served outside
        // /v1/api. Proxy them too so the contest page can fetch same-origin.
        source: "/:problemId/statement.html",
        destination: `${backendUrl}/:problemId/statement.html`,
      },
    ];
  },
};

export default nextConfig;
