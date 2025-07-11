// セキュリティ関連のユーティリティ

// CSP (Content Security Policy) 設定
export const CSP_DIRECTIVES = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https: blob:",
  'connect-src': "'self' https://api.coingecko.com https://quote-api.eclipse.jup.ag https://api.orca.eclipse.so https://api.raydium.eclipse.io https://mainnetbeta-rpc.eclipse.xyz wss://mainnetbeta-rpc.eclipse.xyz",
  'worker-src': "'self' blob:",
  'frame-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'upgrade-insecure-requests': '',
};

// セキュリティヘッダー設定
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
};

// 入力値のサニタイズ
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    })
    .trim();
}

// HTMLエスケープ
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// SQLインジェクション対策（クエリパラメータ用）
export function sanitizeQueryParam(param: string): string {
  return param.replace(/[^\w\s-_.]/g, '');
}

// XSS対策
export function preventXSS(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// CSRFトークン生成
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// セキュアなランダム文字列生成
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

// パスワード強度チェック
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isSecure: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('8文字以上にしてください');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('小文字を含めてください');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('大文字を含めてください');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('数字を含めてください');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('記号を含めてください');

  if (password.length >= 12) score += 1;

  return {
    score,
    feedback,
    isSecure: score >= 4,
  };
}

// 秘密鍵のバリデーション
export function validatePrivateKey(privateKey: string): boolean {
  // 秘密鍵の基本的な形式チェック
  if (!privateKey || typeof privateKey !== 'string') return false;
  
  // Base58形式のチェック（Solanaの秘密鍵）
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(privateKey)) return false;
  
  // 長さのチェック（一般的な秘密鍵の長さ）
  if (privateKey.length < 32 || privateKey.length > 128) return false;
  
  return true;
}

// ウォレットアドレスのバリデーション
export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Solanaアドレスの形式チェック
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaAddressRegex.test(address);
}

// 危険なURL検出
export function isDangerousURL(url: string): boolean {
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /about:/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(url));
}

// セキュアなURL検証
export function isSecureURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // HTTPSのみ許可
    if (parsedUrl.protocol !== 'https:') return false;
    
    // 危険なURLパターンをチェック
    if (isDangerousURL(url)) return false;
    
    // 許可されたドメインのリスト
    const allowedDomains = [
      'api.coingecko.com',
      'quote-api.eclipse.jup.ag',
      'api.orca.eclipse.so',
      'api.raydium.eclipse.io',
      'mainnetbeta-rpc.eclipse.xyz',
      'raw.githubusercontent.com',
    ];
    
    return allowedDomains.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

// リクエストのレート制限
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(
    maxRequests: number = 100,
    windowMs: number = 60000 // 1分
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // 古いリクエストを削除
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// セキュリティイベントのログ
export interface SecurityEvent {
  type: 'xss_attempt' | 'csrf_attempt' | 'rate_limit_exceeded' | 'invalid_input' | 'suspicious_activity';
  timestamp: number;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  ipAddress?: string;
}

export class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents: number = 1000;
  
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    this.events.push(securityEvent);
    
    // 古いイベントを削除
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    
    // 重要度が高い場合はコンソールに出力
    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn('Security Event:', securityEvent);
    }
  }
  
  getEvents(filter?: Partial<SecurityEvent>): SecurityEvent[] {
    if (!filter) return [...this.events];
    
    return this.events.filter(event => {
      return Object.entries(filter).every(([key, value]) => {
        return event[key as keyof SecurityEvent] === value;
      });
    });
  }
  
  getEventsByTimeRange(startTime: number, endTime: number): SecurityEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }
  
  clear(): void {
    this.events = [];
  }
}

// セキュリティ監査機能
export class SecurityAuditor {
  private logger = new SecurityLogger();
  private rateLimiter = new RateLimiter();
  
  auditInput(input: string, context: string): boolean {
    // XSS攻撃の検出
    if (this.detectXSS(input)) {
      this.logger.log({
        type: 'xss_attempt',
        severity: 'high',
        details: { input: input.substring(0, 100), context },
      });
      return false;
    }
    
    // 異常に長い入力の検出
    if (input.length > 10000) {
      this.logger.log({
        type: 'suspicious_activity',
        severity: 'medium',
        details: { inputLength: input.length, context },
      });
      return false;
    }
    
    return true;
  }
  
  private detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  auditURL(url: string): boolean {
    if (!isSecureURL(url)) {
      this.logger.log({
        type: 'suspicious_activity',
        severity: 'medium',
        details: { url, reason: 'insecure_url' },
      });
      return false;
    }
    
    return true;
  }
  
  auditRateLimit(identifier: string): boolean {
    if (!this.rateLimiter.isAllowed(identifier)) {
      this.logger.log({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        details: { identifier },
      });
      return false;
    }
    
    return true;
  }
  
  getSecurityReport(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: SecurityEvent[];
  } {
    const events = this.logger.getEvents();
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = this.logger.getEventsByTimeRange(last24h, Date.now());
    
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents,
    };
  }
}

// グローバルセキュリティ監査インスタンス
export const securityAuditor = new SecurityAuditor();

// セキュリティ設定の検証
export function validateSecuritySettings(): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // HTTPS チェック
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('HTTPSが有効になっていません');
    recommendations.push('HTTPSを有効にしてください');
  }
  
  // Service Worker チェック
  if (!('serviceWorker' in navigator)) {
    issues.push('Service Workerがサポートされていません');
    recommendations.push('モダンブラウザを使用してください');
  }
  
  // Crypto API チェック
  if (!crypto.subtle) {
    issues.push('Web Crypto APIが利用できません');
    recommendations.push('セキュアなコンテキストで実行してください');
  }
  
  // Local Storage チェック
  try {
    localStorage.setItem('security_test', 'test');
    localStorage.removeItem('security_test');
  } catch {
    issues.push('Local Storageが利用できません');
    recommendations.push('ブラウザの設定を確認してください');
  }
  
  return {
    isSecure: issues.length === 0,
    issues,
    recommendations,
  };
}