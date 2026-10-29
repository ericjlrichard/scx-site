# SCX Site (scx-site)

Public-facing website for Swing ConneXion. Built with React + Vite, served at [swingconnexion.com](https://swingconnexion.com).

## Local dev

```bash
npm install
npm run dev
```

## Deploy to production

```bash
npm run deploy
```

That one command (`tools/deploy.mjs`):

1. Checks that every `VITE_*` setting the code reads is set in `.env` / `.env.local` / `.env.production`, and stops if one is missing. Vite would otherwise build it in as empty without warning; that once shipped a signup page with no reCAPTCHA key.
2. Builds.
3. Checks that each setting's value is actually in the built JavaScript.
4. Uploads `dist/` to a temp folder on the server and copies it into `/srv/scx-site/dist` with `sudo` (that folder belongs to `www-data`), skipping `uploads`.

The env files aren't in git. On a new machine, copy them from the server first:

```bash
scp debian@51.79.65.31:/srv/scx-site/.env debian@51.79.65.31:/srv/scx-site/.env.local debian@51.79.65.31:/srv/scx-site/.env.production .
```

On the server, `dist/uploads` is a link to the real uploads folder (`/srv/scx-site/uploads`), which is why the deploy never copies over it. No server restart needed — Caddy serves the static files directly.

## If node_modules are broken

```bash
rm -rf node_modules package-lock.json
npm install
```
