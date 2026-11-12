// Downloads the latest release APK from GitHub into public/ so the site can
// serve it same-origin. Mobile browsers handle a direct download far better
// than GitHub's redirect chain (which some Android browsers bounce off).
//
// Runs as part of the Netlify build: `node scripts/fetch-apk.mjs && pnpm build`
// The file is gitignored — never committed.
//
// IMPORTANT: we deliberately do NOT use the GitHub REST API here — Netlify's
// build IPs are shared and get rate-limited (60 req/hour per IP), which used
// to silently fail the download and send mobile users back to the broken
// GitHub link. Instead we hit the "latest release" redirect directly and read
// the version + size out of the final URL / headers. The API is only a
// fallback of last resort.

import { createWriteStream } from "node:fs";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO = "YUouriii/taafi-app";
const API = `https://api.github.com/repos/${REPO}/releases/latest`;
const LATEST = `https://github.com/${REPO}/releases/latest/download/BreakFree.apk`;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, "..", "public");
const APK = path.join(PUBLIC, "BreakFree.apk");
const TMP = path.join(PUBLIC, "BreakFree.apk.part");
const META = path.join(HERE, "..", "src", "data", "release.json");
const UA = { "User-Agent": "breakfree-site-build" };

/** Persist the release metadata the site renders (version + size). */
function writeMeta(tag, size) {
  mkdirSync(path.dirname(META), { recursive: true });
  writeFileSync(
    META,
    JSON.stringify(
      {
        tag,
        size,
        apk: "local",
        fetchedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
}

/** Pull the tag (v1.2.3) out of a release-asset URL. */
function tagFromUrl(url) {
  const m = url.match(/\/releases\/download\/([^/]+)\//);
  return m ? m[1] : null;
}

try {
  // ── 1. Direct "latest release" download (no API, no rate limit) ────────
  // We follow the redirect manually so we can read the version tag out of
  // the first hop (…/releases/download/v1.5/BreakFree.apk) before GitHub
  // bounces us to the asset CDN, whose URL no longer contains the tag.
  const head = await fetch(LATEST, {
    headers: UA,
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });

  let tag = null;
  let assetUrl = null;

  if (head.status >= 300 && head.status < 400) {
    const location = head.headers.get("location");
    if (location) {
      tag = tagFromUrl(location);
      assetUrl = new URL(location, LATEST).toString();
    }
  }

  if (!tag || !assetUrl) {
    // No redirect (or an unexpected shape) — ask the API instead.
    throw new Error("could not read the version from the latest-release redirect");
  }

  const res = await fetch(assetUrl, {
    headers: UA,
    redirect: "follow",
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`asset download responded ${res.status}`);
  }

  const size = Number(res.headers.get("content-length")) || 0;

  await pipeline(Readable.fromWeb(res.body), createWriteStream(TMP));
  renameSync(TMP, APK);

  writeMeta(tag, size);
  console.log(
    `[fetch-apk] saved public/BreakFree.apk — ${tag} (${Math.round(size / 1048576)} MB)`,
  );
} catch (err) {
  try {
    unlinkSync(TMP);
  } catch {}

  console.warn(
    `[fetch-apk] direct download failed (${err.message}) — trying the GitHub API…`,
  );

  // ── 2. Fallback: GitHub API (can be rate-limited) ─────────────────────
  try {
    const apiRes = await fetch(API, {
      headers: { ...UA, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!apiRes.ok) throw new Error(`GitHub API ${apiRes.status}`);
    const release = await apiRes.json();
    const asset = release.assets?.find((a) => a.name === "BreakFree.apk");
    if (!asset) throw new Error("BreakFree.apk not found in latest release");

    const fileRes = await fetch(asset.browser_download_url, {
      headers: UA,
      signal: AbortSignal.timeout(120_000),
    });
    if (!fileRes.ok || !fileRes.body) throw new Error(`asset ${fileRes.status}`);

    await pipeline(Readable.fromWeb(fileRes.body), createWriteStream(TMP));
    renameSync(TMP, APK);

    writeMeta(release.tag_name, asset.size);
    console.log(
      `[fetch-apk] saved public/BreakFree.apk — ${release.tag_name} (via API)`,
    );
  } catch (err2) {
    try {
      unlinkSync(TMP);
    } catch {}
    console.warn(
      `[fetch-apk] WARN: could not fetch the APK (${err2.message}). The site will keep its last known version and point the button at the GitHub release page instead.`,
    );
    process.exit(0); // never fail the deploy over this
  }
}
