import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Field from './Field';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useFieldValue: () => ['test', vi.fn()],
  useAutoResizer: vi.fn(),
}));

describe('Field component', () => {
  it('Not null', () => {
    const { container } = render(<Field />);
    expect(container).not.toBeNull();
  });
});
