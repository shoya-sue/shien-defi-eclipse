import { useCallback, useEffect, useState } from 'react';
import { securityAuditor } from '../utils/security';

export const useSecurity = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  const auditInput = useCallback((input: string, context: string): boolean => {
    if (!isEnabled) return true;
    return securityAuditor.auditInput(input, context);
  }, [isEnabled]);

  const auditURL = useCallback((url: string): boolean => {
    if (!isEnabled) return true;
    return securityAuditor.auditURL(url);
  }, [isEnabled]);

  const auditRateLimit = useCallback((identifier: string): boolean => {
    if (!isEnabled) return true;
    return securityAuditor.auditRateLimit(identifier);
  }, [isEnabled]);

  const getSecurityReport = useCallback(() => {
    return securityAuditor.getSecurityReport();
  }, []);

  return {
    isEnabled,
    setIsEnabled,
    auditInput,
    auditURL,
    auditRateLimit,
    getSecurityReport,
  };
};