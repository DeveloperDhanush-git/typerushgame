// ============================================================
// TypeRush — Database Setup Script
// ============================================================
// Run this ONCE to create the database, tables, and seed words.
//   Usage:  node setup-db.js
// ============================================================

const mysql = require('mysql2/promise');
const pool = require('./db');
const config = pool.dbConfig;

// ── The full SMART_WORDS list (moved from frontend) ──
const SMART_WORDS = [
    "about", "above", "accept", "across", "action", "active", "actual",
    "adapt", "adjust", "advance", "advice", "almost", "alone", "along",
    "already", "always", "amount", "animal", "answer", "anyone",
    "appear", "apply", "argue", "around", "arrive", "artist",
    "aspect", "assign", "assist", "assume", "attack", "attempt",
    "balance", "basic", "beauty", "become", "before", "begin",
    "behind", "belief", "believe", "benefit", "better", "beyond",
    "border", "branch", "bright", "broken", "budget", "build",
    "camera", "cancel", "career", "carry", "center", "chance",
    "change", "charge", "choice", "choose", "circle", "client",
    "closed", "closer", "coffee", "collect", "common", "compare",
    "complete", "complex", "concept", "confirm", "connect",
    "consider", "consist", "control", "correct", "create",
    "damage", "danger", "decide", "define", "degree", "deliver",
    "demand", "design", "detail", "develop", "device", "differ",
    "dinner", "direct", "discover", "discuss", "display",
    "distance", "doctor", "double", "dream",
    "eager", "early", "earth", "easily", "effect", "effort",
    "either", "elephant", "elite", "emerge", "emotion",
    "employ", "enable", "energy", "engine", "enjoy",
    "enough", "ensure", "enter", "entire", "equal",
    "escape", "estate", "ethics", "evening", "event",
    "every", "evolve", "exact", "example", "except",
    "excite", "exist", "expand", "expect", "expert",
    "explain", "explore", "express", "extend",
    "family", "famous", "feature", "federal", "feeling",
    "female", "figure", "finish", "follow", "force",
    "forest", "forget", "formal", "format", "former",
    "forward", "found", "freedom", "friend", "future",
    "general", "global", "golden", "ground", "growth",
    "handle", "happen", "health", "height", "honest",
    "impact", "improve", "include", "income",
    "increase", "indeed", "inside", "intend",
    "interest", "invest", "island",
    "journey", "justice",
    "knowledge",
    "language", "leader", "learn", "least", "leave",
    "legal", "lesson", "letter", "level", "likely",
    "listen", "little", "local", "longer", "look", "lower",
    "machine", "manage", "market", "matter", "maybe",
    "measure", "medium", "member", "memory",
    "mention", "method", "middle", "minute",
    "modern", "moment", "mother", "motion",
    "nation", "nature", "nearby", "nearly",
    "normal", "notice", "number",
    "object", "observe", "obtain", "occur",
    "offer", "office", "often", "online",
    "option", "order", "origin", "output",
    "panel", "paper", "parent", "people",
    "period", "person", "phrase", "planet",
    "player", "please", "policy", "popular",
    "position", "possible", "power",
    "prepare", "present", "prevent",
    "primary", "problem", "process",
    "produce", "product", "program",
    "project", "proper", "protect",
    "quality", "question", "quickly",
    "random", "rather", "reach", "ready",
    "reason", "record", "reduce",
    "refer", "region", "relate",
    "remain", "remove", "report",
    "require", "result", "return",
    "review", "right", "risk",
    "school", "science", "search",
    "season", "second", "secure",
    "select", "senior", "sense",
    "series", "serious", "serve",
    "service", "settle", "several",
    "simple", "single", "skill",
    "social", "source", "special",
    "speech", "spend", "square",
    "stable", "standard", "start",
    "state", "status", "store",
    "story", "street", "strong",
    "student", "study", "subject",
    "success", "sudden", "suffer",
    "supply", "support", "system",
    "table", "teacher", "team",
    "technology", "term", "test",
    "thank", "their", "theory",
    "thing", "think", "third",
    "those", "though", "threat",
    "through", "today", "toward",
    "trade", "travel", "treat",
    "trend", "trial", "trouble",
    "trust", "truth",
    "unable", "under", "union",
    "unique", "unless", "update",
    "upper", "useful", "usual",
    "value", "various", "vehicle",
    "version", "victory", "video",
    "view", "village", "visit",
    "visual", "voice",
    "wait", "walk", "want",
    "watch", "water", "wealth",
    "week", "weight", "welcome",
    "where", "which", "while",
    "white", "whole", "window",
    "within", "wonder", "world",
    "write", "writer",
    "yellow", "young",
    "zero", "zone"
];

