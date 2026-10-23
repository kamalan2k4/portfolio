# Deployment

The site is a standard Next.js 16 app. Every page is prerendered; the only server code is `POST /api/contact`.
Vercel is the simplest host. Any Node 20+ host that runs `next start` also works.

## Vercel (recommended)

1. **Import** `github.com/kamalan2k4/portfolio` at vercel.com/new. The framework preset is detected automatically.
2. **Environment variables** (Project → Settings → Environment Variables):

   | Name | Required | Example | Notes |
   |---|---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | **Yes** | `https://kamalan.dev` | Canonical origin for metadata, sitemap, robots and OG. No trailing slash. |
   | `RESEND_API_KEY` | For the contact form | `re_…` | Server-only. Without it, the form shows a prefilled "Email me directly" link instead of failing. |
   | `CONTACT_FROM_EMAIL` | With Resend | `Portfolio <hello@kamalan.dev>` | Must be on a domain verified in Resend. `onboarding@resend.dev` works only for sending to your own Resend account email. |
   | `CONTACT_TO_EMAIL` | No | `cskamalan@gmail.com` | Defaults to the email in `src/content/profile.ts`. |

3. **Deploy.** The build runs `prebuild` (generates the project SVGs into `public/generated/`), then `next build`.
4. **Custom domain** (optional): Project → Settings → Domains. Then update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Resend setup (contact form)

1. Create an account at resend.com and add your domain (DNS: SPF + DKIM records).
2. Create an API key with "Sending access" and put it in `RESEND_API_KEY`.
3. Set `CONTACT_FROM_EMAIL` to an address on that domain.
4. Test: submit the form on `/contact`. The email arrives as plain text with **Reply-To** set to the sender.

Abuse protection in `src/app/api/contact/route.ts`: JSON-only, a 10 KB body limit, zod validation, a honeypot field,
a 2.5 s fill-time trap and a per-IP limit of 5 messages per 10 minutes. The limiter lives in memory, per server instance.
For stronger guarantees, swap it for Upstash Redis (same `createRateLimiter` interface).

## Post-deploy checklist

- [ ] `NEXT_PUBLIC_SITE_URL` matches the live domain (check `/robots.txt` and `/sitemap.xml`).
- [ ] `/opengraph-image` renders; test the URL in a social-card validator.
- [ ] Submit the contact form once (or confirm the mailto fallback if email isn't configured).
- [ ] Run `node scripts/check-links.mjs https://<your-domain>`. The canonical links should now resolve.
- [ ] Run `node scripts/lighthouse.mjs https://<your-domain> ./lh` against the deployed site.
- [ ] Enable Vercel Speed Insights or Analytics to collect field Core Web Vitals (lab numbers are in `03-performance.md`).
- [ ] Submit the sitemap in Google Search Console.

## Security headers

Next sets sensible defaults. If you add a CSP, allow `'self'`, `data:` and `blob:` for images (exhibit textures and the
OG image), and `'unsafe-inline'` for styles (Tailwind runtime classes are static, but R3F sets inline transforms).
No third-party scripts are loaded.
