// Signup Page Logic

// Google Sign-In callback
window.handleGoogleSignIn = async function(response) {
    try {
        const result = await haloAPI.googleSignIn(response.credential);
        
        if (result.success) {
            // Store token and redirect to login
            window.location.href = '/login.html';
        } else {
            showError(result.error || 'Google sign-in failed');
        }
    } catch (error) {
        showError(error.message || 'Google sign-in failed');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const strengthIndicator = document.getElementById('password-strength');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitBtn = document.getElementById('signup-btn');
    const passwordToggle = document.getElementById('password-toggle');
    const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
    const sendOTPBtn = document.getElementById('send-otp-btn');
    const mobileInput = document.getElementById('mobile');
    const otpVerifyGroup = document.getElementById('otp-verify-group');
    const otpInput = document.getElementById('otp-input');
    const resendInlineOTP = document.getElementById('resend-inline-otp');
    const otpStatus = document.getElementById('otp-status');
    
    let otpSent = false;
    let otpVerified = false;
    let sentOTP = null; // For dev mode

    // Password strength checker
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        
        strengthIndicator.style.setProperty('--strength', `${strength.percentage}%`);
        strengthIndicator.style.setProperty('--strength-color', strength.color);
        
        // Also validate password match when password changes
        validatePasswordMatch();
    });

    // Password match validator
    const validatePasswordMatch = () => {
        if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    };

    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const eyeIcon = passwordToggle.querySelector('.eye-icon');
            const eyeOffIcon = passwordToggle.querySelector('.eye-off-icon');
            if (type === 'text') {
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    }

    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            const eyeIcon = confirmPasswordToggle.querySelector('.eye-icon');
            const eyeOffIcon = confirmPasswordToggle.querySelector('.eye-off-icon');
            if (type === 'text') {
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    }

    // Send OTP button handler
    if (sendOTPBtn) {
        sendOTPBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const mobile = mobileInput.value.trim();
            
            if (!mobile) {
                showError('Please enter your mobile number');
                return;
            }
            
            sendOTPBtn.disabled = true;
            sendOTPBtn.textContent = 'Sending...';
            hideMessages();
            
            try {
                const response = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to send OTP');
                }
                
                otpSent = true;
                sentOTP = data.otp_for_dev;
                otpVerifyGroup.style.display = 'block';
                otpInput.focus();
                otpStatus.textContent = '✅ OTP sent! Check your phone.';
                otpStatus.style.color = '#10b981';
                sendOTPBtn.textContent = '✓ Sent';
                
                if (sentOTP) {
                    console.log('🔢 DEV OTP:', sentOTP);
                }
            } catch (error) {
                showError(error.message || 'Failed to send OTP');
                sendOTPBtn.disabled = false;
                sendOTPBtn.textContent = 'Send OTP';
            }
        });
    }
    
    // Verify OTP on input
    if (otpInput) {
        otpInput.addEventListener('input', async (e) => {
            const otp = e.target.value.trim();
            
            if (otp.length === 6) {
                otpStatus.textContent = 'Verifying...';
                otpStatus.style.color = '#6b7280';
                
                // In dev mode, check against sent OTP
                if (sentOTP && otp === sentOTP) {
                    otpVerified = true;
                    otpStatus.textContent = '✅ Phone verified!';
                    otpStatus.style.color = '#10b981';
                    otpInput.disabled = true;
                    otpInput.style.borderColor = '#10b981';
                    otpInput.style.backgroundColor = '#f0fdf4';
                } else {
                    otpStatus.textContent = '❌ Invalid OTP';
                    otpStatus.style.color = '#ef4444';
                }
            }
        });
    }
    
    // Resend OTP
    if (resendInlineOTP) {
        resendInlineOTP.addEventListener('click', async (e) => {
            e.preventDefault();
            sendOTPBtn.click();
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError('Passwords do not match');
            return;
        }
        
        // Check if OTP was sent and verified
        if (!otpVerified) {
            showError('Please verify your phone number with OTP first');
            otpInput?.focus();
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const userData = {
            email: formData.get('email'),
            mobile: formData.get('mobile'),
            password: formData.get('password'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            mobile_verified: true, // Phone already verified via OTP
        };

        // Show loading state
        setLoading(true);
        hideMessages();

        try {
            const response = await haloAPI.signup(userData);

            // Success - redirect to login with message
            showSuccess('✅ Account created! Please check your email to verify before logging in.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);

        } catch (error) {
            console.error('Signup error:', error);
            showError(error.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Helper functions
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

        let color;
        if (strength < 40) color = '#ef4444';
        else if (strength < 70) color = '#f59e0b';
        else color = '#10b981';

        return { percentage: Math.min(strength, 100), color };
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        const btnText = submitBtn.querySelector('span');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    // OTP Modal functions
    function showOTPModal() {
        const modal = document.getElementById('otp-modal');
        if (modal) {
            modal.style.display = 'flex';
            setupOTPInputs();
            setupResendTimer();
            
            // Show masked phone number
            const mobile = document.getElementById('mobile').value;
            const maskedPhone = document.getElementById('masked-phone');
            if (mobile && maskedPhone) {
                const last4 = mobile.slice(-4);
                maskedPhone.textContent = `****${last4}`;
            }
            
            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    if (confirm('Skip phone verification? You can verify later before adding payment methods.')) {
                        skipVerification();
                    }
                }
            };
        }
    }

    function hideOTPModal() {
        const modal = document.getElementById('otp-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function setupOTPInputs() {
        const otpInputs = document.querySelectorAll('#otp-modal .otp-input');
        
        otpInputs.forEach((input, index) => {
            // Clear any existing listeners
            input.value = '';
            
            input.addEventListener('input', (e) => {
                let value = e.target.value;
                
                // Only allow digits and take only the last character if multiple are entered
                if (value.length > 1) {
                    value = value.slice(-1);
                }
                
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                e.target.value = value;

                // Auto-focus next input or auto-submit on last digit
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                    otpInputs[index + 1].select();
                } else if (value && index === 5) {
                    // Auto-submit when 6th digit is entered
                    setTimeout(() => verifyOTP(), 300);
                }
            });

            input.addEventListener('keydown', (e) => {
                // Backspace handling
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
                // Enter key to submit
                if (e.key === 'Enter') {
                    verifyOTP();
                }
            });

            // Paste handling
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').slice(0, 6);
                
                if (/^\d+$/.test(pastedData)) {
                    pastedData.split('').forEach((char, i) => {
                        if (otpInputs[i]) {
                            otpInputs[i].value = char;
                        }
                    });
                    
                    if (pastedData.length === 6) {
                        verifyOTP();
                    }
                }
            });
        });
    }

    async function verifyOTP() {
        const otpInputs = document.querySelectorAll('#otp-modal .otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        const verifyBtn = document.getElementById('verify-otp-btn');
        const otpError = document.getElementById('otp-error');

        if (otp.length !== 6) {
            showOTPError('Please enter all 6 digits');
            return;
        }

        // Show loading state
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<span class="btn-loader"></span> Verifying...';
        }
        hideOTPError();

        try {
            const userId = sessionStorage.getItem('pending_verification_user_id');
            if (!userId) {
                throw new Error('Session expired. Please sign up again.');
            }
            
            await haloAPI.verifyMobile(userId, otp);
            
            hideOTPModal();
            showSuccess('✅ Phone verified! Redirecting to login...');
            
            setTimeout(() => {
                sessionStorage.removeItem('pending_verification_user_id');
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            console.error('OTP verification error:', error);
            showOTPError(error.message || 'Invalid OTP. Please try again.');
            // Clear OTP inputs
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        } finally {
            // Reset button state
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Verify';
            }
        }
    }

    function showOTPError(message) {
        const otpError = document.getElementById('otp-error');
        if (otpError) {
            otpError.textContent = message;
            otpError.style.display = 'block';
        }
    }

    function hideOTPError() {
        const otpError = document.getElementById('otp-error');
        if (otpError) {
            otpError.style.display = 'none';
        }
    }

    let resendTimerInterval = null;
    function setupResendTimer() {
        const resendBtn = document.getElementById('resend-otp-btn');
        if (!resendBtn) return;
        
        let countdown = 30;
        resendBtn.disabled = true;
        resendBtn.textContent = `Resend in ${countdown}s`;
        
        if (resendTimerInterval) clearInterval(resendTimerInterval);
        
        resendTimerInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                resendBtn.textContent = `Resend in ${countdown}s`;
            } else {
                resendBtn.textContent = 'Resend OTP';
                resendBtn.disabled = false;
                clearInterval(resendTimerInterval);
            }
        }, 1000);
    }

    async function resendOTP() {
        const resendBtn = document.getElementById('resend-otp-btn');
        const otpError = document.getElementById('otp-error');
        
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.textContent = 'Sending...';
        }
        hideOTPError();

        try {
            const userId = sessionStorage.getItem('pending_verification_user_id');
            if (!userId) {
                throw new Error('Session expired. Please sign up again.');
            }
            await haloAPI.resendOTP(userId);
            showOTPError('✅ New OTP sent! Check your phone.');
            setTimeout(hideOTPError, 3000);
            setupResendTimer(); // Restart timer
        } catch (error) {
            console.error('Resend OTP error:', error);
            showOTPError('Failed to resend OTP: ' + error.message);
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend OTP';
            }
        }
    }

    function skipVerification() {
        hideOTPModal();
        sessionStorage.removeItem('pending_verification_user_id');
        showSuccess('Account created! Please check your email to verify your account.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    // Make functions global
    window.verifyOTP = verifyOTP;
    window.resendOTP = resendOTP;
    window.skipVerification = skipVerification;
});
