'use client';

import { useUser } from '@clerk/nextjs';

export function useSuperUser(): boolean {
  const { user } = useUser();
  
  if (!user?.primaryEmailAddress?.emailAddress) {
    return false;
  }
  
  const superUserEmails = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  return superUserEmails.includes(user.primaryEmailAddress.emailAddress.toLowerCase());
}