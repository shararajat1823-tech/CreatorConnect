import { brand } from '@creatorconnect/shared';

/**
 * Editable copy for the static pages. LAUNCH-EDIT: review every section and
 * replace the placeholder policy text with content reviewed for your business
 * and jurisdiction before going live.
 */
export interface StaticSection {
  heading?: string;
  body: string[];
}
export interface StaticPage {
  key: string;
  title: string;
  intro: string;
  sections: StaticSection[];
  noindex?: boolean;
}

export const STATIC_PAGES: Record<string, StaticPage> = {
  help: {
    key: 'help',
    title: 'Help',
    intro: `How ${brand.name} works for brands and creators.`,
    sections: [
      {
        heading: 'For brands and visitors',
        body: [
          'Browse the directory and open any creator profile — no account needed.',
          'To send a Paid Sponsorship brief or Propose a Collaboration, create a free account. Your message goes to the creator’s private inbox, and you can track its status (pending, accepted, declined) and withdraw it while it’s still pending.',
        ],
      },
      {
        heading: 'For creators',
        body: [
          'Create an account and list your channel: add your YouTube URL, niches, languages, audience size and the collaboration formats you offer.',
          'Submit your profile for review. Once an admin approves it, it appears in the public directory and at its own shareable link. Edits to a published profile are reviewed before the changes go live.',
        ],
      },
      {
        heading: 'Safety',
        body: [
          'Every listing is reviewed before publication. If something looks wrong, use “Report this profile” on any profile and our moderators will take a look.',
          `Still stuck? Email ${brand.supportEmail}.`,
        ],
      },
    ],
  },
  contact: {
    key: 'contact',
    title: 'Contact',
    intro: `We’d love to hear from you.`,
    sections: [
      {
        heading: 'Get in touch',
        body: [
          `General and support enquiries: ${brand.supportEmail}`,
          `Privacy requests: ${brand.privacyEmail}`,
        ],
      },
      {
        heading: 'Business details',
        body: [`${brand.legalName}`, brand.businessAddress],
      },
    ],
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    intro: `This placeholder explains, in plain terms, how ${brand.name} handles your data. LAUNCH-EDIT before going live.`,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Account data: your email address and display name.',
          'Creator profile data you choose to publish: channel name, YouTube links, bio, niches, languages, country, audience size and collaboration formats.',
          'Messages you send through the platform.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To operate the marketplace: show approved listings, deliver your requests and replies, and moderate content.',
          'We keep personal contact details private by default — they are not shown on public profiles.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can edit or unpublish your profile at any time, and request account deletion from your account settings.',
          `For data requests, contact ${brand.privacyEmail}.`,
        ],
      },
    ],
  },
  terms: {
    key: 'terms',
    title: 'Terms of Service',
    intro: `These placeholder terms govern your use of ${brand.name}. LAUNCH-EDIT before going live.`,
    sections: [
      {
        heading: 'Using the platform',
        body: [
          'You must provide accurate information and only list channels you own or are authorised to represent.',
          'Audience metrics entered by creators are self-reported. Verify details directly before entering any paid agreement.',
        ],
      },
      {
        heading: 'Content and conduct',
        body: [
          'Don’t post misleading, infringing or unlawful content. We may request changes to, suspend or remove listings that break these rules.',
          'Sponsorship briefs sent through the platform are introductions, not binding contracts. Payments, deliverables and agreements are arranged between you and the creator.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          `${brand.name} is a venue connecting brands and creators and is not a party to any agreement between them.`,
        ],
      },
    ],
  },
};
