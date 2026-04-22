// ============================================================
// TypeRush — Main HTTP + WebSocket Server
// ============================================================
// Built using ONLY Node.js built-in modules (http, fs, url, path).
// No Express! Pure Node.js HTTP server.
//
// Serves:
//   1. Static frontend files (HTML, CSS, JS)
//   2. REST API endpoints (/api/*)
//   3. WebSocket server for real-time multiplayer
// ============================================================

require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');

const routes = require('./routes');

// ── Configuration ──
const PORT = process.env.PORT || 3000;

// Path to the frontend files (one level up inside /frontend)
const FRONTEND_DIR = path.join(__dirname, '../frontend');

// ── MIME type map for serving static files ──
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// ── Helper: Read request body as JSON ──
function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}



// ── Helper: Send JSON error ──
function sendError(res, code, msg) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: msg }));
}

// ── Helper: Add CORS headers (for local dev) ──
function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ============================================================
// Create the HTTP server
// ============================================================
const server = http.createServer(async (req, res) => {

    // Add CORS headers to every response
    setCORS(res);

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams);

    // ────────────────────────────────────────
    // API Routes — all start with /api/
    // ────────────────────────────────────────
    if (pathname.startsWith('/api/')) {

        try {
            // ── POST endpoints ──
            if (req.method === 'POST') {
                const body = await readBody(req);

                switch (pathname) {
                    case '/api/register': return await routes.handleRegister(req, res, body);
                    case '/api/login': return await routes.handleLogin(req, res, body);
                    case '/api/save-session': return await routes.handleSaveSession(req, res, body);
                    case '/api/create-room': return await routes.handleCreateRoom(req, res, body);
                    case '/api/join-room': return await routes.handleJoinRoom(req, res, body);
                    case '/api/submit-match': return await routes.handleSubmitMatch(req, res, body);
                    default:
                        return sendError(res, 404, 'API endpoint not found');
                }
            }

            // ── GET endpoints ──
            if (req.method === 'GET') {
                switch (pathname) {
                    case '/api/words': return await routes.handleGetWords(req, res, query);
                    case '/api/history': return await routes.handleGetHistory(req, res, query);
                    case '/api/leaderboard': return await routes.handleLeaderboard(req, res);
                    case '/api/users': return await routes.handleGetUsers(req, res);
                    case '/api/room-status': return await routes.handleRoomStatus(req, res, query);
                    default:
                        return sendError(res, 404, 'API endpoint not found');
                }
            }

            return sendError(res, 405, 'Method not allowed');

        } catch (err) {
            console.error('API Error:', err);
            return sendError(res, 500, 'Internal server error');
        }
    }

    // ────────────────────────────────────────
    // Static File Serving — serves frontend files
    // ────────────────────────────────────────
    let filePath = pathname === '/' ? '/index.html' : pathname;

    // Security: prevent directory traversal
    filePath = path.normalize(filePath);
    if (filePath.includes('..')) {
        return sendError(res, 403, 'Forbidden');
    }

    // Don't serve backend files
    if (filePath.startsWith('/backend')) {
        return sendError(res, 403, 'Forbidden');
    }

    const fullPath = path.join(FRONTEND_DIR, filePath);
    const ext = path.extname(fullPath).toLowerCase();

    // Check if file exists and serve it
    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end('<h1>404 — Not Found</h1>');
        }

        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(fullPath).pipe(res);
    });
});

// ============================================================
// WebSocket Server — Real-time multiplayer updates
// ============================================================
// The WebSocket server is attached to the same HTTP server.
// It handles real-time progress updates during multiplayer matches.
// ============================================================

const wss = new WebSocket.Server({ server });

// Track all connected clients by room code
// Structure: { roomCode: { userId: ws, ... } }
const rooms = {};

// Track all globally connected users for invitations
const globalUsers = new Map(); // userId -> { ws, username }

