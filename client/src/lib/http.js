const DEFAULT_TIMEOUT_MS = 15000;

export class RequestTimeoutError extends Error {
  constructor(url) {
    super(`Request timed out: ${url}`);
    this.name = 'RequestTimeoutError';
  }
}

export const fetchWithTimeout = async (url, { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...options } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted && !signal?.aborted) throw new RequestTimeoutError(url);
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
};
