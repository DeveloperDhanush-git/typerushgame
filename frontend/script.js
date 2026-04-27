// ============================================================
// Words are now fetched from the backend API.
// This array is populated when the page loads via loadWordsFromServer().
// Falls back to a small built-in set if the server is unreachable.
// ============================================================
let SMART_WORDS = [
    "about", "action", "active", "balance", "beauty", "become", "camera",
    "change", "create", "damage", "design", "effect", "energy", "family",
    "follow", "future", "global", "handle", "health", "impact", "inside",
    "leader", "listen", "manage", "market", "nature", "normal", "object",
    "option", "people", "player", "quality", "random", "reason", "school",
    "simple", "source", "system", "travel", "update", "value", "world"
];

// Fetch words from backend and replace the fallback list
async function loadWordsFromServer(difficulty) {
    try {
        if (typeof fetchWords === 'function') {
            const words = await fetchWords(difficulty || 'medium');
            if (words && words.length > 0) {
                SMART_WORDS = words;
            }
        }
    } catch (err) {
        console.warn('Could not fetch words from server, using built-in fallback:', err.message);
    }
}



const KEYBOARD_LAYOUT = [
    [
        { key: '`', label: '`', type: 'sym', finger: 'pinky-l' },
        { key: '1', label: '1', type: 'sym', finger: 'pinky-l' },
        { key: '2', label: '2', type: 'sym', finger: 'ring-l' },
        { key: '3', label: '3', type: 'sym', finger: 'middle-l' },
        { key: '4', label: '4', type: 'sym', finger: 'index-l' },
        { key: '5', label: '5', type: 'sym', finger: 'index-l' },
        { key: '6', label: '6', type: 'sym', finger: 'index-r' },
        { key: '7', label: '7', type: 'sym', finger: 'index-r' },
        { key: '8', label: '8', type: 'sym', finger: 'middle-r' },
        { key: '9', label: '9', type: 'sym', finger: 'ring-r' },
        { key: '0', label: '0', type: 'sym', finger: 'pinky-r' },
        { key: '-', label: '-', type: 'sym', finger: 'pinky-r' },
        { key: '=', label: '=', type: 'sym', finger: 'pinky-r' },
        { key: 'backspace', label: 'Backspace', type: 'mod', flex: 1.5 }
    ],
    [
        { key: 'tab', label: 'Tab', type: 'mod', flex: 1.2 },
        { key: 'q', label: 'Q', finger: 'pinky-l' },
        { key: 'w', label: 'W', finger: 'ring-l' },
        { key: 'e', label: 'E', finger: 'middle-l' },
        { key: 'r', label: 'R', finger: 'index-l' },
        { key: 't', label: 'T', finger: 'index-l' },
        { key: 'y', label: 'Y', finger: 'index-r' },
        { key: 'u', label: 'U', finger: 'index-r' },
        { key: 'i', label: 'I', finger: 'middle-r' },
        { key: 'o', label: 'O', finger: 'ring-r' },
        { key: 'p', label: 'P', finger: 'pinky-r' },
        { key: '[', label: '[', type: 'sym', finger: 'pinky-r' },
        { key: ']', label: ']', type: 'sym', finger: 'pinky-r' },
        { key: '\\', label: '\\', type: 'sym', finger: 'pinky-r', flex: 1.3 }
    ],
    [
        { key: 'capslock', label: 'Caps Lock', type: 'mod', flex: 1.5 },
        { key: 'a', label: 'A', finger: 'pinky-l' },
        { key: 's', label: 'S', finger: 'ring-l' },
        { key: 'd', label: 'D', finger: 'middle-l' },
        { key: 'f', label: 'F', finger: 'index-l' },
        { key: 'g', label: 'G', finger: 'index-l' },
        { key: 'h', label: 'H', finger: 'index-r' },
        { key: 'j', label: 'J', finger: 'index-r' },
        { key: 'k', label: 'K', finger: 'middle-r' },
        { key: 'l', label: 'L', finger: 'ring-r' },
        { key: ';', label: ';', type: 'sym', finger: 'pinky-r' },
        { key: '\'', label: '\'', type: 'sym', finger: 'pinky-r' },
        { key: 'enter', label: 'Enter', type: 'mod', flex: 1.8 }
    ],
    [
        { key: 'shift-l', label: 'Shift', type: 'mod', flex: 2 },
        { key: 'z', label: 'Z', finger: 'pinky-l' },
        { key: 'x', label: 'X', finger: 'ring-l' },
        { key: 'c', label: 'C', finger: 'middle-l' },
        { key: 'v', label: 'V', finger: 'index-l' },
        { key: 'b', label: 'B', finger: 'index-l' },
        { key: 'n', label: 'N', finger: 'index-r' },
        { key: 'm', label: 'M', finger: 'index-r' },
        { key: ',', label: ',', type: 'sym', finger: 'middle-r' },
        { key: '.', label: '.', type: 'sym', finger: 'ring-r' },
        { key: '/', label: '/', type: 'sym', finger: 'pinky-r' },
        { key: 'shift-r', label: 'Shift', type: 'mod', flex: 2.2 }
    ],
    [
        { key: 'ctrl-l', label: 'Ctrl', type: 'mod', flex: 1.2 },
        { key: 'meta-l', label: 'Win', type: 'mod', flex: 1 },
        { key: 'alt-l', label: 'Alt', type: 'mod', flex: 1 },
        { key: ' ', label: '', type: 'space', finger: 'thumb', flex: 5 },
        { key: 'alt-r', label: 'Alt', type: 'mod', flex: 1 },
        { key: 'meta-r', label: 'Win', type: 'mod', flex: 1 },
        { key: 'menu', label: 'Menu', type: 'mod', flex: 1 },
        { key: 'ctrl-r', label: 'Ctrl', type: 'mod', flex: 1.2 }
    ]
];

