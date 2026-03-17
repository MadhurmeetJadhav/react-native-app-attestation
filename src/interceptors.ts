// src/interceptors.ts

import { SecurityHeaders } from './types';

/**
 * AXIOS ke liye
 * 
 * Use karo:
 * axiosInterceptor(api, { appVersion: '1.4', getHeaders })
 */
export const axiosInterceptor = (
  axiosInstance: any,
  options: {
    appVersion: string;
    getHeaders: () => Promise<SecurityHeaders>;
  }
) => {
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      try {
        // Security headers lo
        const securityHeaders = await options.getHeaders();

        // Existing headers ke saath merge karo
        config.headers = {
          ...config.headers,
          ...securityHeaders,
        };

      } catch (error) {
        console.warn('[Attestation] Headers add nahi ho sake:', error);
        // App crash nahi hona chahiye — silently fail
      }

      return config;
    },
    (error: any) => Promise.reject(error)
  );
};

/**
 * FETCH ke liye
 * 
 * Use karo:
 * const res = await secureFetch(url, options, getHeaders)
 */
export const secureFetch = async (
  url: string,
  options: RequestInit = {},
  getHeaders: () => Promise<SecurityHeaders>
): Promise<Response> => {
  try {
    // Security headers lo
    const securityHeaders = await getHeaders();

    // Existing headers ke saath merge karo
    const mergedHeaders = {
      ...options.headers,
      ...securityHeaders,
    };

    return fetch(url, {
      ...options,
      headers: mergedHeaders,
    });

  } catch (error) {
    console.warn('[Attestation] secureFetch headers error:', error);
    // Headers add nahi hue — normal fetch karo
    return fetch(url, options);
  }
};