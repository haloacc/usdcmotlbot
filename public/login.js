// Login Page Logic

// Google Sign-In callback
window.handleGoogleSignIn = async function (response) {
    try {
        const result = await haloAPI.googleSignIn(response.credential);

        if (result.success) {
            // Store token and redirect to main agent UI
            window.location.href = '/dashboard.html';
        } else {
            showError(result.error || 'Google sign-in failed');
        }
    } catch (error) {
        showError(error.message || 'Google sign-in failed');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitBtn = document.getElementById('login-btn');
    const passwordToggle = document.getElementById('password-toggle');

    // Check if already logged in
    if (haloAPI.isAuthenticated()) {
        checkAuthAndRedirect();
    }

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

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        // Show loading state
        setLoading(true);
        hideMessages();

        try {
            const response = await haloAPI.login(credentials);

            // Show success message
            showSuccess('Login successful! Redirecting...');

            // Redirect to dashboard to add payment methods first
            setTimeout(() => {
                const returnUrl = new URLSearchParams(window.location.search).get('return');
                window.location.href = returnUrl || '/dashboard.html';
            }, 1000);
        } catch (error) {
            showError(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    });

    // Helper functions
    async function checkAuthAndRedirect() {
        try {
            await haloAPI.getCurrentUser();
            window.location.href = '/index.html';
        } catch (error) {
            // Token invalid, clear it
            haloAPI.clearToken();
        }
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

    // Expose helpers for global callbacks
    window.showError = showError;
    window.showSuccess = showSuccess;

    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }
});
