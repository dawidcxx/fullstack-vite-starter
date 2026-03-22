type WaitForOptions = {
  timeoutMs?: number;
  intervalMs?: number;
};

const DEFAULT_TIMEOUT_MS = 500;
const DEFAULT_INTERVAL_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitFor<T>(
  check: () => Promise<T | null | undefined | false> | T | null | undefined | false,
  options: WaitForOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      const result = await check();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(intervalMs);
  }

  if (lastError) {
    throw new Error(`waitFor timed out after ${timeoutMs}ms`, { cause: lastError });
  }

  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}