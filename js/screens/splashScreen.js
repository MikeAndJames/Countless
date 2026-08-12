/**
 * ===================================================================
 * COUNTLESS - ANIMATED SPLASH SCREEN & BIRTHDAY DEDICATION
 * ===================================================================
 * Dedicated to Gramps on his 80th Birthday!
 * Written by Michael Carrick & James Carrick.
 */

import { playSound, playVictoryChime } from '../audio.js';
import { multiplayerService } from '../multiplayer.js';

let containerRef = null;

export function renderSplashScreen(container, onNavigate) {
    containerRef = container;
    container.innerHTML = `
        <div class="splash-container">
            <!-- BACKGROUND ANIMATED PARTICLES & GLOW -->
            <div class="splash-backdrop-glow"></div>

            <!-- MAIN SPLASH CARD -->
            <div class="splash-card">
                <!-- BIRTHDAY BADGE -->
                <div class="birthday-badge">
                    <span class="badge-icon">🎂</span>
                    <span class="badge-text">GRAMPS' 80TH BIRTHDAY SPECIAL EDITION</span>
                    <span class="badge-icon">🎂</span>
                </div>

                <!-- MAIN TITLE -->
                <h1 class="splash-title">COUNTLESS</h1>
                <p class="splash-tagline">THE MULTIPLAYER ONLINE COUNTDOWN GAME</p>

                <!-- DEDICATION BOX -->
                <div class="dedication-box">
                    <p class="dedication-text">
                        ❤️ Written with love for <strong>Gramps</strong> on his <strong>80th Birthday</strong><br>
                        by <strong>Michael Carrick</strong> & <strong>James Carrick</strong>
                    </p>
                </div>

                <!-- MAIN ACTION BUTTONS -->
                <div class="splash-actions">
                    <button id="btnHostGame" class="btn splash-btn btn-host">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">HOST A GAME</span>
                    </button>

                    <button id="btnJoinGame" class="btn splash-btn btn-join">
                        <span class="btn-icon">🎮</span>
                        <span class="btn-text">JOIN A GAME</span>
                    </button>
                </div>
            </div>

            <!-- HOST GAME MODAL -->
            <div id="hostModal" class="modal-overlay hidden">
                <div class="modal-content splash-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2 class="modal-title" style="font-size:1.3rem;">🏠 HOST A MULTIPLAYER ROOM</h2>
                        <button id="btnCloseHostModal" class="btn btn-secondary" style="padding:2px 8px;">❌</button>
                    </div>

                    <div class="room-code-card">
                        <span style="font-size:0.85rem; color:#94a3b8; font-weight:800;">YOUR ROOM CODE:</span>
                        <div class="room-code-display" id="generatedRoomCode">GRANDAD80</div>
                        <span style="font-size:0.75rem; color:var(--gold); font-weight:800;">Share this code with Gramps & Family!</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">YOUR NAME:</label>
                        <input type="text" id="hostPlayerName" class="styled-input" value="James & Mike" style="padding:8px 12px; font-weight:800; font-size:1rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                    </div>

                    <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                        <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">⏱️ YOUR CLOCK HANDICAP:</label>
                        <select id="hostTimeHandicap" class="styled-select" style="padding:8px; font-size:0.95rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                            <option value="20">20 Seconds (Pro / Blitz)</option>
                            <option value="30" selected>30 Seconds (Default TV Clock)</option>
                            <option value="45">45 Seconds (Relaxed Family)</option>
                            <option value="60">60 Seconds (👑 Grandad Special)</option>
                        </select>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
                        <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">⭐ YOUR SCORE MULTIPLIER:</label>
                        <select id="hostScoreMultiplier" class="styled-select" style="padding:8px; font-size:0.95rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                            <option value="1.0">1.0x (Standard Points)</option>
                            <option value="1.25">1.25x (+25% Bonus Points)</option>
                            <option value="1.5">1.5x (👑 Grandad Special - +50% Bonus)</option>
                        </select>
                    </div>

                    <button id="btnConfirmHost" class="btn btn-submit" style="font-size:1.1rem; padding:12px; margin-top:8px;">🚀 CREATE ROOM & GO TO LOBBY</button>
                </div>
            </div>

            <!-- JOIN GAME MODAL -->
            <div id="joinModal" class="modal-overlay hidden">
                <div class="modal-content splash-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2 class="modal-title" style="font-size:1.3rem;">🎮 JOIN A MULTIPLAYER ROOM</h2>
                        <button id="btnCloseJoinModal" class="btn btn-secondary" style="padding:2px 8px;">❌</button>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">ENTER ROOM CODE:</label>
                            <input type="text" id="joinRoomCodeInput" class="styled-input" value="GRANDAD80" placeholder="e.g. GRANDAD80" style="padding:8px 12px; text-transform:uppercase; font-weight:900; font-size:1.2rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                        </div>

                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">YOUR NAME:</label>
                            <input type="text" id="joinPlayerNameInput" class="styled-input" placeholder="e.g. Gramps" style="padding:8px 12px; font-weight:800; font-size:1rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                        </div>

                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">⏱️ YOUR CLOCK HANDICAP:</label>
                            <select id="joinTimeHandicap" class="styled-select" style="padding:8px; font-size:0.95rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                                <option value="20">20 Seconds (Pro / Blitz)</option>
                                <option value="30" selected>30 Seconds (Default TV Clock)</option>
                                <option value="45">45 Seconds (Relaxed Family)</option>
                                <option value="60">60 Seconds (👑 Grandad Special)</option>
                            </select>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size:0.85rem; color:#94a3b8; font-weight:800;">⭐ YOUR SCORE MULTIPLIER:</label>
                            <select id="joinScoreMultiplier" class="styled-select" style="padding:8px; font-size:0.95rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                                <option value="1.0">1.0x (Standard Points)</option>
                                <option value="1.25">1.25x (+25% Bonus Points)</option>
                                <option value="1.5">1.5x (👑 Grandad Special - +50% Bonus)</option>
                            </select>
                        </div>
                    </div>

                    <button id="btnConfirmJoin" class="btn btn-submit" style="font-size:1.1rem; padding:12px; margin-top:8px;">🎮 ENTER MULTIPLAYER LOBBY</button>
                </div>
            </div>
        </div>
    `;

    attachSplashEvents(onNavigate);
}

