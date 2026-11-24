import { describe, expect, it } from 'vitest';
import { formatLabel, nicheLabel, reportReasonLabel, statusLabel, subscribersText } from './format';

describe('admin label helpers', () => {
  it('maps ids to human labels', () => {
    expect(nicheLabel('gaming')).toBe('Gaming');
    expect(statusLabel('under_review')).toBe('Under Review');
    expect(formatLabel('dedicated_video')).toBe('Dedicated video');
    expect(reportReasonLabel('misleading')).toBe('Misleading or inaccurate');
  });
  it('falls back to the raw id for unknown values', () => {
    expect(nicheLabel('unknown')).toBe('unknown');
  });
  it('formats subscriber counts', () => {
    expect(subscribersText(185000)).toBe('185,000');
    expect(subscribersText(null)).toBe('—');
  });
});
