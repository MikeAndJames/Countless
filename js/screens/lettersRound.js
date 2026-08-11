/**
 * ===================================================================
 * COUNTLESS - LETTERS ROUND MODULE (3-PHASE CLEAN SCREEN FLOW)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Fixed Widescreen Display (960x540): To prevent vertical clipping/overflow,
 *   the round moves through 3 clean dedicated screens:
 *   1. PHASE 'picking': 9x2 Grid & 30s Timer
 *   2. PHASE 'declaring': Clean Word Selection Screen
 *   3. PHASE 'results': Dedicated Results, Challenge & AI Comparison Screen
 */

import { dictionaryEngine } from '../dictionary.js';
import { playSound, playTick, playGong, playVictoryChime } from '../audio.js';
import { CountdownClockComponent } from '../clock.js';
import { lobbySettings } from './lobbyScreen.js';

// Official TV Countdown Weighted Letter Stacks (67 Vowels & 74 Consonants)
const VOWELS = [
    ...'A'.repeat(15),
    ...'E'.repeat(21),
    ...'I'.repeat(13),
    ...'O'.repeat(13),
    ...'U'.repeat(5)
];

const CONSONANTS = [
    ...'B'.repeat(2),
    ...'C'.repeat(3),
    ...'D'.repeat(6),
    ...'F'.repeat(2),
    ...'G'.repeat(3),
    ...'H'.repeat(2),
    ...'J'.repeat(1),
    ...'K'.repeat(1),
    ...'L'.repeat(5),
    ...'M'.repeat(4),
    ...'N'.repeat(8),
    ...'P'.repeat(4),
    ...'Q'.repeat(1),
    ...'R'.repeat(9),
    ...'S'.repeat(9),
    ...'T'.repeat(9),
    ...'V'.repeat(1),
    ...'W'.repeat(1),
    ...'X'.repeat(1),
    ...'Y'.repeat(1),
    ...'Z'.repeat(1)
];

let state = {
    allDrawnLetters: [],
    topLetters: [],
    bottomRack: [null, null, null, null, null, null, null, null, null],
    savedWords: [],
    timerInterval: null,
    dealInterval: null,
    remainingSeconds: 30,
    maxTime: 30,
    isDealing: false,
    isTimerRunning: false,
    isRoundFinished: false,
    currentPhase: 'picking', // 'picking' | 'declaring' | 'results'
    declaredResult: null,    // Stores final result payload
    clockComp: null
};

let containerRef = null;

export function renderLettersRound(container, initialGameData = null) {
    containerRef = container;
    startNewRound(initialGameData);
}

export function cleanupLettersRound() {
    stopTimer();
    if (state.dealInterval) clearInterval(state.dealInterval);
}

