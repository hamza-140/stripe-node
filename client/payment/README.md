# Payment Client (Vite + React)

This folder contains the payment-focused React application built with Vite. It provides a small store, cart, and checkout UI that connects to a Node.js server for creating Stripe payment sessions/intents.

This README documents how to run, build, and configure the client, plus a short overview of the app structure and useful development tips.

## Quick Start

- Install dependencies and run the dev server:

```powershell
cd client/payment
npm install
npm run dev
```

- Build for production:

```powershell
cd client/payment
npm run build
```

- Preview the production build locally:

```powershell
cd client/payment
npm run preview
```

## Available NPM Scripts

- `npm run dev` — start Vite dev server (hot reload)
- `npm run build` — create a production build
- `npm run preview` — locally preview the production build
- `npm run lint` — run ESLint

These scripts are defined in `package.json`.

## Environment Variables

Create a `.env` file in this folder for local development. Example:

```
# client/payment/.env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
VITE_BACKEND_URL=http://localhost:4242
```

- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (test or live) used by Stripe.js on the client.
- `VITE_BACKEND_URL` — (optional) base URL for your backend server. Default examples in this README assume `http://localhost:4242`.

Note: Vite exposes variables that start with `VITE_` to the client bundle. Do not put secret keys here — only publishable keys belong in client env.

## What This Client Does

- Displays products from `src/data/products.js` and lets users add items to the cart.
- Uses a small global store (likely `zustand` in `src/store`) to manage cart state.
- Sends a request to the server to create a Stripe Checkout Session or Payment Intent when starting checkout.
- Routes include store, cart, checkout, success and cancel pages (see `src/pages`).

## Important Files & Folders

- `src/pages/` — pages used by routing (Store, Cart, Checkout, Success, Cancel)
- `src/components/` — reusable UI components (Navbar, product cards, etc.)
- `src/store/` — client-side cart store implementation
- `src/data/products.js` — example product data used by the store page
- `index.html`, `main.jsx`, `App.jsx` — Vite/React entry points

## Stripe Integration (Client-side)

Frontend sends cart items + customer info → backend creates a Stripe Checkout Session → Stripe redirects the user to Stripe’s hosted payment page → after payment, frontend verifies the session using `/verify-session` and shows the success or cancel page.


## Optional UX Enhancements

- This project includes `canvas-confetti` in `package.json` — it can be used to celebrate successful payments on the `Success` page.
- `react-hot-toast` is included for user notifications.

## Testing Payments Locally

- Use Stripe test cards (e.g., `4242 4242 4242 4242`) for quick testing.
- To test webhooks locally, use the Stripe CLI to forward events to your running server and ensure the server's `STRIPE_WEBHOOK_SECRET` is set. The client does not directly receive webhook events; webhook processing happens on the server.

Example Stripe CLI command:

```powershell
stripe listen --forward-to localhost:4242/webhook
```

## CORS and API Base URL

If your client and server run on different origins during development, ensure the server allows CORS from the client origin (Vite dev server). Alternatively, set `VITE_BACKEND_URL` to the correct server origin.

## Linting & Formatting

- ESLint is configured via the repo's `eslint.config.js`. Run `npm run lint` to check for issues.

## Troubleshooting

- Blank page or failed imports: ensure you ran `npm install` and that the Node and npm versions match project requirements.
- Payments failing: double-check that `VITE_STRIPE_PUBLISHABLE_KEY` is a test key and that the server is configured with the corresponding secret key for the same Stripe account.
- Confetti not working: ensure `canvas-confetti` is imported where used (e.g., `import confetti from 'canvas-confetti'`) and run it inside an effect after a successful payment.
