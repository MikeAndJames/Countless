/**
 * ===================================================================
 * COUNTLESS - GAME ENGINE (JAVASCRIPT)
 * Saved Words Notepad & Declaration Selection Phase
 * ===================================================================
 * Notes for Mike & James:
 * 1. `savedWords`: Array storing all words saved during the 30-second clock.
 * 2. Timer Expiration: Auto-saves whatever word is currently sitting in the rack.
 * 3. Declaration Phase: Player chooses their final declared word from their saved notepad!
 */

const VOWELS = ['A','A','A','A','A','E','E','E','E','E','E','E','I','I','I','I','O','O','O','O','U','U'];
const CONSONANTS = ['B','C','D','D','F','G','H','J','K','L','L','M','N','N','P','Q','R','R','S','S','T','T','V','W','X','Y','Z'];

const gameState = {
    topLetters: [],       // Objects: { id, char, used: boolean }
    bottomRack: [null, null, null, null, null, null, null, null, null],
    savedWords: [],       // List of strings saved during 30s round
    timerInterval: null,
    remainingSeconds: 30,
    isTimerRunning: false,
    audioCtx: null
};

let dom = {};

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    attachEvents();
    startNewRound();
});

function initDOM() {
    dom = {
        timerDigits: document.getElementById('timerDigits'),
        btnNewRound: document.getElementById('btnNewRound'),
        btnShuffle: document.getElementById('btnShuffle'),
        topLettersRow: document.getElementById('topLettersRow'),
        bottomWordRow: document.getElementById('bottomWordRow'),
        wordLengthLabel: document.getElementById('wordLengthLabel'),
        btnClear: document.getElementById('btnClear'),
        btnSaveWord: document.getElementById('btnSaveWord'),
        savedWordsList: document.getElementById('savedWordsList'),
        declarationSection: document.getElementById('declarationSection'),
        declarationOptions: document.getElementById('declarationOptions'),
        resultBox: document.getElementById('resultBox'),
        resultTitle: document.getElementById('resultTitle'),
        resultScore: document.getElementById('resultScore'),
        resultDef: document.getElementById('resultDef'),
        btnToggleAI: document.getElementById('btnToggleAI'),
        aiResults: document.getElementById('aiResults'),
        aiList: document.getElementById('aiList')
    };
}

function attachEvents() {
    dom.btnNewRound.addEventListener('click', startNewRound);
    dom.btnShuffle.addEventListener('click', shuffleTopLetters);
    dom.btnClear.addEventListener('click', clearWordRack);
    dom.btnSaveWord.addEventListener('click', saveCurrentWordToNotepad);
    dom.btnToggleAI.addEventListener('click', toggleAISolver);
}

// ===================================================================
// ROUND DEAL & SHUFFLE
// ===================================================================

function startNewRound() {
    stopTimer();
    
    // Pick 4 Vowels & 5 Consonants
    const letters = [];
    for (let i = 0; i < 4; i++) letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
    for (let i = 0; i < 5; i++) letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
    fisherYatesShuffle(letters);

    gameState.topLetters = letters.map((char, index) => ({
        id: index,
        char: char,
        used: false
    }));

    gameState.bottomRack = [null, null, null, null, null, null, null, null, null];
    gameState.savedWords = [];

    // Reset UI sections
    dom.savedWordsList.innerHTML = `<span class="notepad-placeholder">No words saved yet. Build a word and tap "+ SAVE WORD"!</span>`;
    dom.declarationSection.classList.add('hidden');
    dom.resultBox.classList.add('hidden');
    dom.aiResults.classList.add('hidden');
    dom.btnToggleAI.textContent = "💡 SHOW MAX POSSIBLE WORDS & DEFINITION";
    dom.btnSaveWord.disabled = false;
    dom.btnClear.disabled = false;

    renderGridUI();
    resetAndStartTimer();
    playSound(520, 0.08);
}

