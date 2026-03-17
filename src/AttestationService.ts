// src/AttestationService.ts

import { Platform, NativeModules } from 'react-native';
import { AttestationConfig, AttestationResult } from './types';

export class AttestationService {
  private config: AttestationConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;
  private cacheDuration: number;

  constructor(config: AttestationConfig) {
    this.config = config;
    this.cacheDuration = config.tokenCacheDurationMs ?? 10 * 60 * 1000;
  }

  private log(msg: string) {
    if (this.config.debug) console.log(`[Attestation] ${msg}`);
  }

  // Backend se nonce fetch karo
  private async fetchNonce(): Promise<string> {
    const response = await fetch(this.config.nonceEndpoint);
    const data = await response.json();
    if (!data.nonce) throw new Error('Nonce nahi mila backend se');
    return data.nonce;
  }

  // Android — Play Integrity
  private async getAndroidToken(): Promise<string | null> {
    try {
      const { PlayIntegrityModule } = NativeModules;

      if (!PlayIntegrityModule) {
        this.log('PlayIntegrityModule nahi mila');
        return null;
      }

      const nonce = await this.fetchNonce();
      const token = await PlayIntegrityModule
        .getAttestationToken(nonce);
      this.log('Android token mila!');
      return token;

    } catch (error) {
      this.log(`Android error: ${error}`);
      return null;
    }
  }

  // iOS — App Attest
  private async getIOSToken(): Promise<string | null> {
    try {
      const { AppAttestModule } = NativeModules;

      if (!AppAttestModule) {
        this.log('AppAttestModule nahi mila');
        return null;
      }

      const challenge = await this.fetchNonce();
      const token = await AppAttestModule
        .getAttestationToken(challenge);
      this.log('iOS token mila!');
      return token;

    } catch (error) {
      this.log(`iOS error: ${error}`);
      return null;
    }
  }

  // Main function
  async getToken(forceRefresh = false): Promise<AttestationResult> {
    const now = Date.now();
    const platform = Platform.OS as 'android' | 'ios';

    // Cache valid hai?
    if (
      !forceRefresh &&
      this.cachedToken &&
      this.tokenExpiry &&
      now < this.tokenExpiry
    ) {
      this.log('Cached token use ho raha hai');
      return {
        token: this.cachedToken,
        fromCache: true,
        platform,
      };
    }

    // Fresh token lo
    let token: string | null = null;

    if (Platform.OS === 'android') {
      token = await this.getAndroidToken();
    } else if (Platform.OS === 'ios') {
      token = await this.getIOSToken();
    }

    // Cache karo
    if (token) {
      this.cachedToken = token;
      this.tokenExpiry = now + this.cacheDuration;
      this.log(`Token cached — ${this.cacheDuration / 60000} min valid`);
    }

    return { token, fromCache: false, platform };
  }

  // Sensitive operations ke liye
  async getFreshToken(): Promise<AttestationResult> {
    return this.getToken(true);
  }

  // Logout pe call karo
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.log('Cache cleared');
  }
}