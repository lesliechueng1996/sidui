export const env = {
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? 'http://localhost:3900',
  S3_REGION: process.env.S3_REGION ?? 'garage',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? '',
  S3_BUCKET: process.env.S3_BUCKET ?? 'avatars',
  S3_PUBLIC_BASE_URL:
    process.env.S3_PUBLIC_BASE_URL ??
    'http://avatars.web.garage.localhost:3902',
  MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY ?? '',
};
