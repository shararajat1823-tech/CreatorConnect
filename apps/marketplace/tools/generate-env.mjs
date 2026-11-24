/**
 * Generates src/environments/environment.ts from process.env (and an optional
 * local apps/marketplace/.env), using environment.template.ts as the shape.
 *
 * Reads (either prefix works):
 *   PUBLIC_SUPABASE_URL      | SUPABASE_URL
 *   PUBLIC_SUPABASE_ANON_KEY | SUPABASE_ANON_KEY
 *   PUBLIC_SITE_URL          | SITE_URL
 *   NODE_ENV (production => production:true)
 *
 * Safe to run with nothing set — it writes empty strings so the build still
 * works (the app then shows a "not configured" state instead of crashing).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, '..');
const envDir = join(appDir, 'src', 'environments');

// Shallow .env parser (KEY=VALUE, ignores comments/blank lines).
function loadDotEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const dotenv = loadDotEnv(join(appDir, '.env'));
const get = (...keys) => {
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
    if (dotenv[k]) return dotenv[k];
  }
  return '';
};

const supabaseUrl = get('PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
const supabaseAnonKey = get('PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
const siteUrl = get('PUBLIC_SITE_URL', 'SITE_URL') || 'http://localhost:4200';
const production = (process.env.NODE_ENV || '') === 'production';

const template = readFileSync(join(envDir, 'environment.template.ts'), 'utf8');
const output = template
  .replace('__PRODUCTION__', String(production))
  .replace('__SUPABASE_URL__', supabaseUrl)
  .replace('__SUPABASE_ANON_KEY__', supabaseAnonKey)
  .replace('__SITE_URL__', siteUrl);

writeFileSync(join(envDir, 'environment.ts'), output);
const status = supabaseUrl ? 'with Supabase config' : 'with EMPTY config (set env vars for a working backend)';
console.log(`[generate-env] wrote src/environments/environment.ts ${status}`);
