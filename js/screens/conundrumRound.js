/**
 * ===================================================================
 * COUNTLESS - CONUNDRUM ROUND MODULE (STRICT TV CONUNDRUM RULES)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Dynamic 9-Letter Word: Picks a random 9-letter word from the 202,133-word dictionary.
 * - Strict TV Rules: Clicking top scrambled tiles locks them permanently into your answer slots (NO REVERSING/NO UNDO!).
 * - 180° Sweeping Clock & Buzz-In System.
 */

import { dictionaryEngine } from '../dictionary.js';
import { playSound, playTick, playGong, playVictoryChime } from '../audio.js';
import { CountdownClockComponent } from '../clock.js';
import { multiplayerService } from '../multiplayer.js';

let state = {
    targetWord: "",
    scrambledTiles: [], // [{ id: 0..8, char: 'C', used: false }]
    answerTiles: [],    // [{ id: 0..8, char: 'C' }]
    timerInterval: null,
    remainingSeconds: 30,
    maxTime: 30,
    isBuzzed: false,
    clockComp: null
};

let containerRef = null;
let keyListener = null;

export function renderConundrumRound(container, initialGameData = null) {
    containerRef = container;
    container.innerHTML = `
        <div class="widescreen-layout">
            <!-- LEFT SIDEBAR -->
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Conundrum Round</span>
                </div>

                <div class="sidebar-timer-box" id="clockMountConundrum"></div>

                <button id="btnNewConundrum" class="btn btn-deal">🎲 NEXT CONUNDRUM</button>

                <div class="notepad-section">
                    <span class="section-title">💡 CONUNDRUM RULES:</span>
                    <span class="notepad-placeholder">Buzz in to solve! Tap tiles to lock in your 9-letter answer.<br><br><strong style="color:var(--gold);">Strict TV Rules:</strong> Letters cannot be reversed once clicked!</span>
                </div>
            </aside>

            <!-- MAIN CENTER WIDE BOARD -->
            <main class="center-board">
                <!-- TOP SCRAMBLED TILES GRID -->
                <div class="grid-section">
                    <span class="section-title">9-LETTER SCRAMBLED CONUNDRUM:</span>
                    <div id="scrambledDisplay" class="row-9-grid"></div>
                </div>

                <!-- BOTTOM ANSWER TILES GRID -->
                <div class="grid-section">
                    <div class="section-label-row">
                        <span class="section-title">YOUR ANSWER (TAP TILES TO LOCK IN):</span>
                        <span id="conundrumWordLen" class="word-len-label">0 / 9</span>
                    </div>
                    <div id="answerDisplay" class="row-9-grid"></div>
                </div>

                <!-- BUZZ IN BUTTON (BEFORE BUZZING) -->
                <div id="buzzSection" class="actions-row">
                    <button id="btnBuzz" class="btn btn-gold btn-full btn-large" style="padding:14px; font-size:1.15rem; width:100%;">🚨 BUZZ IN TO SOLVE!</button>
                </div>

                <!-- SUBMIT BUTTON (AFTER BUZZING) -->
                <div id="conundrumActions" class="actions-row hidden">
                    <button id="btnSubmitConundrum" class="btn btn-submit" style="width:100%; font-size:1.1rem; padding:12px;">✅ SUBMIT ANSWER</button>
                </div>

                <!-- RESULT CARD -->
                <div id="conundrumResultBox" class="result-card hidden">
                    <div class="result-header">
                        <h3 id="conundrumResultTitle">CORRECT!</h3>
                        <div id="conundrumResultScore" class="score-pill">10 PTS</div>
                    </div>
                    <p id="conundrumResultDef" class="result-def" style="margin-top:6px; font-size:0.95rem;"></p>
                </div>
            </main>
        </div>
    `;

    attachEvents();
    startNewConundrum(initialGameData);

    // Multi-player listener for Conundrum State
    if (multiplayerService.currentRoomCode) {
        multiplayerService.listenToRoom(multiplayerService.currentRoomCode, handleRoomUpdate);
    }
}

export function cleanupConundrumRound() {
    stopTimer();
    removeKeyboardListener();
}

