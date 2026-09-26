# Luxurious Hub — Complete Cloudflare Ecommerce

Ye project **Luxurious Hub** ke liye complete Cloudflare-native ecommerce starter hai. Product images jaan-bujhkar demo/placeholder rakhi gayi hain, taaki aap baad mein Admin se apni real images upload kar sako.

## Kya included hai

### Customer storefront
- Luxurious Hub branding
- Watches, Perfumes, Attar, Mobile Accessories
- Search
- Category filtering
- Product detail
- Cart
- Wishlist
- Coupons
- COD checkout
- Order confirmation
- Order tracking
- Responsive mobile/desktop design
- SEO-ready metadata

### Admin backend
- Secure admin login using environment secrets
- Dashboard
- Product create/edit/hide
- Price / MRP / stock / category / description / specification
- Product image upload to Cloudflare R2
- Image replacement/delete
- Order list
- Order status updates
- Tracking number support
- Coupon create/enable/disable/update
- Customer summary
- Store settings
- WhatsApp / phone / email / address
- Shipping threshold + shipping fee
- COD toggle

### Backend / database
- Cloudflare Worker API
- Cloudflare D1 database
- Cloudflare R2 image storage
- Server-side cart total calculation
- Server-side stock checks
- Idempotent order key
- Coupon validation on server
- Session + CSRF protection for admin

### Online payments
Razorpay server-side order creation, signature verification and webhook verification are included and are enabled only after you provide the real secrets.

## Windows setup

1. Install Node.js LTS.
2. Open this folder in Command Prompt / PowerShell.
3. Run:

```bash
npm install
npx wrangler login
```

4. Create the D1 database:

```bash
npx wrangler d1 create luxurious-hub-db --location apac --update-config
```

5. Create the R2 bucket:

```bash
npx wrangler r2 bucket create luxurious-hub-images
```

6. Open `wrangler.jsonc` and confirm the generated D1 database id and bucket name.

7. Apply the database migration remotely:

```bash
npx wrangler d1 migrations apply luxurious-hub-db --remote
```

8. Add admin credentials:

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
```

9. Test locally:

```bash
npm run dev
```

10. Deploy:

```bash
npm run deploy
```

## Razorpay setup

Add these only when you are ready:

```bash
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

Webhook URL:

`https://YOUR-DOMAIN.com/api/webhooks/razorpay`

Do not put the secret key in frontend code.

## Custom Cloudflare domain

After deployment, add your purchased domain as a custom domain for the Worker in Cloudflare Dashboard.

Recommended public URLs:

- `/`
- `/admin.html`
- `/api/products`
- `/api/orders/<order-id>`
- `/api/webhooks/razorpay`

## Before taking real orders

Change these real-world values:
- Product names/prices/stock
- Product images
- WhatsApp number
- Phone
- Email
- Store address
- Return/refund policy
- Shipping policy
- Razorpay live credentials

## Important limitation

The code and configuration are prepared here, but Cloudflare account resources, your purchased domain, R2/D1 resources, and secret credentials must be created inside your own Cloudflare/Razorpay accounts. I cannot safely invent or access those private credentials from this chat.

For production, the included backend should be deployed to Cloudflare Worker + D1 + R2; the single-file ChatGPT Site Preview is only a visual/demo environment and is not the production backend.
