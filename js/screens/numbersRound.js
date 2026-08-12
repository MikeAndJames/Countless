/**
 * ===================================================================
 * COUNTLESS - NUMBERS ROUND MODULE (16:9 WIDESCREEN LANDSCAPE)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Sequential TV-Style Tile Dealing: Numbers reveal 1-by-1 (every 700ms).
 * - Timer only starts AFTER all 6 numbers are dealt out!
 * - Used tiles fade out (opacity 0.25). Created tiles appear in gold & are fully selectable!
 */

import { playSound, playTick, playGong } from '../audio.js';
import { CountdownClockComponent } from '../clock.js';
import { multiplayerService } from '../multiplayer.js';
import { switchScreen } from '../main.js';

const LARGE_NUMBERS = [25, 50, 75, 100];
const SMALL_NUMBERS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

let state = {
    allDrawnNumbers: [],
    originalTiles: [],
    workingTiles: [],
    targetNumber: 0,
    selectedFirst: null,
    selectedOp: null,
    timerInterval: null,
    dealInterval: null,
    remainingSeconds: 30,
    maxTime: 30,
    isDealing: false,
    isTimerRunning: false,
    history: [],
    savedSolutions: [], // [{ id, val, diff, score, stepsText }]
    clockComp: null
};

let containerRef = null;

