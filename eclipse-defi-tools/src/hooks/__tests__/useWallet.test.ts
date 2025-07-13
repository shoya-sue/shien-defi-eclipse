import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

// Mock the Solana wallet adapter modules
vi.mock('@solana/wallet-adapter-react');

describe('useWallet', () => {
  const mockPublicKey = new PublicKey('11111111111111111111111111111111');
  const mockConnection = {
    getBalance: vi.fn(),
    getAccountInfo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useConnection as any).mockReturnValue({
      connection: mockConnection,
    });
    
    (useSolanaWallet as any).mockReturnValue({
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
    
    (useSolanaWallet as any).mockReturnValue({
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
    
    (useSolanaWallet as any).mockReturnValue({
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
    const mockTokenInfo = {
      address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    };

    const mockAccountData = {
      amount: BigInt(1000000), // 1 USDC
    };

    mockConnection.getAccountInfo.mockResolvedValue({
      data: Buffer.alloc(165), // Mock account data
    });

    // Mock AccountLayout.decode
    vi.mock('@solana/spl-token', async () => {
      const actual = await vi.importActual('@solana/spl-token');
      return {
        ...actual,
        AccountLayout: {
          decode: () => mockAccountData,
        },
      };
    });

    (useSolanaWallet as any).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    });

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.fetchAllBalances([mockTokenInfo as any]);
    });
    
    expect(result.current.balance.tokens).toHaveLength(1);
    expect(result.current.balance.tokens[0].uiBalance).toBe('1.000000');
  });
});