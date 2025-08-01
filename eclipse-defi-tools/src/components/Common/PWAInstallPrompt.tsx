import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, isIOS, install, dismiss } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!canInstall || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismiss();
  };

  // iOS用の特別な説明
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">アプリとしてインストール</h3>
            <p className="text-sm text-primary-100 mb-2">
              このアプリをホーム画面に追加できます
            </p>
            <div className="text-sm text-primary-100 space-y-1">
              <p>1. <strong>共有ボタン</strong> をタップ</p>
              <p>2. <strong>「ホーム画面に追加」</strong> を選択</p>
              <p>3. <strong>「追加」</strong> をタップ</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-primary-200 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            アプリとしてインストール
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Eclipse DeFi Tools をアプリとして使用できます
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            後で
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                インストール中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                インストール
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;