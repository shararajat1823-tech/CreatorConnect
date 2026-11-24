import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateView, StatusBadge } from './ui';

describe('admin UI components', () => {
  it('renders a StateView with title and message', () => {
    render(<StateView title="Nothing here" message="No creators in queue." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('No creators in queue.')).toBeInTheDocument();
  });

  it('renders a status badge with the human label and status class', () => {
    const { container } = render(<StatusBadge status="under_review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(container.querySelector('.badge-under_review')).not.toBeNull();
  });
});
