/**
 * ===================================================================
 * COUNTLESS - LOBBY & ROOM MODULE (16:9 WIDESCREEN LANDSCAPE)
 * ===================================================================
 */

import { playSound } from '../audio.js';

let containerRef = null;
let onStartGameCallback = null;

export let lobbySettings = {
    roomCode: 'GRANDAD80',
    handicap: 'mult20',
    allowHouseRules: true // true = House Rules (Online challenges award points), false = Strict TV Rules (Vibes only)
};

export function renderLobbyScreen(container, onStartGame) {
    containerRef = container;
    onStartGameCallback = onStartGame;

    container.innerHTML = `
        <div class="widescreen-layout">
            <aside class="sidebar-card">
                <div class="sidebar-header">
                    <h1 class="app-title">COUNTLESS 🎂</h1>
                    <span class="sub-tag">Room Lobby</span>
                </div>

                <div class="notepad-section">
                    <span class="section-title">🎮 MULTIPLAYER:</span>
                    <span class="notepad-placeholder">Host invites players to join using the room code!</span>
                </div>
            </aside>

            <main class="center-board">
                <div class="lobby-card">
                    <h2>🎮 MULTIPLAYER GAME LOBBY & HOUSE RULES</h2>

                    <div class="lobby-section">
                        <h3>1. Room & Dictionary Settings</h3>
                        <div class="control-group-row">
                            <label>Room Code:</label>
                            <input type="text" id="roomCodeInput" class="styled-input" value="${lobbySettings.roomCode}" style="text-transform:uppercase; font-weight:800;" />
                        </div>
                        <div class="control-group-row">
                            <label>Player Handicap:</label>
                            <select id="lobbyHandicap" class="styled-select">
                                <option value="none" ${lobbySettings.handicap === 'none' ? 'selected' : ''}>Standard (No Handicap)</option>
                                <option value="plus2" ${lobbySettings.handicap === 'plus2' ? 'selected' : ''}>+2 Bonus Points</option>
                                <option value="time10" ${lobbySettings.handicap === 'time10' ? 'selected' : ''}>+10s Extra Time</option>
                                <option value="mult20" ${lobbySettings.handicap === 'mult20' ? 'selected' : ''}>👑 Grandad Special (Double Points!)</option>
                            </select>
                        </div>
                        <div class="control-group-row">
                            <label>📜 Dictionary Challenge Rules:</label>
                            <select id="lobbyRulesMode" class="styled-select">
                                <option value="house" ${lobbySettings.allowHouseRules ? 'selected' : ''}>🟢 House Rules (Online Challenges Award Points!)</option>
                                <option value="tv" ${!lobbySettings.allowHouseRules ? 'selected' : ''}>🔴 Strict TV Rules (Proper Nouns = 0 PTS, Vibes Only!)</option>
                            </select>
                        </div>
                    </div>

                    <div class="lobby-section">
                        <h3>2. Select Round to Test / Play</h3>
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
}

function attachEvents() {
    const roomCodeInput = containerRef.querySelector('#roomCodeInput');
    const lobbyHandicap = containerRef.querySelector('#lobbyHandicap');
    const lobbyRulesMode = containerRef.querySelector('#lobbyRulesMode');

    roomCodeInput.addEventListener('change', () => lobbySettings.roomCode = roomCodeInput.value.toUpperCase());
    lobbyHandicap.addEventListener('change', () => lobbySettings.handicap = lobbyHandicap.value);
    lobbyRulesMode.addEventListener('change', () => lobbySettings.allowHouseRules = (lobbyRulesMode.value === 'house'));

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
