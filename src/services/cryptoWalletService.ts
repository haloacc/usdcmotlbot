import { CryptoWallet, AddCryptoWalletRequest, VerifyCryptoWalletRequest } from '../models/cryptoWallet';
import { userService } from './userService';
import crypto from 'crypto';

// In-memory store (replace with database in production)
export const cryptoWallets = new Map<string, CryptoWallet>();
export const userCryptoWallets = new Map<string, string[]>(); // user_id -> wallet_ids[]

class CryptoWalletService {
  // Add crypto wallet
  async addCryptoWallet(req: AddCryptoWalletRequest): Promise<CryptoWallet> {
    // Verify user exists
    const user = await userService.getUserById(req.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if wallet already exists for this user
    const existingWallets = userCryptoWallets.get(req.user_id) || [];
    for (const walletId of existingWallets) {
      const wallet = cryptoWallets.get(walletId);
      if (wallet && wallet.address.toLowerCase() === req.address.toLowerCase() && wallet.status === 'active') {
        throw new Error('This wallet is already connected to your account');
      }
    }

    // Create wallet record
    const walletId = `cw_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const wallet: CryptoWallet = {
      id: walletId,
      user_id: req.user_id,
      address: req.address,
      wallet_type: req.wallet_type,
      chain_id: req.chain_id,
      network_name: req.network_name,
      verified: !!req.signature, // If signature provided, consider verified
      signature: req.signature,
      is_default: false,
      created_at: new Date(),
      status: 'active',
    };

    // Check if this is the first wallet for the user
    if (existingWallets.length === 0) {
      wallet.is_default = true;
    }

    // Store wallet
    cryptoWallets.set(walletId, wallet);
    existingWallets.push(walletId);
    userCryptoWallets.set(req.user_id, existingWallets);

    console.log(`[CryptoWalletService] Wallet ${req.address} connected for user ${req.user_id}`);

    return wallet;
  }

  // Get crypto wallets for user
  async getCryptoWalletsForUser(userId: string): Promise<CryptoWallet[]> {
    const walletIds = userCryptoWallets.get(userId) || [];
    const wallets = walletIds
      .map(id => cryptoWallets.get(id))
      .filter((wallet): wallet is CryptoWallet => wallet !== undefined && wallet.status === 'active');

    return wallets;
  }

  // Get wallet by ID
  async getCryptoWalletById(walletId: string, userId: string): Promise<CryptoWallet | null> {
    const wallet = cryptoWallets.get(walletId);
    if (!wallet || wallet.user_id !== userId) {
      return null;
    }

    return wallet;
  }

  // Set default crypto wallet
  async setDefaultCryptoWallet(walletId: string, userId: string): Promise<CryptoWallet> {
    const wallet = cryptoWallets.get(walletId);
    if (!wallet || wallet.user_id !== userId) {
      throw new Error('Wallet not found');
    }

    // Unset other default wallets
    const userWallets = userCryptoWallets.get(userId) || [];
    userWallets.forEach(id => {
      const existingWallet = cryptoWallets.get(id);
      if (existingWallet && existingWallet.id !== walletId) {
        existingWallet.is_default = false;
        cryptoWallets.set(id, existingWallet);
      }
    });

    // Set this as default
    wallet.is_default = true;
    cryptoWallets.set(walletId, wallet);

    return wallet;
  }

  // Remove crypto wallet
  async removeCryptoWallet(walletId: string, userId: string): Promise<void> {
    const wallet = cryptoWallets.get(walletId);
    if (!wallet || wallet.user_id !== userId) {
      throw new Error('Wallet not found');
    }

    wallet.status = 'removed';
    cryptoWallets.set(walletId, wallet);

    // If this was default, set another as default
    if (wallet.is_default) {
      const userWallets = userCryptoWallets.get(userId) || [];
      const activeWallets = userWallets
        .map(id => cryptoWallets.get(id))
        .filter((w): w is CryptoWallet => w !== undefined && w.status === 'active' && w.id !== walletId);

      if (activeWallets.length > 0) {
        activeWallets[0].is_default = true;
        cryptoWallets.set(activeWallets[0].id, activeWallets[0]);
      }
    }
  }
}

export const cryptoWalletService = new CryptoWalletService();
