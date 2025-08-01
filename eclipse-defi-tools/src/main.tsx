import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/utilities.css'
import './theme/globalStyles.css'
import App from './App.tsx'

// グローバルエラーハンドラー
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// アプリケーションのマウント
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('Failed to mount application:', error);
  // フォールバックUI
  document.body.innerHTML = `
    <div style="text-align: center; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2>アプリケーションの起動に失敗しました</h2>
      <p>ブラウザのコンソールでエラーを確認してください。</p>
      <pre style="background: #f0f0f0; padding: 1rem; margin: 1rem auto; max-width: 600px; text-align: left; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
    </div>
  `;
}