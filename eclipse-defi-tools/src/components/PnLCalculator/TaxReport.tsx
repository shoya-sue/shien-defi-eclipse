import React, { useState } from 'react';
import { formatNumber, formatDate } from '../../utils';
import { usePnLCalculation } from '../../hooks/usePnLCalculation';
import type { Transaction, TransactionToken } from '../../types';

interface TaxReportData {
  totalGains: number;
  totalLosses: number;
  shortTermGains: number;
  longTermGains: number;
  taxableEvents: Transaction[];
}

export const TaxReport: React.FC = () => {
  const { generateTaxReport, exportData } = usePnLCalculation();
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [country, setCountry] = useState('US');
  const [taxReport, setTaxReport] = useState<TaxReportData | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const handleGenerateReport = () => {
    const report = generateTaxReport(taxYear, country);
    setTaxReport(report);
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const csvData = await exportData('csv');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_report_${taxYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setExportLoading(true);
    try {
      const jsonData = await exportData('json');
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_report_${taxYear}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tax Report Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          税務レポート生成
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              税務年度
            </label>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              国・地域
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="US">アメリカ</option>
              <option value="JP">日本</option>
              <option value="EU">ヨーロッパ</option>
              <option value="OTHER">その他</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              レポート生成
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV エクスポート
          </button>
          
          <button
            onClick={handleExportJSON}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            JSON エクスポート
          </button>
        </div>
      </div>

      {/* Tax Report Results */}
      {taxReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {taxYear}年度 税務レポート
          </h3>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium text-success-800 dark:text-success-200">総利益</span>
              </div>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                ${formatNumber(taxReport.totalGains, 2)}
              </p>
            </div>
            
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                <span className="text-sm font-medium text-error-800 dark:text-error-200">総損失</span>
              </div>
              <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                ${formatNumber(taxReport.totalLosses, 2)}
              </p>
            </div>
            
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-primary-800 dark:text-primary-200">短期利益</span>
              </div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${formatNumber(taxReport.shortTermGains, 2)}
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">長期利益</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${formatNumber(taxReport.longTermGains, 2)}
              </p>
            </div>
          </div>

          {/* Tax Calculation */}
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-3">
              概算税額（参考値）
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-warning-700 dark:text-warning-300">短期利益税 (30%):</span>
                <span className="font-medium text-warning-800 dark:text-warning-200">
                  ${formatNumber(taxReport.shortTermGains * 0.3, 2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warning-700 dark:text-warning-300">長期利益税 (15%):</span>
                <span className="font-medium text-warning-800 dark:text-warning-200">
                  ${formatNumber(taxReport.longTermGains * 0.15, 2)}
                </span>
              </div>
              <div className="border-t border-warning-200 dark:border-warning-700 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-warning-800 dark:text-warning-200">概算税額:</span>
                  <span className="font-bold text-warning-800 dark:text-warning-200">
                    ${formatNumber(taxReport.shortTermGains * 0.3 + taxReport.longTermGains * 0.15, 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Taxable Events */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              課税対象取引 ({taxReport.taxableEvents.length}件)
            </h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {taxReport.taxableEvents.map((tx: Transaction, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {tx.tokens.slice(0, 2).map((token: TransactionToken, i: number) => (
                        token.token.logoURI && (
                          <img
                            key={i}
                            src={token.token.logoURI}
                            alt={token.token.symbol}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700"
                          />
                        )
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {tx.type === 'swap' ? 'スワップ' : '流動性削除'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {tx.tokens.map((token: TransactionToken, i: number) => (
                        <span key={i} className="block">
                          {token.isInput ? '-' : '+'}
                          {formatNumber(token.amount, 4)} {token.token.symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    手数料: ${formatNumber(tx.fees, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
              ⚠️ 免責事項
            </h5>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              このレポートは参考情報であり、税務アドバイスではありません。
              実際の税務申告については、税理士や税務専門家にご相談ください。
              税法は複雑で変更される可能性があるため、最新の情報を確認することをお勧めします。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxReport;