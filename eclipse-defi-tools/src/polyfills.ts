// Polyfills for browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
  (window as typeof globalThis & { global: typeof globalThis }).global = window;
}

// Re-export borsh with proper exports
export * from 'borsh';