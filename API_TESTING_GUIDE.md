# Halo User Onboarding API Testing Guide

This guide provides step-by-step examples for testing the user onboarding and authentication APIs.

---

## Base URL
```
http://localhost:3000
```

---

## 1. User Signup

**Endpoint:** `POST /api/auth/signup`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "mobile": "+1234567890",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully. Please verify your email.",
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "email": "john.doe@example.com",
    "mobile": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "email_verified": false,
    "mobile_verified": false,
    "created_at": "2026-02-02T10:00:00.000Z",
    "updated_at": "2026-02-02T10:00:00.000Z",
    "status": "pending_verification"
  },
  "session": {
    "token": "abc123def456...",
    "expires_at": "2026-02-09T10:00:00.000Z"
  }
}
```

**Notes:**
- Check console for email verification token and mobile OTP
- Save the `token` for authenticated requests
- Save `user.id` for verification steps

---

## 2. Verify Email

**Endpoint:** `POST /api/auth/verify-email`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_1738496457123_a1b2c3d4",
    "token": "<email_verification_token_from_console>"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "email_verified": true,
    "status": "pending_verification"
  }
}
```

---

## 3. Verify Mobile (OTP)

**Endpoint:** `POST /api/auth/verify-mobile`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_1738496457123_a1b2c3d4",
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Mobile verified successfully",
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "mobile_verified": true,
    "status": "active"
  }
}
```

---

## 4. Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_1738496457123_a1b2c3d4"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

---

## 5. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active",
    "last_login": "2026-02-02T10:05:00.000Z"
  },
  "session": {
    "token": "xyz789abc123...",
    "expires_at": "2026-02-09T10:05:00.000Z"
  }
}
```

**Notes:**
- Save the new `token` for subsequent authenticated requests

---

## 6. Get Current User

**Endpoint:** `GET /api/auth/me`

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "mobile": "+1234567890",
    "email_verified": true,
    "mobile_verified": true,
    "status": "active"
  }
}
```

---

## 7. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Request:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "mobile": "+1234567890",
    "email_verified": true,
    "mobile_verified": true,
    "created_at": "2026-02-02T10:00:00.000Z",
    "status": "active"
  }
}
```

---

## 8. Update Profile

**Endpoint:** `PATCH /api/users/profile`

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer xyz789abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "mobile": "+9876543210"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_1738496457123_a1b2c3d4",
    "first_name": "John",
    "last_name": "Smith",
    "mobile": "+9876543210",
    "mobile_verified": false
  }
}
```

**Notes:**
- Changing mobile number triggers new OTP verification

---

## 9. Add Payment Method

**Endpoint:** `POST /api/payment-methods`

**Request:**
```bash
curl -X POST http://localhost:3000/api/payment-methods \
  -H "Authorization: Bearer xyz789abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "card_number": "4242424242424242",
    "card_holder_name": "John Doe",
    "card_exp_month": 12,
    "card_exp_year": 2028,
    "card_cvv": "123",
    "billing_address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94102",
      "country": "US"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added. Please verify with OTP.",
  "payment_method": {
    "id": "pm_1738496457123_e5f6g7h8",
    "user_id": "user_1738496457123_a1b2c3d4",
    "stripe_payment_method_id": "pm_abc123...",
    "card_brand": "visa",
    "card_last4": "4242",
    "card_exp_month": 12,
    "card_exp_year": 2028,
    "card_holder_name": "John Doe",
    "verified": false,
    "is_default": true,
    "created_at": "2026-02-02T10:10:00.000Z",
    "status": "active"
  }
}
```

**Test Cards (Stripe):**
- Visa: `4242424242424242`
- Mastercard: `5555555555554444`
- Amex: `378282246310005`
- Discover: `6011111111111117`

---

## 10. Verify Payment Method (OTP)

**Endpoint:** `POST /api/payment-methods/:id/verify`

**Request:**
```bash
curl -X POST http://localhost:3000/api/payment-methods/pm_1738496457123_e5f6g7h8/verify \
  -H "Authorization: Bearer xyz789abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method verified successfully",
  "payment_method": {
    "id": "pm_1738496457123_e5f6g7h8",
    "verified": true,
    "is_default": true
  }
}
```

---

## 11. List Payment Methods

**Endpoint:** `GET /api/payment-methods`

**Request:**
```bash
curl -X GET http://localhost:3000/api/payment-methods \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "payment_methods": [
    {
      "id": "pm_1738496457123_e5f6g7h8",
      "card_brand": "visa",
      "card_last4": "4242",
      "card_exp_month": 12,
      "card_exp_year": 2028,
      "verified": true,
      "is_default": true,
      "created_at": "2026-02-02T10:10:00.000Z"
    }
  ]
}
```

---

## 12. Set Default Payment Method

**Endpoint:** `PATCH /api/payment-methods/:id/set-default`

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/payment-methods/pm_1738496457123_e5f6g7h8/set-default \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "message": "Default payment method updated",
  "payment_method": {
    "id": "pm_1738496457123_e5f6g7h8",
    "is_default": true
  }
}
```

---

## 13. Remove Payment Method

**Endpoint:** `DELETE /api/payment-methods/:id`

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/payment-methods/pm_1738496457123_e5f6g7h8 \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed"
}
```

---

## 14. Logout

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer xyz789abc123..."
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Complete Test Flow

### Step 1: Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@halofy.ai","mobile":"+1234567890","password":"TestPass123!","first_name":"Test","last_name":"User"}'
```

### Step 2: Check Console for Verification Details
Look for:
- Email verification token
- Mobile OTP

### Step 3: Verify Email
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","token":"<EMAIL_TOKEN>"}'
```

### Step 4: Verify Mobile
```bash
curl -X POST http://localhost:3000/api/auth/verify-mobile \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","otp":"<OTP>"}'
```

### Step 5: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@halofy.ai","password":"TestPass123!"}'
```

### Step 6: Add Payment Method
```bash
curl -X POST http://localhost:3000/api/payment-methods \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"card_number":"4242424242424242","card_holder_name":"Test User","card_exp_month":12,"card_exp_year":2028,"card_cvv":"123"}'
```

### Step 7: Verify Payment Method
```bash
curl -X POST http://localhost:3000/api/payment-methods/<PM_ID>/verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"otp":"<OTP>"}'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Payment method not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_test_...
PORT=3000
```

---

## Notes

1. **OTP Generation**: Currently logged to console. In production, integrate with Twilio/SendGrid.
2. **Email Verification**: Currently logged to console. In production, send actual emails.
3. **Session Tokens**: Valid for 7 days. Store securely in client (localStorage/cookies).
4. **Card Tokenization**: Uses Stripe. Card data never stored raw.
5. **Password Requirements**: Minimum 8 characters.
6. **OTP Expiry**: 10 minutes from generation.

---

## Testing with Postman

Import this as a Postman collection or use the provided cURL commands. Remember to:
1. Start the server: `npm start`
2. Set `STRIPE_SECRET_KEY` in `.env`
3. Replace `<TOKEN>`, `<USER_ID>`, `<PM_ID>`, etc. with actual values from responses
4. Check server console for OTP and verification tokens
