/**
 * ===================================================================
 * COUNTLESS - ANIMATED SPLASH SCREEN & BIRTHDAY DEDICATION
 * ===================================================================
 * Dedicated to Gramps on his 80th Birthday!
 * Written by Michael Carrick (Age 16) & James Carrick.
 */

import { playSound, playVictoryChime } from '../audio.js';
import { multiplayerService } from '../multiplayer.js';

let containerRef = null;
let splashAnimFrameId = null;

export function renderSplashScreen(container, onNavigate) {
    stopSplashAnimation();
    containerRef = container;
    container.innerHTML = `
        <div class="splash-container">
            <!-- CELEBRATORY & GAME ANIMATED CANVAS -->
            <canvas id="splashCanvas"></canvas>

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
                        by <strong>Michael Carrick (Age 16)</strong> & <strong>James Carrick</strong>
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
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                        <h2 class="modal-title" style="font-size:1.15rem; margin:0;">🏠 HOST A MULTIPLAYER ROOM</h2>
                        <button id="btnCloseHostModal" class="btn btn-secondary" style="padding:2px 8px; font-size:0.9rem;">❌</button>
                    </div>

                    <div class="room-code-card" style="padding:6px 10px; gap:2px;">
                        <span style="font-size:0.75rem; color:#94a3b8; font-weight:800;">YOUR ROOM CODE:</span>
                        <div class="room-code-display" id="generatedRoomCode" style="font-size:1.6rem; line-height:1.1;">GRANDAD80</div>
                        <span style="font-size:0.7rem; color:var(--gold); font-weight:800;">Share this code with friends & family!</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">YOUR NAME:</label>
                        <input type="text" id="hostPlayerName" class="styled-input" value="Gramps" style="padding:5px 10px; font-weight:800; font-size:0.9rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                    </div>

                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">⏱️ YOUR CLOCK HANDICAP:</label>
                        <select id="hostTimeHandicap" class="styled-select" style="padding:5px 10px; font-size:0.88rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                            <option value="20">20 Seconds (Pro / Blitz)</option>
                            <option value="30" selected>30 Seconds (Default TV Clock)</option>
                            <option value="45">45 Seconds (Chill)</option>
                            <option value="60">60 Seconds (Noob)</option>
                        </select>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">⭐ YOUR SCORE MULTIPLIER:</label>
                        <select id="hostScoreMultiplier" class="styled-select" style="padding:5px 10px; font-size:0.88rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                            <option value="1.0">1.0x (Default TV)</option>
                            <option value="1.25">1.25x (+25% Bonus Points)</option>
                            <option value="1.5">1.5x (Noob +50% bonus)</option>
                        </select>
                    </div>

                    <button id="btnConfirmHost" class="btn btn-submit" style="font-size:0.95rem; padding:8px 14px; margin-top:4px;">🚀 CREATE ROOM & GO TO LOBBY</button>
                </div>
            </div>

            <!-- JOIN GAME MODAL -->
            <div id="joinModal" class="modal-overlay hidden">
                <div class="modal-content splash-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                        <h2 class="modal-title" style="font-size:1.15rem; margin:0;">🎮 JOIN A MULTIPLAYER ROOM</h2>
                        <button id="btnCloseJoinModal" class="btn btn-secondary" style="padding:2px 8px; font-size:0.9rem;">❌</button>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">ENTER ROOM CODE:</label>
                            <input type="text" id="joinRoomCodeInput" class="styled-input" value="GRANDAD80" placeholder="e.g. GRANDAD80" style="padding:6px 10px; text-transform:uppercase; font-weight:900; font-size:1.1rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                        </div>

                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">YOUR NAME:</label>
                            <input type="text" id="joinPlayerNameInput" class="styled-input" value="Gramps" placeholder="e.g. Gramps" style="padding:5px 10px; font-weight:800; font-size:0.9rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff;" />
                        </div>

                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">⏱️ YOUR CLOCK HANDICAP:</label>
                            <select id="joinTimeHandicap" class="styled-select" style="padding:5px 10px; font-size:0.88rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                                <option value="20">20 Seconds (Pro / Blitz)</option>
                                <option value="30" selected>30 Seconds (Default TV Clock)</option>
                                <option value="45">45 Seconds (Chill)</option>
                                <option value="60">60 Seconds (Noob)</option>
                            </select>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <label style="font-size:0.78rem; color:#94a3b8; font-weight:800;">⭐ YOUR SCORE MULTIPLIER:</label>
                            <select id="joinScoreMultiplier" class="styled-select" style="padding:5px 10px; font-size:0.88rem; border-radius:8px; border:2px solid var(--gold); background:#0f172a; color:#ffffff; font-weight:800;">
                                <option value="1.0">1.0x (Default TV)</option>
                                <option value="1.25">1.25x (+25% Bonus Points)</option>
                                <option value="1.5">1.5x (Noob +50% bonus)</option>
                            </select>
                        </div>
                    </div>

                    <button id="btnConfirmJoin" class="btn btn-submit" style="font-size:0.95rem; padding:8px 14px; margin-top:4px;">🎮 ENTER MULTIPLAYER LOBBY</button>
                </div>
            </div>
        </div>
    `;

    initSplashCanvasAnimation(container);
    attachSplashEvents(onNavigate);
}

