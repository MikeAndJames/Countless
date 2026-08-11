/**
 * ===================================================================
 * COUNTLESS - LOBBY & REALTIME MULTIPLAYER ROUND LAUNCHER
 * ===================================================================
 */

import { playSound } from '../audio.js';
import { multiplayerService } from '../multiplayer.js';
import { dictionaryEngine } from '../dictionary.js';

let containerRef = null;
let onStartGameCallback = null;

const VOWELS = [...'A'.repeat(15), ...'E'.repeat(21), ...'I'.repeat(13), ...'O'.repeat(13), ...'U'.repeat(5)];
const CONSONANTS = [...'B'.repeat(2), ...'C'.repeat(3), ...'D'.repeat(6), ...'F'.repeat(2), ...'G'.repeat(3), ...'H'.repeat(2), ...'J'.repeat(1), ...'K'.repeat(1), ...'L'.repeat(5), ...'M'.repeat(4), ...'N'.repeat(8), ...'P'.repeat(4), ...'Q'.repeat(1), ...'R'.repeat(9), ...'S'.repeat(9), ...'T'.repeat(9), ...'V'.repeat(1), ...'W'.repeat(1), ...'X'.repeat(1), ...'Y'.repeat(1), ...'Z'.repeat(1)];
const LARGE_NUMBERS = [25, 50, 75, 100];
const SMALL_NUMBERS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

export let lobbySettings = {
    roomCode: 'GRANDAD80',
    allowHouseRules: true
};

export async function renderLobbyScreen(container, onStartGame) {
    containerRef = container;
    onStartGameCallback = onStartGame;

    if (!multiplayerService.currentRoomCode) {
        try {
            await multiplayerService.createRoom('GRANDAD80', 'James & Mike');
        } catch (e) {
            console.warn("Auto-creating room GRANDAD80:", e);
        }
    }

    const currentCode = multiplayerService.currentRoomCode || 'GRANDAD80';

    container.innerHTML = `
        <div class="widescreen-layout">
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Room Lobby</span>
                </div>

                <div class="notepad-section">
                    <span class="section-title">🏠 ROOM CODE:</span>
                    <div style="font-family:var(--font-mono); font-size:1.8rem; font-weight:900; color:var(--gold); text-align:center; padding:6px 0;">
                        ${currentCode}
                    </div>
                </div>

                <div class="notepad-section" style="flex:1;">
                    <span class="section-title">👥 CONNECTED PLAYERS:</span>
                    <div id="lobbyPlayerList" class="saved-words-chips" style="gap:6px;">
                        <span class="notepad-placeholder">Connecting to Firebase...</span>
                    </div>
                </div>
            </aside>

            <main class="center-board">
                <div class="lobby-card">
                    <h2>🎮 MULTIPLAYER GAME LOBBY</h2>

                    <div class="lobby-section">
                        <h3>1. Room Information</h3>
                        <div class="control-group-row">
                            <label>Active Room Code:</label>
                            <input type="text" id="roomCodeInput" class="styled-input" value="${currentCode}" readonly style="text-transform:uppercase; font-weight:900; color:var(--gold);" />
                        </div>
                    </div>

                    <div id="lobbyControlsSection" class="lobby-section">
                        <!-- Rendered dynamically based on Host vs Guest status -->
                    </div>
                </div>
            </main>
        </div>
    `;

    subscribeToRoomUpdates();
}

function subscribeToRoomUpdates() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        if (!containerRef) return;

        // 1. Render Connected Player List
        renderPlayerListUI(roomData.players);

        // 2. Render Host vs Guest Control Section
        const isHost = multiplayerService.isHost(roomData.players);
        renderControlsUI(isHost);

        // 3. AUTO-LAUNCH ROUND FOR ANY DEVICE CURRENTLY IN THE LOBBY!
        if (roomData.status === 'playing' && roomData.activeScreen && onStartGameCallback) {
            onStartGameCallback(roomData.activeScreen, roomData.gameData);
        }
    });
}

