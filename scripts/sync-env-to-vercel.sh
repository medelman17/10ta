#!/bin/bash

# Script to sync Clerk redirect URLs to Vercel
# Run with: bash scripts/sync-env-to-vercel.sh

echo "Adding Clerk redirect URLs to Vercel..."

# Add redirect URLs
echo "/sign-in" | pnpm dlx vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
echo "/sign-up" | pnpm dlx vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production  
echo "/dashboard" | pnpm dlx vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
echo "/dashboard" | pnpm dlx vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production

echo "✅ Done! Don't forget to:"
echo "1. Set up the webhook in Clerk Dashboard"
echo "2. Add CLERK_WEBHOOK_SECRET to Vercel"
echo "3. Redeploy your application"