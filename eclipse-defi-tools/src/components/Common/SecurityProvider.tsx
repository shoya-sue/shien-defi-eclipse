import React, { createContext, useContext, useEffect } from 'react';
import { useSecurity } from '../../hooks/useSecurity';
import { sanitizeInput, preventXSS, type SecurityEvent } from '../../utils/security';

interface SecurityContextType {
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

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { auditInput, auditURL, auditRateLimit, getSecurityReport } = useSecurity();

  useEffect(() => {
    const setupGlobalErrorHandler = () => {
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        auditInput(event.error?.message || 'Unknown error', 'global_error');
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        auditInput(event.reason?.message || 'Unhandled promise rejection', 'promise_rejection');
      });
    };

    setupGlobalErrorHandler();
  }, [auditInput]);

  const contextValue: SecurityContextType = {
    auditInput,
    auditURL,
    auditRateLimit,
    sanitizeInput,
    preventXSS,
    getSecurityReport,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export { SecurityProvider };
export default SecurityProvider;