# BreakFree / تعافي — website

The official site for **BreakFree (تعافي)** — an open-source Android recovery
companion for quitting compulsive pornography use. Source of the app:
<https://github.com/YUouriii/taafi-app>

## Stack

- [Astro](https://astro.build) — static output, zero framework JS shipped
- Self-hosted fonts via Fontsource (Fraunces, Newsreader, Spline Sans Mono, Amiri)
- Hand-written CSS design system ("a recovery journal at dawn")
- ~40 lines of vanilla JS (streak-counter demo + scroll reveals)
- No cookies, no analytics, nothing tracked

## Commands

| Command           | Action                                   |
| ----------------- | ---------------------------------------- |
| `pnpm install`    | Install dependencies                     |
| `pnpm dev`        | Local dev server at `localhost:4321`     |
| `pnpm build`      | Production build to `./dist/`            |
| `pnpm preview`    | Preview the production build locally     |

## Deploy (Netlify)

The repo is Netlify-ready (`netlify.toml`): build command `pnpm build`,
publish directory `dist`, Node 22 + pnpm 11.17.0 pinned, immutable caching
for hashed `/_astro/*` assets, and basic security headers.

1. Push changes to `main`.
2. On Netlify: **Add new site → Import an existing project → GitHub →
   `breakfree-web-site` → Deploy** (settings are read from `netlify.toml`).
3. Every push to `main` redeploys automatically; PRs get preview URLs.


## Structure

```
src/
  layouts/Layout.astro      — head, fonts, reveal observer
  pages/index.astro         — the single page, assembled from sections
  components/               — Header, Hero, Marquee, Ledger, Night,
                              Commitment, Bilingual, Promises, CTA, Footer
  styles/global.css         — design tokens + base styles
public/favicon.svg
extras/build-apk.yml        — ready-made GitHub Action for the app repo
```

## Enabling the download button

The "Download APK" buttons point to:

```
https://github.com/YUouriii/taafi-app/releases/latest/download/BreakFree.apk
```

That URL resolves to the **latest release**'s `BreakFree.apk` asset, so it
starts working the moment the first release is published. Two ways to get
there:

1. **Manual (fastest):** build the APK in Android Studio
   (`Build → Build App Bundle(s) / APK(s) → Build APK(s)`), then on GitHub:
   *Releases → Draft a new release → attach the APK renamed to
   `BreakFree.apk` → Publish*.
2. **Automated:** copy `extras/build-apk.yml` into the app repo as
   `.github/workflows/build-apk.yml`, add the `GOOGLE_SERVICES_JSON` secret
   (see the header of that file), and tag a release — CI builds and attaches
   the APK for you on every future version.

