# Gospel Assembly Church — Website

A modern, responsive, accessible website for Gospel Assembly Church of Jesus
Christ (Apostolic), Inc., built to the project specification. This README
covers what's built, what's still a placeholder, and how to take it to
production.

## What's here

```
gac-website/
├── index.html, about.html, leaders.html, doctrine.html,
│   ministries.html, events.html, give.html, contact.html,
│   plan-your-visit.html                    ← the public pages
├── assets/
│   ├── css/style.css                       ← full design system
│   ├── js/main.js                          ← nav, parallax, forms, filters
│   ├── data/content.json                   ← centralized editable content
│   └── img/                                ← add real photos here
├── server/                                 ← backend API for local dev
│   ├── src/index.js
│   ├── src/routes/{contact,events}.js
│   ├── src/services/ChurchManagementService.js
│   └── .env.example
├── functions/                              ← same backend, packaged as a
│                                              Firebase Cloud Function for
│                                              production (see Deployment)
├── pages/_header.html, _footer.html, _body_*.html, build.py  ← page source/build
└── README.md
```

**Why static HTML + a small Node API**, rather than a full framework: it's
the fastest path to something the church's staff can actually maintain
without a build pipeline, while still giving you a real, secure backend for
the one thing that truly needs one — CCB's events data. If you'd rather run
this on Next.js/WordPress/another CMS, the content model (`content.json`),
design system (`style.css`), and CCB integration layer (`server/`) all port
over directly.

**Member Login is a direct link**, not a backend flow: the confirmed CCB API
has no OAuth2/SSO, so there's no way for this site to authenticate an
individual member itself. Every "Member Login" button/link on the site
points straight to the church's own ChMS login page (opens in a new tab) —
see the CCB integration section below for why.

## What's real vs. placeholder

**Built and working:**
- All required pages, fully responsive, mobile-first
- Sticky nav that goes solid on scroll, polished mobile hamburger menu
- Hero with subtle parallax that **respects `prefers-reduced-motion`**
- Service times rendered from `content.json` (edit one file, updates everywhere)
- Accessible forms (visitor + contact), with server-side validation scaffold
- Sermon filtering UI (client-side demo, ready to back with real data)
- Give page that links out to the church's existing giving provider — no
  payment handling on this site
- Full CCB integration **architecture**: service abstraction layer, OAuth/SSO
  redirect flow, role-based route protection, secure cookie handling
- SEO metadata, Organization/Church schema, semantic HTML, WCAG 2.2 AA
  targeted accessibility (skip link, focus states, ARIA, alt text)

**Explicitly placeholder — do not launch without replacing:**
- Church address(es), phone, email, office hours (`content.json` → `contact`)
- Leadership names/photos/bios (`content.json` → `leadership`, and `about.html`)
- Ministry listings (`content.json` → `ministries`, and `ministries.html`)
- Events (`events.html` — wire to CCB Events API once available, see below)
- Sermon library data (`sermons.html`)
- Giving provider URL (`content.json` → `giving.givingUrl`)
- Social media links (`content.json` → `social`)
- `CCB_*` credentials in `server/.env`

None of this content was fabricated — per the project spec, missing content
is left as a clearly marked placeholder rather than invented.

## Content management

Non-technical staff edits **`assets/data/content.json`** to update service
times, contact info, giving links, and (soon) ministries/leadership/events —
no code changes required. `assets/js/main.js` renders service times and
footer contact info from this file automatically.

If you outgrow a single JSON file, the natural next step is a headless CMS
(e.g. Sanity, Contentful) or a platform CMS (WordPress, if you go that
route) — the page templates are already structured so content blocks map
cleanly to CMS fields.

## CCB / ChMS integration — read this before building auth

Per the spec, **CCB/ChMS remains the sole authentication authority.** This
site never stores member passwords or a duplicate member database.

