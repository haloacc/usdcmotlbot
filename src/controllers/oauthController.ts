import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { userService } from '../services/userService';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export class OauthController {
  // POST /api/auth/google
  async googleSignIn(req: Request, res: Response): Promise<void> {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        res.status(400).json({ success: false, error: 'Missing id_token' });
        return;
      }
      const ticket = await client.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(400).json({ success: false, error: 'Invalid Google token' });
        return;
      }
      // Find or create user
      const user = await userService.findOrCreateUserFromOAuth({
        email: payload.email,
        first_name: payload.given_name,
        last_name: payload.family_name,
        email_verified: payload.email_verified,
        provider: 'google',
        provider_id: payload.sub,
      });
      // Create session
      const session = userService.createSession(user.id);
      res.json({
        success: true,
        user,
        session: {
          token: session.token,
          expires_at: session.expires_at,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