function initSplashCanvasAnimation(container) {
    const canvas = container.querySelector('#splashCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
        canvas.width = container.clientWidth || 840;
        canvas.height = container.clientHeight || 540;
    };
    updateSize();

    const items = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'X', 'Y', 'Z'];
    const numbers = ['80', '100', '75', '50', '25', '10', '7', '5', '3'];
    const emojis = ['🎂', '🎈', '🎉', '🎁', '⭐'];
    const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#a855f7', '#ec4899', '#34d399', '#fef08a'];

    // Helper to draw rounded tile box
    const drawTile = (x, y, width, height, radius, bgGradient, borderColor) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.fillStyle = bgGradient;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
    };

    // Spawn 55 floating items with rich mix of letters, numbers, emojis & confetti
    for (let i = 0; i < 55; i++) {
        const randType = Math.random();
        let itemType = 'letterTile';
        let textVal = '';

        if (randType < 0.45) {
            itemType = 'letterTile';
            textVal = letters[Math.floor(Math.random() * letters.length)];
        } else if (randType < 0.70) {
            itemType = 'numberTile';
            textVal = numbers[Math.floor(Math.random() * numbers.length)];
        } else if (randType < 0.88) {
            itemType = 'emoji';
            textVal = emojis[Math.floor(Math.random() * emojis.length)];
        } else {
            itemType = 'confetti';
        }

        const size = itemType.includes('Tile') ? Math.random() * 8 + 24 : (itemType === 'emoji' ? Math.random() * 12 + 18 : Math.random() * 8 + 8);

        items.push({
            x: Math.random() * (canvas.width || 840),
            y: Math.random() * (canvas.height || 540),
            type: itemType,
            text: textVal,
            size: size,
            speedY: Math.random() * 0.55 + 0.25,
            speedX: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.45 + 0.25,
            rotation: (Math.random() - 0.5) * 0.4,
            rotSpeed: (Math.random() - 0.5) * 0.015,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.03 + 0.01,
            isGoldTile: Math.random() > 0.4
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        items.forEach(item => {
            item.y -= item.speedY;
            item.wobble += item.wobbleSpeed;
            item.x += item.speedX + Math.sin(item.wobble) * 0.4;
            item.rotation += item.rotSpeed;

            if (item.y < -40) {
                item.y = canvas.height + 30;
                item.x = Math.random() * canvas.width;
            }
            if (item.x < -40) item.x = canvas.width + 30;
            if (item.x > canvas.width + 40) item.x = -30;

            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);
            ctx.globalAlpha = item.opacity;

            if (item.type === 'letterTile' || item.type === 'numberTile') {
                const w = item.size * 1.1;
                const h = item.size * 1.2;
                const rad = 5;

                let grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
                if (item.isGoldTile) {
                    grad.addColorStop(0, '#f59e0b');
                    grad.addColorStop(1, '#b45309');
                } else {
                    grad.addColorStop(0, '#0284c7');
                    grad.addColorStop(1, '#0369a1');
                }

                drawTile(-w / 2, -h / 2, w, h, rad, grad, '#fef08a');

                ctx.font = `900 ${item.size * 0.65}px 'Outfit', sans-serif`;
                ctx.fillStyle = item.isGoldTile ? '#0f172a' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.text, 0, 1);
            } else if (item.type === 'emoji') {
                ctx.font = `${item.size}px 'Outfit', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.text, 0, 0);
            } else {
                ctx.fillStyle = item.color;
                ctx.shadowColor = item.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size * 0.6);
            }

            ctx.restore();
        });

        splashAnimFrameId = requestAnimationFrame(animate);
    }

    animate();
}

function stopSplashAnimation() {
    if (splashAnimFrameId) {
        cancelAnimationFrame(splashAnimFrameId);
        splashAnimFrameId = null;
    }
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
            stopSplashAnimation();
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
            stopSplashAnimation();
            joinModal.classList.add('hidden');
            onNavigate('lobby');
        } catch (err) {
            alert(`Error joining room: ${err.message}`);
            btnConfirmJoin.disabled = false;
            btnConfirmJoin.textContent = originalText;
        }
    });
}

