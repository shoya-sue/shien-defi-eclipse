import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { formatAddress } from '../../utils';
import { useWallet as useCustomWallet } from '../../hooks/useWallet';

interface WalletButtonProps {
  className?: string;
}

export const WalletButton: React.FC<WalletButtonProps> = ({ className }) => {
  const { publicKey, connected, disconnect } = useWallet();
  const { balance } = useCustomWallet();

  const handleDisconnect = async () => {
    await disconnect();
  };

  if (connected && publicKey) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span className="text-sm font-medium">
              {formatAddress(publicKey.toBase58())}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {balance.loading ? 'Loading...' : `${balance.sol.toFixed(4)} SOL`}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 text-sm font-medium text-error-600 hover:text-error-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <WalletMultiButton
      className={`!bg-primary-600 hover:!bg-primary-700 !text-white !font-medium !rounded-lg !px-4 !py-2 !text-sm !transition-colors ${className}`}
    />
  );
};

export default WalletButton;