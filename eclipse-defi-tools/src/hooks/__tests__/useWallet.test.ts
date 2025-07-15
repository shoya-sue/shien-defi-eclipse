import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import type { Token } from '../../types';

// Mock the Solana wallet adapter modules
vi.mock('@solana/wallet-adapter-react');

// Mock @solana/spl-token
vi.mock('@solana/spl-token', () => ({
  AccountLayout: {
    decode: vi.fn(),
  },
  getAssociatedTokenAddress: vi.fn(() => 
    Promise.resolve(new PublicKey('7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj'))
  ),
}));

describe('useWallet', () => {
  const mockPublicKey = new PublicKey('11111111111111111111111111111111');
  const mockConnection = {
    getBalance: vi.fn(),
    getAccountInfo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useConnection as Mock).mockReturnValue({
      connection: mockConnection,
    });
    
    (useSolanaWallet as Mock).mockReturnValue({
      publicKey: null,
      connected: false,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    });
  });

  it('should return initial balance state when wallet is not connected', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.balance).toEqual({
      sol: 0,
      tokens: [],
      loading: false,
      error: null,
    });
  });

  it('should fetch SOL balance when wallet is connected', async () => {
    const mockBalance = 1000000000; // 1 SOL in lamports
    mockConnection.getBalance.mockResolvedValue(mockBalance);
    
    (useSolanaWallet as Mock).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    });

    const { result } = renderHook(() => useWallet());
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(mockConnection.getBalance).toHaveBeenCalledWith(mockPublicKey);
    expect(result.current.balance.sol).toBe(1);
    expect(result.current.balance.loading).toBe(false);
  });

  it('should handle balance fetch errors', async () => {
    mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
    
    (useSolanaWallet as Mock).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    });

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.balance.error).toBe('Failed to fetch balances');
    expect(result.current.balance.sol).toBe(0);
  });

  it('should fetch token balances', async () => {
    const mockTokenInfo: Token = {
      address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 100,
    };

    const mockAccountData = {
      amount: BigInt(1000000), // 1 USDC
    };

    mockConnection.getAccountInfo.mockResolvedValue({
      data: Buffer.alloc(165),
      executable: false,
      lamports: 0,
      owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      rentEpoch: 0,
    });

    mockConnection.getBalance.mockResolvedValue(1000000000); // 1 SOL

    // Mock AccountLayout.decode
    const { AccountLayout } = await import('@solana/spl-token');
    (AccountLayout.decode as Mock).mockReturnValue(mockAccountData);

    (useSolanaWallet as Mock).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    });

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.fetchAllBalances([mockTokenInfo as Token]);
    });
    
    expect(result.current.balance.tokens.length).toBeGreaterThan(0);
    if (result.current.balance.tokens.length > 0) {
      expect(result.current.balance.tokens[0].uiBalance).toBe('1.000000');
    }
  });
});