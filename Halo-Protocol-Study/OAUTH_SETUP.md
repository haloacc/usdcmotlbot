# Google OAuth Setup Guide

## 🚀 Quick Start

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Configure:
   - **Name**: Halo MVP
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `http://localhost:3000/login.html`
     - `http://localhost:3000/signup.html`
7. Click **Create**
8. Copy your **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Client ID:

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

### 3. Update Frontend

Replace `YOUR_GOOGLE_CLIENT_ID` in these files with your actual Client ID:

- `public/login.html` (line 34)
- `public/signup.html` (line 34)

Or use a build script to inject it automatically.

### 4. Test the Integration

1. Start the server:
```bash
npm start
```

2. Navigate to `http://localhost:3000/login.html`

3. Click the **Sign in with Google** button

4. You should see Google's OAuth consent screen

5. After authorization, you'll be redirected to the dashboard

## 📋 Features

### What Google OAuth Provides:

✅ **No Password Required** - Users authenticate via Google
✅ **Email Pre-Verified** - Google confirms email ownership
✅ **Instant Login** - No email verification flow needed
✅ **Secure** - Industry-standard OAuth 2.0 / OpenID Connect
✅ **Better UX** - One-click sign in/up
✅ **Social Profile** - Name, email, profile picture automatically

### User Flow:

```
Click "Sign in with Google"
    ↓
Google OAuth Popup
    ↓
User authorizes Halo
    ↓
Backend receives ID token
    ↓
Backend verifies with Google
    ↓
Create/find user account
    ↓
Return session token
    ↓
Redirect to dashboard
```

## 🔧 Development Mode

In development (without `GOOGLE_CLIENT_ID` set):

- Google button will show but won't work
- Traditional email/password signup still works
- Email/SMS verification logs to console

## 🌐 Production Deployment

### Update Authorized Origins:

Add your production domain to Google Cloud Console:

```
https://yourdomain.com
https://www.yourdomain.com
```

### Update .env:

```bash
NODE_ENV=production
APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-prod-client-id
```

### Replace in HTML files:

Update the `data-client_id` in login.html and signup.html with production Client ID.

## 🔒 Security Notes

- Client ID is **public** (safe to expose in frontend)
- Client Secret is **private** (never expose, not needed for frontend)
- ID tokens are verified server-side with Google
- Sessions work identically to password-based auth
- OAuth users can't use password login (no password stored)

## 🎯 Testing Tips

### Test with different Google accounts:

1. Use incognito mode for clean tests
2. Try personal Gmail accounts
3. Try Google Workspace accounts
4. Check that same email = same user account

### Check the flow:

1. Sign up with Google → creates new user
2. Log out
3. Sign in with Google → uses existing user
4. Try signing up traditionally with same email → should detect existing account

## 🐛 Troubleshooting

### "Error 400: redirect_uri_mismatch"

- Add exact URL to authorized redirect URIs in Google Console
- Include the protocol (http:// or https://)
- Check for typos

### Google button not showing:

- Check browser console for errors
- Verify Google SDK loaded: `<script src="https://accounts.google.com/gsi/client">`
- Check `data-client_id` is set correctly

### "Invalid Google token" error:

- Verify `GOOGLE_CLIENT_ID` matches in .env and HTML files
- Check token not expired (happens if testing is slow)
- Ensure server can reach Google's verification endpoint

## 📚 Resources

- [Google Identity Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