function startNewRound(initialGameData = null) {
    stopTimer();
    if (state.dealInterval) clearInterval(state.dealInterval);

    let letters = [];
    if (initialGameData && Array.isArray(initialGameData.drawnLetters) && initialGameData.drawnLetters.length === 9) {
        letters = [...initialGameData.drawnLetters];
    } else {
        // Draw 3 Vowels + 6 Consonants from official weighted stacks
        for (let i = 0; i < 3; i++) letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
        for (let i = 0; i < 6; i++) letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
        fisherYatesShuffle(letters);
    }

    state.allDrawnLetters = letters;
    state.topLetters = [];
    state.bottomRack = [null, null, null, null, null, null, null, null, null];
    state.savedWords = [];
    state.isRoundFinished = false;
    state.isDealing = true;
    state.currentPhase = 'picking';
    state.declaredResult = null;

    renderPhaseUI();

    // Reset Clock
    const clockMount = containerRef.querySelector('#clockMount');
    state.maxTime = 30;
    state.clockComp = new CountdownClockComponent(clockMount, state.maxTime);
    state.clockComp.update(0);

    // Sequential Deal (700ms)
    let dealIndex = 0;
    state.dealInterval = setInterval(() => {
        if (dealIndex < state.allDrawnLetters.length) {
            state.topLetters.push({
                id: dealIndex,
                char: state.allDrawnLetters[dealIndex],
                used: false
            });
            renderGridUIOnly();
            playSound(580 + dealIndex * 30, 0.08);
            dealIndex++;
        } else {
            clearInterval(state.dealInterval);
            state.dealInterval = null;
            state.isDealing = false;
            renderGridUIOnly();
            resetAndStartTimer();
        }
    }, 700);
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * MAIN 3-PHASE SCREEN RENDERER
 */
function renderPhaseUI() {
    if (state.currentPhase === 'picking') {
        renderPickingPhaseUI();
    } else if (state.currentPhase === 'declaring') {
        renderDeclaringPhaseUI();
    } else if (state.currentPhase === 'results') {
        renderResultsPhaseUI();
    }
}

/* ===================================================================
   PHASE 1: LETTER PICKING & 30S TIMER SCREEN
   =================================================================== */
function renderPickingPhaseUI() {
    containerRef.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Letters Round</span>
                </div>

                <div class="sidebar-timer-box" id="clockMount"></div>

                <button id="btnNewRound" class="btn btn-deal">🎲 DEAL LETTERS</button>

                <div class="notepad-section">
                    <span class="section-title">📝 SAVED WORDS (30S):</span>
                    <div id="savedWordsList" class="saved-words-chips">
                        <span class="notepad-placeholder">No words saved yet.</span>
                    </div>
                </div>
            </aside>

            <!-- MAIN CENTER BOARD: 9x2 GRID -->
            <main class="center-board">
                <div class="grid-section">
                    <div class="section-label-row">
                        <span class="section-title">DRAWN LETTERS</span>
                        <button id="btnShuffle" class="btn btn-shuffle">🔀 SHUFFLE</button>
                    </div>
                    <div class="row-9-grid" id="topLettersRow"></div>
                </div>

                <div class="grid-section">
                    <div class="section-label-row">
                        <span class="section-title">YOUR WORD GUESS</span>
                        <span id="wordLengthLabel" class="word-len-label">0 / 9</span>
                    </div>
                    <div class="row-9-grid" id="bottomWordRow"></div>
                </div>

                <div class="actions-row">
                    <button id="btnClear" class="btn btn-secondary">❌ CLEAR</button>
                    <button id="btnSaveWord" class="btn btn-save">➕ SAVE WORD TO NOTEPAD</button>
                </div>
            </main>
        </div>
    `;

    attachPickingEvents();
    renderGridUIOnly();
    renderNotepadChips();
}

function attachPickingEvents() {
    containerRef.querySelector('#btnNewRound').addEventListener('click', startNewRound);
    containerRef.querySelector('#btnShuffle').addEventListener('click', shuffleTopLetters);
    containerRef.querySelector('#btnClear').addEventListener('click', clearWordRack);
    containerRef.querySelector('#btnSaveWord').addEventListener('click', saveCurrentWordToNotepad);
}

function addTouchAndClickListener(element, handler) {
    let touched = false;
    element.addEventListener('pointerdown', (e) => {
        touched = true;
        handler(e);
    });
    element.addEventListener('click', (e) => {
        if (touched) {
            touched = false;
            return;
        }
        handler(e);
    });
}

function renderGridUIOnly() {
    const topRow = containerRef.querySelector('#topLettersRow');
    const bottomRow = containerRef.querySelector('#bottomWordRow');
    const wordLenLabel = containerRef.querySelector('#wordLengthLabel');

    if (!topRow || !bottomRow) return;

    topRow.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const tileItem = state.topLetters[i];
        const tile = document.createElement('div');

        if (tileItem) {
            tile.className = `tile top-tile ${tileItem.used ? 'used' : ''}`;
            tile.textContent = tileItem.char;

            if (!tileItem.used && !state.isRoundFinished && !state.isDealing) {
                addTouchAndClickListener(tile, () => pickTopTile(tileItem.id));
            }
        } else {
            tile.className = 'tile bottom-slot';
            tile.textContent = '';
        }
        topRow.appendChild(tile);
    }

    bottomRow.innerHTML = '';
    let wordLen = 0;

    state.bottomRack.forEach((item, slotIndex) => {
        const slot = document.createElement('div');
        if (item) {
            slot.className = 'tile bottom-slot filled';
            slot.textContent = item.char;
            if (!state.isRoundFinished && !state.isDealing) {
                addTouchAndClickListener(slot, () => returnBottomTile(slotIndex));
            }
            wordLen++;
        } else {
            slot.className = 'tile bottom-slot';
            slot.textContent = '';
        }
        bottomRow.appendChild(slot);
    });

    if (wordLenLabel) wordLenLabel.textContent = `${wordLen} / 9`;
}

function pickTopTile(id) {
    if (state.isDealing) return;
    const tileItem = state.topLetters.find(t => t.id === id);
    if (!tileItem || tileItem.used) return;

    const firstEmptyIndex = state.bottomRack.findIndex(slot => slot === null);
    if (firstEmptyIndex === -1) return;

    tileItem.used = true;
    state.bottomRack[firstEmptyIndex] = tileItem;

    renderGridUIOnly();
    playSound(600, 0.04);
}

function returnBottomTile(slotIndex) {
    if (state.isDealing) return;
    const tileItem = state.bottomRack[slotIndex];
    if (!tileItem) return;

    tileItem.used = false;
    state.bottomRack[slotIndex] = null;

    renderGridUIOnly();
    playSound(440, 0.04);
}

function clearWordRack() {
    if (state.isDealing) return;
    state.topLetters.forEach(item => item.used = false);
    state.bottomRack = [null, null, null, null, null, null, null, null, null];
    renderGridUIOnly();
    playSound(350, 0.05);
}

function saveCurrentWordToNotepad() {
    if (state.isDealing) return;
    const wordChars = state.bottomRack.filter(item => item !== null).map(item => item.char);
    if (wordChars.length === 0) return;

    const word = wordChars.join('');
    if (!state.savedWords.includes(word)) {
        state.savedWords.push(word);
        renderNotepadChips();
        playSound(750, 0.08);
    }

    clearWordRack();
}

function renderNotepadChips() {
    const savedWordsList = containerRef.querySelector('#savedWordsList');
    if (!savedWordsList) return;

    if (state.savedWords.length === 0) {
        savedWordsList.innerHTML = `<span class="notepad-placeholder">No words saved yet.</span>`;
        return;
    }

    savedWordsList.innerHTML = '';
    state.savedWords.forEach((word) => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.innerHTML = `${word} <span class="chip-len">${word.length}</span>`;
        savedWordsList.appendChild(chip);
    });
}

function shuffleTopLetters() {
    if (state.isDealing) return;
    const unusedIndices = [];
    state.topLetters.forEach((item, index) => {
        if (!item.used) unusedIndices.push(index);
    });

    if (unusedIndices.length < 2) return;

    const charsToShuffle = unusedIndices.map(idx => state.topLetters[idx].char);
    fisherYatesShuffle(charsToShuffle);

    unusedIndices.forEach((idx, i) => {
        state.topLetters[idx].char = charsToShuffle[i];
    });

    renderGridUIOnly();
    playSound(700, 0.05);
}

/* ===================================================================
   TIMER LOGIC & TRANSITION TO PHASE 2 (DECLARING)
   =================================================================== */
function resetAndStartTimer() {
    stopTimer();
    const clockMount = containerRef.querySelector('#clockMount');
    if (!clockMount) return;

    state.maxTime = 30;
    state.clockComp = new CountdownClockComponent(clockMount, state.maxTime);
    state.remainingSeconds = state.maxTime;
    state.clockComp.update(0);

    state.isTimerRunning = true;
    state.timerInterval = setInterval(() => {
        state.remainingSeconds--;
        const timeSoFar = state.maxTime - state.remainingSeconds;
        if (state.clockComp) state.clockComp.update(timeSoFar);

        playTick(state.remainingSeconds % 2 === 0);

        if (state.remainingSeconds <= 0) {
            onTimerExpired();
        }
    }, 1000);
}

function stopTimer() {
    state.isTimerRunning = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
}

function onTimerExpired() {
    stopTimer();
    state.isRoundFinished = true;
    playGong();

    // Auto-save current rack if present
    const rackChars = state.bottomRack.filter(item => item !== null).map(item => item.char);
    if (rackChars.length > 0) {
        const rackWord = rackChars.join('');
        if (!state.savedWords.includes(rackWord)) {
            state.savedWords.push(rackWord);
        }
    }

    // Switch to Phase 2: Declaring Screen
    state.currentPhase = 'declaring';
    renderPhaseUI();
}

/* ===================================================================
   PHASE 2: CLEAN WORD SELECTION SCREEN
   =================================================================== */
function renderDeclaringPhaseUI() {
    containerRef.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Letters Round</span>
                </div>

                <div class="sidebar-timer-box">
                    <span class="timer-label">STATUS</span>
                    <span class="clock-digits-val" style="font-size:1.6rem; color:var(--gold);">⏰ TIME UP!</span>
                </div>

                <button id="btnNewRoundDecl" class="btn btn-deal">🎲 NEW ROUND</button>
            </aside>

            <!-- MAIN CENTER BOARD: DECLARATION SCREEN -->
            <main class="center-board" style="justify-content:center; align-items:center; padding:16px;">
                <div class="lobby-card" style="width:100%; max-width:650px; text-align:center; display:flex; flex-direction:column; max-height:440px;">
                    <h2 style="color:var(--gold); font-size:1.4rem; margin-bottom:10px; flex-shrink:0;">⏰ TIME'S UP! SELECT YOUR DECLARED WORD:</h2>
                    
                    <div style="flex:1; min-height:0; overflow-y:auto; padding-right:6px; border:1px solid #334155; background:#0f172a; border-radius:12px; padding:10px;">
                        <div id="declarationOptionList" class="declaration-options" style="gap:8px;"></div>
                    </div>
                </div>
            </main>
        </div>
    `;

    containerRef.querySelector('#btnNewRoundDecl').addEventListener('click', startNewRound);

    const declarationOptionList = containerRef.querySelector('#declarationOptionList');
    declarationOptionList.innerHTML = '';

    if (state.savedWords.length === 0) {
        const btn = document.createElement('button');
        btn.className = 'decl-btn';
        btn.innerHTML = `<span>❌ NO WORD SAVED IN NOTEPAD</span><span>0 PTS</span>`;
        btn.addEventListener('click', () => processDeclaredWord(''));
        declarationOptionList.appendChild(btn);
        return;
    }

    state.savedWords.forEach((word) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-gold btn-large decl-btn';
        btn.style.width = '100%';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.style.padding = '14px 20px';
        btn.style.fontSize = '1.2rem';
        btn.style.cursor = 'pointer';
        btn.style.marginBottom = '8px';

        btn.innerHTML = `
            <span style="pointer-events:none;">⭐ DECLARE "${word}"</span>
            <span class="chip-len" style="pointer-events:none; font-size:0.9rem; padding:4px 12px; background:#0f172a; color:var(--gold); border-radius:6px;">${word.length} PTS</span>
        `;

        addTouchAndClickListener(btn, () => processDeclaredWord(word));
        declarationOptionList.appendChild(btn);
    });
}

