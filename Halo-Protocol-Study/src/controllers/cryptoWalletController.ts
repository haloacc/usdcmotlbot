import { Request, Response } from 'express';
import { cryptoWalletService } from '../services/cryptoWalletService';
import { userService } from '../services/userService';
import { AddCryptoWalletRequest } from '../models/cryptoWallet';

export class CryptoWalletController {
  // POST /api/crypto-wallets
  async addCryptoWallet(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const {
        address,
        wallet_type,
        chain_id,
        network_name,
        signature,
      } = req.body;

      // Validation
      if (!address || !wallet_type || !chain_id || !network_name) {
        res.status(400).json({
          success: false,
          error: 'Wallet address, type, chain ID, and network name are required',
        });
        return;
      }

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address format',
        });
        return;
      }

      const addWalletReq: AddCryptoWalletRequest = {
        user_id: user.id,
        address: address.toLowerCase(),
        wallet_type,
        chain_id,
        network_name,
        signature,
      };

      const wallet = await cryptoWalletService.addCryptoWallet(addWalletReq);

      res.status(201).json({
        success: true,
        message: 'Crypto wallet connected successfully',
        wallet,
      });
    } catch (error: any) {
      console.error('[CryptoWalletController] Add wallet error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to connect wallet',
      });
    }
  }

  // GET /api/crypto-wallets
  async getCryptoWallets(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const wallets = await cryptoWalletService.getCryptoWalletsForUser(user.id);

      res.json({
        success: true,
        wallets,
      });
    } catch (error: any) {
      console.error('[CryptoWalletController] Get wallets error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch wallets',
      });
    }
  }

  // PATCH /api/crypto-wallets/:id/set-default
  async setDefaultWallet(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const { id } = req.params;

      const wallet = await cryptoWalletService.setDefaultCryptoWallet(id, user.id);

      res.json({
        success: true,
        message: 'Default wallet updated',
        wallet,
      });
    } catch (error: any) {
      console.error('[CryptoWalletController] Set default error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to set default wallet',
      });
    }
  }

  // DELETE /api/crypto-wallets/:id
  async removeWallet(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const { id } = req.params;

      await cryptoWalletService.removeCryptoWallet(id, user.id);

      res.json({
        success: true,
        message: 'Wallet disconnected',
      });
    } catch (error: any) {
      console.error('[CryptoWalletController] Remove wallet error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to disconnect wallet',
      });
    }
  }
}

export const cryptoWalletController = new CryptoWalletController();
