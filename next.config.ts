import type { NextConfig } from "next";

// Fail the build immediately if ENCRYPTION_KEY is not set.
// This prevents a broken build from reaching runtime.
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    "❌ Missing required environment variable: ENCRYPTION_KEY\n" +
      "   Add it to your .env file (local) or as a repository secret (CI)."
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