async function processDeclaredWord(word) {
    const isValid = dictionaryEngine.isValidWord(word);
    const definition = dictionaryEngine.getDefinition(word);
    let score = isValid ? ((word.length === 9) ? 18 : word.length) : 0;

    const bestWords = dictionaryEngine.findBestWords(state.allDrawnLetters);
    const aiBest = bestWords.length > 0 ? bestWords[0] : null;

    state.declaredResult = {
        word: word,
        isValid: isValid,
        score: score,
        definition: definition,
        aiBest: aiBest,
        challenged: false,
        challengeResult: null
    };

    if (multiplayerService.currentRoomCode) {
        try {
            await multiplayerService.submitRoundResult({
                word: word || 'NO WORD',
                score: score,
                isValid: isValid
            });
        } catch(e) {
            console.warn("Submitting round result:", e);
        }
    }

    if (isValid) playVictoryChime();
    else playSound(220, 0.3);

    // Switch to Phase 3: Results Screen
    state.currentPhase = 'results';
    renderPhaseUI();
}

/* ===================================================================
   PHASE 3: DEDICATED RESULTS, CHALLENGE & AI COMPARISON SCREEN
   =================================================================== */
function renderResultsPhaseUI() {
    const res = state.declaredResult;
    const word = res.word;
    const isValid = res.isValid;
    const score = res.score;
    const definition = res.definition;
    const aiBest = res.aiBest;

    const aiBannerHtml = getAIComparisonBanner(word, score, isValid, aiBest);

    containerRef.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Round Results</span>
                </div>

                <div class="sidebar-timer-box">
                    <span class="timer-label">YOUR SCORE</span>
                    <span class="clock-digits-val" style="font-size:2.8rem; color:var(--gold);">${score} PTS</span>
                </div>

                <button id="btnNextRound" class="btn btn-deal" style="font-size:1.15rem; padding:12px;">🎲 NEXT ROUND</button>
            </aside>

            <!-- MAIN CENTER BOARD: CLEAN RESULTS & MULTIPLAYER SCOREBOARD -->
            <main class="center-board" style="justify-content:space-between; gap:10px;">
                <!-- RESULT CARD -->
                <div class="result-card ${isValid ? '' : 'invalid'}" style="flex:1; display:flex; flex-direction:column; justify-content:space-around; padding:14px;">
                    <div class="result-header">
                        <h2 style="font-size:1.3rem; color:${isValid ? 'var(--success-green)' : 'var(--danger-red)'}; margin:0;">
                            ${word ? (isValid ? `DECLARED WORD: "${word}"` : `INVALID: "${word}"`) : 'NO WORD DECLARED'}
                        </h2>
                        <div class="score-pill" style="font-size:1.1rem; padding:4px 12px;">${score} PTS</div>
                    </div>

                    <div id="challengeStatusArea">
                        ${!isValid && word ? `
                            <div style="margin-top:6px;">
                                <button id="btnChallengeWord" class="btn btn-deal" style="width:100%; font-size:0.95rem; padding:8px;">
                                    🚨 CHALLENGE WORD "${word}" (CHECK ONLINE DICTIONARY)
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <p class="result-def" style="font-size:0.9rem; line-height:1.4; color:#cbd5e1; margin:6px 0;">
                        <strong>Definition:</strong> ${definition}
                    </p>

                    <div id="aiBannerContainer">
                        ${aiBannerHtml}
                    </div>
                </div>

                <!-- MULTIPLAYER ROUND SCOREBOARD -->
                <div class="result-card" style="flex:1; display:flex; flex-direction:column; padding:12px; border:2px solid var(--gold);">
                    <h3 style="color:var(--gold); font-size:1.1rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span>🏆 MULTIPLAYER ROUND SCOREBOARD</span>
                        <small style="color:#94a3b8; font-size:0.75rem;">Tap any word for definition</small>
                    </h3>

                    <div id="resultsMultiplayerBoard" style="display:flex; flex-direction:column; gap:6px; flex:1; overflow-y:auto;">
                        <div style="color:#94a3b8; font-size:0.85rem;">Waiting for player submissions...</div>
                    </div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button id="btnToggleAI" class="btn btn-ai" style="flex:1;">💡 VIEW ALL TOP AI SOLVER WORDS</button>
                </div>

                <!-- AI SOLVER OVERLAY MODAL -->
                <div id="aiResults" class="modal-overlay hidden">
                    <div class="modal-content">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3 class="modal-title">💡 TOP MAX AI SOLVER WORDS (TAP FOR DEFINITION)</h3>
                            <button id="btnCloseAIModal" class="btn btn-secondary" style="padding:2px 8px;">❌ CLOSE</button>
                        </div>
                        <ul id="aiList" class="ai-list"></ul>
                    </div>
                </div>

                <!-- WORD DEFINITION INSPECTOR MODAL -->
                <div id="wordInspectorModal" class="modal-overlay hidden">
                    <div class="modal-content splash-modal" style="max-width:500px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--gold); padding-bottom:6px; margin-bottom:10px;">
                            <h3 id="inspectorWordTitle" style="color:var(--gold); font-size:1.4rem; margin:0;">📖 WORD</h3>
                            <button id="btnCloseInspectorModal" class="btn btn-secondary" style="padding:2px 8px;">❌</button>
                        </div>
                        <p id="inspectorWordDef" style="font-size:1rem; color:#ffffff; line-height:1.5; margin:0;"></p>
                    </div>
                </div>
            </main>
        </div>
    `;

    attachResultsEvents();
    subscribeToMultiplayerResults();
}

function subscribeToMultiplayerResults() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        renderScoreboardItemsUI(roomData);
    });
}

