# SCX Site (scx-site)

Public-facing website for Swing ConneXion. Built with React + Vite, served at [swingconnexion.com](https://swingconnexion.com).

## Local dev

```bash
npm install
npm run dev
```

## Deploy to production

```bash
npm run build
scp -r dist/. debian@51.79.65.31:/srv/scx-site/dist/
```

> Use `dist/.` (not `dist/`) so the **contents** are copied, not the folder itself.

No server restart needed — Caddy serves the static files directly.

## If node_modules are broken

```bash
rm -rf node_modules package-lock.json
npm install
```
