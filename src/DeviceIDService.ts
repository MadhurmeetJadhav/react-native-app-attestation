// src/DeviceIDService.ts

import { StorageAdapter } from './types';

const DEVICE_ID_KEY = 'rn_attestation_device_id';

// Khud ka UUID generator — koi library nahi!
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class DeviceIDService {
  private storage: StorageAdapter;
  private debug: boolean;

  constructor(storage: StorageAdapter, debug = false) {
    this.storage = storage;
    this.debug = debug;
  }

  private log(msg: string) {
    if (this.debug) console.log(`[DeviceID] ${msg}`);
  }

  async getDeviceID(): Promise<string> {
    try {
      // Storage se check karo
      let deviceId = await Promise.resolve(
        this.storage.get(DEVICE_ID_KEY)
      );

      if (!deviceId) {
        // Pehli baar — naya UUID banao
        deviceId = generateUUID();
        await Promise.resolve(
          this.storage.set(DEVICE_ID_KEY, deviceId)
        );
        this.log(`Naya Device ID banaya: ${deviceId}`);
      } else {
        this.log(`Existing Device ID mila: ${deviceId}`);
      }

      return deviceId;

    } catch (error) {
      this.log(`Error: ${error}`);
      // Fallback — storage fail ho toh bhi app crash na ho
      return generateUUID();
    }
  }

  async resetDeviceID(): Promise<void> {
    await Promise.resolve(
      this.storage.delete(DEVICE_ID_KEY)
    );
    this.log('Device ID reset ho gaya');
  }
}