import React, { useEffect } from 'react';
import { useSecurity } from '../../hooks/useSecurity';
import { sanitizeInput, preventXSS } from '../../utils/security';
import { SecurityContext, type SecurityContextType } from '../../contexts/SecurityContext';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export type { SecurityContextType };

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