// @ts-check
import { defineConfig } from "astro/config";

// Static, zero-framework output. HTML is compressed at build time.
export default defineConfig({
  compressHTML: true,
});
