# ShopCore customer website

The online shop for customers (Next.js, App Router). It uses the same ShopCore API as the phone app.

## Run it

```bash
cd store
cp .env.example .env.local     # then set SHOPCORE_API_URL
npm install
npm run dev                     # http://localhost:3000
npm run build && npm start      # production build
```

| Variable | What it is |
|---|---|
| `SHOPCORE_API_URL` | Address of the ShopCore API (server side only). The browser never talks to the API directly. |
| `NEXT_PUBLIC_SITE_URL` | The public address of this website (for the sitemap, link previews and search results). |

## How it works

- **Pages that search engines read** (home, categories, products, search, deals, help, legal) are built on the server from the shop's catalogue and refreshed every minute.
- **Signing in** goes through this website (`/api/sc/...`). The API's tokens live in `httpOnly` cookies, so scripts on the page can't read them. Only shop endpoints are reachable this way; admin and rider endpoints are not.
- **The cart** is kept in the browser. Checkout needs an account, because the API places orders for signed-in customers.
- **Pictures** come from the API through `/v1/files/...` (proxied by this site).

## Deploy (Cloudflare Workers)

The site runs on Cloudflare Workers through OpenNext (`wrangler.jsonc`, `open-next.config.ts`).

1. Cloudflare dashboard → Workers & Pages → Create → import this repo. **Root directory: `store`**.
2. Build command: `npm run build` (it runs OpenNext). Deploy command: `npx wrangler deploy`.
3. Variables (Settings → Variables and secrets): `SHOPCORE_API_URL` (the API address; also set in `wrangler.jsonc`) and `NEXT_PUBLIC_SITE_URL` (the site's own address, e.g. `https://shop.example.com`). Add `NEXT_PUBLIC_SITE_URL` as a **build** variable too, because it is baked into the pages at build time.
4. On the API (Render): set `TRUST_PROXY` so rate limits see each visitor, and allow the site's address if the API restricts origins.
5. Custom domain: Worker → Settings → Domains & Routes.

From your own computer: `npm run deploy` (needs `npx wrangler login` once), `npm run preview` to try it locally on the Workers runtime.

Pages are built on each visit and the catalogue is cached at Cloudflare's edge for a minute, so the build never needs the API to be reachable.

## What the site covers

Browsing, search and filters, product pages with reviews, cart, checkout (M-Pesa or cash on delivery), accounts, addresses, wishlist, orders with tracking and receipts, returns, refund requests, order and rider ratings, support tickets and live chat, notifications, rewards and referrals, bundle deals, settings (notifications, change phone, delete account), help centre with search, legal and extra content pages, and a maintenance screen that follows the switch in the admin.

## Not included

Guest checkout (the API places orders for signed-in customers only), card payments, and uploading photos with a return request.