function attachSplashEvents(onNavigate) {
    const btnHost = containerRef.querySelector('#btnHostGame');
    const btnJoin = containerRef.querySelector('#btnJoinGame');

    const hostModal = containerRef.querySelector('#hostModal');
    const joinModal = containerRef.querySelector('#joinModal');

    const btnCloseHost = containerRef.querySelector('#btnCloseHostModal');
    const btnCloseJoin = containerRef.querySelector('#btnCloseJoinModal');

    const btnConfirmHost = containerRef.querySelector('#btnConfirmHost');
    const btnConfirmJoin = containerRef.querySelector('#btnConfirmJoin');

    btnHost.addEventListener('click', () => {
        playSound(600, 0.08);
        hostModal.classList.remove('hidden');
    });

    btnJoin.addEventListener('click', () => {
        playSound(600, 0.08);
        joinModal.classList.remove('hidden');
    });

    btnCloseHost.addEventListener('click', () => hostModal.classList.add('hidden'));
    btnCloseJoin.addEventListener('click', () => joinModal.classList.add('hidden'));

    btnConfirmHost.addEventListener('click', async () => {
        const hostName = containerRef.querySelector('#hostPlayerName').value.trim() || 'Host';
        const roomCode = containerRef.querySelector('#generatedRoomCode').textContent.trim() || 'GRAMPS80';
        const timeHandicap = containerRef.querySelector('#hostTimeHandicap').value;
        const scoreMultiplier = containerRef.querySelector('#hostScoreMultiplier').value;

        // PREVENT DOUBLE-CLICKS (Input Lag Fix)
        btnConfirmHost.disabled = true;
        const originalText = btnConfirmHost.textContent;
        btnConfirmHost.textContent = "⏳ CREATING...";

        try {
            await multiplayerService.createRoom(roomCode, hostName, timeHandicap, scoreMultiplier);
            playVictoryChime();
            hostModal.classList.add('hidden');
            onNavigate('lobby');
        } catch (err) {
            alert(`Error creating room: ${err.message}`);
            btnConfirmHost.disabled = false;
            btnConfirmHost.textContent = originalText;
        }
    });

    btnConfirmJoin.addEventListener('click', async () => {
        const code = containerRef.querySelector('#joinRoomCodeInput').value.trim().toUpperCase();
        const playerName = containerRef.querySelector('#joinPlayerNameInput').value.trim() || 'Player';
        const timeHandicap = containerRef.querySelector('#joinTimeHandicap').value;
        const scoreMultiplier = containerRef.querySelector('#joinScoreMultiplier').value;

        if (!code) {
            alert("Please enter a valid Room Code (e.g. GRAMPS80)!");
            return;
        }

        // PREVENT DOUBLE-CLICKS (Input Lag Fix)
        btnConfirmJoin.disabled = true;
        const originalText = btnConfirmJoin.textContent;
        btnConfirmJoin.textContent = "⏳ JOINING...";

        try {
            await multiplayerService.joinRoom(code, playerName, timeHandicap, scoreMultiplier);
            playVictoryChime();
            joinModal.classList.add('hidden');
            onNavigate('lobby');
        } catch (err) {
            alert(`Error joining room: ${err.message}`);
            // If it failed, re-enable so they can try again
            btnConfirmJoin.disabled = false;
            btnConfirmJoin.textContent = originalText;
        }
    });
}
