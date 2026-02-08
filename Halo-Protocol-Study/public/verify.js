// Verification Page Logic
document.addEventListener('DOMContentLoaded', () => {
    // Get pending user data
    const pendingUserData = sessionStorage.getItem('pending_user');
    if (!pendingUserData) {
        window.location.href = '/signup.html';
        return;
    }

    const pendingUser = JSON.parse(pendingUserData);
    let emailVerified = pendingUser.email_verified || false;
    let mobileVerified = pendingUser.mobile_verified || false;
    let otpTimerInterval;

    // Show verification codes for testing
    if (pendingUser.email_token) {
        document.getElementById('email-code-display').style.display = 'block';
        document.getElementById('email-token-display').textContent = pendingUser.email_token;
    }

    if (pendingUser.mobile_otp) {
        document.getElementById('mobile-code-display').style.display = 'block';
        document.getElementById('mobile-otp-display').textContent = pendingUser.mobile_otp;
    }

    // Update UI based on initial state
    updateEmailStepUI();
    if (pendingUser.mobile) {
        document.getElementById('mobile-step').style.display = 'block';
        startOTPTimer();
        setupOTPInputs();
    }

    // Check if already verified
    if (emailVerified && (!pendingUser.mobile || mobileVerified)) {
        showContinueButton();
    }

    // Start polling for email verification
    if (!emailVerified) {
        startEmailPolling();
    }

    function updateEmailStepUI() {
        const step = document.getElementById('email-step');
        const icon = document.getElementById('email-icon');
        const badge = document.getElementById('email-badge');
        const text = document.getElementById('email-text');

        if (emailVerified) {
            step.classList.add('completed');
            step.classList.remove('pending');
            icon.classList.add('completed');
            icon.textContent = '✓';
            badge.classList.remove('pending');
            badge.classList.add('success');
            badge.textContent = 'Verified';
            text.textContent = `Verified: ${pendingUser.email}`;
        } else {
            text.textContent = `Verify: ${pendingUser.email}`;
        }
    }

    function updateMobileStepUI() {
        const step = document.getElementById('mobile-step');
        const icon = document.getElementById('mobile-icon');
        const badge = document.getElementById('mobile-badge');
        const text = document.getElementById('mobile-text');

        if (mobileVerified) {
            step.classList.add('completed');
            step.classList.remove('pending');
            icon.classList.add('completed');
            icon.textContent = '✓';
            badge.classList.remove('pending');
            badge.classList.add('success');
            badge.textContent = 'Verified';
            text.textContent = `Verified: ${pendingUser.mobile}`;
            
            // Hide OTP input
            document.getElementById('otp-container').style.display = 'none';
            document.querySelector('.action-buttons').style.display = 'none';
            clearInterval(otpTimerInterval);
        }
    }

    function startEmailPolling() {
        const pollInterval = setInterval(async () => {
            try {
                // Auto-check if email was verified (simulated click on verification link)
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${haloAPI.getToken()}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.user.email_verified) {
                        emailVerified = true;
                        updateEmailStepUI();
                        clearInterval(pollInterval);
                        
                        if (!pendingUser.mobile || mobileVerified) {
                            showContinueButton();
                        }
                    }
                }
            } catch (error) {
                console.error('Email polling error:', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    function setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow digits
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Auto-focus next input
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }

                // Auto-submit when all filled
                if (index === otpInputs.length - 1 && value) {
                    const allFilled = Array.from(otpInputs).every(inp => inp.value);
                    if (allFilled) {
                        verifyMobileOTP();
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                // Backspace handling
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
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
                        verifyMobileOTP();
                    }
                }
            });
        });
    }

    function startOTPTimer() {
        let timeLeft = 600; // 10 minutes in seconds
        const timerElement = document.getElementById('otp-timer');

        otpTimerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(otpTimerInterval);
                timerElement.textContent = 'OTP expired - Click resend';
                timerElement.classList.add('expired');
            }
        }, 1000);
    }

    function showContinueButton() {
        document.getElementById('continue-btn').style.display = 'block';
    }

    // Global functions
    window.verifyEmailManually = async function() {
        if (!pendingUser.email_token) {
            alert('No email token available');
            return;
        }

        try {
            const response = await haloAPI.verifyEmail(pendingUser.email_token);
            emailVerified = true;
            updateEmailStepUI();

            if (!pendingUser.mobile || mobileVerified) {
                showContinueButton();
            }

            alert('Email verified successfully!');
        } catch (error) {
            alert('Verification failed: ' + error.message);
        }
    };

    window.checkEmailStatus = async function() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${haloAPI.getToken()}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.email_verified) {
                    emailVerified = true;
                    updateEmailStepUI();
                    alert('Email is verified!');
                    
                    if (!pendingUser.mobile || mobileVerified) {
                        showContinueButton();
                    }
                } else {
                    alert('Email not verified yet');
                }
            }
        } catch (error) {
            alert('Error checking status: ' + error.message);
        }
    };

    window.verifyMobileOTP = async function() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            alert('Please enter all 6 digits');
            return;
        }

        try {
            await haloAPI.verifyMobile(otp);
            mobileVerified = true;
            updateMobileStepUI();

            if (emailVerified) {
                showContinueButton();
            }

            alert('Mobile verified successfully!');
        } catch (error) {
            alert('Verification failed: ' + error.message);
            // Clear OTP inputs
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }
    };

    window.resendOTP = async function() {
        try {
            const result = await haloAPI.resendOTP(pendingUser.user_id);
            
            // Update displayed OTP if returned
            if (result.otp) {
                document.getElementById('mobile-code-display').style.display = 'block';
                document.getElementById('mobile-otp-display').textContent = result.otp;
                
                // Log to console as well
                console.log('🔐 New OTP:', result.otp);
            }

            // Restart timer
            clearInterval(otpTimerInterval);
            startOTPTimer();
            document.getElementById('otp-timer').classList.remove('expired');

            alert('New OTP sent successfully!');
        } catch (error) {
            alert('Failed to resend OTP: ' + error.message);
        }
    };

    window.continueToDashboard = function() {
        sessionStorage.removeItem('pending_user');
        window.location.href = '/dashboard.html';
    };
});
