// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static, zero-framework output. HTML is compressed at build time.
// NOTE: `site` must be the final public URL — it drives the canonical tag,
// og:image absolute URLs and the generated sitemap. If the host assigns a
// different domain (or you add a custom domain), update it here once and
// the next build fixes canonical URLs, og:image and sitemap everywhere.
export default defineConfig({
  site: "https://breakfree-taafi.netlify.app",
  compressHTML: true,
  integrations: [sitemap()],
});
