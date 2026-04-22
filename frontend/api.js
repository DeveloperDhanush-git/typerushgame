// ============================================================
// TypeRush — Frontend API Helper
// ============================================================
// Centralized API calls to the backend.
// All pages include this file to communicate with the server.
// Also handles user session management (stored in localStorage).
// ============================================================

const API_BASE = '/api';

// Online user tracking
let onlineUsers = new Set();

// ── Toast Notification System ──
function showToast(title, desc, type = 'invite', onAccept = null) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    let actionsHtml = '';
    if (type === 'invite') {
        actionsHtml = `
            <div class="toast-actions">
                <button class="toast-btn toast-btn-primary" id="toastAccept">Accept</button>
                <button class="toast-btn toast-btn-secondary" id="toastDecline">Decline</button>
            </div>
        `;
    }

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${desc}</div>
            ${actionsHtml}
        </div>
    `;

    container.appendChild(toast);

    if (type === 'invite') {
        toast.querySelector('#toastAccept').onclick = () => {
            if (onAccept) onAccept();
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        };
        toast.querySelector('#toastDecline').onclick = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        };
    } else {
        // Auto remove for info toasts
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// ── API Helper: Make fetch requests ──
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data;
}

// ── User Session Management ──
// We store logged-in user info in localStorage
function setCurrentUser(user) {
    localStorage.setItem('typerush_user', JSON.stringify(user));
}

function getCurrentUser() {
    const saved = localStorage.getItem('typerush_user');
    if (!saved) return null;
    try { return JSON.parse(saved); }
    catch { return null; }
}

function logoutUser() {
    localStorage.removeItem('typerush_user');
    window.location.href = 'login.html';
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ── Auth API calls ──
async function registerUser(username, email, password) {
    const data = await apiCall('/register', 'POST', { username, email, password });
    return data;
}

async function loginUser(username, password) {
    const data = await apiCall('/login', 'POST', { username, password });
    // Save user session locally
    setCurrentUser(data.user);
    return data;
}

// ── Words API ──
async function fetchWords(difficulty = 'medium') {
    const data = await apiCall(`/words?difficulty=${difficulty}`);
    return data.words;
}

// ── Users (Friends) API ──
async function fetchUsers() {
    const data = await apiCall('/users');
    return data.users;
}

// ── Session API ──
async function saveSessionToServer(sessionData) {
    const user = getCurrentUser();
    if (!user) return;
    return await apiCall('/save-session', 'POST', {
        userId: user.id,
        ...sessionData
    });
}

async function fetchHistory() {
    const user = getCurrentUser();
    if (!user) return null;
    return await apiCall(`/history?userId=${user.id}`);
}

// ── Leaderboard API ──
async function fetchLeaderboard() {
    return await apiCall('/leaderboard');
}

// ── Multiplayer API ──
async function createRoom(duration = 60) {
    const user = getCurrentUser();
    if (!user) throw new Error('Must be logged in');
    return await apiCall('/create-room', 'POST', { userId: user.id, duration });
}

async function joinRoom(roomCode) {
    const user = getCurrentUser();
    if (!user) throw new Error('Must be logged in');
    return await apiCall('/join-room', 'POST', { userId: user.id, roomCode });
}

async function submitMatchResult(roomCode, wpm, accuracy, errors) {
    const user = getCurrentUser();
    if (!user) throw new Error('Must be logged in');
    return await apiCall('/submit-match', 'POST', {
        roomCode,
        userId: user.id,
        wpm,
        accuracy,
        errors
    });
}

async function getRoomStatus(roomCode) {
    return await apiCall(`/room-status?roomCode=${roomCode}`);
}

// ── WebSocket Connection for Multiplayer ──
function connectToRoom(roomCode, onMessage) {
    const user = getCurrentUser();
    if (!user) return null;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'join-room',
            roomCode,
            userId: user.id,
            username: user.username
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket disconnected');

    return ws;
}

// ── Helper: Send progress via WebSocket ──
function sendProgress(ws, roomCode, wpm, accuracy, progress) {
    const user = getCurrentUser();
    if (!user || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
        type: 'progress',
        roomCode,
        userId: user.id,
        username: user.username,
        wpm,
        accuracy,
        progress
    }));
}

// ── Helper: Send finished event via WebSocket ──
function sendFinished(ws, roomCode, wpm, accuracy, errors) {
    const user = getCurrentUser();
    if (!user || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
        type: 'finished',
        roomCode,
        userId: user.id,
        username: user.username,
        wpm,
        accuracy,
        errors
    }));
}

// ── Helper: Start game via WebSocket ──
function sendStartGame(ws, roomCode) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
        type: 'start-game',
        roomCode
    }));
}

// ── Global WebSocket (for invitations) ──
let globalWs = null;

function initGlobalWebSocket() {
    const user = getCurrentUser();
    if (!user) return;

    // Do not initialize global WS if already in a multiplayer room (which uses connectToRoom)
    if (window.location.pathname.includes('multiplayer.html')) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    globalWs = new WebSocket(`${protocol}//${window.location.host}`);

    globalWs.onopen = () => {
        globalWs.send(JSON.stringify({
            type: 'global-auth',
            userId: user.id,
            username: user.username
        }));
    };

    globalWs.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'init-status') {
            onlineUsers = new Set(data.onlineIds);
            loadFriendsDrawer();
        } else if (data.type === 'user-status') {
            if (data.status === 'online') {
                onlineUsers.add(data.userId);
            } else {
                onlineUsers.delete(data.userId);
            }
            loadFriendsDrawer();
        } else if (data.type === 'invited') {
            showToast(
                'Game Challenge!',
                `${data.fromUsername} nominated you for a typing match.`,
                'invite',
                () => {
                    window.location.href = `multiplayer.html?room=${data.roomCode}`;
                }
            );
        }
    };
}

