# TripPilot: Engineering & Design Constitution

This document defines strict architectural, visual, and copy standards for TripPilot. Every developer, AI assistant, and contributor must follow these rules without deviation.

---

## 1. Visual & Aesthetic Principles (Strict Non-"Vibe-Coded" Rules)

- **No Purple Gradients:** Do not use purple gradients (e.g. `from-purple-500 to-indigo-500` or violet/purple fades). Use curated, grounded palettes: Deep Navy (`#0f172a`), Slate, Travel Teal (`#0d9488`), and Emerald (`#10b981`).
- **No Pill-Shaped Buttons:** Buttons must not use `rounded-full`. Use modern, crisp geometries such as `rounded-lg`, `rounded-xl`, or `rounded-md`.
- **No Emoji Icons:** Do not use emoji characters (e.g. ✈️, 👋, 🤖, 🛍️, 🔐, 🎉, 🔒, ✨) in user interface copy, navigation, status tags, or toast notifications. Use professional SVG icons from `lucide-react`.
- **No Em Dashes:** Do not use em dashes (`—`). Use colons, commas, hyphens (`-`), or write complete, structured sentences.
- **No Over-The-Top Animations:** Do not use parallax scroll loops, bouncing elements, floating particles, or custom cursor animations. Subtle hover transitions (`duration-200`) and standard micro-interactions only.
- **No AI Badges or "Made with AI" Tags:** Remove all generic "Made with AI" / "Powered by AI" vanity badges.

---

## 2. Content & Copywriting Standards

- **No Vague Hero Text:** Avoid generic marketing buzzwords ("Where will your next adventure take you?", "Unleash the magic of travel"). State the exact capability, functional input, and output clearly and directly.
- **No AI-Slop Copy:** Never use cliché AI filler ("In today's fast-paced world...", "Revolutionize your journey...", "Seamlessly craft memories..."). Use direct, concrete, authoritative, and concise language.
- **No Fake Reviews or Testimonials:** Do not include mock user testimonials or fabricated review quotes on marketing or landing pages.
- **No Fake Metrics or Counters:** Never display artificial counters ("10,000+ satisfied travelers", "99.9% happiness rating", etc.). Show real counts or omit the counter.
- **No AI-Slop Photos:** Use real photography with proper attribution, crisp SVGs, or clean UI diagrams.

---

## 3. Launch Requirements Checklist

Before any production launch or public deployment, the following criteria must be satisfied:

1. [x] **Favicon:** Custom vector SVG favicon installed at `/favicon.svg` and configured in `client/index.html`.
2. [x] **Privacy Policy:** Dedicated legal page available at `/privacy` (`PrivacyPolicy.jsx`).
3. [x] **Terms and Conditions:** Dedicated legal terms page available at `/terms` (`TermsAndConditions.jsx`).
4. [x] **Footer Links:** All legal links wired to real routes instead of empty hashes (`#`).
5. [x] **No Em Dashes or Emojis:** Verified across the client codebase.
6. [ ] **Custom Domain Connected:** Verified DNS records (A/CNAME) and SSL certificate issued.

---

## 4. Custom Domain Connection & Deployment Guide

To connect a custom domain (e.g. `trippilot.app` or `trippilot.ai`):

### Option A: Vercel / Netlify (Client SPA)
1. In the project dashboard, navigate to **Settings > Domains**.
2. Add your custom domain (e.g., `trippilot.ai` and `www.trippilot.ai`).
3. In your DNS provider (Cloudflare, Namecheap, Google Domains):
   - **Apex domain (`@`)**: Add an `A` record pointing to `76.76.21.21` (or your platform's IP).
   - **Subdomain (`www`)**: Add a `CNAME` record pointing to `cname.vercel-dns.com` (or equivalent).
4. Ensure automatic SSL/TLS certificate provisioning is complete before public traffic routing.

### Option B: Nginx / Reverse Proxy (Full-Stack Monorepo)
```nginx
server {
    listen 80;
    server_name trippilot.ai www.trippilot.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name trippilot.ai www.trippilot.ai;

    ssl_certificate /etc/letsencrypt/live/trippilot.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trippilot.ai/privkey.pem;

    # Client Static SPA
    location / {
        root /var/www/trippilot/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