export function renderNumbersRound(container, initialGameData = null) {
    containerRef = container;
    container.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR: TITLE, TIMER, DEAL BUTTON, SAVED SOLUTIONS, EQUATION HISTORY -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Numbers Round</span>
                </div>

                <div class="sidebar-timer-box" id="clockMountNumbers"></div>

                <button id="btnNewNumbersRound" class="btn btn-deal">🎲 DEAL NUMBERS</button>

                <div class="notepad-section">
                    <span class="section-title">📝 SAVED SOLUTIONS (30S):</span>
                    <div id="savedSolutionsList" class="saved-words-chips" style="margin-bottom:12px;">
                        <span class="notepad-placeholder">No solutions saved yet.</span>
                    </div>

                    <span class="section-title">📐 EQUATION STEPS:</span>
                    <div id="equationHistory" class="saved-words-chips">
                        <span class="notepad-placeholder">Pick numbers & operators to solve target!</span>
                    </div>
                </div>
            </aside>

            <!-- MAIN CENTER WIDE BOARD -->
            <main class="center-board">
                <!-- TARGET NUMBER CARD -->
                <div class="target-card">
                    <span class="target-label">TARGET NUMBER:</span>
                    <span id="targetDisplay" class="target-digits">???</span>
                </div>

                <!-- NUMBERS WORKING TILES AREA -->
                <div class="grid-section">
                    <span class="section-title">AVAILABLE NUMBERS (TAP TO COMBINE):</span>
                    <div id="numbersTilesGrid" class="numbers-grid" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;"></div>
                </div>

                <!-- MATH OPERATORS ROW -->
                <div class="operators-row">
                    <button class="btn btn-op" data-op="+">➕ ADD (+)</button>
                    <button class="btn btn-op" data-op="-">➖ SUB (-)</button>
                    <button class="btn btn-op" data-op="*">✖️ MULT (×)</button>
                    <button class="btn btn-op" data-op="/">➗ DIV (÷)</button>
                </div>

                <!-- ACTIONS ROW -->
                <div class="actions-row" style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">
                    <button id="btnUndoStep" class="btn btn-secondary" style="padding:10px 12px;">↩️ UNDO</button>
                    <button id="btnResetBoard" class="btn btn-secondary" style="padding:10px 12px; background:#475569;">🔄 RESET TILES</button>
                    <button id="btnSaveSolution" class="btn btn-save" style="padding:10px 12px; background:var(--gold); color:#0f172a; font-weight:800;">➕ SAVE SOLUTION</button>
                    <button id="btnSubmitNumber" class="btn btn-submit" style="flex:1; padding:10px 12px;">✅ DECLARE SCORE</button>
                </div>

                <!-- RESULT CARD -->
                <div id="numberResultBox" class="result-card hidden">
                    <div class="result-header">
                        <h3 id="numberResultTitle">EXACT TARGET!</h3>
                        <div id="numberResultScore" class="score-pill">10 PTS</div>
                    </div>
                    <p id="numberResultDiff" class="result-def"></p>
                </div>

                <!-- MULTIPLAYER ROUND SCOREBOARD CARD -->
                <div id="numbersMultiplayerBoardCard" class="result-card hidden" style="max-height:150px; display:flex; flex-direction:column; padding:10px 12px; border:2px solid var(--gold); margin-top:8px; box-sizing:border-box;">
                    <h3 style="color:var(--gold); font-size:1rem; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                        <span>🏆 MULTIPLAYER NUMBERS SCOREBOARD</span>
                        <small style="color:#94a3b8; font-size:0.75rem;">Scroll for all players</small>
                    </h3>

                    <div id="resultsMultiplayerBoard" style="display:flex; flex-direction:column; gap:6px; flex:1; overflow-y:auto; padding-right:4px;">
                        <div style="color:#94a3b8; font-size:0.85rem;">Waiting for player submissions...</div>
                    </div>
                </div>

                <!-- AI SOLVER BUTTON -->
                <div class="ai-section">
                    <button id="btnSolveNumbersAI" class="btn btn-ai">💡 SHOW AI MATH TARGET SOLUTION</button>
                </div>

                <!-- AI MATH SOLVER OVERLAY MODAL -->
                <div id="numbersAIResults" class="modal-overlay hidden">
                    <div class="modal-content">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3 class="modal-title">💡 AI MATH TARGET SOLUTION</h3>
                            <button id="btnCloseNumbersAI" class="btn btn-secondary" style="padding:2px 8px;">❌ CLOSE</button>
                        </div>
                        <div id="numbersAISolutionText" class="result-def" style="font-size:1rem; color:#ffffff; padding:10px 0;"></div>
                    </div>
                </div>
            </main>
        </div>
    `;

    attachEvents();
    
    // If launched via multiplayer host, hide manual deal button and auto-start
    if (initialGameData) {
        const btnNew = container.querySelector('#btnNewNumbersRound');
        if (btnNew) btnNew.style.display = 'none';
        startNewNumbersRound(initialGameData);
    }
    
    subscribeToMultiplayerEvents();
}

export function cleanupNumbersRound() {
    stopTimer();
    if (state.dealInterval) clearInterval(state.dealInterval);
}

function attachEvents() {
    const btnNew = containerRef.querySelector('#btnNewNumbersRound');
    const opBtns = containerRef.querySelectorAll('.btn-op');
    const btnUndo = containerRef.querySelector('#btnUndoStep');
    const btnReset = containerRef.querySelector('#btnResetBoard');
    const btnSave = containerRef.querySelector('#btnSaveSolution');
    const btnSubmit = containerRef.querySelector('#btnSubmitNumber');
    const btnAI = containerRef.querySelector('#btnSolveNumbersAI');
    const btnCloseAI = containerRef.querySelector('#btnCloseNumbersAI');

    if (btnNew) btnNew.addEventListener('click', () => startNewNumbersRound());
    if (btnUndo) btnUndo.addEventListener('click', undoLastStep);
    if (btnReset) btnReset.addEventListener('click', resetBoardTiles);
    if (btnSave) btnSave.addEventListener('click', saveCurrentSolutionToNotepad);
    if (btnSubmit) btnSubmit.addEventListener('click', submitNumberScore);
    if (btnAI) btnAI.addEventListener('click', toggleAIMathSolver);
    if (btnCloseAI) btnCloseAI.addEventListener('click', () => {
        containerRef.querySelector('#numbersAIResults').classList.add('hidden');
    });

    opBtns.forEach(btn => {
        btn.addEventListener('click', () => selectOperator(btn.getAttribute('data-op')));
    });
}

function startNewNumbersRound(initialGameData = null) {
    stopTimer();
    if (state.dealInterval) clearInterval(state.dealInterval);

    let drawn = [];
    let target = 0;

    if (initialGameData && Array.isArray(initialGameData.drawnNumbers) && initialGameData.drawnNumbers.length === 6) {
        drawn = [...initialGameData.drawnNumbers];
        target = initialGameData.targetNumber || 500;
    } else {
        const largeCopy = [...LARGE_NUMBERS];
        const smallCopy = [...SMALL_NUMBERS];

        for (let i = 0; i < 2; i++) {
            const idx = Math.floor(Math.random() * largeCopy.length);
            drawn.push(largeCopy.splice(idx, 1)[0]);
        }
        for (let i = 0; i < 4; i++) {
            const idx = Math.floor(Math.random() * smallCopy.length);
            drawn.push(smallCopy.splice(idx, 1)[0]);
        }
        target = Math.floor(Math.random() * 899) + 101;
    }

    state.allDrawnNumbers = drawn;
    state.originalTiles = drawn;
    state.workingTiles = [];
    state.targetNumber = target;
    state.selectedFirst = null;
    state.selectedOp = null;
    state.history = [];
    state.savedSolutions = [];
    state.isDealing = true;

    containerRef.querySelector('#targetDisplay').textContent = state.targetNumber;
    containerRef.querySelector('.actions-row').classList.remove('hidden');
    containerRef.querySelector('.operators-row').classList.remove('hidden');
    containerRef.querySelector('#numberResultBox').classList.add('hidden');
    containerRef.querySelector('.ai-section').classList.add('hidden');
    containerRef.querySelector('#numbersAIResults').classList.add('hidden');

    // Reset clock display
    const clockMount = containerRef.querySelector('#clockMountNumbers');
    state.maxTime = multiplayerService.currentRoomCode ? multiplayerService.getMyTimeHandicap() : 30;
    state.clockComp = new CountdownClockComponent(clockMount, state.maxTime);
    state.clockComp.update(0);

    renderTilesUI();
    renderHistoryUI();
    renderSavedSolutionsUI();

    // SEQUENTIAL DEALING FOR NUMBERS (1 TILE EVERY 700ms)
    let dealIndex = 0;
    state.dealInterval = setInterval(() => {
        if (dealIndex < state.allDrawnNumbers.length) {
            const val = state.allDrawnNumbers[dealIndex];
            state.workingTiles.push({
                id: `t_${dealIndex}_${Date.now()}`,
                val: val,
                used: false,
                isCreated: false,
                parentIds: []
            });
            renderTilesUI();
            playSound(600 + dealIndex * 40, 0.08); // Tile pop sound!
            dealIndex++;
        } else {
            clearInterval(state.dealInterval);
            state.dealInterval = null;
            state.isDealing = false;
            renderTilesUI();
            resetAndStartTimer();
        }
    }, 700);
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

function renderTilesUI() {
    const grid = containerRef.querySelector('#numbersTilesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    state.workingTiles.forEach((tile) => {
        const card = document.createElement('div');
        let classes = 'tile number-tile';
        if (tile.used) classes += ' used';
        if (tile.isCreated) classes += ' created';
        if (state.selectedFirst === tile.id) classes += ' selected';

        card.className = classes;
        card.textContent = tile.val;

        if (!state.isDealing && !tile.used) {
            addTouchAndClickListener(card, () => handleTileClick(tile));
        }
        grid.appendChild(card);
    });

    // Highlight selected operator button
    const opBtns = containerRef.querySelectorAll('.btn-op');
    opBtns.forEach(btn => {
        if (btn.getAttribute('data-op') === state.selectedOp) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function handleTileClick(tile) {
    if (state.isDealing || tile.used) return;

    // 1. If clicking the already-selected first tile, deselect it!
    if (state.selectedFirst === tile.id) {
        state.selectedFirst = null;
        playSound(400, 0.04);
        renderTilesUI();
        return;
    }

    // 2. If no first tile selected yet, select this tile!
    if (state.selectedFirst === null) {
        state.selectedFirst = tile.id;
        playSound(600, 0.04);
        renderTilesUI();
        return;
    }

    // 3. If first tile IS selected BUT no operator is selected yet, switch first selection to this tile!
    if (state.selectedFirst !== null && state.selectedOp === null) {
        state.selectedFirst = tile.id;
        playSound(600, 0.04);
        renderTilesUI();
        return;
    }

    // 4. If first tile AND operator ARE selected, execute operation!
    if (state.selectedFirst !== null && state.selectedOp !== null) {
        executeOperation(tile);
    }
}

function selectOperator(op) {
    if (state.isDealing) return;
    if (state.selectedFirst === null) {
        return;
    }
    state.selectedOp = op;
    playSound(700, 0.04);
    renderTilesUI();
}

function executeOperation(secondTile) {
    const firstTile = state.workingTiles.find(t => t.id === state.selectedFirst);
    const op = state.selectedOp;

    let result = 0;
    if (op === '+') result = firstTile.val + secondTile.val;
    else if (op === '-') result = firstTile.val - secondTile.val;
    else if (op === '*') result = firstTile.val * secondTile.val;
    else if (op === '/') {
        if (secondTile.val === 0 || firstTile.val % secondTile.val !== 0) {
            state.selectedOp = null;
            renderTilesUI();
            return;
        }
        result = firstTile.val / secondTile.val;
    }

    if (result <= 0) {
        state.selectedOp = null;
        renderTilesUI();
        return;
    }

    firstTile.used = true;
    secondTile.used = true;

    const newTile = {
        id: `created_${Date.now()}`,
        val: result,
        used: false,
        isCreated: true,
        parentIds: [firstTile.id, secondTile.id]
    };

    state.workingTiles.push(newTile);

    const symbolMap = { '+': '+', '-': '-', '*': '×', '/': '÷' };
    state.history.push({
        createdId: newTile.id,
        text: `${firstTile.val} ${symbolMap[op]} ${secondTile.val} = ${result}`
    });

    state.selectedFirst = null;
    state.selectedOp = null;

    renderTilesUI();
    renderHistoryUI();
    playSound(880, 0.1);
}

function undoLastStep() {
    if (state.history.length === 0) return;
    const lastHistory = state.history[state.history.length - 1];
    const createdTile = state.workingTiles.find(t => t.id === lastHistory.createdId);
    if (createdTile) {
        cancelCreatedTile(createdTile);
    }
}

function cancelCreatedTile(createdTile) {
    if (!createdTile) return;

    // Recursively undo any child tiles created using this tile
    const childTiles = state.workingTiles.filter(t => t.isCreated && t.parentIds.includes(createdTile.id));
    childTiles.forEach(child => cancelCreatedTile(child));

    // Restore parent tiles
    createdTile.parentIds.forEach(pId => {
        const parent = state.workingTiles.find(t => t.id === pId);
        if (parent) parent.used = false;
    });

    const idx = state.workingTiles.findIndex(t => t.id === createdTile.id);
    if (idx > -1) state.workingTiles.splice(idx, 1);

    const hIdx = state.history.findIndex(h => h.createdId === createdTile.id);
    if (hIdx > -1) state.history.splice(hIdx, 1);

    state.selectedFirst = null;
    state.selectedOp = null;

    renderTilesUI();
    renderHistoryUI();
    playSound(350, 0.05);
}

function renderHistoryUI() {
    const container = containerRef.querySelector('#equationHistory');
    if (!container) return;

    if (state.history.length === 0) {
        container.innerHTML = `<span class="notepad-placeholder">Pick numbers & operators to solve target!</span>`;
        return;
    }

    container.innerHTML = '';
    state.history.forEach(step => {
        const chip = document.createElement('button');
        chip.className = 'word-chip undo-chip';
        chip.style.cursor = 'pointer';
        chip.style.width = '100%';
        chip.style.justifyContent = 'space-between';
        chip.style.padding = '6px 10px';
        chip.style.fontSize = '0.88rem';
        chip.innerHTML = `<span>↩️ ${step.text}</span><span style="font-size:0.75rem; color:var(--gold); font-weight:800;">UNDOS</span>`;
        
        addTouchAndClickListener(chip, () => {
            const createdTile = state.workingTiles.find(t => t.id === step.createdId);
            if (createdTile) {
                cancelCreatedTile(createdTile);
            }
        });
        container.appendChild(chip);
    });
}

function saveCurrentSolutionToNotepad() {
    if (state.isDealing) return;

    const activeTiles = state.workingTiles.filter(t => !t.used);
    if (activeTiles.length === 0) return;

    // Pick tile closest to target
    let closest = activeTiles[0];
    let minDiff = Math.abs(closest.val - state.targetNumber);
    activeTiles.forEach(t => {
        const d = Math.abs(t.val - state.targetNumber);
        if (d < minDiff) {
            minDiff = d;
            closest = t;
        }
    });

    let score = 0;
    if (minDiff === 0) score = 10;
    else if (minDiff <= 5) score = 7;
    else if (minDiff <= 10) score = 5;

    const stepsText = state.history.map(h => h.text).join(' → ') || `Raw Tile: ${closest.val}`;
    
    // Avoid duplicate value entries if identical number already saved
    const exists = state.savedSolutions.find(s => s.val === closest.val && s.diff === minDiff);
    if (!exists) {
        state.savedSolutions.push({
            id: `sol_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            val: closest.val,
            diff: minDiff,
            score: score,
            stepsText: stepsText
        });
        playSound(880, 0.1);
    }
    renderSavedSolutionsUI();
}

