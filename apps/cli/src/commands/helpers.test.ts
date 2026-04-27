import { beforeEach, describe, expect, it, vi } from 'vitest';

const cancelMock = vi.fn();
const isCancelMock = vi.fn();
const textMock = vi.fn();

vi.mock('@clack/prompts', () => ({
  cancel: cancelMock,
  isCancel: isCancelMock,
  text: textMock,
}));

describe('ensureValue', () => {
  beforeEach(() => {
    cancelMock.mockReset();
    isCancelMock.mockReset();
    textMock.mockReset();
  });

  it('returns the explicit value without prompting', async () => {
    const { ensureValue } = await import('./helpers.js');

    await expect(ensureValue('provided', 'Prompt', 'fallback')).resolves.toBe(
      'provided',
    );
    expect(textMock).not.toHaveBeenCalled();
  });

  it('returns the prompted value when no explicit value is supplied', async () => {
    isCancelMock.mockReturnValue(false);
    textMock.mockResolvedValue('typed-value');

    const { ensureValue } = await import('./helpers.js');

    await expect(ensureValue(undefined, 'Prompt', 'fallback')).resolves.toBe(
      'typed-value',
    );
    expect(textMock).toHaveBeenCalledWith({
      defaultValue: 'fallback',
      message: 'Prompt',
      placeholder: 'fallback',
    });
  });
});
