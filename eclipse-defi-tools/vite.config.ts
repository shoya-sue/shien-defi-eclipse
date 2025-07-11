import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ベンダーライブラリ
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@solana')) {
              return 'vendor-solana';
            }
            if (id.includes('@heroicons')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
          
          // 機能別チャンク
          if (id.includes('SwapComparison')) {
            return 'swap';
          }
          if (id.includes('LiquidityCalculator')) {
            return 'pools';
          }
          if (id.includes('YieldTracker')) {
            return 'farming';
          }
          if (id.includes('PnLCalculator')) {
            return 'pnl';
          }
          if (id.includes('UserSettings')) {
            return 'settings';
          }
          
          // サービス層
          if (id.includes('/services/')) {
            return 'services';
          }
          
          // フック
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
        }
      }
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@solana/web3.js']
  }
})