function resetBoardTiles() {
    if (state.isDealing || state.allDrawnNumbers.length < 6) return;

    state.workingTiles = state.allDrawnNumbers.map((val, idx) => ({
        id: `t_${idx}_${Date.now()}`,
        val: val,
        used: false,
        isCreated: false,
        parentIds: []
    }));

    state.selectedFirst = null;
    state.selectedOp = null;
    state.history = [];

    renderTilesUI();
    renderHistoryUI();
    playSound(350, 0.05);
}

function renderSavedSolutionsUI() {
    const container = containerRef ? containerRef.querySelector('#savedSolutionsList') : null;
    if (!container) return;

    if (state.savedSolutions.length === 0) {
        container.innerHTML = `<span class="notepad-placeholder">No solutions saved yet. Tap "SAVE SOLUTION" to keep your work!</span>`;
        return;
    }

    container.innerHTML = '';
    state.savedSolutions.forEach((sol) => {
        const chip = document.createElement('div');
        chip.className = 'word-chip';
        chip.style.display = 'flex';
        chip.style.justifyContent = 'space-between';
        chip.style.alignItems = 'center';
        chip.style.padding = '8px 12px';
        chip.style.margin = '4px 0';
        chip.style.background = 'rgba(15, 23, 42, 0.85)';
        chip.style.border = sol.diff === 0 ? '2px solid var(--gold)' : '1px solid var(--cyan)';
        chip.style.borderRadius = '8px';

        let labelText = `${sol.val}`;
        if (sol.diff === 0) labelText += ` (EXACT MATCH!)`;
        else labelText += ` (Off by ${sol.diff})`;

        chip.innerHTML = `
            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px;">
                <strong style="color:${sol.diff === 0 ? 'var(--gold)' : '#ffffff'}; font-size:1rem;">${labelText}</strong>
                <div style="font-size:0.75rem; color:#94a3b8; overflow:hidden; text-overflow:ellipsis;">${sol.stepsText}</div>
            </div>
            <span style="font-weight:900; background:${sol.score > 0 ? 'var(--gold)' : '#475569'}; color:#0f172a; padding:3px 8px; border-radius:6px; font-size:0.85rem;">${sol.score} PTS</span>
        `;
        container.appendChild(chip);
    });
}

