'use client';

import { ReactNode } from 'react';

// Simple global store for page header actions
let globalHeaderAction: (() => void) | ReactNode | null = null;
let subscribers: Array<() => void> = [];

export function setHeaderAction(action: (() => void) | ReactNode | null, isCustom = false) {
  globalHeaderAction = action;
  // Notify all subscribers
  subscribers.forEach(callback => callback());
}

export function getHeaderAction() {
  return globalHeaderAction;
}

export function subscribeToHeaderAction(callback: () => void) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}