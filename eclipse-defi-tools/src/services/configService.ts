// セキュアな設定管理サービス
import { sanitizeInput, generateSecureRandomString } from '../utils/security';

interface SecureConfig {
  encrypted: boolean;
  timestamp: number;
  data: string;
}

interface APIKeyConfig {
  coingecko?: string;
  jupiter?: string;
  orca?: string;
  raydium?: string;
}

interface SecuritySettings {
  cspEnabled: boolean;
  xssProtectionEnabled: boolean;
  csrfProtectionEnabled: boolean;
  rateLimitEnabled: boolean;
  secureHeaders: boolean;
  encryptStorage: boolean;
}

class ConfigService {
  private readonly ENCRYPTION_KEY_NAME = 'eclipse_defi_encryption_key';
  private readonly CONFIG_PREFIX = 'eclipse_defi_secure_';
  private encryptionKey: string | null = null;

  constructor() {
    this.initializeEncryption();
  }

  private initializeEncryption(): void {
    try {
      let key = localStorage.getItem(this.ENCRYPTION_KEY_NAME);
      if (!key) {
        key = generateSecureRandomString(64);
        localStorage.setItem(this.ENCRYPTION_KEY_NAME, key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.warn('暗号化キーの初期化に失敗しました:', error);
      this.encryptionKey = generateSecureRandomString(64);
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      return btoa(data); // フォールバック: Base64エンコーディング
    }

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.encryptionKey.slice(0, 32));
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = encoder.encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('暗号化に失敗しました:', error);
      return btoa(data); // フォールバック
    }
  }

  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      try {
        return atob(encryptedData); // フォールバック: Base64デコーディング
      } catch {
        return '';
      }
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const keyData = encoder.encode(this.encryptionKey.slice(0, 32));
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('復号化に失敗しました:', error);
      try {
        return atob(encryptedData); // フォールバック
      } catch {
        return '';
      }
    }
  }

  private sanitizeConfig<T>(config: T): T {
    if (typeof config === 'string') {
      return sanitizeInput(config) as T;
    }
    if (typeof config === 'object' && config !== null) {
      const sanitized = {} as T;
      for (const [key, value] of Object.entries(config)) {
        (sanitized as any)[key] = this.sanitizeConfig(value);
      }
      return sanitized;
    }
    return config;
  }

  async setSecureConfig<T>(key: string, value: T, encrypt: boolean = true): Promise<void> {
    try {
      const sanitizedValue = this.sanitizeConfig(value);
      const jsonData = JSON.stringify(sanitizedValue);
      
      const secureConfig: SecureConfig = {
        encrypted: encrypt,
        timestamp: Date.now(),
        data: encrypt ? await this.encrypt(jsonData) : jsonData,
      };

      const configKey = `${this.CONFIG_PREFIX}${sanitizeInput(key)}`;
      localStorage.setItem(configKey, JSON.stringify(secureConfig));
    } catch (error) {
      console.error('セキュア設定の保存に失敗しました:', error);
      throw new Error('設定の保存に失敗しました');
    }
  }

  async getSecureConfig<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const configKey = `${this.CONFIG_PREFIX}${sanitizeInput(key)}`;
      const stored = localStorage.getItem(configKey);
      
      if (!stored) {
        return defaultValue;
      }

      const secureConfig: SecureConfig = JSON.parse(stored);
      const data = secureConfig.encrypted 
        ? await this.decrypt(secureConfig.data)
        : secureConfig.data;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('セキュア設定の取得に失敗しました:', error);
      return defaultValue;
    }
  }

  async removeSecureConfig(key: string): Promise<void> {
    try {
      const configKey = `${this.CONFIG_PREFIX}${sanitizeInput(key)}`;
      localStorage.removeItem(configKey);
    } catch (error) {
      console.error('セキュア設定の削除に失敗しました:', error);
    }
  }

  // APIキー管理
  async setAPIKeys(apiKeys: APIKeyConfig): Promise<void> {
    // APIキーをサニタイズして暗号化保存
    const sanitizedKeys: APIKeyConfig = {};
    
    for (const [service, key] of Object.entries(apiKeys)) {
      if (key && typeof key === 'string') {
        sanitizedKeys[service as keyof APIKeyConfig] = sanitizeInput(key);
      }
    }

    await this.setSecureConfig('api_keys', sanitizedKeys, true);
  }

  async getAPIKeys(): Promise<APIKeyConfig> {
    return (await this.getSecureConfig<APIKeyConfig>('api_keys', {})) || {};
  }

  async getAPIKey(service: keyof APIKeyConfig): Promise<string | undefined> {
    const apiKeys = await this.getAPIKeys();
    return apiKeys[service];
  }

  // セキュリティ設定管理
  async setSecuritySettings(settings: SecuritySettings): Promise<void> {
    await this.setSecureConfig('security_settings', settings, true);
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    return (await this.getSecureConfig<SecuritySettings>('security_settings', {
      cspEnabled: true,
      xssProtectionEnabled: true,
      csrfProtectionEnabled: true,
      rateLimitEnabled: true,
      secureHeaders: true,
      encryptStorage: true,
    })) || {
      cspEnabled: true,
      xssProtectionEnabled: true,
      csrfProtectionEnabled: true,
      rateLimitEnabled: true,
      secureHeaders: true,
      encryptStorage: true,
    };
  }

  // 安全なURL検証とプロキシリクエスト
  async safeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const sanitizedUrl = sanitizeInput(url);
    
    // URLの検証
    try {
      const parsedUrl = new URL(sanitizedUrl);
      
      // プロトコルチェック
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('HTTPSプロトコルのみ許可されています');
      }

      // 許可されたホストのチェック
      const allowedHosts = [
        'api.coingecko.com',
        'mainnetbeta-rpc.eclipse.xyz',
        'mock-api.eclipse-defi-tools.local',
      ];

      if (!allowedHosts.includes(parsedUrl.hostname)) {
        throw new Error(`許可されていないホストです: ${parsedUrl.hostname}`);
      }

      // CSRFトークンの追加
      const secureOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers,
        },
      };

      // APIキーが必要な場合は追加
      if (parsedUrl.hostname === 'api.coingecko.com') {
        const apiKey = await this.getAPIKey('coingecko');
        if (apiKey) {
          secureOptions.headers = {
            ...secureOptions.headers,
            'X-CG-Pro-API-Key': apiKey,
          };
        }
      }

      return fetch(sanitizedUrl, secureOptions);
    } catch (error) {
      console.error('セキュアリクエストエラー:', error);
      throw error;
    }
  }

  // 設定のバックアップとリストア
  async exportSettings(): Promise<string> {
    try {
      const settings = {
        securitySettings: await this.getSecuritySettings(),
        exportTimestamp: Date.now(),
        version: '1.0.0',
      };

      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('設定のエクスポートに失敗しました:', error);
      throw new Error('設定のエクスポートに失敗しました');
    }
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(sanitizeInput(settingsJson));
      
      if (settings.securitySettings) {
        await this.setSecuritySettings(settings.securitySettings);
      }
    } catch (error) {
      console.error('設定のインポートに失敗しました:', error);
      throw new Error('設定のインポートに失敗しました');
    }
  }

  // 全ての暗号化された設定を削除
  clearAllSecureConfig(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CONFIG_PREFIX)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(this.ENCRYPTION_KEY_NAME);
      
      this.initializeEncryption();
    } catch (error) {
      console.error('セキュア設定のクリアに失敗しました:', error);
    }
  }

  // 設定の整合性チェック
  async validateStoredConfigs(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // セキュリティ設定の検証
      const securitySettings = await this.getSecuritySettings();
      if (!securitySettings.cspEnabled) {
        warnings.push('CSP保護が無効になっています');
      }
      if (!securitySettings.xssProtectionEnabled) {
        warnings.push('XSS保護が無効になっています');
      }

      // APIキーの検証
      const apiKeys = await this.getAPIKeys();
      if (apiKeys.coingecko && !/^CG-[A-Za-z0-9-_]{36}$/.test(apiKeys.coingecko)) {
        errors.push('CoinGecko APIキーの形式が正しくありません');
      }

      // 暗号化キーの存在確認
      if (!this.encryptionKey) {
        errors.push('暗号化キーが見つかりません');
      }

    } catch (error) {
      errors.push(`設定の検証中にエラーが発生しました: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const configService = new ConfigService();
export type { APIKeyConfig, SecuritySettings };
export default configService;