function resetAndStartTimer() {
    stopTimer();
    const clockMount = containerRef.querySelector('#clockMountNumbers');
    if (!clockMount) return;

    state.maxTime = multiplayerService.currentRoomCode ? multiplayerService.getMyTimeHandicap() : 30;
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
            stopTimer();
            playGong();
            submitNumberScore();
        }
    }, 1000);
}

function stopTimer() {
    state.isTimerRunning = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
}

function submitNumberScore() {
    if (state.isDealing) return;
    stopTimer();

    // Auto-save current active board state if not already saved!
    const activeTiles = state.workingTiles.filter(t => !t.used);
    if (activeTiles.length > 0) {
        saveCurrentSolutionToNotepad();
    }

    // If still no saved solutions, add raw drawn numbers
    if (state.savedSolutions.length === 0 && state.allDrawnNumbers.length > 0) {
        state.allDrawnNumbers.forEach(num => {
            const diff = Math.abs(num - state.targetNumber);
            let score = 0;
            if (diff === 0) score = 10;
            else if (diff <= 5) score = 7;
            else if (diff <= 10) score = 5;

            state.savedSolutions.push({
                id: `sol_raw_${num}`,
                val: num,
                diff: diff,
                score: score,
                stepsText: `Raw Tile: ${num}`
            });
        });
    }

    // Sort solutions by score descending, then min diff ascending
    state.savedSolutions.sort((a, b) => b.score - a.score || a.diff - b.diff);
    const bestSolution = state.savedSolutions[0] || { val: 0, diff: 999, score: 0, stepsText: 'None' };

    let titleText = "";
    if (bestSolution.diff === 0) {
        titleText = `🎯 EXACT TARGET MATCH (${bestSolution.val})!`;
    } else if (bestSolution.diff <= 5) {
        titleText = `🥈 VERY CLOSE (${bestSolution.val})!`;
    } else if (bestSolution.diff <= 10) {
        titleText = `🥉 WITHIN 10 (${bestSolution.val})!`;
    } else {
        titleText = `❌ OFF BY ${bestSolution.diff} (${bestSolution.val})`;
    }

    const box = containerRef.querySelector('#numberResultBox');
    const title = containerRef.querySelector('#numberResultTitle');
    const scoreEl = containerRef.querySelector('#numberResultScore');
    const diffEl = containerRef.querySelector('#numberResultDiff');

    // HIDE PLAYING CONTROLS (ACTIONS & OPERATORS) TO FREE UP VERTICAL Y-SPACE!
    containerRef.querySelector('.actions-row').classList.add('hidden');
    containerRef.querySelector('.operators-row').classList.add('hidden');

    box.classList.remove('hidden');
    containerRef.querySelector('.ai-section').classList.remove('hidden');

    title.textContent = titleText;
    scoreEl.textContent = `${bestSolution.score} PTS`;
    diffEl.textContent = `Target: ${state.targetNumber} | Declared Solution: ${bestSolution.val} (Difference: ${bestSolution.diff}) — Steps: ${bestSolution.stepsText}`;

    // Submit multiplayer score
    if (multiplayerService.currentRoomCode) {
        multiplayerService.submitRoundResult({
            score: bestSolution.score,
            targetWord: `${bestSolution.val}`,
            declaredNumber: bestSolution.val,
            diff: bestSolution.diff,
            stepsText: bestSolution.stepsText,
            isValid: true // Math is always valid if calculated by the game
        }).catch(e => console.warn("Submitting numbers result:", e));
    }

    // Show placeholder for Next Action
    const sidebar = containerRef.querySelector('.sidebar-card');
    if (sidebar && !sidebar.querySelector('#hostNextActionArea') && multiplayerService.currentRoomCode) {
        const msg = document.createElement('div');
        msg.id = 'hostNextActionArea';
        msg.style.textAlign = 'center';
        msg.style.marginTop = '10px';
        msg.style.color = '#94a3b8';
        msg.style.fontSize = '0.9rem';
        msg.textContent = 'Waiting for others to finish...';
        sidebar.appendChild(msg);
    }
}

