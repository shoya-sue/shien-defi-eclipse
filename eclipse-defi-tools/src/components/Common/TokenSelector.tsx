import React, { useState, useRef, useEffect } from 'react';
import type { Token } from '../../types';
import { COMMON_TOKENS } from '../../constants';

interface TokenSelectorProps {
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  excludeToken?: Token;
  className?: string;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  excludeToken,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTokens = COMMON_TOKENS.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isNotExcluded = !excludeToken || token.address !== excludeToken.address;
    return matchesSearch && isNotExcluded;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary-500"
      >
        {selectedToken ? (
          <div className="flex items-center">
            {selectedToken.logoURI && (
              <img
                src={selectedToken.logoURI}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedToken.symbol}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedToken.name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">トークンを選択</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="トークンを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary-500"
            />
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                トークンが見つかりません
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                >
                  {token.logoURI && (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mr-3"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.symbol}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {token.name}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;