function handleRoomUpdate(roomData) {
    if (!roomData || !roomData.conundrumState) return;
    const cState = roomData.conundrumState;

    if (cState.status === "buzzed") {
        stopTimer();
        state.remainingSeconds = cState.frozenSeconds;
        
        const buzzBtn = containerRef.querySelector('#btnBuzz');
        buzzBtn.disabled = true;
        buzzBtn.textContent = `🚨 ${cState.buzzedPlayerName.toUpperCase()} IS SOLVING!`;

        // If I am the one who buzzed:
        if (cState.buzzedPlayerId === multiplayerService.currentPlayerId) {
            state.isBuzzed = true;
            containerRef.querySelector('#buzzSection').classList.add('hidden');
            containerRef.querySelector('#conundrumActions').classList.remove('hidden');
            attachKeyboardListener();
        } else {
            // Someone else buzzed! I just watch.
            state.isBuzzed = false;
            containerRef.querySelector('#buzzSection').classList.remove('hidden');
            containerRef.querySelector('#conundrumActions').classList.add('hidden');
        }

        // Live Sync Remote Guess!
        if (cState.currentGuess !== undefined && cState.buzzedPlayerId !== multiplayerService.currentPlayerId) {
            syncRemoteGuess(cState.currentGuess);
        }
    } 
    else if (cState.status === "running") {
        // Round resumed after a wrong guess!
        // Lock out players who guessed wrong
        const amILockedOut = cState.lockedOutPlayers && cState.lockedOutPlayers.includes(multiplayerService.currentPlayerId);
        
        const buzzBtn = containerRef.querySelector('#btnBuzz');
        buzzBtn.classList.remove('hidden');
        containerRef.querySelector('#buzzSection').classList.remove('hidden');
        containerRef.querySelector('#conundrumActions').classList.add('hidden');
        
        if (amILockedOut) {
            buzzBtn.disabled = true;
            buzzBtn.textContent = "❌ YOU ARE LOCKED OUT";
        } else {
            buzzBtn.disabled = false;
            buzzBtn.textContent = "🚨 BUZZ IN TO SOLVE!";
        }

        state.isBuzzed = false;
        removeKeyboardListener();
        
        // Clear guess array and reset tiles to unused
        state.answerTiles = [];
        state.scrambledTiles.forEach(t => t.used = false);
        renderTilesUI();

        // Resume timer from frozen time
        state.remainingSeconds = cState.frozenSeconds;
        resumeTimer();
    }
}

function syncRemoteGuess(guessStr) {
    state.answerTiles = [];
    state.scrambledTiles.forEach(t => t.used = false);
    
    for (const char of guessStr) {
        const availableTile = state.scrambledTiles.find(t => t.char === char && !t.used);
        if (availableTile) {
            availableTile.used = true;
            state.answerTiles.push({ id: availableTile.id, char: availableTile.char });
        }
    }
    renderTilesUI();
}

function resumeTimer() {
    stopTimer();
    state.clockComp.update(state.maxTime - state.remainingSeconds);
    state.timerInterval = setInterval(() => {
        state.remainingSeconds--;
        const timeSoFar = state.maxTime - state.remainingSeconds;
        if (state.clockComp) state.clockComp.update(timeSoFar);
        playTick(state.remainingSeconds % 2 === 0);
        if (state.remainingSeconds <= 0) {
            stopTimer();
            playGong();
            handleTimeout();
        }
    }, 1000);
}

function attachEvents() {
    containerRef.querySelector('#btnNewConundrum').addEventListener('click', () => startNewConundrum());
    containerRef.querySelector('#btnBuzz').addEventListener('click', buzzIn);
    containerRef.querySelector('#btnSubmitConundrum').addEventListener('click', submitConundrumAnswer);
}

function attachKeyboardListener() {
    removeKeyboardListener();
    keyListener = (e) => {
        if (!state.isBuzzed) return;

        const key = e.key.toUpperCase();
        if (key === 'ENTER') {
            submitConundrumAnswer();
        } else if (/^[A-Z]$/.test(key)) {
            // Find top scrambled tile with this letter that hasn't been used yet
            const availableTile = state.scrambledTiles.find(t => t.char === key && !t.used);
            if (availableTile) {
                selectTopTile(availableTile);
            }
        }
    };
    window.addEventListener('keydown', keyListener);
}

function removeKeyboardListener() {
    if (keyListener) {
        window.removeEventListener('keydown', keyListener);
        keyListener = null;
    }
}