function shuffleTopLetters() {
    const unusedIndices = [];
    gameState.topLetters.forEach((item, index) => {
        if (!item.used) unusedIndices.push(index);
    });

    if (unusedIndices.length < 2) return;

    const charsToShuffle = unusedIndices.map(idx => gameState.topLetters[idx].char);
    fisherYatesShuffle(charsToShuffle);

    unusedIndices.forEach((idx, i) => {
        gameState.topLetters[idx].char = charsToShuffle[i];
    });

    renderGridUI();
    playSound(700, 0.05);
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ===================================================================
// GRID UI RENDER & INTERACTION
// ===================================================================

function renderGridUI() {
    // 1. Top Letters
    dom.topLettersRow.innerHTML = '';
    gameState.topLetters.forEach((item) => {
        const tile = document.createElement('div');
        tile.className = `tile top-tile ${item.used ? 'used' : ''}`;
        tile.textContent = item.char;

        if (!item.used && gameState.isTimerRunning) {
            tile.addEventListener('click', () => pickTopTile(item.id));
        }

        dom.topLettersRow.appendChild(tile);
    });

    // 2. Bottom Word Rack
    dom.bottomWordRow.innerHTML = '';
    let wordLen = 0;

    gameState.bottomRack.forEach((item, slotIndex) => {
        const slot = document.createElement('div');
        if (item) {
            slot.className = 'tile bottom-slot filled';
            slot.textContent = item.char;
            if (gameState.isTimerRunning) {
                slot.addEventListener('click', () => returnBottomTile(slotIndex));
            }
            wordLen++;
        } else {
            slot.className = 'tile bottom-slot';
            slot.textContent = '';
        }
        dom.bottomWordRow.appendChild(slot);
    });

    dom.wordLengthLabel.textContent = `${wordLen} / 9`;
}

function pickTopTile(id) {
    const tileItem = gameState.topLetters.find(t => t.id === id);
    if (!tileItem || tileItem.used) return;

    const firstEmptyIndex = gameState.bottomRack.findIndex(slot => slot === null);
    if (firstEmptyIndex === -1) return;

    tileItem.used = true;
    gameState.bottomRack[firstEmptyIndex] = tileItem;

    renderGridUI();
    playSound(600, 0.04);
}

function returnBottomTile(slotIndex) {
    const tileItem = gameState.bottomRack[slotIndex];
    if (!tileItem) return;

    tileItem.used = false;
    gameState.bottomRack[slotIndex] = null;

    renderGridUI();
    playSound(440, 0.04);
}

function clearWordRack() {
    gameState.topLetters.forEach(item => item.used = false);
    gameState.bottomRack = [null, null, null, null, null, null, null, null, null];
    renderGridUI();
    playSound(350, 0.05);
}

// ===================================================================
// SAVED WORDS NOTEPAD LOGIC
// ===================================================================

/**
 * Save currently built word to notepad chips list
 */
function saveCurrentWordToNotepad() {
    const wordChars = gameState.bottomRack
        .filter(item => item !== null)
        .map(item => item.char);

    if (wordChars.length === 0) return;

    const word = wordChars.join('');

    // Add to savedWords list if not already present
    if (!gameState.savedWords.includes(word)) {
        gameState.savedWords.push(word);
        renderNotepadChips();
        playSound(750, 0.08);
    }

    // Clear rack so player can try to build another word!
    clearWordRack();
}

function renderNotepadChips() {
    if (gameState.savedWords.length === 0) {
        dom.savedWordsList.innerHTML = `<span class="notepad-placeholder">No words saved yet. Build a word and tap "+ SAVE WORD"!</span>`;
        return;
    }

    dom.savedWordsList.innerHTML = '';
    gameState.savedWords.forEach((word) => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.innerHTML = `${word} <span class="chip-len">${word.length}</span>`;
        dom.savedWordsList.appendChild(chip);
    });
}

// ===================================================================
// TIMER EXPIRATION & FINAL WORD DECLARATION PHASE
// ===================================================================

function resetAndStartTimer() {
    stopTimer();
    gameState.remainingSeconds = 30;
    dom.timerDigits.textContent = '30';
    dom.timerDigits.classList.remove('warning');

    gameState.isTimerRunning = true;
    gameState.timerInterval = setInterval(() => {
        gameState.remainingSeconds--;
        dom.timerDigits.textContent = String(gameState.remainingSeconds).padStart(2, '0');

        if (gameState.remainingSeconds <= 10) {
            dom.timerDigits.classList.add('warning');
        }

        if (gameState.remainingSeconds % 2 === 0) {
            playSound(750, 0.03);
        } else {
            playSound(550, 0.03);
        }

        if (gameState.remainingSeconds <= 0) {
            onTimerExpired();
        }
    }, 1000);
}

