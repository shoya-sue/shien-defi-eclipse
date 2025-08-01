import React, { useState, useEffect } from 'react';
import { securityAuditor, validateSecuritySettings } from '../../utils/security';
import type { SecurityEvent } from '../../utils/security';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isOpen, onClose }) => {
  const [securityReport, setSecurityReport] = useState<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: SecurityEvent[];
  } | null>(null);
  const [securitySettings, setSecuritySettings] = useState<{
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'settings'>('overview');

  useEffect(() => {
    if (isOpen) {
      updateSecurityData();
    }
  }, [isOpen]);

  const updateSecurityData = () => {
    const report = securityAuditor.getSecurityReport();
    const settings = validateSecuritySettings();
    setSecurityReport(report);
    setSecuritySettings(settings);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error-600 bg-error-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-warning-600 bg-warning-100';
      case 'low': return 'text-primary-600 bg-primary-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'xss_attempt': return 'XSS攻撃の試行';
      case 'csrf_attempt': return 'CSRF攻撃の試行';
      case 'rate_limit_exceeded': return 'レート制限超過';
      case 'invalid_input': return '無効な入力';
      case 'suspicious_activity': return '疑わしい活動';
      default: return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            セキュリティダッシュボード
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4">
              <div className="space-y-2">
                {[
                  { id: 'overview', label: '概要', icon: '📊' },
                  { id: 'events', label: 'セキュリティイベント', icon: '🚨' },
                  { id: 'settings', label: 'セキュリティ設定', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'events' | 'settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'overview' && securityReport && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      セキュリティ概要
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-sm font-medium text-primary-800 dark:text-primary-200">総イベント数</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {securityReport.totalEvents}
                        </p>
                      </div>
                      
                      <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-success-800 dark:text-success-200">セキュリティ状態</span>
                        </div>
                        <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                          {securitySettings?.isSecure ? '安全' : '警告'}
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">高リスクイベント</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {(securityReport.eventsBySeverity.high || 0) + (securityReport.eventsBySeverity.critical || 0)}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">24時間以内</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {securityReport.recentEvents.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      イベントタイプ別統計
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(securityReport.eventsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-900 dark:text-white">{getEventTypeLabel(type)}</span>
                          <span className="font-semibold text-gray-600 dark:text-gray-400">{String(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && securityReport && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      最近のセキュリティイベント
                    </h3>
                    <button
                      onClick={updateSecurityData}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm"
                    >
                      更新
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {securityReport.recentEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        最近のセキュリティイベントはありません
                      </div>
                    ) : (
                      securityReport.recentEvents.map((event: SecurityEvent, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                                  {event.severity.toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getEventTypeLabel(event.type)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {new Date(event.timestamp).toLocaleString('ja-JP')}
                              </p>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {Object.entries(event.details).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <strong>{key}:</strong> {String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && securitySettings && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    セキュリティ設定の検証
                  </h3>
                  
                  <div className={`p-4 rounded-lg border ${
                    securitySettings.isSecure
                      ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                      : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${
                        securitySettings.isSecure ? 'text-success-600' : 'text-error-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                          securitySettings.isSecure 
                            ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        } />
                      </svg>
                      <span className={`font-medium ${
                        securitySettings.isSecure ? 'text-success-800' : 'text-error-800'
                      }`}>
                        {securitySettings.isSecure ? 'セキュリティ設定は適切です' : 'セキュリティ設定に問題があります'}
                      </span>
                    </div>
                  </div>
                  
                  {securitySettings.issues.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-error-600 dark:text-error-400 mb-3">
                        検出された問題
                      </h4>
                      <ul className="space-y-2">
                        {securitySettings.issues.map((issue: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {securitySettings.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-primary-600 dark:text-primary-400 mb-3">
                        推奨事項
                      </h4>
                      <ul className="space-y-2">
                        {securitySettings.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;