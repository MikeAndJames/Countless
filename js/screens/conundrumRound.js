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
import { switchScreen } from '../main.js';

let state = {
    targetWord: "",
    scrambledTiles: [], // [{ id: 0..8, char: 'C', used: false }]
    answerTiles: [],    // [{ id: 0..8, char: 'C' }]
    timerInterval: null,
    buzzTimerInterval: null,
    buzzRemainingSeconds: 5,
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
                    <span class="notepad-placeholder">Buzz in to solve! Tap tiles to lock in your 9-letter answer.<br><br><strong style="color:var(--gold);">Strict TV Rules:</strong> Letters cannot be reversed once clicked! You have 5 seconds per tile action when buzzed in.</span>
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
                    <button id="btnSubmitConundrum" class="btn btn-submit" style="width:100%; font-size:1.1rem; padding:12px;">✅ SUBMIT ANSWER <span style="background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:12px; margin-left:8px; font-weight:900; color:var(--gold);">⏱️ 5s</span></button>
                </div>

                <!-- RESULT CARD -->
                <div id="conundrumResultBox" class="result-card hidden">
                    <div class="result-header">
                        <h3 id="conundrumResultTitle">CORRECT!</h3>
                        <div id="conundrumResultScore" class="score-pill">10 PTS</div>
                    </div>
                    <p id="conundrumResultDef" class="result-def" style="margin-top:6px; font-size:0.95rem;"></p>
                </div>

                <!-- HOST ACTION CONTROLS CONTAINER -->
                <div id="hostConundrumActionArea" class="actions-row hidden" style="margin-top:15px; flex-direction:column; gap:10px; width:100%;">
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
    stopBuzzActionTimer();
    removeKeyboardListener();
}

function handleRoomUpdate(roomData) {
    if (!roomData) return;

    if (roomData.activeScreen === 'scoreboard') {
        stopBuzzActionTimer();
        switchScreen('scoreboard');
        return;
    }
    if (roomData.status === 'lobby' || roomData.activeScreen === 'lobby') {
        stopBuzzActionTimer();
        switchScreen('lobby');
        return;
    }
    if (roomData.status === 'playing' && roomData.activeScreen && roomData.activeScreen !== 'conundrum') {
        stopBuzzActionTimer();
        switchScreen(roomData.activeScreen, roomData.gameData);
        return;
    }

    if (!roomData.conundrumState) return;
    const cState = roomData.conundrumState;

    if (cState.status === "ended") {
        stopTimer();
        stopBuzzActionTimer();
        removeKeyboardListener();
        const buzzBtn = containerRef ? containerRef.querySelector('#btnBuzz') : null;
        if (buzzBtn) buzzBtn.disabled = true;
        if (containerRef) {
            containerRef.querySelector('#buzzSection').classList.add('hidden');
            containerRef.querySelector('#conundrumActions').classList.add('hidden');
        }
        renderHostConundrumControls(roomData);
        return;
    }

    const amILockedOut = cState.lockedOutPlayers && cState.lockedOutPlayers.includes(multiplayerService.currentPlayerId);

    if (cState.status === "buzzed") {
        stopTimer();
        state.remainingSeconds = cState.frozenSeconds;
        
        const buzzBtn = containerRef.querySelector('#btnBuzz');
        
        // If I am the one who buzzed:
        if (cState.buzzedPlayerId === multiplayerService.currentPlayerId) {
            state.isBuzzed = true;
            buzzBtn.disabled = true;
            buzzBtn.textContent = `🚨 YOU ARE SOLVING!`;
            containerRef.querySelector('#buzzSection').classList.add('hidden');
            containerRef.querySelector('#conundrumActions').classList.remove('hidden');
            attachKeyboardListener();
            renderTilesUI(); // RE-RENDER SO TILES BECOME CLICKABLE!
            startBuzzActionTimer();
        } else {
            // Someone else buzzed! I just watch.
            state.isBuzzed = false;
            stopBuzzActionTimer();
            containerRef.querySelector('#buzzSection').classList.remove('hidden');
            containerRef.querySelector('#conundrumActions').classList.add('hidden');

            if (amILockedOut) {
                buzzBtn.disabled = true;
                buzzBtn.textContent = "❌ YOU ARE LOCKED OUT";
            } else {
                buzzBtn.disabled = true;
                buzzBtn.textContent = `🚨 ${cState.buzzedPlayerName.toUpperCase()} IS SOLVING!`;
            }
        }

        // Live Sync Remote Guess!
        if (cState.currentGuess !== undefined && cState.buzzedPlayerId !== multiplayerService.currentPlayerId) {
            syncRemoteGuess(cState.currentGuess);
        }
    } 
    else if (cState.status === "running") {
        stopBuzzActionTimer();
        
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
    const hostActionArea = containerRef.querySelector('#hostConundrumActionArea');
    if (hostActionArea) hostActionArea.classList.add('hidden');
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

    // RESET 5-SECOND ACTION TIMER FOR NEXT LETTER INPUT!
    resetBuzzActionTimer();

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
        startBuzzActionTimer();
    }
}

