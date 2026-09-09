# Sitemap & Site Architecture — JARVIS Hosting

## 1. Domain & Environment Overview
- **Production Host**: `https://imjarvis.cloud`
- **Sitemap URL**: `https://imjarvis.cloud/sitemap.xml`
- **Robots.txt**: `https://imjarvis.cloud/robots.txt`
- **LLM Context**: `https://imjarvis.cloud/llms.txt` & `https://imjarvis.cloud/llm.txt`

---

## 2. Public vs Authenticated Routing Map

| Route | Canonical URL | Access Level | Indexed in Sitemap | Description |
|-------|---------------|--------------|-------------------|-------------|
| `/` | `https://imjarvis.cloud/` | Public | ✅ Yes | Homepage, interactive 3D hero, features, network metrics, FAQ |
| `/plans` | `https://imjarvis.cloud/plans` | Public | ✅ Yes | Dedicated server plans & packs selector |
| `/checkout` | `https://imjarvis.cloud/checkout` | Public | ✅ Yes | Instant UPI Pay Kit & order provisioning |
| `/checkout/:orderId` | `https://imjarvis.cloud/checkout/:orderId` | Public | ❌ No (dynamic) | Direct order checkout & payment completion |
| `/portal` | `https://imjarvis.cloud/portal` | Authenticated | ❌ No (Disallowed) | Customer portal overview & service stats |
| `/portal/orders` | `https://imjarvis.cloud/portal/orders` | Authenticated | ❌ No (Disallowed) | Customer orders management |
| `/portal/billing` | `https://imjarvis.cloud/portal/billing` | Authenticated | ❌ No (Disallowed) | Invoices & transaction receipts |
| `/portal/servers` | `https://imjarvis.cloud/portal/servers` | Authenticated | ❌ No (Disallowed) | Live server console, telemetry & control |
| `/portal/support` | `https://imjarvis.cloud/portal/support` | Authenticated | ❌ No (Disallowed) | Ticket & voice remote assist dispatch |
| `/admin` | `https://imjarvis.cloud/admin` | Admin Only | ❌ No (Disallowed) | Operator telemetry, payments verification, CRM |
| `/api/*` | `https://imjarvis.cloud/api/*` | API Endpoints | ❌ No (Disallowed) | Backend REST API & Discord OAuth routes |

---

## 3. Crawler Directives Summary

- **Public Crawlers**: `Googlebot`, `Bingbot`, `Baiduspider`, `Yandex` can index public routes.
- **AI Crawlers**: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` are enabled for public training/retrieval context while blocking portal/admin/API surfaces.
- **Disallowed**: All user data, private portal dashboards, internal API endpoints, and admin panels.