function subscribeToMultiplayerEvents() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        if (roomData.activeScreen === 'scoreboard') {
            switchScreen('scoreboard');
            return;
        }
        
        renderScoreboardItemsUI(roomData);
    });
}

function renderScoreboardItemsUI(roomData) {
    const boardCard = containerRef ? containerRef.querySelector('#numbersMultiplayerBoardCard') : null;
    const boardEl = containerRef ? containerRef.querySelector('#resultsMultiplayerBoard') : null;
    if (!boardEl || !roomData) return;

    if (multiplayerService.currentRoomCode) {
        if (boardCard) boardCard.classList.remove('hidden');
    } else {
        if (boardCard) boardCard.classList.add('hidden');
        return;
    }

    boardEl.innerHTML = '';
    const players = roomData.players || {};
    const results = roomData.roundResults || {};

    Object.values(players).forEach(p => {
        const res = results[p.id];
        const isMe = p.id === multiplayerService.currentPlayerId;

        const row = document.createElement('div');
        row.className = 'word-chip';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.margin = '4px 0';
        row.style.background = 'rgba(15, 23, 42, 0.85)';
        row.style.border = res && res.diff === 0 ? '2px solid var(--gold)' : '1px solid var(--border-color, #334155)';

        if (res) {
            let label = `${res.declaredNumber !== undefined ? res.declaredNumber : (res.targetWord || '0')}`;
            if (res.diff === 0) label += ` (EXACT MATCH!)`;
            else if (res.diff !== undefined) label += ` (Off by ${res.diff})`;

            const steps = res.stepsText || 'Direct Tile';

            row.innerHTML = `
                <div style="flex:1; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">
                    <span>${p.isHost ? '👑 ' : '🎮 '}<strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold);">(YOU)</small>' : ''}:</span>
                    <strong style="color:var(--gold); font-size:1rem; margin-left:6px;">${label}</strong>
                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Steps: ${steps}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="chip-len" style="font-weight:900; background:${res.score > 0 ? 'var(--gold)' : '#475569'}; color:#0f172a; padding:3px 8px; border-radius:6px;">${res.score} PTS</span>
                </div>
            `;
        } else {
            row.innerHTML = `
                <div>
                    <span>${p.isHost ? '👑 ' : '🎮 '}<strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold);">(YOU)</small>' : ''}:</span>
                    <span style="color:#94a3b8; font-style:italic; margin-left:6px;">Calculating...</span>
                </div>
                <span style="color:#94a3b8; font-size:0.85rem;">⏳ WAITING</span>
            `;
        }
        boardEl.appendChild(row);
    });

    const actionArea = containerRef ? containerRef.querySelector('#hostNextActionArea') : null;
    if (actionArea) {
        const pCount = Object.keys(players).length;
        const rCount = Object.keys(results).length;
        
        if (rCount >= pCount) {
            if (multiplayerService.isHost(players)) {
                actionArea.innerHTML = `<button id="btnViewScoreboard" class="btn btn-deal" style="font-size:1rem; padding:12px; width:100%;">🏆 VIEW CUMULATIVE SCOREBOARD</button>`;
                const btnScoreboard = document.getElementById('btnViewScoreboard');
                if (btnScoreboard) {
                    btnScoreboard.addEventListener('click', async (e) => {
                        e.target.disabled = true;
                        await multiplayerService.broadcastRoundStart('scoreboard', null);
                    });
                }
            } else {
                actionArea.innerHTML = `Waiting for host to continue...`;
            }
        } else {
            actionArea.innerHTML = `Waiting for others to finish... (${rCount}/${pCount})`;
        }
    }
}