function renderScoreboardItemsUI(roomData) {
    const boardEl = containerRef ? containerRef.querySelector('#resultsMultiplayerBoard') : null;
    if (!boardEl || !roomData) return;

    boardEl.innerHTML = '';
    const players = roomData.players || {};
    const results = roomData.roundResults || {};

    Object.values(players).forEach(p => {
        const res = results[p.id] || { word: '...', score: 0 };
        const isMe = p.id === multiplayerService.currentPlayerId;

        const row = document.createElement('div');
        row.className = 'word-chip';
        row.style.display = 'flex';
        row.style.justifySpaceBetween = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.cursor = 'pointer';

        row.innerHTML = `
            <div>
                <span>${p.isHost ? '👑 ' : '🎮 '}<strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold);">(YOU)</small>' : ''}:</span>
                <strong style="color:var(--gold); font-size:1rem; margin-left:6px;">"${res.word}"</strong>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="chip-len" style="font-weight:900;">${res.score} PTS</span>
                <span style="font-size:0.8rem; color:var(--cyan);">🔍 DEF</span>
            </div>
        `;

        if (res.word && res.word !== '...') {
            row.addEventListener('click', () => showWordInspector(res.word));
        }
        boardEl.appendChild(row);
    });

    // Also append AI Best Word to Scoreboard
    if (state.declaredResult && state.declaredResult.aiBest) {
        const aiWord = state.declaredResult.aiBest.word;
        const aiScore = (aiWord.length === 9) ? 18 : aiWord.length;

        const aiRow = document.createElement('div');
        aiRow.className = 'word-chip';
        aiRow.style.background = 'rgba(59,130,246,0.2)';
        aiRow.style.border = '1px solid #3b82f6';
        aiRow.style.padding = '8px 12px';
        aiRow.style.cursor = 'pointer';

        aiRow.innerHTML = `
            <div>
                <span>🤖 <strong>AI MAX BEST</strong>:</span>
                <strong style="color:#93c5fd; font-size:1rem; margin-left:6px;">"${aiWord}"</strong>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="chip-len" style="background:#3b82f6; color:#ffffff;">${aiScore} PTS</span>
                <span style="font-size:0.8rem; color:var(--cyan);">🔍 DEF</span>
            </div>
        `;
        aiRow.addEventListener('click', () => showWordInspector(aiWord));
        boardEl.appendChild(aiRow);
    }
}