async function startNewConundrum(initialGameData = null) {
    stopTimer();
    removeKeyboardListener();

    if (initialGameData && initialGameData.conundrumWord) {
        state.targetWord = initialGameData.conundrumWord.toUpperCase();
    } else {
        // 1. Pick a random 9-letter word from the 202,133-word dictionary!
        state.targetWord = await dictionaryEngine.getRandom9LetterWordAsync();
    }

    let scrambledChars;
    if (initialGameData && initialGameData.scrambledWord) {
        scrambledChars = initialGameData.scrambledWord;
    } else {
        scrambledChars = scrambleWord(state.targetWord);
    }

    state.scrambledTiles = scrambledChars.split('').map((char, index) => ({
        id: index,
        char: char,
        used: false
    }));
    state.answerTiles = [];
    state.isBuzzed = false;

    // 2. Reset UI elements
    containerRef.querySelector('#conundrumResultBox').classList.add('hidden');
    containerRef.querySelector('#conundrumActions').classList.add('hidden');
    containerRef.querySelector('#buzzSection').classList.remove('hidden');
    containerRef.querySelector('#btnBuzz').disabled = false;

    renderTilesUI();

    // 3. Start 30-Second Sweeping Clock Timer
    resetAndStartTimer();
    playSound(520, 0.08);
}

export function scrambleWord(word) {
    const chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const scrambled = chars.join('');
    if (scrambled === word && word.length > 1) {
        return scrambleWord(word);
    }
    return scrambled;
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
    // 1. Render Top Scrambled Display
    const topGrid = containerRef.querySelector('#scrambledDisplay');
    if (!topGrid) return;
    topGrid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const tile = state.scrambledTiles[i];
        const card = document.createElement('div');

        if (tile) {
            let classes = 'tile top-tile';
            if (tile.used) classes += ' used';
            card.className = classes;
            card.textContent = tile.char;

            // Clicking top tile locks it into answer slot if buzzed in and not used!
            if (state.isBuzzed && !tile.used) {
                addTouchAndClickListener(card, () => selectTopTile(tile));
            }
        } else {
            card.className = 'tile bottom-slot';
            card.textContent = '';
        }
        topGrid.appendChild(card);
    }

    // 2. Render Bottom Answer Display (NO CLICK LISTENER: STRICT TV RULES - CANNOT BE REVERSED!)
    const bottomGrid = containerRef.querySelector('#answerDisplay');
    if (!bottomGrid) return;
    bottomGrid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const tile = state.answerTiles[i];
        const card = document.createElement('div');

        if (tile) {
            card.className = 'tile bottom-slot filled';
            card.textContent = tile.char;
        } else {
            card.className = 'tile bottom-slot';
            card.textContent = '';
        }
        bottomGrid.appendChild(card);
    }

    // Update length counter
    const lenEl = containerRef.querySelector('#conundrumWordLen');
    if (lenEl) {
        lenEl.textContent = `${state.answerTiles.length} / 9`;
    }
}

function selectTopTile(tile) {
    if (!state.isBuzzed || tile.used || state.answerTiles.length >= 9) return;

    // Lock in tile permanently (used = true)
    tile.used = true;
    state.answerTiles.push({ id: tile.id, char: tile.char });
    playSound(600, 0.04);
    renderTilesUI();

    // LIVE SYNC: Tell Firebase what we typed so far!
    if (multiplayerService.currentRoomCode) {
        const currentGuessStr = state.answerTiles.map(t => t.char).join('');
        multiplayerService.updateConundrumGuess(currentGuessStr);
    }

    // If all 9 letters are locked in, evaluate immediately!
    if (state.answerTiles.length === 9) {
        submitConundrumAnswer();
    }
}

function buzzIn() {
    // ONLY buzz in if we are online!
    if (multiplayerService.currentRoomCode) {
        playSound(880, 0.2);
        containerRef.querySelector('#btnBuzz').disabled = true;
        // Tell Firebase we buzzed in, which will freeze everyone's clock via handleRoomUpdate!
        multiplayerService.buzzInConundrum(state.remainingSeconds);
    } else {
        // Fallback for purely local offline play
        state.isBuzzed = true;
        stopTimer();
        playSound(880, 0.2);

        containerRef.querySelector('#btnBuzz').disabled = true;
        containerRef.querySelector('#buzzSection').classList.add('hidden');
        containerRef.querySelector('#conundrumActions').classList.remove('hidden');

        attachKeyboardListener();
        renderTilesUI();
    }
}

