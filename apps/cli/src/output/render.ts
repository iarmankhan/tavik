export function renderOutput(value: unknown, asJson: boolean): string {
  if (asJson) {
    return `${JSON.stringify(value, null, 2)}\n`;
  }

  if (typeof value === 'string') {
    return value.endsWith('\n') ? value : `${value}\n`;
  }

  return `${JSON.stringify(value, null, 2)}\n`;
}