function renderControlsUI(isHost) {
    const section = containerRef.querySelector('#lobbyControlsSection');
    if (!section) return;

    if (isHost) {
        section.innerHTML = `
            <h3>2. Launch Game Round (Host Controls)</h3>
            <div class="round-select-grid">
                <button id="btnLaunchLetters" class="btn btn-gold btn-large round-btn">
                    🔤 LETTERS ROUND
                </button>
                <button id="btnLaunchNumbers" class="btn btn-primary btn-large round-btn">
                    🔢 NUMBERS ROUND
                </button>
                <button id="btnLaunchConundrum" class="btn btn-vowel btn-large round-btn">
                    🧩 CONUNDRUM ROUND
                </button>
            </div>
        `;
        attachHostEvents();
    } else {
        section.innerHTML = `
            <div style="background:#0f172a; padding:24px; border-radius:14px; border:2px solid var(--gold); text-align:center;">
                <h3 style="color:var(--gold); font-size:1.4rem; margin-bottom:8px;">⌛ WAITING FOR HOST TO START...</h3>
                <p style="color:#94a3b8; font-size:0.95rem; margin:0;">Sit back! The game round will start automatically on your screen the moment the Host launches it.</p>
            </div>
        `;
    }
}

function attachHostEvents() {
    const btnLetters = containerRef.querySelector('#btnLaunchLetters');
    const btnNumbers = containerRef.querySelector('#btnLaunchNumbers');
    const btnConundrum = containerRef.querySelector('#btnLaunchConundrum');

    if (btnLetters) {
        btnLetters.addEventListener('click', async () => {
            playSound(600, 0.08);

            // Generate Host Letters
            const letters = [];
            for (let i = 0; i < 3; i++) letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
            for (let i = 0; i < 6; i++) letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
            fisherYatesShuffle(letters);

            await multiplayerService.broadcastRoundStart('letters', { drawnLetters: letters });
        });
    }

    if (btnNumbers) {
        btnNumbers.addEventListener('click', async () => {
            playSound(600, 0.08);

            // Generate Host Numbers
            const drawn = [];
            const largeCopy = [...LARGE_NUMBERS];
            const smallCopy = [...SMALL_NUMBERS];
            for (let i = 0; i < 2; i++) drawn.push(largeCopy.splice(Math.floor(Math.random() * largeCopy.length), 1)[0]);
            for (let i = 0; i < 4; i++) drawn.push(smallCopy.splice(Math.floor(Math.random() * smallCopy.length), 1)[0]);
            const target = Math.floor(Math.random() * 899) + 101;

            await multiplayerService.broadcastRoundStart('numbers', { drawnNumbers: drawn, targetNumber: target });
        });
    }

    if (btnConundrum) {
        btnConundrum.addEventListener('click', async () => {
            playSound(600, 0.08);

            // Generate Host Conundrum Word
            const targetWord = await dictionaryEngine.getRandom9LetterWordAsync();
            await multiplayerService.broadcastRoundStart('conundrum', { conundrumWord: targetWord });
        });
    }
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderPlayerListUI(players) {
    const playerListEl = containerRef.querySelector('#lobbyPlayerList');
    if (!playerListEl || !players) return;

    playerListEl.innerHTML = '';
    const playerArray = Object.values(players);

    playerArray.forEach(p => {
        const item = document.createElement('div');
        item.className = 'word-chip';
        item.style.padding = '8px 10px';
        item.style.fontSize = '0.9rem';

        const isMe = p.id === multiplayerService.currentPlayerId;
        
        item.innerHTML = `
            <span>${p.isHost ? '👑 ' : '🎮 '}<strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold);">(YOU)</small>' : ''}</span>
            <span class="chip-len" style="font-size:0.75rem; padding:2px 6px;">
                ⏱️${p.timeHandicap || 30}s | ⭐${p.scoreMultiplier || 1.0}x
            </span>
        `;
        playerListEl.appendChild(item);
    });
}
