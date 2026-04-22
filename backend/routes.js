// ============================================================
// TypeRush — API Route Handlers
// ============================================================
// Each handler receives (req, res, body) where body is the
// parsed JSON request body (for POST). These are pure functions
// that talk to the database and return JSON responses.
// ============================================================

const pool = require('./db');
const bcrypt = require('bcrypt');

// ── Helper: Send JSON response ──
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// ────────────────────────────────────────────
// POST /api/register — Create a new account
// ────────────────────────────────────────────
async function handleRegister(req, res, body) {
    try {
        const { username, email, password } = body;

        // Validate required fields
        if (!username || !email || !password) {
            return sendJSON(res, 400, { error: 'Username, email and password are required' });
        }

        if (password.length < 6) {
            return sendJSON(res, 400, { error: 'Password must be at least 6 characters' });
        }

        // Check if user or email already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (existing.length > 0) {
            return sendJSON(res, 409, { error: 'Username or email already taken' });
        }

        // Hash password with bcrypt (10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into database
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        sendJSON(res, 201, {
            message: 'Registration successful',
            user: { id: result.insertId, username, email }
        });

    } catch (err) {
        console.error('Register error:', err);
        sendJSON(res, 500, { error: 'Server error during registration' });
    }
}

// ────────────────────────────────────────────
// POST /api/login — Authenticate a user
// ────────────────────────────────────────────
async function handleLogin(req, res, body) {
    try {
        const { username, password } = body;

        if (!username || !password) {
            return sendJSON(res, 400, { error: 'Username and password are required' });
        }

        // Find user by username OR email
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (rows.length === 0) {
            return sendJSON(res, 401, { error: 'Invalid credentials' });
        }

        const user = rows[0];

        // Compare password with stored hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return sendJSON(res, 401, { error: 'Invalid credentials' });
        }

        sendJSON(res, 200, {
            message: 'Login successful',
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error('Login error:', err);
        sendJSON(res, 500, { error: 'Server error during login' });
    }
}

// ────────────────────────────────────────────
// GET /api/words?difficulty=easy|medium|hard
// Fetch words from DB filtered by difficulty
// ────────────────────────────────────────────
async function handleGetWords(req, res, query) {
    try {
        const difficulty = query.difficulty || 'medium';
        let minLen = 1, maxLen = 50;

        if (difficulty === 'easy') { minLen = 3; maxLen = 5; }
        if (difficulty === 'medium') { minLen = 5; maxLen = 8; }
        if (difficulty === 'hard') { minLen = 6; maxLen = 50; }

        const [rows] = await pool.query(
            'SELECT word FROM words WHERE length >= ? AND length <= ?',
            [minLen, maxLen]
        );

        const words = rows.map(r => r.word);
        sendJSON(res, 200, { words });

    } catch (err) {
        console.error('Get words error:', err);
        sendJSON(res, 500, { error: 'Failed to fetch words' });
    }
}

// ────────────────────────────────────────────
// POST /api/save-session — Save typing session
// ────────────────────────────────────────────
async function handleSaveSession(req, res, body) {
    try {
        const { userId, wpm, accuracy, errors, weakKeys, duration, keyStats } = body;

        if (!userId) {
            return sendJSON(res, 400, { error: 'userId is required' });
        }

        // Insert session record
        const weakKeysStr = weakKeys ? JSON.stringify(weakKeys) : '[]';
        await pool.query(
            'INSERT INTO sessions (user_id, wpm, accuracy, errors, weak_keys, duration) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, wpm || 0, accuracy || 0, errors || 0, weakKeysStr, duration || 60]
        );

        // Update key_stats — use INSERT ... ON DUPLICATE KEY UPDATE
        // This merges new stats with existing ones
        if (keyStats && typeof keyStats === 'object') {
            for (const [ch, stat] of Object.entries(keyStats)) {
                if (ch.length !== 1) continue; // skip invalid keys
                await pool.query(`
                    INSERT INTO key_stats (user_id, key_char, correct_count, error_count)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        correct_count = correct_count + VALUES(correct_count),
                        error_count   = error_count   + VALUES(error_count)
                `, [userId, ch, stat.correct || 0, stat.errors || 0]);
            }
        }

        sendJSON(res, 201, { message: 'Session saved successfully' });

    } catch (err) {
        console.error('Save session error:', err);
        sendJSON(res, 500, { error: 'Failed to save session' });
    }
}

// ────────────────────────────────────────────
// GET /api/history?userId=<id>
// Fetch user's session history
// ────────────────────────────────────────────
async function handleGetHistory(req, res, query) {
    try {
        const userId = query.userId;
        if (!userId) {
            return sendJSON(res, 400, { error: 'userId is required' });
        }

        // Get session history (latest 20)
        const [sessions] = await pool.query(
            'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId]
        );

        // Get key stats
        const [keyStats] = await pool.query(
            'SELECT key_char, correct_count, error_count FROM key_stats WHERE user_id = ?',
            [userId]
        );

        // Compute aggregated stats
        const [bestStats] = await pool.query(`
            SELECT
                MAX(wpm)      AS bestWpm,
                MAX(accuracy) AS bestAcc,
                COUNT(*)      AS totalSessions,
                SUM(duration) AS totalSeconds
            FROM sessions WHERE user_id = ?
        `, [userId]);

        const stats = bestStats[0] || {};

        sendJSON(res, 200, {
            sessions,
            keyStats,
            bestWpm: stats.bestWpm || 0,
            bestAcc: stats.bestAcc || 0,
            totalSessions: stats.totalSessions || 0,
            totalPracticeMinutes: Math.floor((stats.totalSeconds || 0) / 60)
        });

    } catch (err) {
        console.error('Get history error:', err);
        sendJSON(res, 500, { error: 'Failed to fetch history' });
    }
}

// ────────────────────────────────────────────
// GET /api/leaderboard — Global rankings
// ────────────────────────────────────────────
async function handleLeaderboard(req, res) {
    try {
        // Rank users by their best WPM across all sessions
        const [rows] = await pool.query(`
            SELECT
                u.id,
                u.username,
                MAX(s.wpm)       AS bestWpm,
                MAX(s.accuracy)  AS bestAcc,
                COUNT(s.id)      AS totalSessions
            FROM users u
            JOIN sessions s ON s.user_id = u.id
            GROUP BY u.id
            ORDER BY bestWpm DESC
            LIMIT 50
        `);

        sendJSON(res, 200, { leaderboard: rows });

    } catch (err) {
        console.error('Leaderboard error:', err);
        sendJSON(res, 500, { error: 'Failed to fetch leaderboard' });
    }
}

// ────────────────────────────────────────────
// GET /api/users — Fetch all users
// ────────────────────────────────────────────
async function handleGetUsers(req, res) {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.username, COALESCE(MAX(s.wpm), 0) as bestWpm
            FROM users u
            LEFT JOIN sessions s ON u.id = s.user_id
            GROUP BY u.id
            ORDER BY u.username ASC
        `);
        sendJSON(res, 200, { users });
    } catch (err) {
        console.error('Fetch users error:', err);
        sendJSON(res, 500, { error: 'Server error fetching users' });
    }
}

// ────────────────────────────────────────────
// POST /api/create-room — Create multiplayer room
// ────────────────────────────────────────────
async function handleCreateRoom(req, res, body) {
    try {
        const { userId, duration } = body;
        if (!userId) {
            return sendJSON(res, 400, { error: 'userId is required' });
        }

        const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
        let roomCode = generateRoomCode();

        // Generate the shared text for the match
        const dur = duration || 60;
        const [rows] = await pool.query('SELECT word FROM words ORDER BY RAND() LIMIT 30');
        const textContent = rows.map(r => r.word).join(' ');

        await pool.query(
            'INSERT INTO multiplayer_rooms (room_code, host_id, text_content, duration) VALUES (?, ?, ?, ?)',
            [roomCode, userId, textContent, dur]
        );

        sendJSON(res, 201, { roomCode, textContent, duration: dur });

    } catch (err) {
        console.error('Create room error:', err);
        sendJSON(res, 500, { error: 'Failed to create room' });
    }
}

// ────────────────────────────────────────────
// POST /api/join-room — Join a multiplayer room
// ────────────────────────────────────────────
async function handleJoinRoom(req, res, body) {
    try {
        const { userId, roomCode } = body;
        if (!userId || !roomCode) {
            return sendJSON(res, 400, { error: 'userId and roomCode are required' });
        }

        // Find the room
        const [rooms] = await pool.query(
            'SELECT * FROM multiplayer_rooms WHERE room_code = ? AND status = "waiting"',
            [roomCode]
        );

        if (rooms.length === 0) {
            return sendJSON(res, 404, { error: 'Room not found or already started' });
        }

        const room = rooms[0];

        // Prevent host from joining their own room
        if (room.host_id === parseInt(userId)) {
            return sendJSON(res, 400, { error: 'You cannot join your own room' });
        }

        // Set guest and change status to playing
        await pool.query(
            'UPDATE multiplayer_rooms SET guest_id = ?, status = "playing" WHERE id = ?',
            [userId, room.id]
        );

        sendJSON(res, 200, {
            message: 'Joined room successfully',
            roomId: room.id,
            roomCode: room.room_code,
            textContent: room.text_content,
            duration: room.duration,
            hostId: room.host_id
        });

    } catch (err) {
        console.error('Join room error:', err);
        sendJSON(res, 500, { error: 'Failed to join room' });
    }
}

// ────────────────────────────────────────────
// POST /api/submit-match — Submit match result
// ────────────────────────────────────────────
async function handleSubmitMatch(req, res, body) {
    try {
        const { roomCode, userId, wpm, accuracy, errors } = body;
        if (!roomCode || !userId) {
            return sendJSON(res, 400, { error: 'roomCode and userId are required' });
        }

        // Find the room
        const [rooms] = await pool.query(
            'SELECT * FROM multiplayer_rooms WHERE room_code = ?',
            [roomCode]
        );
        if (rooms.length === 0) {
            return sendJSON(res, 404, { error: 'Room not found' });
        }

        const room = rooms[0];

        // Save this player's result
        await pool.query(
            'INSERT INTO multiplayer_results (room_id, user_id, wpm, accuracy, errors) VALUES (?, ?, ?, ?, ?)',
            [room.id, userId, wpm || 0, accuracy || 0, errors || 0]
        );

        // Check if both players have submitted
        const [results] = await pool.query(
            'SELECT * FROM multiplayer_results WHERE room_id = ?',
            [room.id]
        );

        if (results.length === 2) {
            // Both done — determine the winner (higher WPM wins)
            const sorted = results.sort((a, b) => b.wpm - a.wpm);
            const winnerId = sorted[0].user_id;

            await pool.query(
                'UPDATE multiplayer_results SET is_winner = 1 WHERE room_id = ? AND user_id = ?',
                [room.id, winnerId]
            );
            await pool.query(
                'UPDATE multiplayer_rooms SET status = "finished" WHERE id = ?',
                [room.id]
            );

            // Also save as regular sessions for leaderboard
            for (const r of results) {
                await pool.query(
                    'INSERT INTO sessions (user_id, wpm, accuracy, errors, duration) VALUES (?, ?, ?, ?, ?)',
                    [r.user_id, r.wpm, r.accuracy, r.errors, room.duration]
                );
            }

            // Fetch usernames for display
            const [winner] = await pool.query('SELECT username FROM users WHERE id = ?', [winnerId]);

            sendJSON(res, 200, {
                finished: true,
                winner: winner[0]?.username || 'Unknown',
                winnerId,
                results: sorted
            });
        } else {
            sendJSON(res, 200, {
                finished: false,
                message: 'Waiting for opponent to finish'
            });
        }

    } catch (err) {
        console.error('Submit match error:', err);
        sendJSON(res, 500, { error: 'Failed to submit match result' });
    }
}

// ────────────────────────────────────────────
// GET /api/room-status?roomCode=<code>
// Check room status (for polling)
// ────────────────────────────────────────────
async function handleRoomStatus(req, res, query) {
    try {
        const roomCode = query.roomCode;
        if (!roomCode) {
            return sendJSON(res, 400, { error: 'roomCode is required' });
        }

        const [rooms] = await pool.query(
            'SELECT * FROM multiplayer_rooms WHERE room_code = ?',
            [roomCode]
        );
        if (rooms.length === 0) {
            return sendJSON(res, 404, { error: 'Room not found' });
        }

        const room = rooms[0];

        // Get results if any
        const [results] = await pool.query(`
            SELECT mr.*, u.username
            FROM multiplayer_results mr
            JOIN users u ON u.id = mr.user_id
            WHERE mr.room_id = ?
        `, [room.id]);

        // Get host username
        const [host] = await pool.query('SELECT username FROM users WHERE id = ?', [room.host_id]);

        // Get guest username
        let guestName = null;
        if (room.guest_id) {
            const [guest] = await pool.query('SELECT username FROM users WHERE id = ?', [room.guest_id]);
            guestName = guest[0]?.username || null;
        }

        sendJSON(res, 200, {
            roomCode: room.room_code,
            status: room.status,
            hostId: room.host_id,
            hostUsername: host[0]?.username || 'Unknown',
            guestId: room.guest_id,
            guestUsername: guestName,
            textContent: room.text_content,
            duration: room.duration,
            results
        });

    } catch (err) {
        console.error('Room status error:', err);
        sendJSON(res, 500, { error: 'Failed to fetch room status' });
    }
}

// Export all handlers
module.exports = {
    handleRegister,
    handleLogin,
    handleGetWords,
    handleSaveSession,
    handleGetHistory,
    handleLeaderboard,
    handleGetUsers,
    handleCreateRoom,
    handleJoinRoom,
    handleSubmitMatch,
    handleRoomStatus
};
