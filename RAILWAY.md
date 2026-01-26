# Railway Deployment Guide for paper.fun

## Overview

This guide will help you deploy paper.fun to Railway (backend) and Vercel (frontend).

**Stack:**
- Railway: API, WebSocket, Workers, Postgres, Redis
- Vercel: Next.js Frontend
- Domain: paper.fun (or Railway temp domain)

---

## Prerequisites

- [ ] GitHub account (for code)
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] Code pushed to GitHub

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "feat: railway deployment config"
git push origin master
```

---

## Step 2: Deploy to Railway

### A. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose `eeshm/trade` repository
5. Railway will detect your monorepo

### B. Add Services

You need to create **7 services** in Railway:

#### 1. **Postgres Database**
- Click "+ New Service"
- Select "Database" → "PostgreSQL"
- Name: `postgres`
- Click "Add"
- Copy the `DATABASE_URL` from Variables tab

#### 2. **Redis Cache**
- Click "+ New Service"
- Select "Database" → "Redis"
- Name: `redis`
- Click "Add"
- Copy the `REDIS_URL` from Variables tab

#### 3. **API Service**
- Click "+ New Service"
- Select "GitHub Repo" → `eeshm/trade`
- Name: `api`
- Root Directory: `apps/api`
- Start Command: `bun run start`
- Click "Add"

**Environment Variables for API:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-with-openssl-rand-base64-64>
PYTH_NETWORK_URL=https://hermes.pyth.network
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

#### 4. **WebSocket Service**
- Click "+ New Service"
- Select "GitHub Repo" → `eeshm/trade`
- Name: `websocket`
- Root Directory: `apps/ws`
- Start Command: `bun run start`

**Environment Variables for WebSocket:**
```bash
NODE_ENV=production
WS_PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<same-as-api>
```

#### 5. **Price Ingestion Worker**
- Click "+ New Service"
- Select "GitHub Repo" → `eeshm/trade`
- Name: `price-worker`
- Root Directory: `workers/price-ingestion`
- Start Command: `bun run start`

**Environment Variables for Price Worker:**
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PYTH_NETWORK_URL=https://hermes.pyth.network
```

#### 6. **Candle Aggregation Worker**
- Click "+ New Service"
- Select "GitHub Repo" → `eeshm/trade`
- Name: `candle-worker`
- Root Directory: `workers/candle-aggregation`
- Start Command: `bun run start`

**Environment Variables for Candle Worker:**
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### C. Run Database Migrations

1. Go to API service
2. Click "Settings" → "Deploy Triggers"
3. Add deploy command: `bun run migrate:deploy`
4. Or run manually via Railway CLI:
   ```bash
   railway run bun run migrate:deploy
   ```

### D. Get Service URLs

Railway will provide public URLs for:
- API: `https://api-production-xxxx.up.railway.app`
- WebSocket: `wss://websocket-production-xxxx.up.railway.app`

Save these for Vercel deployment!

---

## Step 3: Deploy Frontend to Vercel

### A. Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import `eeshm/trade` repository
4. Framework: Next.js
5. Root Directory: `apps/web`

### B. Environment Variables

Add these in Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://api-production-xxxx.up.railway.app
NEXT_PUBLIC_WS_URL=wss://websocket-production-xxxx.up.railway.app
```

### C. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Get your Vercel URL: `https://paper-fun.vercel.app`

### D. Update CORS

Go back to Railway → API service → Environment Variables:
```bash
CORS_ORIGIN=https://paper-fun.vercel.app
```

Redeploy API service.

---

## Step 4: Custom Domain (Optional)

### For Railway (API/WebSocket):
1. Go to Railway service → Settings → Domains
2. Add custom domain: `api.paper.fun`
3. Add DNS records as instructed

### For Vercel (Frontend):
1. Go to Vercel project → Settings → Domains
2. Add custom domain: `paper.fun`
3. Add DNS records as instructed

---

## Step 5: Verify Deployment

### Test API:
```bash
curl https://api-production-xxxx.up.railway.app/health
```

Should return: `{"status":"healthy"}`

### Test WebSocket:
Open browser console on your Vercel site:
```javascript
const ws = new WebSocket('wss://websocket-production-xxxx.up.railway.app');
ws.onopen = () => console.log('Connected!');
```

### Test Frontend:
Visit your Vercel URL and:
- ✅ Prices should update
- ✅ Connect wallet works
- ✅ Place orders works

---

## Troubleshooting

### Migration Errors:
```bash
# SSH into Railway API service
railway link
railway run bun run migrate:deploy
```

### WebSocket Connection Fails:
- Check `NEXT_PUBLIC_WS_URL` in Vercel
- Verify WebSocket service is running in Railway
- Check CORS settings

### Database Connection:
- Verify `DATABASE_URL` is set in all services
- Check Postgres service is running
- Test connection: `railway run bun run prisma studio`

---

## Monitoring

### Railway Dashboard:
- View logs for each service
- Monitor resource usage
- Check deployment status

### Vercel Dashboard:
- View deployment logs
- Monitor function logs
- Check analytics

---

## Cost Estimate

**Railway Hobby Plan ($5/month):**
- Postgres: Included
- Redis: Included
- 7 services: $5/month total

**Vercel Hobby Plan:**
- Free for personal projects
- Unlimited bandwidth

**Total: ~$5/month**

---

## Next Steps

1. Set up monitoring (optional)
2. Configure custom domain
3. Set up database backups
4. Add Sentry for error tracking
5. Set up GitHub Actions for CI/CD

---

## Quick Deploy Script

For future deployments:

```bash
# Backend (Railway auto-deploys on git push)
git push origin master

# Frontend (Vercel auto-deploys on git push)
git push origin master

# Manual redeploy
railway up  # Railway CLI
vercel --prod  # Vercel CLI
```

---

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Project Issues: https://github.com/eeshm/trade/issues
