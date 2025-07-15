// RealtimeService - temporarily disabled due to type errors
// This service will be fixed in a future update

export const realtimeService = {
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  subscribeToQuote: () => ({ unsubscribe: () => {} }),
  subscribeToPrice: () => ({ unsubscribe: () => {} }),
  subscribeToPool: () => ({ unsubscribe: () => {} }),
  subscribeToFarming: () => ({ unsubscribe: () => {} }),
  isConnected: () => false,
  getConnectionStatus: () => ({ connected: false, healthy: false, lastPing: 0 }),
};

export default realtimeService;