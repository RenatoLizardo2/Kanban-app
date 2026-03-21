import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

// Simplified wrapper for Phase 0.
// Will be updated in Phase 2 to include QueryClientProvider when @tanstack/react-query is installed.
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, options);
}