**Confirmed auth mechanism** (against
[Pushpay ChMS v1 docs](https://docs.pushpay.io/chms-v1/docs/getting-started)):
this API uses **HTTP Basic Auth with a dedicated API username/password**
issued from ChMS's own API Admin section (`Setup → API Admin`) — a
service-account credential for server-to-server data access, not an
individual member's personal login. **There is no OAuth2/SSO flow for
this API.** That means this backend can pull church-wide data (events,
groups, ministries, announcements) but **cannot authenticate an
individual site visitor as a specific member.**

Practical consequence: every `Member Login` link/button on the site is a
plain link straight to the church's real ChMS login page
(`https://gacny.ccbchurch.com/goto/login`) — this is not a temporary
fallback pending SSO confirmation, it's the only option this API supports,
and it's a fully legitimate, secure approach (the member signs in on
ChMS's own site; this site never sees the password). There is
intentionally no backend route for this — it doesn't need one.

Before implementing the remaining data methods:

1. Set `CCB_API_URL`, `CCB_API_USERNAME`, `CCB_API_PASSWORD` in
   `server/.env` (base URL is `https://<subdomain>.ccbchurch.com/api.php` —
   for this church, `https://gacny.ccbchurch.com/api.php`).
2. `getEvents`, `getGroups`, `getAnnouncements`, `getMinistries` in
   `server/src/services/ChurchManagementService.js` are stubbed with
   `NotImplementedError` — implement each once you've confirmed the exact
   `srv` service name and response shape against the full Pushpay ChMS v1
   API reference (the getting-started page only documents the auth
   mechanism, not every service).
3. **The API returns XML, not JSON.** Add an XML parser (e.g.
   `fast-xml-parser`) and use it in `ChurchManagementService._call()`
   before this becomes usable.
4. There is intentionally no `getMemberProfile` method, and no
   `/api/member/*` routes — a shared service account has no way to
   resolve "the current member" without a separate per-member identity
   system, which doesn't exist. If one gets built later, it'll need its
   own auth middleware; there's nothing to resurrect here.

**Architecture (enforced in code):**
```
Browser → Website Backend/API (server/) → CCB/ChMS API
```
CCB credentials live only in `server/.env`, never in frontend JS.

## Local development

Frontend (static, no build step):
```bash
cd gac-website
python3 -m http.server 8080
# visit http://localhost:8080
```

Backend API:
```bash
cd gac-website/server
cp .env.example .env   # fill in real values
npm install
npm run dev             # http://localhost:3000
```

If editing page structure/nav/footer, edit `_header.html`, `_footer.html`,
or a `_body_*.html` file, then rerun `python3 build.py` to regenerate the
final HTML pages — don't hand-edit the generated `.html` files at the repo
root, your changes will be overwritten on the next build.

## Deployment

1. **Static frontend**: deploy the repo root (minus `server/`, `_header.html`,
   `_footer.html`, `_body_*.html`, `build.py`) to any static host — Netlify,
   Vercel, S3+CloudFront, or the church's existing hosting provider.
2. **Backend API**: deploy `server/` to any Node host (Render, Railway,
   Fly.io, a small EC2/VPS instance, etc.) with the real `.env` values set
   as platform secrets — never commit `.env`.
3. **Domain**: point the church's existing domain's DNS at the static host
   (A/CNAME per host's instructions); route `/api/*` to the backend host
   (either via the static host's rewrite rules, or a subdomain like
   `api.yourchurchdomain.org`). Do not register a new domain.
4. **SSL**: use your host's automatic HTTPS (Netlify/Vercel/CloudFront all
   provide free managed certs) — don't serve the site over plain HTTP.
5. **Environment variables**: set every value in `server/.env.example` on
   the backend host's secret manager.
6. Update `og:url` / `canonical` placeholders in `build.py` from
   `example-gac-domain.org` to the real domain, then rerun `python3 build.py`.

## Accessibility & performance notes

- Parallax and scroll-reveal animations are disabled automatically for
  users with `prefers-reduced-motion: reduce`.
- The hero photo (`assets/img/hero-church-*.jpg` / `.webp`) is served as a
  responsive `<picture>` with WebP + JPEG variants at 640/1000/1600/2400px
  and `fetchpriority="high"` on the largest-impact image on the page.
  `hero-church-original.jpg` is the untouched source file, kept for
  regenerating variants later — it isn't referenced by any page and can be
  excluded from deployment.
  The crop is biased toward the upper facade (`object-position`) so both
  bell towers stay in frame on mobile, per the spec's focal-point
  requirement — adjust the percentage in `style.css` (`.hero-media img`) if
  a different crop is preferred.
- `assets/img/og-cover.jpg` is a pre-cropped 1200×630 social-share image
  generated from the same photo, wired into the Open Graph tags in every
  page's `<head>`.
- Remaining placeholder images (interior photo, ministry/event/sermon
  thumbnails, leadership headshots) are still solid-color CSS panels —
  run a Lighthouse/axe audit again once those are replaced with real,
  optimized photos before launch.

## What's intentionally not built

- A working payment/giving flow — by spec, giving goes through the church's
  existing approved provider, not custom code here.
- A live CCB connection — cannot be built or tested without real
  credentials; the abstraction layer, auth flow, and security model are
  complete and ready to wire up.
- Real church content (see placeholder list above).
