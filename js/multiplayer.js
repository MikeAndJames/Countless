/**
 * ===================================================================
 * COUNTLESS - FIREBASE MULTIPLAYER SERVICE (js/multiplayer.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * 1. ES6 Browser Imports: We import Firebase directly from Google's official CDN.
 *    No npm or node build tools required!
 * 2. Realtime Database Listeners (`onValue`): Automatically pushes game updates
 *    to all connected browsers (Host, Grandad, Mike) instantly!
 * 3. Room Schema in Firebase:
 *    /rooms/{ROOM_CODE}/
 *        - host: "James & Mike"
 *        - currentScreen: "letters" | "numbers" | "conundrum"
 *        - roundState: { drawnLetters, clockSeconds, ... }
 *        - players: { "player1": { name, score, handicap }, ... }
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    onValue 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Official Firebase Configuration for Countless
const firebaseConfig = {
    apiKey: "AIzaSyB7uVyEu0w6P8XVFKQHjyu88_04Ae_6PJA",
    authDomain: "countless-game.firebaseapp.com",
    databaseURL: "https://countless-game-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "countless-game",
    storageBucket: "countless-game.firebasestorage.app",
    messagingSenderId: "894381983991",
    appId: "1:894381983991:web:1a6640c2dcfbea85e76bf2"
};

// Initialize Firebase App & Realtime Database instance
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export class MultiplayerService {
    constructor() {
        this.currentRoomCode = null;
        this.currentPlayerId = null;
        this.activeScreenName = null;
        this.unsubscribeRoomListener = null;
    }

    /**
     * 1. CREATE A NEW ROOM (Host Action)
     */
    async createRoom(roomCode, hostName, timeHandicap = 30, scoreMultiplier = 1.0) {
        const cleanCode = roomCode.trim().toUpperCase();
        const cleanHostName = (hostName && hostName.trim()) ? hostName.trim() : "Gramps";

        try {
            localStorage.setItem('countless_player_name', cleanHostName);
            localStorage.setItem('countless_handicap', String(timeHandicap));
            localStorage.setItem('countless_multiplier', String(scoreMultiplier));
        } catch (e) {}

        this.currentRoomCode = cleanCode;
        this.currentPlayerId = `p_${Date.now()}`;
        this.isLocalHost = true;

        const roomRef = ref(db, `rooms/${cleanCode}`);
        const roomData = {
            roomCode: cleanCode,
            hostName: cleanHostName,
            status: "lobby", // "lobby" | "playing" | "results"
            activeScreen: "splash",
            createdAt: Date.now(),
            players: {
                [this.currentPlayerId]: {
                    id: this.currentPlayerId,
                    name: cleanHostName,
                    isHost: true,
                    timeHandicap: Number(timeHandicap) || 30, // 20s, 30s (default), 45s, 60s
                    scoreMultiplier: Number(scoreMultiplier) || 1.0, // 1.0x, 1.25x, 1.5x
                    score: 0
                }
            },
            gameData: {
                drawnLetters: [],
                targetNumber: 0,
                drawnNumbers: [],
                conundrumWord: ""
            }
        };

        await set(roomRef, roomData);
        console.log(`Created Firebase Room: ${cleanCode}`);
        return roomData;
    }

    /**
     * 2. JOIN AN EXISTING ROOM (Player Action)
     */
    async joinRoom(roomCode, playerName, timeHandicap = 30, scoreMultiplier = 1.25) {
        const cleanCode = roomCode.trim().toUpperCase();
        const roomRef = ref(db, `rooms/${cleanCode}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            throw new Error(`Room "${cleanCode}" does not exist! Check the code and try again.`);
        }

        const roomData = snapshot.val();
        const existingPlayers = roomData.players || {};
        const existingNames = new Set(
            Object.values(existingPlayers).map(p => (p.name || '').trim().toLowerCase())
        );

        let requestedName = (playerName && playerName.trim()) ? playerName.trim() : "Gramps";
        let finalName = requestedName;

        // Auto-Deduplication: Prevents "Gramps11" and neatly assigns "Gramps 2", "Gramps 3", etc.
        if (existingNames.has(finalName.toLowerCase())) {
            // Strip any trailing digits or parenthesized digits: "Gramps 2", "Gramps11", "Gramps (2)" -> "Gramps"
            const baseName = requestedName.replace(/\s*(\d+|\(\d+\))$/, '').trim() || requestedName;
            let counter = 2;
            while (
                existingNames.has(`${baseName.toLowerCase()} ${counter}`) ||
                existingNames.has(`${baseName.toLowerCase()}${counter}`) ||
                existingNames.has(`${baseName.toLowerCase()} (${counter})`)
            ) {
                counter++;
            }
            finalName = `${baseName} ${counter}`;
        }

        try {
            localStorage.setItem('countless_player_name', finalName);
            localStorage.setItem('countless_handicap', String(timeHandicap));
            localStorage.setItem('countless_multiplier', String(scoreMultiplier));
        } catch (e) {}

        this.currentRoomCode = cleanCode;
        this.currentPlayerId = `p_${Date.now()}`;
        this.isLocalHost = false;

        const playerRef = ref(db, `rooms/${cleanCode}/players/${this.currentPlayerId}`);
        const playerData = {
            id: this.currentPlayerId,
            name: finalName,
            isHost: false,
            timeHandicap: Number(timeHandicap) || 30,     // 20, 30 (default), 45, 60 seconds
            scoreMultiplier: Number(scoreMultiplier) || 1.25, // 1.0x, 1.25x, 1.5x
            score: 0
        };

        await set(playerRef, playerData);
        console.log(`Joined Firebase Room: ${cleanCode} as ${finalName}`);
        return snapshot.val();
    }

    /**
     * 3. LISTEN TO REALTIME ROOM UPDATES
     * Fires callback(roomData) instantly whenever Host or Player updates Firebase!
     */
    listenToRoom(roomCode, callback) {
        const cleanCode = roomCode.trim().toUpperCase();
        const roomRef = ref(db, `rooms/${cleanCode}`);

        // UNBIND PREVIOUS LISTENER IF ONE EXISTS
        if (this.unsubscribeRoomListener) {
            this.unsubscribeRoomListener();
            this.unsubscribeRoomListener = null;
        }

        // Attach Firebase Realtime Listener
        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                this.currentRoomData = snapshot.val();
                callback(this.currentRoomData);
            }
        });

        this.unsubscribeRoomListener = unsubscribe;
        return unsubscribe;
    }

    /**
     * 4. CHECK IF CURRENT PLAYER IS HOST
     */
    isHost(playersObj = null) {
        if (playersObj) {
            if (!this.currentPlayerId) return false;
            const player = playersObj[this.currentPlayerId];
            return player ? Boolean(player.isHost) : false;
        }
        return Boolean(this.isLocalHost);
    }

    /**
     * 4b. GET CURRENT PLAYER TIME HANDICAP
     */
    getMyTimeHandicap() {
        if (!this.currentPlayerId || !this.currentRoomData || !this.currentRoomData.players) return 30;
        const me = this.currentRoomData.players[this.currentPlayerId];
        return me ? (Number(me.timeHandicap) || 30) : 30;
    }

    /**
     * 5. BROADCAST ROUND START (Host Actions)
     * Writes round data (drawn letters, target numbers, etc.) to Firebase so all devices see identical tiles!
     */
    async broadcastRoundStart(roundType, gameData) {
        if (!this.currentRoomCode) return;
        this.activeScreenName = roundType;
        const roomRef = ref(db, `rooms/${this.currentRoomCode}`);
        
        const updates = {
            status: "playing",
            activeScreen: roundType,
            gameData: gameData,
            roundResults: null, // Clear previous round results for fresh round!
            startedAt: Date.now(), // Precise timestamp for client-side deadline calculation
            lastUpdated: Date.now()
        };

        // Initialize empty conundrum state when host starts the round
        if (roundType === "conundrum") {
            updates.conundrumState = {
                status: "running",
                buzzedPlayerId: null,
                buzzedPlayerName: "",
                currentGuess: "",
                frozenSeconds: 30,
                lockedOutPlayers: []
            };
        }

        await update(roomRef, updates);
    }

    /**
     * 6. UPDATE ROOM GAME STATE (Host Actions)
     */
    async updateGameState(updates) {
        if (!this.currentRoomCode) return;
        const roomRef = ref(db, `rooms/${this.currentRoomCode}`);
        await update(roomRef, updates);
    }

    /**
     * 7. SUBMIT PLAYER ROUND RESULT TO FIREBASE
     */
    async submitRoundResult(submissionData) {
        if (!this.currentRoomCode || !this.currentPlayerId) return;
        
        // 1. Get current player data to read multiplier and cumulative score
        const playerRef = ref(db, `rooms/${this.currentRoomCode}/players/${this.currentPlayerId}`);
        const playerSnap = await get(playerRef);
        
        let multiplier = 1.0;
        let currentTotal = 0;
        
        if (playerSnap.exists()) {
            const pData = playerSnap.val();
            multiplier = pData.scoreMultiplier || 1.0;
            currentTotal = pData.score || 0;
        }

        // 2. Apply multiplier and round to integer
        const rawScore = submissionData.score || 0;
        const adjustedScore = Math.round(rawScore * multiplier);

        // 3. Update the cumulative score in the player's node
        await update(playerRef, {
            score: currentTotal + adjustedScore
        });

        // 4. Submit the round result (with adjusted score for the scoreboard)
        const subRef = ref(db, `rooms/${this.currentRoomCode}/roundResults/${this.currentPlayerId}`);
        await set(subRef, {
            id: this.currentPlayerId,
            ...submissionData,
            score: adjustedScore,
            baseScore: rawScore,
            submittedAt: Date.now()
        });
    }

    /**
     * 7b. SUBMIT ZERO-POINT RESULT FOR TIMED-OUT OR OFFLINE PLAYER
     * Host or room writes a 0-score record on behalf of player who exceeded deadline.
     */
    async submitZeroResultForPlayer(playerId, reason = "Timed Out") {
        if (!this.currentRoomCode || !playerId) return;
        const subRef = ref(db, `rooms/${this.currentRoomCode}/roundResults/${playerId}`);
        const subSnap = await get(subRef);
        if (subSnap.exists()) return; // Player submitted in the meantime!

        await set(subRef, {
            id: playerId,
            word: `(${reason})`,
            steps: `(${reason})`,
            score: 0,
            baseScore: 0,
            timedOut: true,
            submittedAt: Date.now()
        });
        console.log(`Auto-submitted 0 PTS for player ${playerId}: ${reason}`);
    }

    /**
     * 7c. KICK PLAYER FROM ROOM (Host Action)
     * Removes the player completely from room, round results, and active lockouts.
     */
    async kickPlayer(playerId) {
        if (!this.currentRoomCode || !playerId) return;
        const cleanCode = this.currentRoomCode;

        // 1. Remove player from players roster
        const playerRef = ref(db, `rooms/${cleanCode}/players/${playerId}`);
        await set(playerRef, null);

        // 2. Remove player from current round results if present
        const resultRef = ref(db, `rooms/${cleanCode}/roundResults/${playerId}`);
        await set(resultRef, null);

        // 3. Remove from conundrum lockouts if present
        const roomRef = ref(db, `rooms/${cleanCode}`);
        const snap = await get(roomRef);
        if (snap.exists()) {
            const roomData = snap.val();
            if (roomData.conundrumState && Array.isArray(roomData.conundrumState.lockedOutPlayers)) {
                const updatedLocked = roomData.conundrumState.lockedOutPlayers.filter(id => id !== playerId);
                const cRef = ref(db, `rooms/${cleanCode}/conundrumState`);
                await update(cRef, { lockedOutPlayers: updatedLocked });
            }
        }
        console.log(`Kicked player ${playerId} from room ${cleanCode}`);
    }

    /**
     * 7d. FORCE ADVANCE ROUND (Host Action)
     * Automatically scores 0 for any unsubmitted players and immediately transitions to targetScreen.
     */
    async forceAdvanceRound(targetScreen = 'scoreboard') {
        if (!this.currentRoomCode) return;
        const roomRef = ref(db, `rooms/${this.currentRoomCode}`);
        const snap = await get(roomRef);
        if (snap.exists()) {
            const data = snap.val();
            const players = data.players || {};
            const results = data.roundResults || {};
            for (const pId of Object.keys(players)) {
                if (!results[pId]) {
                    await this.submitZeroResultForPlayer(pId, "Skipped by Host");
                }
            }
        }
        await this.broadcastRoundStart(targetScreen, null);
    }

    /**
     * 8. BUZZ IN CONUNDRUM
     * Player buzzed in! Freeze the timer and lock out others.
     */
    async buzzInConundrum(remainingSeconds) {
        if (!this.currentRoomCode || !this.currentPlayerId) return;
        
        // Auto-lookup the player's name
        const playerRef = ref(db, `rooms/${this.currentRoomCode}/players/${this.currentPlayerId}`);
        const pSnap = await get(playerRef);
        let pName = "Player";
        if (pSnap.exists()) pName = pSnap.val().name;

        const stateRef = ref(db, `rooms/${this.currentRoomCode}/conundrumState`);
        await update(stateRef, {
            status: "buzzed",
            buzzedPlayerId: this.currentPlayerId,
            buzzedPlayerName: pName,
            currentGuess: "",
            frozenSeconds: remainingSeconds
        });
    }

    /**
     * 9. UPDATE CONUNDRUM GUESS
     * As the buzzed player types, sync their string so others see it live.
     */
    async updateConundrumGuess(guessString) {
        if (!this.currentRoomCode) return;
        const stateRef = ref(db, `rooms/${this.currentRoomCode}/conundrumState`);
        await update(stateRef, {
            currentGuess: guessString
        });
    }

    /**
     * 10. RESOLVE CONUNDRUM GUESS
     */
    async resolveConundrumGuess(isCorrect, newlyLockedIdOrArray) {
        if (!this.currentRoomCode) return;
        const roomRef = ref(db, `rooms/${this.currentRoomCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) return;

        const roomData = snap.val();
        const cState = roomData.conundrumState || {};
        const stateRef = ref(db, `rooms/${this.currentRoomCode}/conundrumState`);
        
        if (isCorrect) {
            await update(stateRef, {
                status: "ended"
            });
        } else {
            const existingLocked = cState.lockedOutPlayers || [];
            const newIds = Array.isArray(newlyLockedIdOrArray) ? newlyLockedIdOrArray : [newlyLockedIdOrArray];
            const combinedLocked = Array.from(new Set([...existingLocked, ...newIds].filter(Boolean)));

            const players = roomData.players || {};
            const totalPlayersCount = Object.keys(players).length;

            if (totalPlayersCount > 0 && combinedLocked.length >= totalPlayersCount) {
                // ALL players in room are locked out! End the round automatically.
                await update(stateRef, {
                    status: "ended",
                    buzzedPlayerId: null,
                    buzzedPlayerName: "",
                    currentGuess: "",
                    lockedOutPlayers: combinedLocked
                });
            } else {
                await update(stateRef, {
                    status: "running",
                    buzzedPlayerId: null,
                    buzzedPlayerName: "",
                    currentGuess: "",
                    lockedOutPlayers: combinedLocked
                });
            }
        }
    }
}

// Global Singleton Instance
export const multiplayerService = new MultiplayerService();
