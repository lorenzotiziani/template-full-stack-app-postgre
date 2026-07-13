import type { SignOptions } from 'jsonwebtoken';

// In produzione i secret DEVONO arrivare dall'env: niente fallback silenziosi.
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET e JWT_REFRESH_SECRET sono obbligatori in produzione');
}

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️  JWT_SECRET/JWT_REFRESH_SECRET non impostati: uso valori di sviluppo insicuri.');
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh-secret',
  expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
};
