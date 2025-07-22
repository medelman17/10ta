# Vercel Environment Variables Setup

## Clerk Configuration

The Vercel Clerk integration automatically adds:
- ✅ `CLERK_SECRET_KEY`
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

You need to manually add these in the Vercel Dashboard:

### 1. Clerk Redirect URLs
Go to your Vercel project settings → Environment Variables and add:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

### 2. Clerk Webhook Secret (After setting up webhook)
```
CLERK_WEBHOOK_SECRET = [Your webhook signing secret from Clerk Dashboard]
```

## Setting up Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → **Add Endpoint**
3. Set the endpoint URL: `https://[your-app].vercel.app/api/webhooks/clerk`
4. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret**
6. Add it as `CLERK_WEBHOOK_SECRET` in Vercel

## Already Configured

These are already set up by the Vercel integrations:
- ✅ Neon Database (DATABASE_URL, etc.)
- ✅ Upstash Redis (REDIS_URL, KV_* variables)
- ✅ Vercel Blob Storage (if enabled)
- ✅ AI API Keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- ✅ Sentry (NEXT_PUBLIC_SENTRY_DSN)