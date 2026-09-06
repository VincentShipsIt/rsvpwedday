const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 0.85;
const SKIP_BELOW_BYTES = 1 * 1024 * 1024;

// Animated or vector formats a canvas re-draw would break: pass these through untouched.
const PASSTHROUGH_TYPES = new Set(["image/gif", "image/svg+xml"]);

async function decodeToBitmapSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
	if (typeof createImageBitmap === "function") {
		return createImageBitmap(file, { imageOrientation: "from-image" });
	}
	return decodeWithImageElement(file);
}

function decodeWithImageElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Could not decode image."));
		};
		image.src = objectUrl;
	});
}

function sourceDimensions(source: ImageBitmap | HTMLImageElement): {
	width: number;
	height: number;
} {
	if (source instanceof HTMLImageElement) {
		return { width: source.naturalWidth, height: source.naturalHeight };
	}
	return { width: source.width, height: source.height };
}

function canvasToFile(canvas: HTMLCanvasElement, name: string, type: string): Promise<File> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Canvas re-encoding produced no data."));
					return;
				}
				resolve(new File([blob], name, { type }));
			},
			type,
			type === "image/jpeg" ? JPEG_QUALITY : undefined
		);
	});
}

// Shrinks a phone-sized photo (5-10 MB) to fit under the upload cap before it ever leaves the
// browser: draws it to a canvas capped at 2400px on the long edge and re-encodes at ~0.85 quality
// JPEG, except PNG stays PNG (it may carry transparency, which JPEG can't) and GIF/SVG pass
// through untouched (a canvas re-draw would flatten an animation or rasterize a vector).
// `createImageBitmap({ imageOrientation: "from-image" })` applies EXIF rotation for us; browsers
// without it fall back to an <img> element, which applies EXIF rotation on decode too. Any
// failure returns the original file rather than blocking the upload.
export async function downscaleImage(file: File): Promise<File> {
	if (
		file.size < SKIP_BELOW_BYTES ||
		PASSTHROUGH_TYPES.has(file.type) ||
		!file.type.startsWith("image/")
	) {
		return file;
	}

	const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

	try {
		const source = await decodeToBitmapSource(file);
		try {
			const { width, height } = sourceDimensions(source);
			if (width === 0 || height === 0) {
				return file;
			}

			const longEdge = Math.max(width, height);
			const scale = Math.min(1, MAX_LONG_EDGE / longEdge);
			const targetWidth = Math.round(width * scale);
			const targetHeight = Math.round(height * scale);

			const canvas = document.createElement("canvas");
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			const context = canvas.getContext("2d");
			if (!context) {
				return file;
			}
			context.drawImage(source, 0, 0, targetWidth, targetHeight);

			return await canvasToFile(canvas, file.name, outputType);
		} finally {
			if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
				source.close();
			}
		}
	} catch {
		return file;
	}
}
