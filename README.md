# Minpaku · minpaku.ca

A one-page, bilingual (English / 日本語) website for a Japanese–Canadian homestay in
Coquitlam, BC. Every section is a chapter in one cartoon three.js camera journey:
a flight from Tokyo, a tour of the Lower Mainland, a dollhouse look inside the home,
activity dioramas, a trip calculator and a contact form.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173 — includes the /api/contact function
npm run build     # production build in dist/
npm run preview   # serve dist/ with the production security headers
npm run lint
```

## How it's put together

| Path | What lives there |
| --- | --- |
| `src/i18n/` | All site copy in English and Japanese, plus the language/currency provider |
| `src/components/header/` | Floating flight-route header, mobile boarding-pass menu, language switch |
| `src/components/sections/` | The page chapters, top to bottom |
| `src/components/chapters/` | Shared scroll-chapter frame: sticky 3D view, narration cards, cloud entrances |
| `src/components/stage/` | One shared WebGL renderer for every 3D view, the camera rig and static-mesh merging |
| `src/components/hero3d/` | Hero flight scene and the shared toon kit and props |
| `src/components/where3d/` | Lower Mainland tour, the house and the hosts |
| `src/components/story3d/` | Our Story dollhouse cutaway |
| `src/components/activities3d/` | Hiking, snow, pickleball and food islands |
| `src/components/footer3d/` | Sunset footer scene |
| `src/lib/` | Calculator maths and the shared exchange-rate fetch |
| `netlify/functions/contact.mjs` | `POST /api/contact` — validates inquiries, stores and emails them |
| `public/` | Icons, social image, `_headers`, `robots.txt`, `sitemap.xml`, 404 page |
| `design/` | Source artwork for generated icons |

Copy changes only touch `src/i18n/content.js`. Calculator prices live in `src/lib/calculator.js`.

## Contact form

Inquiries post to `/api/contact`. Every valid inquiry is saved as a Netlify Forms
submission (Netlify → Forms → **inquiry**). Email delivery turns on once these
environment variables are set in Netlify (see `.env.example`):

- `CONTACT_TO_EMAIL` — where inquiries go (currently a placeholder)
- `CONTACT_FROM_EMAIL` — sender, on a domain verified with [Resend](https://resend.com)
- `RESEND_API_KEY`

## Deploying

Netlify builds `main` automatically (`npm run build`, publish `dist/`). Work happens on
`staging`; pull requests get a deploy preview before merging.
