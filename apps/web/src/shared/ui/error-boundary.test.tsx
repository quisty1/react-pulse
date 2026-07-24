import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '@/shared/ui';

function Boom(): ReactNode {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByText(/application error/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
