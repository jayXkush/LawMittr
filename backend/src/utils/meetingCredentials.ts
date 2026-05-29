import crypto from 'crypto';

export function generateMeetingId(): string {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `LM-${suffix}`;
}

export function generateMeetingPassword(): string {
  return crypto.randomBytes(4).toString('hex').slice(0, 8);
}

export function generateDemoTransactionId(): string {
  return `DEMO_PAYMENT_${crypto.randomUUID()}`;
}
