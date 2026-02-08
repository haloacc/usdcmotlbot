# 🚀 Halo MVP - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Choose Your Setup

#### Option A: Full OAuth Setup (Recommended)
```bash
# Run the setup script
./setup-oauth.sh

# Follow prompts to enter your Google Client ID
# Get it from: https://console.cloud.google.com/apis/credentials
```

#### Option B: Dev Mode (No OAuth required)
```bash
# Use the existing .env file
# OAuth button will show but won't work
# Traditional signup/login works normally
```

### 3. Start the Server
```bash
npm start
```

### 4. Test the Application

Open in your browser:
- **Homepage:** http://localhost:3000
- **Sign Up:** http://localhost:3000/signup.html
- **Login:** http://localhost:3000/login.html

## 🎯 Testing User Flows

### Traditional Signup/Login Flow

1. **Sign Up** at `/signup.html`:
   - Enter email, mobile, password, name
   - Click "Send OTP" for mobile verification
   - Check terminal for OTP code (logged to console)
   - Enter OTP and submit
   - Check terminal for email verification link
   - Click the email verification link

2. **Login** at `/login.html`:
   - Enter email and password
   - Click "Sign In"
   - Redirects to dashboard

### Google OAuth Flow (if configured)

1. **Sign Up or Login**:
   - Click "Sign in with Google" button
   - Authorize Halo in Google popup
   - Auto-redirect to dashboard
   - ✅ No email verification needed!

## 🧪 Test Payment Orchestration

### Natural Language Payment
```bash
curl -X POST http://localhost:3000/halo/process-natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Buy $100 Nike shoes from Nike with express shipping"
  }'
```

### Protocol Detection
```bash
curl -X POST http://localhost:3000/halo/detect \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Buy $50 shirt with standard shipping to US"
  }'
```

### Full Orchestration
```bash
curl -X POST http://localhost:3000/halo/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Buy $25 book from Amazon with express shipping",
    "user_id": "user_123",
    "payment_method_id": "pm_card_visa"
  }'
```

## 📋 Development Mode Features

When running without production credentials:

### ✅ Works Out of the Box:
- Traditional signup/login
- Password validation
- Full payment orchestration (ACP, UCP, x402)
- Protocol detection and routing
- Risk scoring
- Natural language processing

### 📝 Logs to Console:
- **SMS OTP codes** - Copy from terminal
- **Email verification links** - Click from terminal
- **Session tokens**
- **Payment processing results**

### ⚠️ Requires Setup:
- **Google Sign-In** - Needs Client ID
- **Real Email Delivery** - Needs Gmail credentials
- **Real SMS Delivery** - Needs Twilio credentials
- **Stripe Payments** - Needs API key (or uses mock mode)

## 🔧 Configuration Quick Reference

### Minimal .env (Dev Mode)
```bash
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

### Full .env (Production Ready)
```bash
# Server
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=your-real-id.apps.googleusercontent.com

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com

# SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Payments
STRIPE_SECRET_KEY=sk_live_...
```

## 🎨 Frontend Pages

- **/** - Landing page with feature overview
- **/signup.html** - User registration with OAuth
- **/login.html** - User login with OAuth
- **/dashboard.html** - User dashboard (authenticated)
- **/verify.html** - Email verification status

## 🧩 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/verify-mobile` - Verify mobile OTP
- `GET /api/auth/me` - Get current user

### Payment Orchestration
- `POST /halo/orchestrate` - Full payment orchestration
- `POST /halo/detect` - Protocol detection
- `POST /halo/process-natural-language` - Natural language to payment
- `POST /halo/agentic-checkout` - ACP checkout flow

### Payment Methods
- `GET /api/payment-methods` - List payment methods
- `POST /api/payment-methods` - Add payment method
- `POST /api/payment-methods/:id/verify` - Verify with OTP

## 🐛 Troubleshooting

### Google button not showing?
- Check `data-client_id` in HTML files
- Verify Google SDK loaded in browser console
- Check `.env` has `GOOGLE_CLIENT_ID`

### Can't verify email?
- Check server terminal for verification link
- Link expires in 24 hours
- In dev mode, links are logged to console

### SMS OTP not received?
- Check server terminal (dev mode logs OTPs)
- For production, configure Twilio credentials

### TypeScript errors?
```bash
npm install
npx tsc --noEmit
```

### Tests failing?
```bash
npm test
```

## 📚 Additional Resources

- **[OAUTH_SETUP.md](OAUTH_SETUP.md)** - Detailed Google OAuth setup
- **[README.md](README.md)** - Full documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - API testing guide

## 🎯 Next Steps

1. ✅ Get basic setup running
2. ✅ Test traditional signup/login
3. ✅ Configure Google OAuth
4. ✅ Test OAuth flow
5. ✅ Try payment orchestration APIs
6. ✅ Add payment methods
7. ✅ Test full checkout flow
8. 🚀 Deploy to production!

---

**Need help?** Check the terminal logs - most issues are logged with helpful messages!
