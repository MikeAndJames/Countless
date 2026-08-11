/**
 * ===================================================================
 * COUNTLESS - LOBBY & LIVE MULTIPLAYER PLAYER LIST MODULE
 * ===================================================================
 */

import { playSound } from '../audio.js';
import { multiplayerService } from '../multiplayer.js';

let containerRef = null;
let onStartGameCallback = null;

export let lobbySettings = {
    roomCode: 'GRAMPS80',
    allowHouseRules: true
};

export function renderLobbyScreen(container, onStartGame) {
    containerRef = container;
    onStartGameCallback = onStartGame;

    const currentCode = multiplayerService.currentRoomCode || 'GRAMPS80';

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

                    <div class="lobby-section">
                        <h3>2. Launch Game Round (Host Controls)</h3>
                        <div class="round-select-grid">
                            <button class="btn btn-gold btn-large round-btn" data-round="letters">
                                🔤 LETTERS ROUND
                            </button>
                            <button class="btn btn-primary btn-large round-btn" data-round="numbers">
                                🔢 NUMBERS ROUND
                            </button>
                            <button class="btn btn-vowel btn-large round-btn" data-round="conundrum">
                                🧩 CONUNDRUM ROUND
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    attachEvents();
    subscribeToRoomUpdates();
}

function attachEvents() {
    const roundBtns = containerRef.querySelectorAll('.round-btn');
    roundBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const roundType = btn.getAttribute('data-round');
            playSound(600, 0.08);
            if (onStartGameCallback) {
                onStartGameCallback(roundType);
            }
        });
    });
}

function subscribeToRoomUpdates() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        renderPlayerListUI(roomData.players);
    });
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
        const hostBadge = p.isHost ? '👑 HOST' : 'PLAYER';
        
        item.innerHTML = `
            <span>${p.isHost ? '👑 ' : '🎮 '}<strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold);">(YOU)</small>' : ''}</span>
            <span class="chip-len" style="font-size:0.75rem; padding:2px 6px;">
                ⏱️${p.timeHandicap || 30}s | ⭐${p.scoreMultiplier || 1.0}x
            </span>
        `;
        playerListEl.appendChild(item);
    });
}
