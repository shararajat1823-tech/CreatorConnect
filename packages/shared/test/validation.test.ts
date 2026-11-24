import { describe, expect, it } from 'vitest';
// Test the built package (run `npm run build:shared` first; the root test script does).
import {
  isValidYouTubeChannelUrl,
  parseYouTubeChannelUrl,
  parseYouTubeVideoId,
  slugify,
  subscriberRangeForCount,
  validateProfileDraft,
  validateRequest,
} from '../dist/index.js';

describe('parseYouTubeChannelUrl', () => {
  it('accepts @handles, channel ids, /c/ and /user/', () => {
    expect(parseYouTubeChannelUrl('https://www.youtube.com/@mrbeast')?.kind).toBe('handle');
    expect(parseYouTubeChannelUrl('https://youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA')?.kind).toBe(
      'channel_id'
    );
    expect(parseYouTubeChannelUrl('https://www.youtube.com/c/SomeName')?.kind).toBe('custom');
    expect(parseYouTubeChannelUrl('https://www.youtube.com/user/LegacyName')?.kind).toBe('user');
  });

  it('normalizes handles to a canonical URL', () => {
    expect(parseYouTubeChannelUrl('http://m.youtube.com/@creator/')?.normalized).toBe(
      'https://www.youtube.com/@creator'
    );
  });

  it('rejects non-channel and non-YouTube URLs', () => {
    expect(isValidYouTubeChannelUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isValidYouTubeChannelUrl('https://vimeo.com/@creator')).toBe(false);
    expect(isValidYouTubeChannelUrl('not a url')).toBe(false);
    expect(isValidYouTubeChannelUrl('https://www.youtube.com/@ab')).toBe(false); // too short
  });
});

describe('parseYouTubeVideoId', () => {
  it('extracts ids from watch, youtu.be, shorts and embed', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('rejects invalid ids/urls', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(parseYouTubeVideoId('https://www.youtube.com/@handle')).toBeNull();
  });
});

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify("Hana's Kitchen!")).toBe('hana-s-kitchen');
    expect(slugify('  Múltiple   Spaces ')).toBe('multiple-spaces');
  });
});

describe('subscriberRangeForCount', () => {
  it('buckets counts correctly', () => {
    expect(subscriberRangeForCount(500)).toBe('under_1k');
    expect(subscriberRangeForCount(5000)).toBe('1k_10k');
    expect(subscriberRangeForCount(185000)).toBe('100k_1m');
    expect(subscriberRangeForCount(2_000_000)).toBe('1m_plus');
    expect(subscriberRangeForCount(null)).toBeNull();
  });
});

describe('validateProfileDraft', () => {
  it('requires a name and valid channel URL', () => {
    const errs = validateProfileDraft({ channelName: '', youtubeUrl: 'nope' });
    expect(errs.channelName).toBeTruthy();
    expect(errs.youtubeUrl).toBeTruthy();
  });
  it('limits niches to 3 and validates video links', () => {
    const errs = validateProfileDraft({
      channelName: 'Ok',
      youtubeUrl: 'https://www.youtube.com/@ok123',
      niches: ['gaming', 'tech', 'beauty', 'food'],
      videoUrls: ['https://www.youtube.com/@ok123'],
    });
    expect(errs.niches).toBeTruthy();
    expect(errs.videoUrls).toBeTruthy();
  });
  it('passes a valid draft', () => {
    const errs = validateProfileDraft({
      channelName: 'Maya Rivers',
      youtubeUrl: 'https://www.youtube.com/@mayarivers',
      niches: ['beauty'],
      videoUrls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    });
    expect(Object.keys(errs)).toHaveLength(0);
  });
});

describe('validateRequest', () => {
  it('requires type, name, title and message', () => {
    const errs = validateRequest({});
    expect(errs.requestType).toBeTruthy();
    expect(errs.senderName).toBeTruthy();
    expect(errs.title).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });
  it('rejects a budget where min > max (non-negotiable)', () => {
    const errs = validateRequest({
      requestType: 'paid_sponsorship',
      senderName: 'Acme',
      title: 'Brief',
      message: 'Hello',
      budgetMin: 5000,
      budgetMax: 1000,
      currency: 'USD',
      budgetNegotiable: false,
    });
    expect(errs.budgetMax).toBeTruthy();
  });
  it('accepts a negotiable sponsorship with no budget', () => {
    const errs = validateRequest({
      requestType: 'paid_sponsorship',
      senderName: 'Acme',
      title: 'Brief',
      message: 'Hello',
      budgetNegotiable: true,
    });
    expect(Object.keys(errs)).toHaveLength(0);
  });
});
