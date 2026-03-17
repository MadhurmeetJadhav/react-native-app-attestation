// src/index.ts

import { Platform } from 'react-native';
import { DeviceIDService } from './DeviceIDService';
import { AttestationService } from './AttestationService';
import { axiosInterceptor, secureFetch } from './interceptors';
import {
  AttestationConfig,
  SecurityHeaders,
  StorageAdapter,
} from './types';

// Re-export — user directly import kar sake
export * from './types';
export { DeviceIDService } from './DeviceIDService';
export { AttestationService } from './AttestationService';
export { axiosInterceptor, secureFetch } from './interceptors';

// ========================================
// SINGLETON — ek baar init, har jagah use
// ========================================
let deviceIDService: DeviceIDService | null = null;
let attestationService: AttestationService | null = null;
let globalConfig: AttestationConfig | null = null;

/**
 * App start pe ek baar call karo
 *
 * MMKV example:
 * initAttestation({
 *   storage: {
 *     get: (key) => mmkv.getString(key) ?? null,
 *     set: (key, val) => mmkv.set(key, val),
 *     delete: (key) => mmkv.delete(key),
 *   },
 *   nonceEndpoint: 'https://api.yourapp.com/auth/nonce',
 *   appVersion: '1.4',
 *   debug: __DEV__,
 * });
 */
export const initAttestation = (config: AttestationConfig): void => {
  globalConfig = config;
  deviceIDService = new DeviceIDService(config.storage, config.debug);
  attestationService = new AttestationService(config);
};

// Init check
const checkInit = (fnName: string) => {
  if (!deviceIDService || !attestationService || !globalConfig) {
    throw new Error(
      `[react-native-app-attestation] ${fnName}() call karne se pehle initAttestation() call karo!`
    );
  }
};

/**
 * Device ID lo
 */
export const getDeviceID = async (): Promise<string> => {
  checkInit('getDeviceID');
  return deviceIDService!.getDeviceID();
};

/**
 * Attestation token lo (cached ya fresh)
 */
export const getAttestationToken = async (
  forceRefresh = false
): Promise<string | null> => {
  checkInit('getAttestationToken');
  const result = await attestationService!.getToken(forceRefresh);
  return result.token;
};

/**
 * Sensitive operations ke liye fresh token
 * Payment, Login, OTP pe ye use karo
 */
export const getFreshAttestationToken = async (): Promise<string | null> => {
  checkInit('getFreshAttestationToken');
  const result = await attestationService!.getFreshToken();
  return result.token;
};

/**
 * Saare security headers ek saath lo
 * Interceptor mein ye use karo
 */
export const getSecurityHeaders = async (): Promise<SecurityHeaders> => {
  checkInit('getSecurityHeaders');

  const [deviceId, attestationResult] = await Promise.all([
    deviceIDService!.getDeviceID(),
    attestationService!.getToken(),
  ]);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';

  const headers: SecurityHeaders = {
    'User-Agent': `App/${globalConfig!.appVersion} (${platform})`,
    'X-App-Platform': Platform.OS,
    'X-App-Version': globalConfig!.appVersion,
    'X-Device-ID': deviceId,
    'X-Timestamp': timestamp,
  };

  if (attestationResult.token) {
    headers['X-Attestation'] = attestationResult.token;
  }

  return headers;
};

/**
 * Axios interceptor setup
 * 
 * import axios from 'axios';
 * import { initAttestation, setupAxios } from 'react-native-app-attestation';
 * 
 * const api = axios.create({ baseURL: '...' });
 * setupAxios(api);
 */
export const setupAxios = (axiosInstance: any): void => {
  checkInit('setupAxios');
  axiosInterceptor(axiosInstance, {
    appVersion: globalConfig!.appVersion,
    getHeaders: getSecurityHeaders,
  });
};

/**
 * Secure fetch — fetch ki jagah use karo
 * 
 * const res = await secureGet('https://api.com/user');
 */
export const secureGet = (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  checkInit('secureGet');
  return secureFetch(url, options ?? {}, getSecurityHeaders);
};

export const securePost = (
  url: string,
  body: unknown,
  options?: RequestInit
): Promise<Response> => {
  checkInit('securePost');
  return secureFetch(
    url,
    {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    },
    getSecurityHeaders
  );
};

/**
 * Logout pe call karo
 */
export const clearAttestationCache = (): void => {
  attestationService?.clearCache();
};

/**
 * Device ID reset karo
 */
export const resetDeviceID = async (): Promise<void> => {
  await deviceIDService?.resetDeviceID();
};