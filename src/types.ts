// src/types.ts

/**
 * Storage interface — user apna storage dega
 * MMKV, AsyncStorage, ya koi bhi
 */
export interface StorageAdapter {
  get: (key: string) => string | null | Promise<string | null>;
  set: (key: string, value: string) => void | Promise<void>;
  delete: (key: string) => void | Promise<void>;
}

/**
 * Package initialize karne ke liye config
 */
export interface AttestationConfig {
  // Tumhara storage (MMKV ya AsyncStorage)
  storage: StorageAdapter;

  // Nonce fetch karne ke liye URL
  nonceEndpoint: string;

  // App version — header mein jayega
  appVersion: string;

  // Token cache kitni der valid rahe (default: 10 min)
  tokenCacheDurationMs?: number;

  // Debug logs on/off (default: false)
  debug?: boolean;
}

/**
 * Attestation token result
 */
export interface AttestationResult {
  token: string | null;
  fromCache: boolean;
  platform: 'android' | 'ios';
}

/**
 * Security headers jo API call mein jayenge
 */
export interface SecurityHeaders {
  'User-Agent': string;
  'X-App-Platform': string;
  'X-App-Version': string;
  'X-Device-ID': string;
  'X-Timestamp': string;
  'X-Attestation'?: string;
}