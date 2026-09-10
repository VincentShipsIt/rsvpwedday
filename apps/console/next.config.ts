import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@rsvpwedday/ui"],
	devIndicators: { position: "bottom-right" },
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "*.cdninstagram.com" },
			{ protocol: "https", hostname: "*.fbcdn.net" },
		],
	},
};

export default nextConfig;