async function showWordInspector(word) {
    if (!word || !containerRef) return;
    const cleanWord = word.trim().toUpperCase();
    const modal = containerRef.querySelector('#wordInspectorModal');
    const titleEl = containerRef.querySelector('#inspectorWordTitle');
    const defEl = containerRef.querySelector('#inspectorWordDef');
    const btnClose = containerRef.querySelector('#btnCloseInspectorModal');

    if (!modal || !titleEl || !defEl) return;

    titleEl.textContent = `📖 "${cleanWord}"`;
    defEl.textContent = "⏳ Fetching dictionary definition...";
    modal.classList.remove('hidden');

    const def = await dictionaryEngine.getDefinitionAsync(cleanWord);
    defEl.textContent = def;

    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
}

function attachResultsEvents() {
    containerRef.querySelector('#btnNextRound').addEventListener('click', startNewRound);
    
    const btnToggleAI = containerRef.querySelector('#btnToggleAI');
    const btnCloseAIModal = containerRef.querySelector('#btnCloseAIModal');
    
    if (btnToggleAI) btnToggleAI.addEventListener('click', toggleAISolver);
    if (btnCloseAIModal) {
        btnCloseAIModal.addEventListener('click', () => {
            containerRef.querySelector('#aiResults').classList.add('hidden');
        });
    }

    const btnChallenge = containerRef.querySelector('#btnChallengeWord');
    if (btnChallenge) {
        btnChallenge.addEventListener('click', async () => {
            const word = state.declaredResult.word;
            btnChallenge.disabled = true;
            btnChallenge.textContent = "⏳ SEARCHING ONLINE DICTIONARIES...";

            const res = await dictionaryEngine.challengeWordOnlineAsync(word);
            const challengeStatusArea = containerRef.querySelector('#challengeStatusArea');
            const aiBannerContainer = containerRef.querySelector('#aiBannerContainer');

            if (res.valid) {
                let challengeScore = (word.length === 9) ? 18 : word.length;
                const updatedAiBanner = getAIComparisonBanner(word, challengeScore, true, state.declaredResult.aiBest);

                if (lobbySettings.allowHouseRules) {
                    state.declaredResult.score = challengeScore;
                    state.declaredResult.isValid = true;

                    challengeStatusArea.innerHTML = `
                        <div style="padding:8px 12px; background:rgba(22,163,74,0.25); border:1px solid #22c55e; border-radius:8px;">
                            <div style="font-weight:900; color:#4ade80; font-size:0.95rem;">🌐 ONLINE SEARCH: Found in Online Dictionary!</div>
                            <div style="color:#ffffff; font-weight:800; margin-top:2px;">🟢 HOUSE RULES: Accepted & Overruled! (+${challengeScore} PTS)</div>
                        </div>
                    `;
                    aiBannerContainer.innerHTML = updatedAiBanner;
                    playVictoryChime();
                } else {
                    challengeStatusArea.innerHTML = `
                        <div style="padding:8px 12px; background:rgba(245,158,11,0.25); border:1px solid #f59e0b; border-radius:8px;">
                            <div style="font-weight:900; color:#fde047; font-size:0.95rem;">🌐 ONLINE SEARCH: Found in Online Dictionary!</div>
                            <div style="color:#cbd5e1; font-weight:700; margin-top:2px;">🔴 STRICT TV RULES: Proper Nouns / Unlisted words are 0 PTS on Countdown!</div>
                        </div>
                    `;
                    playSound(220, 0.3);
                }
            } else {
                challengeStatusArea.innerHTML = `
                    <div style="padding:8px 12px; background:rgba(220,38,38,0.25); border:1px solid #ef4444; border-radius:8px;">
                        <div style="font-weight:900; color:#fca5a5; font-size:0.95rem;">🌐 ONLINE SEARCH: Not Found Online</div>
                        <div style="color:#cbd5e1; margin-top:2px;">❌ Word rejected under both Local and Online dictionaries (0 PTS).</div>
                    </div>
                `;
                playSound(220, 0.3);
            }
        });
    }
}

