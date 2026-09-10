import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@rsvpwedday/ui"],
	devIndicators: { position: "bottom-right" },
};

export default nextConfig;