let persistentData = {
    keyStats: {},
    bestWpm: 0,
    bestAcc: 0,
    totalPracticeMinutes: 0,
    totalSessions: 0,
    history: []
};

let gameState = {
    active: false,
    currentText: "",
    userInputBuffer: "",
    startTime: null,
    timerRemainingSec: 0,
    timerInterval: null,
    difficulty: "medium",
    selectedTimerSec: 60,
    correctChars: 0,
    errorCount: 0,
    keyStats: {},
    autoWeakKeys: null,
    currentError: false,
    currentErrorLogged: false
};

const autoWeakKeys = localStorage.getItem('auto_weak_keys');

if (autoWeakKeys) {
    gameState.autoWeakKeys = JSON.parse(autoWeakKeys);
    localStorage.removeItem('auto_weak_keys');
}


function loadFromLocalStorage() {
    // Load cached data from localStorage as a fallback
    const saved = localStorage.getItem('typemaster_pro');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            persistentData.keyStats = data.keyStats || {};
            persistentData.bestWpm = data.bestWpm || 0;
            persistentData.bestAcc = data.bestAcc || 0;
            persistentData.totalPracticeMinutes = data.totalPracticeMinutes || 0;
            persistentData.totalSessions = data.totalSessions || 0;
            persistentData.history = data.history || [];
        } catch (e) { }
    }
}

function saveToLocalStorage() {
    // Still save locally for offline access / quick reads
    localStorage.setItem('typemaster_pro', JSON.stringify({
        keyStats: persistentData.keyStats,
        bestWpm: persistentData.bestWpm,
        bestAcc: persistentData.bestAcc,
        totalPracticeMinutes: persistentData.totalPracticeMinutes,
        totalSessions: persistentData.totalSessions,
        history: persistentData.history
    }));

    // Also save to the server if logged in
    if (typeof saveSessionToServer === 'function' && typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) {
            // Server save happens in endPracticeSession directly
        }
    }
}