// ── Broadcast to all globally connected users ──
function broadcastGlobal(data, excludeUserId = null) {
    const message = JSON.stringify(data);
    globalUsers.forEach((info, uid) => {
        if (uid == excludeUserId) return;
        if (info.ws.readyState === WebSocket.OPEN) {
            info.ws.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    let currentRoom = null;
    let currentUserId = null;

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw);

            switch (msg.type) {

                // ── Global authentication for invitations ──
                case 'global-auth': {
                    const { userId, username } = msg;
                    currentUserId = userId;
                    globalUsers.set(userId, { ws, username });

                    // Broadcast that someone came online
                    broadcastGlobal({
                        type: 'user-status',
                        userId,
                        status: 'online'
                    }, userId);

                    // Send list of currently online users to the new connector
                    const onlineIds = Array.from(globalUsers.keys());
                    ws.send(JSON.stringify({
                        type: 'init-status',
                        onlineIds
                    }));
                    break;
                }

                // ── Send Invite to a user ──
                case 'invite': {
                    const { toUserId, fromUsername, roomCode } = msg;
                    const target = globalUsers.get(toUserId);
                    if (target && target.ws.readyState === WebSocket.OPEN) {
                        target.ws.send(JSON.stringify({
                            type: 'invited',
                            fromUsername,
                            roomCode
                        }));
                    }
                    break;
                }

                // ── Player joins a room for real-time updates ──
                case 'join-room': {
                    const { roomCode, userId, username } = msg;
                    currentRoom = roomCode;
                    currentUserId = userId;

                    if (!rooms[roomCode]) rooms[roomCode] = {};
                    rooms[roomCode][userId] = { ws, username };

                    // Notify all players in the room
                    broadcastToRoom(roomCode, {
                        type: 'player-joined',
                        userId,
                        username,
                        playerCount: Object.keys(rooms[roomCode]).length
                    });
                    break;
                }

                // ── Real-time progress update (WPM, position) ──
                case 'progress': {
                    const { roomCode, userId, wpm, accuracy, progress, username } = msg;
                    broadcastToRoom(roomCode, {
                        type: 'progress-update',
                        userId,
                        username,
                        wpm,
                        accuracy,
                        progress    // percentage of text completed
                    }, userId);     // exclude sender
                    break;
                }

                // ── Player finished the match ──
                case 'finished': {
                    const { roomCode, userId, wpm, accuracy, errors, username } = msg;
                    broadcastToRoom(roomCode, {
                        type: 'player-finished',
                        userId,
                        username,
                        wpm,
                        accuracy,
                        errors
                    });
                    break;
                }

                // ── Game starts (host triggers) ──
                case 'start-game': {
                    const { roomCode } = msg;
                    broadcastToRoom(roomCode, {
                        type: 'game-started'
                    });
                    break;
                }
            }

        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    });

    ws.on('close', () => {
        // Remove from global users and notify
        if (currentUserId && globalUsers.has(currentUserId)) {
            globalUsers.delete(currentUserId);
            broadcastGlobal({
                type: 'user-status',
                userId: currentUserId,
                status: 'offline'
            });
        }

        // Clean up when a player disconnects
        if (currentRoom && currentUserId && rooms[currentRoom]) {
            delete rooms[currentRoom][currentUserId];
            broadcastToRoom(currentRoom, {
                type: 'player-left',
                userId: currentUserId
            });
            // Remove empty rooms
            if (Object.keys(rooms[currentRoom]).length === 0) {
                delete rooms[currentRoom];
            }
        }
    });
});

// ── Broadcast a message to all players in a room ──
// excludeUserId: optionally skip sending to a specific player
function broadcastToRoom(roomCode, data, excludeUserId = null) {
    if (!rooms[roomCode]) return;
    const message = JSON.stringify(data);
    for (const [uid, info] of Object.entries(rooms[roomCode])) {
        if (uid == excludeUserId) continue;
        if (info.ws.readyState === WebSocket.OPEN) {
            info.ws.send(message);
        }
    }
}

// ============================================================
// Start the server
// ============================================================
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║     ⌨️  TypeRush Server is RUNNING            ║
║                                               ║
║     🌐 http://localhost:${PORT}               ║
║     🔌 WebSocket on same port                 ║
║                                               ║
║     API endpoints:                            ║
║       POST /api/register                      ║
║       POST /api/login                         ║
║       GET  /api/words?difficulty=easy         ║
║       POST /api/save-session                  ║
║       GET  /api/history?userId=1              ║
║       GET  /api/leaderboard                   ║
║       POST /api/create-room                   ║
║       POST /api/join-room                     ║
║       POST /api/submit-match                  ║
║       GET  /api/room-status?roomCode=ABC123   ║
╚═══════════════════════════════════════════════╝
    `);
});
