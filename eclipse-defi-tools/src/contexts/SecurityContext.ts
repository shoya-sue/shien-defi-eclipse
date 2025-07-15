import { createContext } from 'react';
import type { SecurityEvent } from '../utils/security';

export interface SecurityContextType {
  auditInput: (input: string, context: string) => boolean;
  auditURL: (url: string) => boolean;
  auditRateLimit: (identifier: string) => boolean;
  sanitizeInput: (input: string) => string;
  preventXSS: (content: string) => string;
  getSecurityReport: () => {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: SecurityEvent[];
  };
}

export const SecurityContext = createContext<SecurityContextType | null>(null);