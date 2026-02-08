
export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('halo_token');
}

export function setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('halo_token', token);
}

export function clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('halo_token');
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        console.log(`[API] 🚀 Request: ${endpoint}`, { method: options.method || 'GET', headers });
        const response = await fetch(endpoint, {
            ...options,
            headers,
        });

        console.log(`[API] 🛬 Response: ${endpoint}`, { status: response.status, statusText: response.statusText });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API] ❌ Error Body (${response.status}):`, text);
            let errorData = {};
            try {
                errorData = JSON.parse(text);
            } catch {
                // Not JSON, probably HTML (404/500 page)
                errorData = { message: `Server returned ${response.status} ${response.statusText}` };
            }
            const err = errorData as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            throw new Error(err.error || err.message || "Something went wrong");
        }

        return response.json();
    } catch (error) {
        console.error(`[API] 💥 Network/Parsing Error:`, error);
        throw error;
    }
}
