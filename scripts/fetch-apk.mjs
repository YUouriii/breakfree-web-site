// Downloads the latest release APK from GitHub into public/ so the site can
// serve it same-origin. Mobile browsers handle a direct download far better
// than GitHub's redirect chain (which some Android browsers bounce off).
//
// Runs as part of the Netlify build: `node scripts/fetch-apk.mjs && pnpm build`
// The file is gitignored — never committed. If the network or the GitHub API
// fails, this exits 0 WITHOUT writing a partial file, and the components
// detect the missing file and fall back to linking GitHub directly.

import { createWriteStream } from "node:fs";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API = "https://api.github.com/repos/YUouriii/taafi-app/releases/latest";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, "..", "public");
const APK = path.join(PUBLIC, "BreakFree.apk");
const TMP = path.join(PUBLIC, "BreakFree.apk.part");
const META = path.join(HERE, "..", "src", "data", "release.json");

// Already fetched this build (or present locally)? Still refresh the
// version metadata below, then skip the download.
if (existsSync(APK)) {
  console.log("[fetch-apk] public/BreakFree.apk already present — skipping download");
}

try {
  const res = await fetch(API, {
    headers: { "User-Agent": "breakfree-site-build", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const release = await res.json();
  const asset = release.assets?.find((a) => a.name === "BreakFree.apk");
  if (!asset) throw new Error("BreakFree.apk not found in latest release");

  // Record the release metadata for the site (version badge, JSON-LD).
  // Written even if the APK download below fails — the components then
  // fall back to linking GitHub, but still show the right version.
  mkdirSync(path.dirname(META), { recursive: true });
  writeFileSync(
    META,
    JSON.stringify(
      {
        tag: release.tag_name,
        size: asset.size,
        apk: "github", // fixed below when the download succeeds
        fetchedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );

  if (existsSync(APK)) {
    markLocal();
    process.exit(0);
  }

  console.log(`[fetch-apk] downloading ${asset.name} (${Math.round(asset.size / 1048576)} MB) from ${release.tag_name}…`);
  const fileRes = await fetch(asset.browser_download_url, {
    headers: { "User-Agent": "breakfree-site-build" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!fileRes.ok || !fileRes.body) throw new Error(`asset download ${fileRes.status}`);

  await pipeline(Readable.fromWeb(fileRes.body), createWriteStream(TMP));
  renameSync(TMP, APK);
  markLocal();
  console.log(`[fetch-apk] saved public/BreakFree.apk (${release.tag_name})`);

  /** Flip the metadata to "served from this site". */
  function markLocal() {
    const meta = JSON.parse(readFileSync(META, "utf8"));
    meta.apk = "local";
    writeFileSync(META, JSON.stringify(meta, null, 2) + "\n");
  }
} catch (err) {
  // Clean the temp file so we never leave a half-written APK around.
  try { unlinkSync(TMP); } catch {}
  console.warn(`[fetch-apk] WARN: could not fetch the APK (${err.message}) — the site keeps its last known version and links GitHub directly`);
  process.exit(0); // never fail the deploy over this
}