function getAIComparisonBanner(userWord, userScore, isValid, aiBest) {
    if (!aiBest) return '';
    const aiScore = (aiBest.length === 9) ? 18 : aiBest.length;

    if (isValid && userScore > aiScore) {
        return `<div style="padding:8px 12px; background:rgba(245,158,11,0.25); border:1px solid #f59e0b; border-radius:6px; color:#fde047; font-weight:900;">👑 BEAT THE AI! You scored ${userScore} PTS ("${userWord}") vs AI's ${aiScore} PTS ("${aiBest.word}")!</div>`;
    } else if (isValid && userScore === aiScore) {
        return `<div style="padding:8px 12px; background:rgba(22,163,74,0.25); border:1px solid #22c55e; border-radius:6px; color:#4ade80; font-weight:900;">🏆 MATCHED THE AI! Both scored ${userScore} PTS ("${userWord}" vs "${aiBest.word}")!</div>`;
    } else if (isValid && userScore < aiScore) {
        return `<div style="padding:8px 12px; background:rgba(59,130,246,0.25); border:1px solid #3b82f6; border-radius:6px; color:#93c5fd; font-weight:700;">🤖 AI BEST: "${aiBest.word}" (${aiScore} PTS) — You scored ${userScore} PTS with "${userWord}".</div>`;
    } else {
        return `<div style="padding:8px 12px; background:rgba(51,65,85,0.6); border:1px solid #475569; border-radius:6px; color:#cbd5e1; font-weight:700;">🤖 AI BEST: "${aiBest.word}" (${aiScore} PTS).</div>`;
    }
}