async function submitConundrumAnswer() {
    if (!state.isBuzzed) return;

    const guess = state.answerTiles.map(t => t.char).join('');
    if (!guess) return;

    stopBuzzActionTimer();
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
        renderHostConundrumControls();
    } else {
        resultBox.classList.add('invalid');
        title.textContent = `❌ INCORRECT GUESS! "${guess}"`;
        scorePill.textContent = `0 PTS`;
        
        if (multiplayerService.currentRoomCode) {
            defText.textContent = "Oops! You are locked out. Others can still guess!";
            // Lock this player out and unfreeze the room for others!
            multiplayerService.resolveConundrumGuess(false, multiplayerService.currentPlayerId);
            
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

function renderHostConundrumControls(roomData = null) {
    const actionArea = containerRef ? containerRef.querySelector('#hostConundrumActionArea') : null;
    if (!actionArea) return;

    if (!multiplayerService.currentRoomCode) {
        actionArea.classList.add('hidden');
        return;
    }

    actionArea.classList.remove('hidden');
    const players = roomData ? roomData.players : null;
    const isHost = multiplayerService.isHost(players);

    if (isHost) {
        actionArea.innerHTML = `
            <div style="text-align:center; color:var(--gold); font-weight:800; margin-bottom:4px; font-size:1.1rem;">👑 HOST GAME CONTROLS</div>
            <button id="btnConundrumScoreboard" class="btn btn-deal" style="width:100%; font-size:1.05rem; padding:12px;">🏆 VIEW CUMULATIVE SCOREBOARD</button>
            <div style="display:flex; gap:10px; width:100%; margin-top:6px; flex-wrap:wrap;">
                <button id="btnHostNextLetters" class="btn btn-vowel" style="flex:1; min-width:130px; padding:10px; font-size:0.9rem;">🔤 NEXT: LETTERS</button>
                <button id="btnHostNextNumbers" class="btn btn-vowel" style="flex:1; min-width:130px; padding:10px; font-size:0.9rem;">🔢 NEXT: NUMBERS</button>
                <button id="btnHostNextConundrum" class="btn btn-vowel" style="flex:1; min-width:130px; padding:10px; font-size:0.9rem;">🎲 NEXT CONUNDRUM</button>
            </div>
            <button id="btnHostEndGame" class="btn btn-submit" style="width:100%; background:#ef4444; margin-top:6px; padding:10px; font-size:0.95rem;">🛑 END GAME (RETURN TO LOBBY)</button>
        `;

        const btnScoreboard = actionArea.querySelector('#btnConundrumScoreboard');
        if (btnScoreboard) {
            btnScoreboard.addEventListener('click', async (e) => {
                e.target.disabled = true;
                await multiplayerService.broadcastRoundStart('scoreboard', null);
            });
        }

        const btnLetters = actionArea.querySelector('#btnHostNextLetters');
        if (btnLetters) {
            btnLetters.addEventListener('click', async (e) => {
                e.target.disabled = true;
                const VOWELS = ['A','E','I','O','U'];
                const CONS = ['B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','X','Y','Z'];
                let letters = [];
                for(let i=0; i<4; i++) letters.push(VOWELS[Math.floor(Math.random()*VOWELS.length)]);
                for(let i=0; i<5; i++) letters.push(CONS[Math.floor(Math.random()*CONS.length)]);
                await multiplayerService.broadcastRoundStart('letters', { drawnLetters: letters });
            });
        }

        const btnNumbers = actionArea.querySelector('#btnHostNextNumbers');
        if (btnNumbers) {
            btnNumbers.addEventListener('click', async (e) => {
                e.target.disabled = true;
                const LARGE = [25, 50, 75, 100];
                const SMALL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
                let drawn = [];
                const largeCopy = [...LARGE];
                const smallCopy = [...SMALL];
                for (let i=0; i<2; i++) drawn.push(largeCopy.splice(Math.floor(Math.random()*largeCopy.length), 1)[0]);
                for (let i=0; i<4; i++) drawn.push(smallCopy.splice(Math.floor(Math.random()*smallCopy.length), 1)[0]);
                const target = Math.floor(Math.random() * 899) + 101;
                await multiplayerService.broadcastRoundStart('numbers', { drawnNumbers: drawn, targetNumber: target });
            });
        }

        const btnNextConundrum = actionArea.querySelector('#btnHostNextConundrum');
        if (btnNextConundrum) {
            btnNextConundrum.addEventListener('click', async (e) => {
                e.target.disabled = true;
                const targetWord = await dictionaryEngine.getRandom9LetterWordAsync();
                const scrambled = scrambleWord(targetWord);
                await multiplayerService.broadcastRoundStart('conundrum', { conundrumWord: targetWord, scrambledWord: scrambled });
            });
        }

        const btnEndGame = actionArea.querySelector('#btnHostEndGame');
        if (btnEndGame) {
            btnEndGame.addEventListener('click', async (e) => {
                e.target.disabled = true;
                await multiplayerService.updateGameState({ status: 'lobby', activeScreen: 'lobby' });
            });
        }
    } else {
        actionArea.innerHTML = `
            <div style="text-align:center; color:#94a3b8; font-size:1rem; font-weight:600; padding:10px;">
                Waiting for host to select the next action...
            </div>
        `;
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

    state.maxTime = multiplayerService.currentRoomCode ? multiplayerService.getMyTimeHandicap() : 30;
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

    if (multiplayerService.currentRoomCode) {
        multiplayerService.updateGameState({ "conundrumState/status": "ended" });
    }
    renderHostConundrumControls();
}

function startBuzzActionTimer() {
    stopBuzzActionTimer();
    state.buzzRemainingSeconds = 5;
    updateBuzzTimerUI();

    state.buzzTimerInterval = setInterval(() => {
        state.buzzRemainingSeconds--;
        updateBuzzTimerUI();
        playSound(900, 0.03); // Ticking sound

        if (state.buzzRemainingSeconds <= 0) {
            stopBuzzActionTimer();
            handleBuzzTimeout();
        }
    }, 1000);
}

function stopBuzzActionTimer() {
    if (state.buzzTimerInterval) {
        clearInterval(state.buzzTimerInterval);
        state.buzzTimerInterval = null;
    }
}

function resetBuzzActionTimer() {
    if (state.isBuzzed) {
        stopBuzzActionTimer();
        state.buzzRemainingSeconds = 5;
        updateBuzzTimerUI();
        startBuzzActionTimer();
    }
}

function updateBuzzTimerUI() {
    const submitBtn = containerRef ? containerRef.querySelector('#btnSubmitConundrum') : null;
    if (submitBtn) {
        submitBtn.innerHTML = `✅ SUBMIT ANSWER <span style="background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:12px; margin-left:8px; font-weight:900; color:var(--gold);">⏱️ ${state.buzzRemainingSeconds}s</span>`;
    }
}

function handleBuzzTimeout() {
    stopBuzzActionTimer();
    removeKeyboardListener();

    if (!containerRef) return;
    containerRef.querySelector('#conundrumActions').classList.add('hidden');

    const resultBox = containerRef.querySelector('#conundrumResultBox');
    const title = containerRef.querySelector('#conundrumResultTitle');
    const scorePill = containerRef.querySelector('#conundrumResultScore');
    const defText = containerRef.querySelector('#conundrumResultDef');

    if (resultBox && title && scorePill && defText) {
        resultBox.classList.remove('hidden');
        resultBox.classList.add('invalid');
        title.textContent = `⏱️ BUZZ TIMER EXPIRED!`;
        scorePill.textContent = `0 PTS`;
        defText.textContent = "You took more than 5 seconds without selecting a letter! You are locked out.";

        setTimeout(() => {
            resultBox.classList.add('hidden');
        }, 3500);
    }

    playSound(220, 0.4);

    if (multiplayerService.currentRoomCode) {
        multiplayerService.resolveConundrumGuess(false, multiplayerService.currentPlayerId);
    }
}
