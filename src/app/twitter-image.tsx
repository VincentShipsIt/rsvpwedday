export { alt, contentType, default, size } from "@/app/opengraph-image";

// Route segment config is not inherited through a re-export, so this route needs its own copy of
// the flag; otherwise Next prerenders it at build time and the database read fails.
export const dynamic = "force-dynamic";