function updateKeyboardHighlight(currentChar, isError = false) {
    const allKeys = document.querySelectorAll('.key');
    allKeys.forEach(key => {
        key.classList.remove('active');
        key.classList.remove('error-key');
    });

    if (currentChar && currentChar !== ' ') {
        const targetKey = document.querySelector(`.key[data-key="${currentChar.toLowerCase()}"]`);
        if (targetKey) {
            targetKey.classList.add('active');
            if (isError) targetKey.classList.add('error-key');
        }
    }
}

function createKeyboard() {
    const rows = ['keyboardRow0', 'keyboardRow1', 'keyboardRow2', 'keyboardRow3', 'keyboardRow4'];

    KEYBOARD_LAYOUT.forEach((row, idx) => {
        const rowDiv = document.getElementById(rows[idx]);
        if (rowDiv) {
            rowDiv.innerHTML = row.map(k => {
                let w = k.flex ? `style="flex: ${k.flex};"` : '';
                let kClass = `key sys-${k.type || 'letter'} finger-${k.finger || 'none'}`;
                return `<div class="${kClass}" data-key="${k.key}" ${w}>${k.label}</div>`;
            }).join('');
        }
    });

    let weakKeys =
        (gameState.autoWeakKeys && gameState.autoWeakKeys.length > 0)
            ? gameState.autoWeakKeys
            : getAdaptiveWeakKeys();

    document.querySelectorAll('.key').forEach(key => {

        const keyChar = key.getAttribute('data-key');

        if (weakKeys.includes(keyChar))
            key.classList.add('weak');
    });
}

function getAdaptiveWeakKeys() {
    let weakSet = new Set();
    let combinedStats = {};

    for (let [key, stat] of Object.entries(persistentData.keyStats)) {
        combinedStats[key] = { correct: stat.correct, errors: stat.errors };
    }

    for (let [key, stat] of Object.entries(gameState.keyStats)) {
        if (!combinedStats[key]) combinedStats[key] = { correct: 0, errors: 0 };
        combinedStats[key].correct += stat.correct;
        combinedStats[key].errors += stat.errors;
    }

    for (let [key, stat] of Object.entries(combinedStats)) {
        let total = stat.correct + stat.errors;

        // A key is weak only when it has been pressed at least 4 times
        // AND has a 25%+ error rate. Pure percentage — no count-based fallback.
        const isWeak = total >= 4 && (stat.errors / total) >= 0.25;

        if (isWeak) weakSet.add(key);
    }
    return Array.from(weakSet);
}

function generateAdaptiveWord() {

    let weakKeys =
        (gameState.autoWeakKeys && gameState.autoWeakKeys.length > 0)
            ? gameState.autoWeakKeys
            : getAdaptiveWeakKeys();

    let candidates = [];

    if (weakKeys && weakKeys.length > 0) {

        SMART_WORDS.forEach(word => {

            let score = 0;

            weakKeys.forEach(k => {

                if (word.includes(k))
                    score++;

            });

            if (score >= 1)
                candidates.push(word);

        });

        candidates = candidates.filter(word => {

            if (gameState.difficulty === "easy")
                return word.length <= 5;

            if (gameState.difficulty === "medium")
                return word.length <= 8;

            return word.length >= 6;

        });

        if (candidates.length > 0) {
            return candidates[
                Math.floor(Math.random() * candidates.length)
            ] + " ";
        }
    }

    let fallback =
        SMART_WORDS.filter(word => {

            if (gameState.difficulty === "easy")
                return word.length <= 5;

            if (gameState.difficulty === "medium")
                return word.length <= 8;

            return word.length >= 6;

        });

    if (fallback.length === 0)
        fallback = SMART_WORDS;

    return fallback[
        Math.floor(Math.random() * fallback.length)
    ] + " ";

}