function toggleAISolver() {
    const aiResults = containerRef.querySelector('#aiResults');
    const aiList = containerRef.querySelector('#aiList');
    if (!aiResults || !aiList) return;

    const isHidden = aiResults.classList.contains('hidden');

    if (isHidden) {
        const topChars = state.allDrawnLetters;
        const bestWords = dictionaryEngine.findBestWords(topChars);
        aiList.innerHTML = '';

        if (bestWords.length === 0) {
            aiList.innerHTML = `<li class="ai-item"><div class="ai-item-head">No dictionary words found.</div></li>`;
        } else {
            bestWords.slice(0, 8).forEach(item => {
                const li = document.createElement('li');
                li.className = 'ai-item';
                li.style.cursor = 'pointer';
                const cleanDefText = dictionaryEngine.cleanDefinition(item.definition);
                li.innerHTML = `
                    <div class="ai-item-head">
                        <span style="font-weight:900;">${item.word} <small style="color:var(--cyan); font-weight:normal;">(Tap to view def)</small></span>
                        <span style="color:var(--gold); font-weight:900;">${item.length} PTS</span>
                    </div>
                    <div class="ai-item-def">${cleanDefText}</div>
                `;
                li.addEventListener('click', () => {
                    aiResults.classList.add('hidden');
                    showWordInspector(item.word);
                });
                aiList.appendChild(li);
            });
        }

        aiResults.classList.remove('hidden');
    } else {
        aiResults.classList.add('hidden');
    }
}
