import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pings the Render service to wake it from sleep before executing or retrying requests.
 */
export async function wakeUpRenderService(serviceUrl?: string): Promise<boolean> {
  const url = serviceUrl || API_CONFIG.NODE_URL;
  try {
    const res = await axios.get(`${url}/api/health`, { timeout: 15000 });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Executes an Axios request with seamless in-flight polling / retry.
 * If Render is sleeping and returns 502, 503, 504, or network timeout, this function
 * keeps retrying silently with backoff while the loading indicator stays active.
 * The user NEVER sees raw 502/503 errors.
 */
export async function requestWithColdStartRetry<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxAttempts: number = 8,
  initialDelayMs: number = 3000
): Promise<AxiosResponse<T>> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxAttempts) {
    try {
      return await requestFn();
    } catch (err: any) {
      attempt++;
      const status = err.response?.status;
      const isColdStart =
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ECONNRESET' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        err.message?.includes('warming up');

      if (isColdStart && attempt < maxAttempts) {
        console.log(
          `[Cloud Engine] Server is waking up (Status: ${status || err.code}). In-flight attempt ${attempt}/${maxAttempts}. Polling in ${delay}ms...`
        );
        // Kick health check in the background to speed up Render spinup
        wakeUpRenderService().catch(() => {});
        await sleep(delay);
        delay = Math.min(delay * 1.4, 7000);
      } else {
        throw err;
      }
    }
  }

  throw new Error('Our cloud engine is taking longer than expected to wake up. Please try once more.');
}
