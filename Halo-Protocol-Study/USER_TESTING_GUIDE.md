# 🧪 End-to-End User Testing Guide

## 🚀 Getting Started

### Prerequisites
- Server is running: `npm start`
- Open your browser to: `http://localhost:3000/home.html`

---

## 📋 Complete User Journey

### **Step 1: Landing Page**
1. Visit `http://localhost:3000/home.html`
2. You'll see the Halo welcome page
3. Click **"Sign Up"**

---

### **Step 2: Create Account**
URL: `http://localhost:3000/signup.html`

**Fill in the form:**
- Full Name: `Your Name`
- Email: `yourname@test.com` (use any test email)
- Password: `Test123!@#` (must be 8+ characters)
- Mobile: `+1234567890`

Click **"Sign Up"**

✅ **Expected Result:** Account created successfully, you'll see a message about email verification

---

### **Step 3: Email Verification**
After signup, you need to verify your email. In **development mode**, the verification link is logged to the server console.

**In a new terminal, run:**
```bash
tail -f /tmp/halo-server.log | grep -A 2 "verify-email"
```

**Look for a URL like:**
```
http://localhost:3000/api/auth/verify-email?token=abc123...
```

**Copy that URL and paste it in your browser**

✅ **Expected Result:** You'll see a success page saying "Email Verified!"

---

### **Step 4: Login**
URL: `http://localhost:3000/login.html`

**Login with your credentials:**
- Email: `yourname@test.com`
- Password: `Test123!@#`

Click **"Login"**

✅ **Expected Result:** Redirected to products page

---

### **Step 5: Browse Products**
URL: `http://localhost:3000/products.html`

You'll see a catalog of products:
- 💻 Gaming Laptop - $1,500
- 🎧 Wireless Headphones - $299
- ⌚ Smart Watch - $399
- ⌨️ Mechanical Keyboard - $149
- 📹 Webcam 4K - $129
- 💾 Portable SSD 2TB - $189

**Click "Add to Cart" on any products you want**

✅ **Expected Result:** Toast notification appears, cart counter increases

---

### **Step 6: View Cart & Checkout**
Click the **"🛒 Cart"** button in the header

You'll see:
- All items you added
- Quantity controls (+/- buttons)
- Subtotal, shipping ($25), tax (8%)
- Total amount

**Click "Place Order"**

✅ **Expected Result:** 
- Loading spinner appears
- You're redirected to Stripe Checkout page

---

### **Step 7: Complete Payment**
You're now on the Stripe Checkout page (hosted by Stripe)

**Test Cards:**

**Basic Card (no 3DS):**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/28
CVV: 123
Name: Test User
```

**Card Requiring 3DS Authentication:**
```
Card Number: 4000 0025 0000 3155
Expiry: 12/28
CVV: 123
Name: Test User
```

**Enter the card details and click "Pay"**

✅ **Expected Result:** 
- If using 3DS card: Authentication popup appears
- Payment processes
- Redirected to success page

---

### **Step 8: Payment Method Management (Optional)**
At any time, click **"Dashboard"** in the header to:
- View your saved payment methods
- Add new cards
- See account stats

**To add a payment method:**
1. Click "Add Payment Method"
2. Enter card details (same test cards as above)
3. Submit

✅ **Expected Result:** 
- OTP sent (logged to console in dev mode)
- Card added to your account
- Can verify OTP if needed

---

## 🔍 What's Being Tested

### ✅ Frontend
- Landing page
- Signup/Login flows
- Email verification
- Product catalog
- Shopping cart
- Checkout UI
- Payment method management

### ✅ Backend
- User authentication (JWT)
- Email verification tokens
- Session management
- Payment method storage
- Card validation (Luhn algorithm)

### ✅ Protocol Orchestration
- Natural language processing
- UCP request creation
- ACP adapter (Stripe)
- Stripe Checkout Session creation
- 3DS authentication

### ✅ Stripe Integration
- Test mode active
- Checkout Sessions
- PaymentIntents
- 3DS support
- Webhook handling (if configured)

---

## 🐛 Debugging Tips

### Check Server Logs
```bash
tail -f /tmp/halo-server.log
```

### Check Browser Console
Press **F12** → **Console** tab to see:
- API calls
- Errors
- Network requests

### Common Issues

**"Please verify your email"**
→ Check server logs for verification link

**Cart not updating**
→ Check browser localStorage: `localStorage.getItem('halo_cart')`

**Login failed**
→ Ensure email is verified first

**Checkout stuck**
→ Check server logs for Stripe API errors

---

## 📊 Test Scenarios

### Happy Path ✅
1. Signup → Verify Email → Login → Browse → Add to Cart → Checkout → Pay

### Edge Cases
- [ ] Try logging in before email verification
- [ ] Add multiple quantities of same product
- [ ] Remove items from cart
- [ ] Test with 3DS card
- [ ] Add payment method from dashboard
- [ ] Logout and login again

---

## 🎉 Success Criteria

You've successfully tested the system when you:
- ✅ Created an account
- ✅ Verified your email
- ✅ Logged in
- ✅ Browsed products
- ✅ Added items to cart
- ✅ Completed checkout
- ✅ Reached Stripe payment page
- ✅ Processed a test payment

---

## 🔗 Quick Links

| Page | URL |
|------|-----|
| Landing | http://localhost:3000/home.html |
| Signup | http://localhost:3000/signup.html |
| Login | http://localhost:3000/login.html |
| Products | http://localhost:3000/products.html |
| Checkout | http://localhost:3000/checkout.html |
| Dashboard | http://localhost:3000/dashboard.html |

---

## 💡 Pro Tips

1. **Keep server logs open** in a separate terminal
2. **Use browser DevTools** to inspect network calls
3. **Clear localStorage** if you want to start fresh: `localStorage.clear()`
4. **Use different email addresses** for testing multiple accounts
5. **Test card numbers are safe** - they never charge real money

Happy Testing! 🚀