async function setup() {
    // ── Step 1: Connect WITHOUT specifying a database so we can CREATE it ──
    const rootConn = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    console.log('✅ Connected to MySQL server');

    // ── Step 2: Create the database if it doesn't exist ──
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    console.log(`✅ Database "${config.database}" ready`);

    // Switch to the database
    await rootConn.query(`USE \`${config.database}\``);

    // ── Step 3: Create all tables ──

    // users — stores registered accounts
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS users (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            username    VARCHAR(50)  NOT NULL UNIQUE,
            email       VARCHAR(100) NOT NULL UNIQUE,
            password    VARCHAR(255) NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Table "users" created');

    // words — the word bank (moved from frontend JS)
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS words (
            id     INT AUTO_INCREMENT PRIMARY KEY,
            word   VARCHAR(50) NOT NULL UNIQUE,
            length INT NOT NULL
        )
    `);
    console.log('✅ Table "words" created');

    // sessions — each completed typing session
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            wpm        INT NOT NULL DEFAULT 0,
            accuracy   FLOAT NOT NULL DEFAULT 0,
            errors     INT NOT NULL DEFAULT 0,
            weak_keys  TEXT,
            duration   INT NOT NULL DEFAULT 60,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Table "sessions" created');

    // key_stats — per-user per-key accuracy data
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS key_stats (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL,
            key_char      CHAR(1) NOT NULL,
            correct_count INT NOT NULL DEFAULT 0,
            error_count   INT NOT NULL DEFAULT 0,
            UNIQUE KEY user_key (user_id, key_char),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Table "key_stats" created');

    // multiplayer_rooms — challenge rooms
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS multiplayer_rooms (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            room_code   VARCHAR(10) NOT NULL UNIQUE,
            host_id     INT NOT NULL,
            guest_id    INT DEFAULT NULL,
            text_content TEXT NOT NULL,
            duration    INT NOT NULL DEFAULT 60,
            status      ENUM('waiting','playing','finished') DEFAULT 'waiting',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log('✅ Table "multiplayer_rooms" created');

    // multiplayer_results — match outcomes
    await rootConn.query(`
        CREATE TABLE IF NOT EXISTS multiplayer_results (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            room_id     INT NOT NULL,
            user_id     INT NOT NULL,
            wpm         INT NOT NULL DEFAULT 0,
            accuracy    FLOAT NOT NULL DEFAULT 0,
            errors      INT NOT NULL DEFAULT 0,
            is_winner   TINYINT(1) DEFAULT 0,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Table "multiplayer_results" created');

    // ── Step 4: Seed words table ──
    // Use INSERT IGNORE so re-running the script won't cause duplicates
    const wordValues = SMART_WORDS.map(w => `('${w}', ${w.length})`).join(',\n');
    await rootConn.query(`INSERT IGNORE INTO words (word, length) VALUES ${wordValues}`);
    console.log(`✅ Seeded ${SMART_WORDS.length} words into "words" table`);

    await rootConn.end();
    console.log('\n🎉 Database setup complete! You can now start the server with: node server.js');
}

setup().catch(err => {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
});
