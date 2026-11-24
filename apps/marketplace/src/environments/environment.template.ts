/**
 * Template for the generated environment file.
 * `tools/generate-env.mjs` copies this to `environment.ts`, filling values from
 * process.env (or a local apps/marketplace/.env). Never edit environment.ts by
 * hand — it is git-ignored and regenerated on install/build.
 */
export const environment = {
  production: __PRODUCTION__,
  supabaseUrl: '__SUPABASE_URL__',
  supabaseAnonKey: '__SUPABASE_ANON_KEY__',
  siteUrl: '__SITE_URL__',
};