// Helper: send invite
async function sendInvite(toUserId) {
    const user = getCurrentUser();
    if (!user) {
        alert('You must be logged in to invite.');
        return;
    }

    // 1. Create a room
    let room;
    try {
        room = await createRoom(60);
    } catch (e) {
        alert('Failed to create room: ' + e.message);
        return;
    }

    // 2. Send invite via global WS
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
        globalWs.send(JSON.stringify({
            type: 'invite',
            toUserId: toUserId,
            fromUsername: user.username,
            roomCode: room.roomCode
        }));

        // 3. Jump to multiplayer page
        window.location.href = `multiplayer.html?room=${room.roomCode}&role=host`;
    } else {
        alert('Not connected to real-time server.');
    }
}
// ── Global UI Updates (Auth Nav) ──
window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'login.html'; // Default to login if root

    const isGuestPage = page === 'login.html' || page === 'register.html';
    const loggedIn = isLoggedIn();

    // 🔒 Auth Guard: Redirect to login if not authenticated
    if (!loggedIn && !isGuestPage) {
        window.location.href = 'login.html';
        return;
    }

    // 🔓 Guest Guard: Redirect to index if already logged in and visiting login/register
    if (loggedIn && isGuestPage) {
        window.location.href = 'index.html';
        return;
    }

    let nav = document.querySelector('.topbar-nav');
    let isHomeNav = false;

    // Support index.html navbar which has a different class and links
    if (!nav) {
        nav = document.querySelector('.home-topnav');
        isHomeNav = !!nav;
    }

    if (nav) {
        // Hide navbar completely on auth pages
        if (isGuestPage) {
            nav.style.display = 'none';
            return;
        }

        const navLinks = [
            { id: 'tnHome', href: 'index.html', text: 'Home' },
            { id: 'tnPractice', href: 'practice.html', text: 'Practice' },
            { id: 'tnWeakKeys', href: 'weak-keys.html', text: 'Weak Keys' },
            { id: 'tnDashboard', href: 'dashboard.html', text: 'Dashboard' },
            { id: 'tnLeaderboard', href: 'leaderboard.html', text: 'Leaderboard' },
            { id: 'tnMulti', href: 'multiplayer.html', text: 'Multiplayer' },
        ];

        const linkClass = isHomeNav ? 'topnav-link' : 'topbar-nav-link';
        let navHTML = '';

        navLinks.forEach(link => {
            const isActive = (page === link.href || (page === '' && link.href === 'index.html'));
            const activeClass = isActive && !isHomeNav ? ' active' : ''; // home-topnav didn't use active initially, but we allow it
            const ariaCurrent = isActive ? ' aria-current="page"' : '';
            navHTML += `<a href="${link.href}" class="${linkClass}${activeClass}" id="${link.id}"${ariaCurrent}>${link.text}</a>`;
        });

        // Add correct auth elements
        if (isLoggedIn()) {
            navHTML += `<a href="#" class="${linkClass}" id="tnLogout">Logout</a>`;
        } else {
            navHTML += `<a href="login.html" class="${linkClass}">Login</a>`;
            navHTML += `<a href="register.html" class="${linkClass}">Register</a>`;
        }

        nav.innerHTML = navHTML;

        // Attach event listener to Logout button
        const logoutBtn = document.getElementById('tnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
    }

    // Initialize global presence and load friends wrapper
    if (isLoggedIn()) {
        initGlobalWebSocket();
        loadFriendsDrawer();
    }
});

// ── Populate Friends Drawer ──
async function loadFriendsDrawer() {
    const friendsList = document.querySelector('.friends-list');
    if (!friendsList) return;

    try {
        const users = await fetchUsers();
        const currentUser = getCurrentUser();

        let html = '';
        users.forEach(u => {
            // Don't show self
            if (currentUser && u.id === currentUser.id) return;

            const isOnline = onlineUsers.has(u.id);
            const statusLabel = isOnline ? 'Online' : 'Offline';
            const statusClass = isOnline ? 'status-indicator-online' : 'status-indicator-offline';
            const statusTextClass = isOnline ? 'online' : 'offline';

            // Avatars generated randomly based on ID
            const avatars = ['🧑', '👩', '🤓', '😎', '🤖', '👾'];
            const avatar = avatars[u.id % avatars.length];

            html += `
            <div class="friend-item">
                <span class="friend-avatar">${avatar}</span>
                <div class="friend-info">
                    <div class="friend-name">${u.username}</div>
                    <div class="friend-status ${statusTextClass}">
                        <span class="status-pill ${statusClass}"></span>
                        ${statusLabel}
                    </div>
                </div>
                <div class="friend-wpm">${u.bestWpm} WPM</div>
                <button class="invite-btn" 
                        onclick="sendInvite(${u.id})" 
                        ${!isOnline ? 'disabled' : ''}
                        style="background:${isOnline ? 'var(--color-accent-blue)' : '#ccc'}; 
                               padding:4px 10px; font-size:12px; color:#fff; border-radius:4px; 
                               border:none; cursor:${isOnline ? 'pointer' : 'not-allowed'}; 
                               margin-left:8px; font-weight:700;">
                    Invite
                </button>
            </div>
            `;
        });

        if (html === '') {
            html = '<p style="padding:1rem; opacity:0.7; text-align:center;">No players found.</p>';
        }

        friendsList.innerHTML = html;
    } catch (e) {
        console.error('Failed to load friends:', e);
    }
}