function buildPracticeText(wordCount = 12) {

    let words = [];

    for (let i = 0; i < wordCount; i++) {

        let w =
            generateAdaptiveWord().trim();

        if (!words.includes(w))
            words.push(w);
        else i--;

    }

    return words.join(" ");

}

function renderHighlightedText() {
    const target = gameState.currentText;
    const typed = gameState.userInputBuffer;
    let html = "";
    for (let i = 0; i < target.length; i++) {
        let cls = "";
        if (i < typed.length) cls = "char-correct";
        else if (i === typed.length) cls = gameState.currentError ? "char-incorrect char-current" : "char-current";

        let displayChar = target[i] === ' ' ? '·' : escapeHtml(target[i]);
        html += `<span class="${cls}">${displayChar}</span>`;
    }
    const displayDiv = document.getElementById('displayText');
    if (displayDiv) displayDiv.innerHTML = html;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = `${(typed.length / target.length) * 100}%`;

    const currentChar = typed.length < target.length ? target[typed.length] : null;
    updateKeyboardHighlight(currentChar, gameState.currentError);
}

function escapeHtml(s) {
    return s.replace(/[&<>]/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function updateLiveStats() {
    if (!gameState.active) return;
    const minutes = (Date.now() - gameState.startTime) / 60000;
    const typedLen = gameState.userInputBuffer.length;
    const wpm = Math.floor((typedLen / 5) / Math.max(0.01, minutes));
    const accuracy = (gameState.correctChars + gameState.errorCount) > 0 ? (gameState.correctChars / (gameState.correctChars + gameState.errorCount)) * 100 : 100;

    const wpmSpan = document.getElementById('statWpm');
    const accSpan = document.getElementById('statAcc');
    const errorsSpan = document.getElementById('statErrors');
    if (wpmSpan) wpmSpan.innerText = Math.min(300, wpm);
    if (accSpan) accSpan.innerText = Math.floor(accuracy);
    if (errorsSpan) errorsSpan.innerText = gameState.errorCount;
}

function updateKeyStatsLocal(character, isCorrect) {
    if (!character || character === ' ') return;
    const ch = character.toLowerCase();
    if (!gameState.keyStats[ch]) gameState.keyStats[ch] = { correct: 0, errors: 0 };
    if (isCorrect) gameState.keyStats[ch].correct += 1;
    else gameState.keyStats[ch].errors += 1;
}

function startTimer(seconds) {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerRemainingSec = seconds;
    updateTimerDisplay();
    gameState.timerInterval = setInterval(() => {
        if (!gameState.active) return;
        if (gameState.timerRemainingSec <= 1) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
            if (gameState.active) endPracticeSession();
        } else {
            gameState.timerRemainingSec--;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(gameState.timerRemainingSec / 60);
    const secs = gameState.timerRemainingSec % 60;
    const timerSpan = document.getElementById('timerDisplay');
    if (timerSpan) timerSpan.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleTyping(e) {
    if (!gameState.active) return;
    let input = e.target.value;
    const oldTyped = gameState.userInputBuffer;
    const target = gameState.currentText;

    if (input.length > oldTyped.length) {
        let addedChar = input[input.length - 1];
        let expectedChar = target[oldTyped.length];

        if (addedChar === expectedChar) {
            gameState.correctChars++;
            updateKeyStatsLocal(expectedChar, true);
            gameState.userInputBuffer += addedChar;
            gameState.currentError = false;
            gameState.currentErrorLogged = false;
        } else {
            if (!gameState.currentErrorLogged) {
                gameState.errorCount++;
                updateKeyStatsLocal(expectedChar, false);
                gameState.currentErrorLogged = true;
            }
            gameState.currentError = true;

            const displayDiv = document.getElementById('displayText');
            if (displayDiv) {
                displayDiv.classList.add('shake-effect');
                setTimeout(() => displayDiv.classList.remove('shake-effect'), 180);
            }
        }
    }

    e.target.value = gameState.userInputBuffer;

    renderHighlightedText();
    updateLiveStats();

    if (gameState.userInputBuffer.length === target.length && target.length > 0) {
        let newText = buildPracticeText(10);
        gameState.currentText = newText;
        gameState.userInputBuffer = "";
        const inputField = document.getElementById('userInput');
        if (inputField) inputField.value = "";
        gameState.currentError = false;
        gameState.currentErrorLogged = false;
        renderHighlightedText();
    }
}

function endPracticeSession() {
    if (!gameState.active) return;
    gameState.active = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    const inputField = document.getElementById('userInput');
    if (inputField) inputField.disabled = true;

    const totalTyped = gameState.correctChars + gameState.errorCount;
    const accuracy = totalTyped > 0 ? (gameState.correctChars / totalTyped) * 100 : 100;
    const minutesElapsed = (Date.now() - gameState.startTime) / 60000;
    const finalWpm = totalTyped > 0 ? Math.floor((totalTyped / 5) / Math.max(0.01, minutesElapsed)) : 0;
    const weakKeysNow = getAdaptiveWeakKeys();

    for (let [ch, stat] of Object.entries(gameState.keyStats)) {
        if (!persistentData.keyStats[ch]) persistentData.keyStats[ch] = { correct: 0, errors: 0 };
        persistentData.keyStats[ch].correct += stat.correct;
        persistentData.keyStats[ch].errors += stat.errors;
    }

    persistentData.totalPracticeMinutes += minutesElapsed;
    persistentData.totalSessions++;
    if (finalWpm > persistentData.bestWpm) persistentData.bestWpm = finalWpm;
    if (accuracy > persistentData.bestAcc) persistentData.bestAcc = accuracy;
    persistentData.history.push({
        wpm: finalWpm,
        acc: Math.floor(accuracy),
        errors: gameState.errorCount,
        date: new Date().toLocaleString(),
        weakKeys: weakKeysNow.slice(0, 4)
    });
    if (persistentData.history.length > 20) persistentData.history = persistentData.history.slice(-20);
    saveToLocalStorage();

    // ── Save session to server (if logged in) ──
    if (typeof saveSessionToServer === 'function' && typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) {
            saveSessionToServer({
                wpm: finalWpm,
                accuracy: Math.floor(accuracy),
                errors: gameState.errorCount,
                weakKeys: weakKeysNow.slice(0, 6),
                duration: gameState.selectedTimerSec,
                keyStats: gameState.keyStats
            }).catch(err => console.warn('Failed to save session to server:', err.message));
        }
    }

    const finalWpmSpan = document.getElementById('finalWpm');
    const finalAccSpan = document.getElementById('finalAcc');
    const finalErrorsSpan = document.getElementById('finalErrors');
    const weakKeysListSpan = document.getElementById('weakKeysList');
    const resultsModal = document.getElementById('resultsModal');

    if (finalWpmSpan) finalWpmSpan.innerText = finalWpm;
    if (finalAccSpan) finalAccSpan.innerText = Math.floor(accuracy);
    if (finalErrorsSpan) finalErrorsSpan.innerText = gameState.errorCount;
    if (weakKeysListSpan) weakKeysListSpan.innerText = weakKeysNow.slice(0, 6).join(', ') || "None";
    if (resultsModal) {
        resultsModal.style.visibility = "visible";
        resultsModal.style.opacity = "1";
    }
}

function startPractice() {

    if (gameState.active) {

        if (gameState.timerInterval)
            clearInterval(gameState.timerInterval);

    }

    let autoKeys =
        gameState.autoWeakKeys;

    const difficultySelect =
        document.getElementById('difficultySelect');

    const timerSelect =
        document.getElementById('timerSelect');

    gameState = {

        active: true,

        currentText: "",

        userInputBuffer: "",

        startTime: Date.now(),

        timerRemainingSec: 0,

        timerInterval: null,

        difficulty: difficultySelect ?
            difficultySelect.value :
            "medium",

        selectedTimerSec:
            timerSelect ?
                parseInt(timerSelect.value)
                : 60,

        correctChars: 0,

        errorCount: 0,

        keyStats: {},

        autoWeakKeys: autoKeys

    };

    gameState.currentText =
        buildPracticeText(12);

    const inputField =
        document.getElementById('userInput');

    if (inputField) {

        inputField.value = "";

        inputField.disabled = false;

        inputField.focus();

    }

    renderHighlightedText();

    startTimer(
        gameState.selectedTimerSec
    );

    updateLiveStats();

    createKeyboard();

}

function resetToMenu() {
    if (gameState.active) {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        gameState.active = false;
    }
    const inputField = document.getElementById('userInput');
    if (inputField) {
        inputField.disabled = true;
        inputField.value = "";
    }
    gameState.currentText = "";
    gameState.currentError = false;
    gameState.currentErrorLogged = false;
    const displayDiv = document.getElementById('displayText');
    if (displayDiv) {
        displayDiv.innerHTML = `<span style="color: var(--color-text-tertiary);">✨ Click START to begin practicing ✨</span>`;
    }
    const wpmSpan = document.getElementById('statWpm');
    const accSpan = document.getElementById('statAcc');
    const errorsSpan = document.getElementById('statErrors');
    const timerSpan = document.getElementById('timerDisplay');
    const progressFill = document.getElementById('progressFill');

    if (wpmSpan) wpmSpan.innerText = "0";
    if (accSpan) accSpan.innerText = "100";
    if (errorsSpan) errorsSpan.innerText = "0";
    if (timerSpan) timerSpan.innerText = "00:00";
    if (progressFill) progressFill.style.width = "0%";
}

document.addEventListener('DOMContentLoaded', async () => {
    loadFromLocalStorage();
    createKeyboard();
    resetToMenu();

    // Fetch words from server on page load
    await loadWordsFromServer('medium');

    const startBtn = document.getElementById('startPracticeBtn');
    const weakFocusBtn = document.getElementById('weakFocusBtn');
    const resetBtn = document.getElementById('resetToMenuBtn');
    const userInput = document.getElementById('userInput');
    const modalRestartBtn = document.getElementById('modalRestartBtn');
    const modalMenuBtn = document.getElementById('modalMenuBtn');

    if (startBtn) startBtn.addEventListener('click', startPractice);
    if (weakFocusBtn) {
        weakFocusBtn.addEventListener('click', () => {
            let weakKeys = getAdaptiveWeakKeys();
            if (weakKeys.length === 0) {
                alert(
                    "Complete one session first to detect weak keys"
                );
                return;
            }
            gameState.autoWeakKeys = [...weakKeys];
            alert(
                "Smart weak training activated"
            );
            createKeyboard();
            if (gameState.active) {
                gameState.currentText =
                    buildPracticeText(12);
                gameState.userInputBuffer = "";
                if (userInput)
                    userInput.value = "";
                renderHighlightedText();
            }
        });
    }
    if (resetBtn) resetBtn.addEventListener('click', resetToMenu);
    if (userInput) userInput.addEventListener('input', handleTyping);
    if (userInput) userInput.addEventListener('paste', (e) => e.preventDefault());
    if (modalRestartBtn) {
        modalRestartBtn.addEventListener('click', () => {
            const modal = document.getElementById('resultsModal');
            if (modal) {
                modal.style.visibility = "hidden";
                modal.style.opacity = "0";
            }
            startPractice();
        });
    }
    if (modalMenuBtn) {
        modalMenuBtn.addEventListener('click', () => {
            const modal = document.getElementById('resultsModal');
            if (modal) {
                modal.style.visibility = "hidden";
                modal.style.opacity = "0";
            }
            window.location.href = 'index.html';
        });
    }
});