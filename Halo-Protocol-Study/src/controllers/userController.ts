import { Request, Response } from 'express';
import { userService } from '../services/userService';

export class UserController {
  // GET /api/users/profile
  async getProfile(req: Request, res: Response): Promise<void> {
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

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('[UserController] Get profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
      });
    }
  }

  // PATCH /api/users/profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const currentUser = await userService.getUserByToken(token);

      if (!currentUser) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const { first_name, last_name, mobile } = req.body;

      const updates: any = {};
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (mobile !== undefined) updates.mobile = mobile;

      const updatedUser = await userService.updateProfile(currentUser.id, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      console.error('[UserController] Update profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile',
      });
    }
  }
}

export const userController = new UserController();
