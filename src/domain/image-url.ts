import { isAllowedMediaUrl } from "@/domain/media-url";

// Image URLs follow the shared media rule; kept as its own name so the call sites read as what
// they validate.
export function isAllowedImageUrl(value: string): boolean {
	return isAllowedMediaUrl(value);
}
