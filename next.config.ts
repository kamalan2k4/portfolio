import type { NextConfig } from "next";

/**
 * Hero mode (the city game with licensed-character models) is development-only.
 * Unless explicitly enabled, its entry is aliased to an empty stub so no game code
 * is emitted into production output at all.
 */
const heroGame = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_HERO_GAME === "1";

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
    resolveAlias: heroGame ? {} : { "@/game/GameExperience": "./src/game/GameDisabled.tsx" },
  },
};

export default nextConfig;
