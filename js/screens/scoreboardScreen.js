import { multiplayerService } from '../multiplayer.js';
import { dictionaryEngine } from '../dictionary.js';

let containerRef = null;
let onStartGameCallback = null;

export function renderScoreboardScreen(container, startGameCb) {
    containerRef = container;
    onStartGameCallback = startGameCb;

    container.innerHTML = `
        <div style="width:100%; height:100%; display:flex; padding:10px; box-sizing:border-box;">
            <main class="center-board" style="flex:1; align-items:center; justify-content:center; padding:40px;">
                <h1 style="color:var(--gold); font-size:2.5rem; text-align:center; margin-bottom:20px;">🏆 CUMULATIVE SCOREBOARD 🏆</h1>
                
                <div id="scoreboardList" style="width:100%; max-width:600px; display:flex; flex-direction:column; gap:12px; margin-bottom:30px;">
                    <div style="text-align:center; color:#94a3b8;">Loading scores...</div>
                </div>

                <div id="hostControls" class="hidden" style="display:flex; gap:16px; justify-content:center; width:100%;">
                    <button id="btnNextLetters" class="btn btn-deal">🔤 NEXT: LETTERS</button>
                    <button id="btnNextNumbers" class="btn btn-deal">🔢 NEXT: NUMBERS</button>
                    <button id="btnNextConundrum" class="btn btn-deal">🧩 NEXT: CONUNDRUM</button>
                </div>
                
                <div id="guestWaitMessage" class="hidden" style="color:#94a3b8; font-size:1.2rem;">
                    Waiting for Host to start the next round...
                </div>
            </main>
        </div>
    `;

    attachEvents();
    subscribeToScoreboardUpdates();
}

function attachEvents() {
    const btnLetters = containerRef.querySelector('#btnNextLetters');
    const btnNumbers = containerRef.querySelector('#btnNextNumbers');
    const btnConundrum = containerRef.querySelector('#btnNextConundrum');

    if (btnLetters) {
        btnLetters.addEventListener('click', async () => {
            btnLetters.disabled = true;
            // Generate letters
            const VOWELS = ['A','E','I','O','U'];
            const CONS = ['B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','X','Y','Z'];
            let letters = [];
            for(let i=0; i<4; i++) letters.push(VOWELS[Math.floor(Math.random()*VOWELS.length)]);
            for(let i=0; i<5; i++) letters.push(CONS[Math.floor(Math.random()*CONS.length)]);
            
            await multiplayerService.broadcastRoundStart('letters', { drawnLetters: letters });
        });
    }

    if (btnNumbers) {
        btnNumbers.addEventListener('click', async () => {
            btnNumbers.disabled = true;
            // Generate numbers
            const LARGE = [25, 50, 75, 100];
            const SMALL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
            let drawn = [];
            
            // Create a copy so we don't modify the originals
            const largeCopy = [...LARGE];
            const smallCopy = [...SMALL];
            
            for (let i=0; i<2; i++) drawn.push(largeCopy.splice(Math.floor(Math.random()*largeCopy.length), 1)[0]);
            for (let i=0; i<4; i++) drawn.push(smallCopy.splice(Math.floor(Math.random()*smallCopy.length), 1)[0]);
            const target = Math.floor(Math.random() * 899) + 101;

            await multiplayerService.broadcastRoundStart('numbers', { drawnNumbers: drawn, targetNumber: target });
        });
    }

    if (btnConundrum) {
        btnConundrum.addEventListener('click', async () => {
            btnConundrum.disabled = true;
            
            // Generate conundrum word on Host so all clients receive the exact same word
            const targetWord = await dictionaryEngine.getRandom9LetterWordAsync();
            await multiplayerService.broadcastRoundStart('conundrum', { conundrumWord: targetWord });
        });
    }
}

function subscribeToScoreboardUpdates() {
    const code = multiplayerService.currentRoomCode;
    if (!code) return;

    multiplayerService.listenToRoom(code, (roomData) => {
        if (!containerRef) return;

        // Auto-launch the next round if the Host changed it
        const isScoreboardVisible = document.getElementById('scoreboardList') !== null;
        if (isScoreboardVisible && roomData.status === 'playing' && roomData.activeScreen && roomData.activeScreen !== 'scoreboard' && onStartGameCallback) {
            onStartGameCallback(roomData.activeScreen, roomData.gameData);
            return;
        }

        if (roomData.players) {
            renderLeaderboard(roomData.players);
        }

        const isHost = multiplayerService.isHost(roomData.players);
        const hostControls = containerRef.querySelector('#hostControls');
        const guestWait = containerRef.querySelector('#guestWaitMessage');

        if (isHost) {
            hostControls.classList.remove('hidden');
            guestWait.classList.add('hidden');
        } else {
            hostControls.classList.add('hidden');
            guestWait.classList.remove('hidden');
        }
    });
}

function renderLeaderboard(playersObj) {
    const listEl = containerRef.querySelector('#scoreboardList');
    if (!listEl || !playersObj) return;

    // Sort players by score descending
    const players = Object.values(playersObj).sort((a, b) => b.score - a.score);

    listEl.innerHTML = '';
    
    players.forEach((p, index) => {
        const isMe = p.id === multiplayerService.currentPlayerId;
        const row = document.createElement('div');
        row.className = 'word-chip';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '16px 20px';
        if (isMe) {
            row.style.border = '2px solid var(--gold)';
            row.style.background = 'rgba(251, 191, 36, 0.1)';
        }

        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';

        row.innerHTML = `
            <div style="font-size:1.4rem; display:flex; align-items:center; gap:10px;">
                <span style="width:30px; text-align:center;">${medal}</span>
                <strong>${p.name}</strong> ${isMe ? '<small style="color:var(--gold); font-size:0.9rem;">(YOU)</small>' : ''}
                <small style="color:#94a3b8; font-size:0.9rem; margin-left:10px;">[${p.scoreMultiplier}x]</small>
            </div>
            <div style="font-size:1.8rem; font-weight:900; color:var(--gold);">
                ${p.score} PTS
            </div>
        `;
        listEl.appendChild(row);
    });
}
