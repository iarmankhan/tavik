import { cancel, isCancel, text } from '@clack/prompts';

export async function ensureValue(
  explicitValue: string | undefined,
  promptMessage: string,
  fallbackInitialValue: string,
): Promise<string> {
  if (explicitValue !== undefined && explicitValue.trim().length > 0) {
    return explicitValue;
  }

  const response = await text({
    defaultValue: fallbackInitialValue,
    message: promptMessage,
    placeholder: fallbackInitialValue,
  });

  if (isCancel(response)) {
    cancel('Command cancelled.');
    process.exit(1);
  }

  return response.trim();
}