async function submitConundrumAnswer() {
    if (!state.isBuzzed) return;

    const guess = state.answerTiles.map(t => t.char).join('');
    if (!guess) return;

    removeKeyboardListener();
    containerRef.querySelector('#conundrumActions').classList.add('hidden');

    const resultBox = containerRef.querySelector('#conundrumResultBox');
    const title = containerRef.querySelector('#conundrumResultTitle');
    const scorePill = containerRef.querySelector('#conundrumResultScore');
    const defText = containerRef.querySelector('#conundrumResultDef');

    resultBox.classList.remove('hidden');

    const scrambledStr = state.scrambledTiles.map(t => t.char).join('');
    const isAnagram = isAnagramOfScrambled(guess, scrambledStr);
    const isValidDictWord = dictionaryEngine.isValidWord(guess);

    if (guess === state.targetWord || (isAnagram && isValidDictWord)) {
        resultBox.classList.remove('invalid');
        title.textContent = `🎯 CORRECT CONUNDRUM! "${guess}"`;
        scorePill.textContent = `10 PTS`;
        const def = await dictionaryEngine.getDefinitionAsync(guess);
        defText.textContent = `Definition: ${def}`;
        playVictoryChime();
        
        if (multiplayerService.currentRoomCode) {
            multiplayerService.resolveConundrumGuess(true, []);
            multiplayerService.submitRoundResult({ score: 10, targetWord: state.targetWord, guess: guess });
        }
    } else {
        resultBox.classList.add('invalid');
        title.textContent = `❌ INCORRECT GUESS! "${guess}"`;
        scorePill.textContent = `0 PTS`;
        
        if (multiplayerService.currentRoomCode) {
            defText.textContent = "Oops! You are locked out. Others can still guess!";
            // Lock this player out and unfreeze the room for others!
            multiplayerService.resolveConundrumGuess(false, [multiplayerService.currentPlayerId]);
            
            // Hide the red result box after 3.5 seconds so we can see the board again
            setTimeout(() => {
                resultBox.classList.add('hidden');
            }, 3500);
        } else {
            const def = await dictionaryEngine.getDefinitionAsync(state.targetWord);
            defText.textContent = `The target 9-letter word was "${state.targetWord}". Definition: ${def}`;
        }
        playSound(220, 0.3);
    }
}

function isAnagramOfScrambled(guess, scrambled) {
    if (guess.length !== 9 || scrambled.length !== 9) return false;
    const count = {};
    for (const char of scrambled) {
        count[char] = (count[char] || 0) + 1;
    }
    for (const char of guess) {
        if (!count[char]) return false;
        count[char]--;
    }
    return true;
}

function resetAndStartTimer() {
    stopTimer();
    const clockMount = containerRef.querySelector('#clockMountConundrum');
    if (!clockMount) return;

    state.maxTime = 30;
    state.clockComp = new CountdownClockComponent(clockMount, state.maxTime);
    state.remainingSeconds = state.maxTime;
    state.clockComp.update(0);

    state.timerInterval = setInterval(() => {
        state.remainingSeconds--;
        const timeSoFar = state.maxTime - state.remainingSeconds;
        if (state.clockComp) state.clockComp.update(timeSoFar);

        playTick(state.remainingSeconds % 2 === 0);

        if (state.remainingSeconds <= 0) {
            stopTimer();
            playGong();
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
}

async function handleTimeout() {
    removeKeyboardListener();
    containerRef.querySelector('#buzzSection').classList.add('hidden');
    containerRef.querySelector('#conundrumActions').classList.add('hidden');

    const resultBox = containerRef.querySelector('#conundrumResultBox');
    const title = containerRef.querySelector('#conundrumResultTitle');
    const scorePill = containerRef.querySelector('#conundrumResultScore');
    const defText = containerRef.querySelector('#conundrumResultDef');

    resultBox.classList.remove('hidden');
    resultBox.classList.add('invalid');

    title.textContent = `⏰ TIME IS UP!`;
    scorePill.textContent = `0 PTS`;
    const def = await dictionaryEngine.getDefinitionAsync(state.targetWord);
    defText.textContent = `The correct 9-letter word was "${state.targetWord}". Definition: ${def}`;
}
