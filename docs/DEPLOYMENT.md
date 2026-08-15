# LinkMeU Deployment Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development](#local-development)
3. [Testing](#testing)
4. [Continuous Integration](#continuous-integration)
5. [Production Deployment](#production-deployment)
6. [GitHub Secrets](#github-secrets)
7. [PM2 Process Management](#pm2-process-management)
8. [Health Checks](#health-checks)
9. [Version Verification](#version-verification)
10. [Rollback Procedure](#rollback-procedure)
11. [Migration Safety](#migration-safety)
12. [Secret Handling](#secret-handling)
13. [Branch Protection](#branch-protection)

---

## Architecture Overview

LinkMeU consists of two deployable artifacts:

| Artifact | Technology | Deployment Target |
|----------|-----------|-------------------|
| Frontend | React 18 + Vite | GitHub Pages |
| Backend | Express + PostgreSQL | VPS (PM2) |

The frontend is built as static files and served via GitHub Pages.
The backend runs as a Node.js process managed by PM2 on a VPS.
The backend also serves static frontend files from `STATIC_PATH` as a fallback.

---

## Local Development

### Prerequisites

- Node.js 20+ (production runs 20.x)
- PostgreSQL 15+ (or Neon PostgreSQL)
- npm

### Environment Variables

Create a `.env` file in the project root. **Never commit this file.**

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/linkmeu_dev

# Security
JWT_SECRET=dev-secret-do-not-use-in-production
ADMIN_API_KEY=dev-admin-key

# Server
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Start Development

```bash
# Install dependencies
npm ci

# Start frontend dev server
npm run dev

# In another terminal, start backend
npm run server
```

The frontend dev server runs on port 3000 (Vite default).
The backend API runs on port 3001.

---

## Testing

### Test Scripts

```bash
# Run all tests locally (requires running PostgreSQL and backend server)
npm test

# Run security regression tests (rate limiting disabled)
npm run test:security

# Run rate-limit threshold test (rate limiting enabled)
npm run test:rate-limit
```

### Local Test Requirements

1. PostgreSQL must be running.
2. The `users`, `listings`, and `audit_logs` tables must exist.
3. Backend server must be running with:
   - `DATABASE_URL` pointing to your local database
   - `JWT_SECRET` set
   - `PORT=3001`
4. Tests connect to `http://localhost:3001` by default.

### Environment Variables for Tests

```bash
# For security tests (rate limiting disabled to avoid test interference)
DISABLE_RATE_LIMIT=true node tests/security.test.cjs

# For rate-limit tests (rate limiting must be enabled)
node tests/rate-limit.test.cjs
```

---

## Continuous Integration

### Workflows

Two GitHub Actions workflows are configured:

#### `.github/workflows/ci.yml`

Runs on **pull requests** and **pushes to `main`**.

Steps:
1. Checkout repository
2. Setup Node.js 20
3. Install dependencies with `npm ci`
4. Start PostgreSQL service
5. Apply CI test schema (`tests/fixtures/ci-schema.sql`)
6. Start backend server with test environment
7. Run security regression tests (`DISABLE_RATE_LIMIT=true`)
8. Run rate-limit threshold test
9. Build frontend with Vite
10. Verify build output exists

If any step fails, the workflow fails and blocks deployment.

#### `.github/workflows/deploy.yml`

Runs only on **pushes to `main`**.

Steps:
1. Runs the same test-and-build steps as CI
2. Deploys frontend to GitHub Pages (if tests pass)
3. Deploys backend to production VPS via SSH (if tests pass and secrets are configured)

### CI Test Database

The CI workflow uses a temporary PostgreSQL 15 service container. The schema is created from `tests/fixtures/ci-schema.sql`, which sets up `users`, `listings`, and `audit_logs` tables with the exact columns expected by the application.

**Test-only values used in CI:**
- `DATABASE_URL` = local PostgreSQL service (no external connectivity)
- `JWT_SECRET` = `test-secret-ci-do-not-use-in-production`
- `ADMIN_API_KEY` = `test-admin-key-ci-only`

No production credentials are used in CI.

---

## Production Deployment

### Frontend Deployment (GitHub Pages)

The frontend is automatically deployed to GitHub Pages by `.github/workflows/deploy.yml` when tests pass on `main`.

### Backend Deployment (VPS)

The backend deployment requires three GitHub repository secrets (see [GitHub Secrets](#github-secrets)).

Deployment sequence:
1. CI tests must pass
2. Workflow SSHs into the production server
3. Initializes git in `/var/www/linkmeu-api` (if not already present)
4. Fetches the exact commit SHA from GitHub
5. Checks out the exact commit
6. Runs `npm ci --production`
7. Sets `GIT_COMMIT` environment variable
8. Reloads the PM2 process with updated environment
9. Polls `/api/health` up to 10 times (3-second intervals)
10. If health check passes, deployment succeeds
11. If health check fails, the deployment job fails

### Exact Commit Deployment

The workflow deploys the specific commit SHA that triggered the workflow (`${{ github.sha }}`). This is recorded in the `GIT_COMMIT` environment variable and exposed by the `/api/version` endpoint.

---

## GitHub Secrets

Configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Required For | Description |
|-------------|-------------|-------------|
| `PROD_HOST` | Backend deploy | Production server IP or hostname |
| `PROD_USER` | Backend deploy | SSH username (e.g., `root`) |
| `PROD_SSH_KEY` | Backend deploy | SSH private key for the deployment user |

### Setting Up the SSH Key

1. Generate a dedicated deployment key (do not reuse personal keys):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/linkmeu-deploy -N ""
   ```
2. Add the public key to the server's `~/.ssh/authorized_keys`:
   ```bash
   cat ~/.ssh/linkmeu-deploy.pub >> ~/.ssh/authorized_keys
   ```
3. Add the **private key** contents to GitHub as `PROD_SSH_KEY`.

---

## PM2 Process Management

Production uses PM2 to manage the Node.js process.

### View Status

```bash
pm2 status
pm2 show linkmeu
pm2 logs linkmeu
```

### Manual Restart

```bash
pm2 reload linkmeu --update-env
```

### Startup Script

Ensure PM2 restarts on boot:

```bash
pm2 startup systemd
pm2 save
```

---

## Health Checks

### Production Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-08-15T10:00:00.000Z"
}
```

### Deployment Health Verification

The deployment workflow automatically polls this endpoint after PM2 reload. If the database is unreachable or the server fails to start, the deployment job fails.

### Manual Health Check

```bash
# From the production server
curl -s http://localhost:3000/api/health | jq .

# From external (if firewall allows)
curl -s https://linkmeu.com/api/health
```

---

## Version Verification

### Version Endpoint

```bash
curl http://localhost:3000/api/version
```

Expected response:
```json
{
  "service": "linkmeu-api",
  "version": "1.2.0",
  "commit": "abc1234",
  "environment": "production",
  "timestamp": "2026-08-15T10:00:00.000Z"
}
}
```

The `commit` field reflects the deployed Git commit. It is determined by:
1. `git rev-parse --short HEAD` (if `.git` directory exists)
2. Fallback to `GIT_COMMIT` environment variable
3. Fallback to `"unknown"`

### Verify Deployed Commit

After deployment, compare the version endpoint `commit` with the GitHub commit SHA:

```bash
curl -s http://localhost:3000/api/version | jq -r '.commit'
git rev-parse --short HEAD
```

---

## Rollback Procedure

### Automated Rollback

The deployment workflow does not implement automatic rollback. If the health check fails after deployment, the workflow fails and the operator must intervene.

### Manual Rollback

If a deployment introduces a critical issue, roll back manually:

1. **SSH into the production server:**
   ```bash
   ssh root@<PROD_HOST>
   ```

2. **Identify the previous good commit:**
   ```bash
   cd /var/www/linkmeu-api
   git log --oneline -5
   ```

3. **Checkout the previous commit:**
   ```bash
   git checkout -f <PREVIOUS_COMMIT_SHA>
   ```

4. **Reinstall dependencies (if package.json changed):**
   ```bash
   npm ci --production
   ```

5. **Reload PM2:**
   ```bash
   export GIT_COMMIT=<PREVIOUS_COMMIT_SHA>
   pm2 reload linkmeu --update-env
   ```

6. **Verify health:**
   ```bash
   curl -s http://localhost:3000/api/health
   curl -s http://localhost:3000/api/version
   ```

7. **Optional: view logs:**
   ```bash
   pm2 logs linkmeu --lines 50
   ```

### Emergency Rollback (Fastest)

If you know the exact previous commit:

```bash
ssh root@<PROD_HOST> "cd /var/www/linkmeu-api && git checkout -f <SHA> && npm ci --production && GIT_COMMIT=<SHA> pm2 reload linkmeu --update-env && sleep 5 && curl -s http://localhost:3000/api/health"
```

---

## Migration Safety

### Migration Runner

The project includes a SQL-based migration runner:

```bash
npm run db:migrate
```

This runs scripts in `db/migrations/` in order, skipping already-applied migrations.

### Deployment Policy

**Database migrations are NOT run automatically during deployment.**

Migrations should be reviewed and executed manually by an operator:

1. Review the migration files in `db/migrations/`
2. Back up the database if the migration is non-trivial
3. Run `npm run db:migrate` on the production server
4. Verify the application health after migration

This policy prevents accidental destructive operations during automated deployments.

### Migration Files

| File | Purpose |
|------|---------|
| `0001_users_and_ownership.sql` | Users table, owner_id, audit_logs |
| `0002_add_constraints.sql` | Foreign keys, CHECK constraints |
| `0003_migrate_existing_users.sql` | Legacy password/name migration |
| `0004_cleanup_old_password_column.sql` | Drop obsolete columns |
| `0005_fix_role_default.sql` | Fix role default value |

---

## Secret Handling

### What Is Secret

The following values must never be committed to Git:

- `DATABASE_URL` (Neon connection string)
- `JWT_SECRET`
- `ADMIN_API_KEY`
- SSH private keys
- Any production password or token

### `.env` File

`.env` is listed in `.gitignore` and must remain untracked.

### Vite-Prefixed Variables

**Important:** Variables prefixed with `VITE_` are embedded into the frontend bundle by Vite. **Never prefix server-only secrets with `VITE_`.**

Server-only secrets must never use the `VITE_` prefix. The application now uses `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and `ADMIN_API_KEY` as the canonical server-only variable names.

### CI Safety

- CI uses disposable PostgreSQL containers with test-only credentials.
- No production secrets are referenced in workflow files.
- Workflow logs do not echo secret values (GitHub automatically masks secrets).

### Server-Side Only

These variables should exist only on the server, never in the frontend:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_API_KEY`
- `COOKIE_NAME`

---

## Branch Protection

Recommended GitHub branch protection rules for `main`:

1. **Require a pull request before merging**
   - Dismiss stale PR approvals when new commits are pushed
   - Require approval from at least 1 reviewer (if team size allows)

2. **Require status checks to pass before merging**
   - `CI / test` (from `.github/workflows/ci.yml`)

3. **Require branches to be up to date before merging**

4. **Restrict pushes that create files larger than 100MB**

5. **Do not allow bypassing the above settings**

### Configure Branch Protection

1. Go to `Settings > Branches` in the GitHub repository
2. Add a rule for `main`
3. Enable the settings above
4. Save changes

This ensures no code reaches production without passing automated tests and peer review.
