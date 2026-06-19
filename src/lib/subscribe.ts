export interface SubscribePayload { email: string; source: string; }

export function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

export function isHoneypotTripped(value: string): boolean {
  return value.trim().length > 0;
}

export function buildPayload(email: string): SubscribePayload {
  return { email: email.trim(), source: 'blog' };
}

export const SUBSCRIBE_ENDPOINT = 'https://api.jmotools.com/api/subscribe';
