# WaveKeySite

Product marketing site for WaveKey with a sleek, minimalist homepage and dedicated product pages.

## Deploy for team demo (GitHub Pages)

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that deploys the static site to GitHub Pages on every push to `main`.

### One-time GitHub Pages setup

1. Open **Settings → Pages** in this repository.
2. Under **Source**, choose **GitHub Actions**.
3. Save the setting.

After that, every push to `main` publishes automatically.

### Demo URL

- Primary URL: `https://sachinLU26.github.io/WaveKeySite/`

## Use a custom `.io` domain

1. Buy or use your domain (for example, `wavekey.io`).
2. In **Settings → Pages**, set **Custom domain** to `wavekey.io` (or your chosen domain).
3. Update DNS at your registrar with GitHub Pages records.
4. Wait for DNS propagation, then confirm HTTPS is enabled in Pages settings.

## Alternative hosting options

- **Netlify**: connect this repo and publish from repository root.
- **Vercel**: import this repo and deploy as a static site from repository root.
- **Cloudflare Pages**: connect this repo and deploy root as a static site (no build command needed).

## Quick deployment checks

Smoke test these routes after publish:

- `/`
- `/products/byo-app.html`
- `/products/chrome-plugin.html`
- `/products/sdk.html`

Then:

- Check desktop + mobile rendering.
- In browser DevTools Network tab, verify no missing files (no 404s for HTML/CSS/JS assets).
