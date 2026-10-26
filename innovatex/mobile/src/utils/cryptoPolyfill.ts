// Polyfill global ExpoCrypto if running in an Expo Go environment where the native binary is unregistered
import { Platform } from 'react-native';

if (!(globalThis as any).expo) {
  (globalThis as any).expo = {};
}
if (!(globalThis as any).expo.modules) {
  (globalThis as any).expo.modules = {};
}

if (!(globalThis as any).expo.modules.ExpoCrypto) {
  (globalThis as any).expo.modules.ExpoCrypto = {
    digestStringAsync: async (algorithm: string, data: string) => {
      return '';
    },
    getRandomBytes: (byteCount: number) => {
      const arr = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    getRandomBytesAsync: async (byteCount: number) => {
      const arr = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    getRandomValues: (typedArray: any) => {
      for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = Math.floor(Math.random() * 256);
      }
      return typedArray;
    },
  };
}

if (!globalThis.crypto) {
  (globalThis as any).crypto = {
    getRandomValues: (typedArray: any) => {
      for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = Math.floor(Math.random() * 256);
      }
      return typedArray;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  };
}
