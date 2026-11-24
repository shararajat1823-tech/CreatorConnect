/**
 * Brand configuration — the single source of truth for the product name and
 * public-facing business details. To rename the product, change `name` and
 * `slug` here (and the environment variables that reference the domain); no
 * other code hard-codes the product name.
 *
 * Policy/marketing copy that must be reviewed before launch is marked LAUNCH-EDIT.
 */
export const brand = {
  /** Working product name. Change this to rename the product everywhere. */
  name: 'CreatorConnect',
  /** Lowercase, URL/handle-safe form of the name. */
  slug: 'creatorconnect',
  /** One-line description used in metadata and footers. */
  tagline: 'Find YouTube creators for your next campaign.',
  /** Short value-proposition sentence for the homepage. */
  intro:
    'CreatorConnect is where brands and creators meet. Browse approved YouTube creators, send a sponsorship brief or a collaboration proposal, and keep the whole conversation in one private inbox.',

  // --- Business details (LAUNCH-EDIT: replace with your real details) ---
  legalName: 'CreatorConnect (demo operator)', // LAUNCH-EDIT
  supportEmail: 'hello@creatorconnect.example', // LAUNCH-EDIT
  privacyEmail: 'privacy@creatorconnect.example', // LAUNCH-EDIT
  /** Public marketing domain, no protocol. Used for canonical URLs / sitemap when PUBLIC_SITE_URL is unset. */
  defaultDomain: 'creatorconnect.example', // LAUNCH-EDIT
  businessAddress: 'Add your registered business address before launch.', // LAUNCH-EDIT
} as const;

export type Brand = typeof brand;