function toggleAIMathSolver() {
    const box = containerRef.querySelector('#numbersAIResults');
    const textEl = containerRef.querySelector('#numbersAISolutionText');

    const isHidden = box.classList.contains('hidden');
    if (isHidden) {
        const solution = solveCountdownNumbers(state.allDrawnNumbers, state.targetNumber);
        if (solution) {
            textEl.innerHTML = `
                <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid var(--gold); text-align:left;">
                    <div style="color:var(--gold); font-weight:900; margin-bottom:8px; font-size:0.95rem;">🎯 EXACT AI SOLUTION STEPS:</div>
                    ${solution.map(s => `<div style="font-family:var(--font-mono); font-size:1.15rem; color:#38bdf8; padding:3px 0; font-weight:800;">👉 ${s}</div>`).join('')}
                </div>
            `;
        } else {
            textEl.innerHTML = `<div style="color:#ef4444; font-weight:800; padding:10px;">No exact solution possible with these numbers.</div>`;
        }
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
}

function solveCountdownNumbers(numbers, target) {
    const results = [];

    function solve(currentNumbers, steps) {
        for (let i = 0; i < currentNumbers.length; i++) {
            if (currentNumbers[i] === target) {
                results.push(steps);
                return true;
            }
        }

        if (currentNumbers.length <= 1) return false;

        for (let i = 0; i < currentNumbers.length; i++) {
            for (let j = 0; j < currentNumbers.length; j++) {
                if (i === j) continue;

                const a = currentNumbers[i];
                const b = currentNumbers[j];
                const rest = currentNumbers.filter((_, idx) => idx !== i && idx !== j);

                // Addition
                if (solve([...rest, a + b], [...steps, `${a} + ${b} = ${a + b}`])) return true;

                // Subtraction
                if (a - b > 0) {
                    if (solve([...rest, a - b], [...steps, `${a} - ${b} = ${a - b}`])) return true;
                }

                // Multiplication
                if (a > 1 && b > 1) {
                    if (solve([...rest, a * b], [...steps, `${a} × ${b} = ${a * b}`])) return true;
                }

                // Division
                if (b > 1 && a % b === 0) {
                    if (solve([...rest, a / b], [...steps, `${a} ÷ ${b} = ${a / b}`])) return true;
                }
            }
        }
        return false;
    }

    solve(numbers, []);
    return results.length > 0 ? results[0] : null;
}