function stopTimer() {
    gameState.isTimerRunning = false;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

/**
 * Triggered when 30-second timer hits 0
 */
function onTimerExpired() {
    stopTimer();
    playSound(300, 0.8);

    // Auto-save word sitting in rack if any
    const rackChars = gameState.bottomRack.filter(item => item !== null).map(item => item.char);
    if (rackChars.length > 0) {
        const rackWord = rackChars.join('');
        if (!gameState.savedWords.includes(rackWord)) {
            gameState.savedWords.push(rackWord);
            renderNotepadChips();
        }
    }

    // Disable further editing during declaration
    dom.btnSaveWord.disabled = true;
    dom.btnClear.disabled = true;
    renderGridUI();

    // Trigger Declaration Phase UI
    showDeclarationPhase();
}

/**
 * Show list of saved words for player to pick as final entry
 */
function showDeclarationPhase() {
    dom.declarationSection.classList.remove('hidden');
    dom.declarationOptions.innerHTML = '';

    if (gameState.savedWords.length === 0) {
        dom.declarationOptions.innerHTML = `<button class="decl-btn" onclick="selectDeclaredWord('')">❌ NO WORD SAVED (0 PTS)</button>`;
        return;
    }

    gameState.savedWords.forEach((word) => {
        const btn = document.createElement('button');
        btn.className = 'decl-btn';
        btn.innerHTML = `⭐ DECLARE "${word}" <span class="chip-len">${word.length} PTS</span>`;
        btn.addEventListener('click', () => selectDeclaredWord(word));
        dom.declarationOptions.appendChild(btn);
    });
}

/**
 * Player selects their final declared word from the notepad list!
 */
function selectDeclaredWord(word) {
    dom.declarationSection.classList.add('hidden');

    if (!word) {
        dom.resultBox.classList.remove('hidden');
        dom.resultBox.classList.add('invalid');
        dom.resultTitle.textContent = `NO WORD DECLARED`;
        dom.resultScore.textContent = `0 PTS`;
        dom.resultDef.textContent = `No word was saved during the 30-second timer.`;
        return;
    }

    const isValid = window.dictionaryEngine.isValidWord(word);
    const definition = window.dictionaryEngine.getDefinition(word);
    let score = isValid ? ((word.length === 9) ? 18 : word.length) : 0;

    dom.resultBox.classList.remove('hidden');
    if (isValid) {
        dom.resultBox.classList.remove('invalid');
        dom.resultTitle.textContent = `DECLARED WORD: "${word}"`;
        dom.resultScore.textContent = `${score} PTS`;
        dom.resultDef.textContent = `Definition: ${definition}`;
        playSound(880, 0.25);
    } else {
        dom.resultBox.classList.add('invalid');
        dom.resultTitle.textContent = `INVALID: "${word}"`;
        dom.resultScore.textContent = `0 PTS`;
        dom.resultDef.textContent = `"${word}" was not found in the dictionary.`;
        playSound(220, 0.3);
    }
}

// Global scope helper for empty state
window.selectDeclaredWord = selectDeclaredWord;

// ===================================================================
// AI MAX WORD SOLVER
// ===================================================================

function toggleAISolver() {
    const isHidden = dom.aiResults.classList.contains('hidden');

    if (isHidden) {
        const topChars = gameState.topLetters.map(item => item.char);
        const bestWords = window.dictionaryEngine.findBestWords(topChars);
        dom.aiList.innerHTML = '';

        if (bestWords.length === 0) {
            dom.aiList.innerHTML = `<li class="ai-item"><div class="ai-item-head">No dictionary words found.</div></li>`;
        } else {
            bestWords.slice(0, 8).forEach(item => {
                const li = document.createElement('li');
                li.className = 'ai-item';
                li.innerHTML = `
                    <div class="ai-item-head">
                        <span>${item.word}</span>
                        <span style="color:var(--gold);">${item.length} PTS</span>
                    </div>
                    <div class="ai-item-def">${item.definition}</div>
                `;
                dom.aiList.appendChild(li);
            });
        }

        dom.aiResults.classList.remove('hidden');
        dom.btnToggleAI.textContent = "🙈 HIDE AI SOLVER";
    } else {
        dom.aiResults.classList.add('hidden');
        dom.btnToggleAI.textContent = "💡 SHOW MAX POSSIBLE WORDS & DEFINITION";
    }
}

function playSound(freq, duration) {
    try {
        if (!gameState.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            gameState.audioCtx = new AudioContext();
        }
        const osc = gameState.audioCtx.createOscillator();
        const gain = gameState.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, gameState.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, gameState.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gameState.audioCtx.destination);
        osc.start();
        osc.stop(gameState.audioCtx.currentTime + duration);
    } catch(e) {}
}
