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

## Deploy (Vercel)

1. New project from this repo, **Root Directory: `store`**.
2. Environment variables: `SHOPCORE_API_URL` and `NEXT_PUBLIC_SITE_URL` (the website's own address).
3. The API must trust the proxy headers so that rate limits see the visitor's address (`TRUST_PROXY` on the API).

## Not included yet

Live chat with support, guest checkout, product reviews from the website, loyalty points and gift cards.
