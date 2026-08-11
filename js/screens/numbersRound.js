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
    clockComp: null
};

let containerRef = null;

export function renderNumbersRound(container, initialGameData = null) {
    containerRef = container;
    container.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR: TITLE, TIMER, DEAL BUTTON, EQUATION HISTORY -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Numbers Round</span>
                </div>

                <div class="sidebar-timer-box" id="clockMountNumbers"></div>

                <button id="btnNewNumbersRound" class="btn btn-deal">🎲 DEAL NUMBERS</button>

                <div class="notepad-section">
                    <span class="section-title">📝 EQUATION STEPS:</span>
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
                <div class="actions-row">
                    <button id="btnUndoStep" class="btn btn-secondary">↩️ UNDO STEP</button>
                    <button id="btnSubmitNumber" class="btn btn-submit" style="flex:1;">✅ DECLARE SCORE</button>
                </div>

                <!-- RESULT CARD -->
                <div id="numberResultBox" class="result-card hidden">
                    <div class="result-header">
                        <h3 id="numberResultTitle">EXACT TARGET!</h3>
                        <div id="numberResultScore" class="score-pill">10 PTS</div>
                    </div>
                    <p id="numberResultDiff" class="result-def"></p>
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
    const btnSubmit = containerRef.querySelector('#btnSubmitNumber');
    const btnAI = containerRef.querySelector('#btnSolveNumbersAI');
    const btnCloseAI = containerRef.querySelector('#btnCloseNumbersAI');

    btnNew.addEventListener('click', () => startNewNumbersRound());
    btnUndo.addEventListener('click', undoLastStep);
    btnSubmit.addEventListener('click', submitNumberScore);
    btnAI.addEventListener('click', toggleAIMathSolver);
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
    state.isDealing = true;

    containerRef.querySelector('#targetDisplay').textContent = state.targetNumber;
    containerRef.querySelector('.actions-row').classList.remove('hidden');
    containerRef.querySelector('.operators-row').classList.remove('hidden');
    containerRef.querySelector('#numberResultBox').classList.add('hidden');
    containerRef.querySelector('.ai-section').classList.add('hidden');
    containerRef.querySelector('#numbersAIResults').classList.add('hidden');

    // Reset clock display
    const clockMount = containerRef.querySelector('#clockMountNumbers');
    state.maxTime = 30;
    state.clockComp = new CountdownClockComponent(clockMount, state.maxTime);
    state.clockComp.update(0);

    renderTilesUI();
    renderHistoryUI();

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

function resetAndStartTimer() {
    stopTimer();
    const clockMount = containerRef.querySelector('#clockMountNumbers');
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

    const activeTiles = state.workingTiles.filter(t => !t.used);
    if (activeTiles.length === 0) return;

    let closestTile = activeTiles[0];
    let minDiff = Math.abs(closestTile.val - state.targetNumber);

    activeTiles.forEach(t => {
        const diff = Math.abs(t.val - state.targetNumber);
        if (diff < minDiff) {
            minDiff = diff;
            closestTile = t;
        }
    });

    let score = 0;
    let titleText = "";
    if (minDiff === 0) {
        score = 10;
        titleText = `🎯 EXACT TARGET MATCH (${closestTile.val})!`;
    } else if (minDiff <= 5) {
        score = 7;
        titleText = `🥈 VERY CLOSE (${closestTile.val})!`;
    } else if (minDiff <= 10) {
        score = 5;
        titleText = `🥉 WITHIN 10 (${closestTile.val})!`;
    } else {
        score = 0;
        titleText = `❌ OFF BY ${minDiff} (${closestTile.val})`;
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
    scoreEl.textContent = `${score} PTS`;
    diffEl.textContent = `Target: ${state.targetNumber} | Your Closest: ${closestTile.val} (Difference: ${minDiff})`;

    // Submit multiplayer score
    if (multiplayerService.currentRoomCode) {
        multiplayerService.submitRoundResult({
            score: score,
            isValid: true // Math is always valid if calculated by the game
        }).catch(e => console.warn("Submitting numbers result:", e));
    }

    // Show View Scoreboard button for Host
    const sidebar = containerRef.querySelector('.sidebar-card');
    if (sidebar && !sidebar.querySelector('#btnViewScoreboard') && multiplayerService.isHost()) {
        const btn = document.createElement('button');
        btn.id = 'btnViewScoreboard';
        btn.className = 'btn btn-deal';
        btn.style.marginTop = '10px';
        btn.style.padding = '12px';
        btn.innerHTML = '🏆 VIEW CUMULATIVE SCOREBOARD';
        btn.onclick = async () => {
            playSound(600, 0.08);
            await multiplayerService.broadcastRoundStart('scoreboard', null);
        };
        sidebar.appendChild(btn);
    } else if (sidebar && !sidebar.querySelector('#btnWaitHost') && !multiplayerService.isHost() && multiplayerService.currentRoomCode) {
        const msg = document.createElement('div');
        msg.id = 'btnWaitHost';
        msg.style.textAlign = 'center';
        msg.style.marginTop = '10px';
        msg.style.color = '#94a3b8';
        msg.style.fontSize = '0.9rem';
        msg.textContent = 'Waiting for host to continue...';
        sidebar.appendChild(msg);
    }
}

function subscribeToMultiplayerEvents() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        if (roomData.activeScreen === 'scoreboard') {
            switchScreen('scoreboard');
        }
    });
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
