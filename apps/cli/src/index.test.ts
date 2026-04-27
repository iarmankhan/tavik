import { describe, expect, it } from 'vitest';

import { renderOutput } from './output/render.js';

describe('renderOutput', () => {
  it('renders strings with a trailing newline', () => {
    expect(renderOutput('hello', false)).toBe('hello\n');
  });

  it('renders json objects in json mode', () => {
    expect(renderOutput({ ok: true }, true)).toContain('"ok": true');
  });

  it('renders non-string values as json when json mode is off', () => {
    expect(renderOutput({ ok: true }, false)).toContain('"ok": true');
  });
});
