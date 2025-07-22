#!/usr/bin/env tsx

/**
 * This script helps set up the Clerk webhook automatically
 * Run with: pnpm tsx scripts/setup-clerk-webhook.ts
 */

console.log(`
====================================
Clerk Webhook Setup Instructions
====================================

Since Clerk doesn't have a CLI for webhook management, 
please follow these steps in the Clerk Dashboard:

1. Go to https://dashboard.clerk.com

2. Select your application

3. Navigate to Webhooks → Add Endpoint

4. Configure the webhook:
   - Endpoint URL: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://YOUR-APP.vercel.app'}/api/webhooks/clerk
   - Events to listen for:
     ✓ user.created
     ✓ user.updated  
     ✓ user.deleted

5. After creating, copy the Signing Secret

6. Add to Vercel Environment Variables:
   - Name: CLERK_WEBHOOK_SECRET
   - Value: [Your signing secret]
   - Environments: Production, Preview, Development

7. Redeploy your application

====================================

For local development, add to your .env.local:
CLERK_WEBHOOK_SECRET=your_signing_secret_here

`);

// Check if we have the necessary environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:', missingVars.join(', '));
} else {
  console.log('✅ Core Clerk environment variables are set');
}

// Check redirect URLs
const redirectVars = [
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
];

const setRedirects = redirectVars.filter(v => process.env[v]);
if (setRedirects.length === redirectVars.length) {
  console.log('✅ All redirect URLs are configured');
} else {
  console.log('ℹ️  Redirect URLs will use defaults from .env.example');
}