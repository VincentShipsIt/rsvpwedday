import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**" }],
	},
	transpilePackages: ["@rsvpwedday/ui"],
	devIndicators: { position: "bottom-right" },
};

export default nextConfig;
