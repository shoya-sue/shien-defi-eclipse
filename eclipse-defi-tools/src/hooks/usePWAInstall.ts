import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

export const usePWAInstall = (): PWAInstallStatus => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  // iOS検出
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // スタンドアロンモード検出
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  useEffect(() => {
    // インストール済みかチェック
    setIsInstalled(isStandalone);

    // beforeinstallprompt イベントリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // アプリインストール完了イベント
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install failed:', error);
      throw error;
    }
  };

  const dismiss = (): void => {
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const canInstall = isInstallable && !isInstalled;

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    canInstall,
    install,
    dismiss,
  };
};

export default usePWAInstall;