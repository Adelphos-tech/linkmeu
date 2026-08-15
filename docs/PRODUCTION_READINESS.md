# LinkMeU Production Readiness Checklist

Last updated: 2026-08-15

---

## Security

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Secrets externalized | ✅ | `.env` used, `.env` removed from git |
| 2 | Secrets rotated | ⚠️ | API key rotated; **Neon DB password still needs rotation** |
| 3 | Git history cleaned | ⚠️ | Old `.env`/credentials remain in history |
| 4 | Admin endpoints protected | ✅ | `x-api-key` auth middleware on PATCH/DELETE |
| 5 | User authentication | 🔄 | In progress — bcrypt + JWT + sessions |
| 6 | RBAC | 🔄 | In progress — roles: user, moderator, admin, super_admin |
| 7 | Object-level authorization (IDOR) | 🔄 | In progress — owner_id + permission checks |
| 8 | Rate limiting | ✅ | In-memory: 100/min public, 30/min admin, 10/min create |
| 9 | CORS restricted | ✅ | Configured origins only |
| 10 | Security headers | ✅ | HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| 11 | Input validation | ✅ | Regex ID validation, required field checks, email format |
| 12 | Upload security | ⚠️ | Extension + MIME check; needs magic-byte + re-encode |
| 13 | CSRF/session protection | 🔄 | In progress — HttpOnly cookies |
| 14 | Audit logs | 🔄 | In progress — `audit_logs` table |

## Infrastructure

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | PM2 process management | ✅ | `linkmeu` + `slotcare` running |
| 2 | PM2 startup | ✅ | systemd service configured |
| 3 | CI/CD | ❌ | GitHub Actions not yet set up |
| 4 | Staging environment | ❌ | Only production |
| 5 | Health checks | ✅ | `/api/health` + `/api/version` |
| 6 | Automated backups | ❌ | No DB backup automation |
| 7 | Disaster recovery | ❌ | Not documented |
| 8 | Error monitoring (Sentry) | ❌ | Not configured |
| 9 | Structured logs | ❌ | Still `console.error` |

## Database

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Migrations | 🔄 | In progress — SQL-based runner |
| 2 | Ownership model | 🔄 | In progress — `owner_id` on listings |
| 3 | Proper indexes | ⚠️ | Basic indexes on category, status, created_at |
| 4 | Money types | ❌ | Still `VARCHAR` for budget/revenue |
| 5 | Constraints | ⚠️ | No foreign keys yet |
| 6 | Backup verification | ❌ | Not tested |

## Product

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | User registration | 🔄 | In progress |
| 2 | User login | 🔄 | In progress |
| 3 | User dashboard | ❌ | Not built |
| 4 | Seller profiles | ❌ | Not built |
| 5 | Favorites | ❌ | Not built |
| 6 | Messaging/inquiries | ❌ | WhatsApp workaround |
| 7 | Moderation queue | ❌ | Admin manually patches status |
| 8 | Seller verification | ❌ | Not built |
| 9 | Payments | ❌ | Frontend claims payment, no webhook |
| 10 | Notifications | ❌ | Not built |

## Performance

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | CDN | ❌ | No CDN configured |
| 2 | Image optimization | ❌ | Base64 + local filesystem |
| 3 | Cursor pagination | ❌ | Still OFFSET |
| 4 | Caching | ❌ | No Redis/cache layer |
| 5 | Search | ⚠️ | Basic category/status filters |
| 6 | Core Web Vitals | ❌ | Not measured |

## SEO

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Dynamic metadata | ❌ | Static SPA meta |
| 2 | Listing URLs | ❌ | `/listings/:id`, not slug |
| 3 | Sitemap | ❌ | Not generated |
| 4 | JSON-LD | ❌ | Not implemented |
| 5 | Canonical URLs | ❌ | Not implemented |
| 6 | SSR/SSG | ❌ | Client-side rendered |

---

## Current Score: ~5.5/10

### P0 (Fix immediately)
1. **Rotate Neon DB password** — only remaining exposed credential
2. **Clean Git history** — remove old secrets after rotation

### P1 (Next sprint)
3. Complete authentication + RBAC
4. Complete database migrations + ownership model
5. Complete IDOR protection + tests
6. Add audit logging

### P2 (Following sprint)
7. User dashboard + seller profiles
8. Listing lifecycle (draft → submitted → under_review → approved → published)
9. Proper media upload (presigned R2/S3 URLs)
10. Payment webhooks (Stripe/Razorpay)

### P3 (Later)
11. Search + filters
12. Notifications + messaging
13. CDN + image optimization
14. SEO improvements
15. Evaluate Next.js migration based on data
