const ipv4Pattern = /^\d{1,3}(\.\d{1,3}){3}$/;

function isIpLiteralHostname(hostname: string): boolean {
	const bare =
		hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
	return ipv4Pattern.test(bare) || bare.includes(":");
}

// Admin-submitted media URLs (photos in `next/image`, the background-music track in `<audio>`)
// load directly on the public site, so only an https URL with a real hostname is allowed: no
// `localhost` and no bare IP literal, both of which would point the site at an internal or
// unintended address.
export function isAllowedMediaUrl(value: string): boolean {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return false;
	}

	if (url.protocol !== "https:") {
		return false;
	}

	if (url.hostname === "localhost" || isIpLiteralHostname(url.hostname)) {
		return false;
	}

	return true;
}
