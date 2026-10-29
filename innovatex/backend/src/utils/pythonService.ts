import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes an HTTP call to the Python microservice with automatic retry
 * while Render is cold-starting from idle (502, 503, 504, ECONNREFUSED, timeout).
 * Keeps polling with exponential backoff up to maxRetries so requests never fail prematurely.
 */
export async function callPythonServiceWithRetry<T = any>(
  config: AxiosRequestConfig,
  maxRetries: number = 5,
  initialDelayMs: number = 3000
): Promise<AxiosResponse<T>> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      const response = await axios({
        ...config,
        timeout: config.timeout || 90000,
      });
      return response;
    } catch (err: any) {
      attempt++;
      const status = err.response?.status;
      const isColdStart =
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ENOTFOUND' ||
        err.message?.includes('timeout') ||
        err.message?.includes('Network Error');

      if (isColdStart && attempt <= maxRetries) {
        console.log(
          `[Python Bridge] Service is waking up (status ${status || err.code}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`
        );
        await sleep(delay);
        delay = Math.min(delay * 1.5, 10000);
      } else {
        throw err;
      }
    }
  }

  throw new Error('Python AI service timed out while waking up.');
}

