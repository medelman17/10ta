#!/bin/bash

echo "Please follow these steps to link to the correct Vercel project:"
echo ""
echo "1. Run: pnpm dlx vercel link"
echo "2. When asked 'Set up and deploy?', answer: Y"
echo "3. Select scope: fortai-legal (not edel-projects)"
echo "4. Select 'Link to existing project'"
echo "5. Choose '10ta' from the list"
echo ""
echo "After linking, run:"
echo "pnpm dlx vercel env pull .env.local"
echo ""
echo "This will pull all the environment variables including CLERK_WEBHOOK_SECRET"