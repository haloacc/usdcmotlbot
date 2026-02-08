// Google Sign-In button handler
function onGoogleSignIn(googleUser) {
    const id_token = googleUser.getAuthResponse().id_token;
    fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('halo_token', data.session.token);
            window.location.href = '/dashboard.html';
        } else {
            alert(data.error || 'Google sign-in failed');
        }
    })
    .catch(() => alert('Google sign-in failed'));
}
