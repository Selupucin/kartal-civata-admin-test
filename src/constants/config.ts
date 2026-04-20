export const APP_CONFIG = {
  name: 'Kartal Civata Admin',
  description: 'Kartal Civata Yönetim Paneli',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  mainAppUrl: process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000',
  currency: 'TRY',
  defaultTaxRate: 20,
  loginMaxAttempts: 5,
  loginLockDuration: 15 * 60 * 1000,
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '7d',
  rememberMeAccessExpiry: '24h',
  rememberMeRefreshExpiry: '30d',
  itemsPerPage: 25,
  lowStockThreshold: 10,
  superAdminEmail: 'admin@kartalcivata.com',
  screenLockTimeout: 30 * 60 * 1000, // 30 minutes
} as const;
