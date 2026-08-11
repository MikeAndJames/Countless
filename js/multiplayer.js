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
        this.unsubscribeRoomListener = null;
    }

    /**
     * 1. CREATE A NEW ROOM (Host Action)
     */
    async createRoom(roomCode, hostName) {
        const cleanCode = roomCode.trim().toUpperCase();
        this.currentRoomCode = cleanCode;
        this.currentPlayerId = `p_host_${Date.now()}`;

        const roomRef = ref(db, `rooms/${cleanCode}`);
        const roomData = {
            roomCode: cleanCode,
            hostName: hostName,
            status: "lobby", // "lobby" | "playing" | "results"
            activeScreen: "splash",
            createdAt: Date.now(),
            players: {
                [this.currentPlayerId]: {
                    id: this.currentPlayerId,
                    name: hostName,
                    isHost: true,
                    timeHandicap: 30, // 20s, 30s (default), 45s, 60s
                    scoreMultiplier: 1.0, // 1.0x, 1.25x, 1.5x
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

        this.currentRoomCode = cleanCode;
        this.currentPlayerId = `p_${Date.now()}`;

        const playerRef = ref(db, `rooms/${cleanCode}/players/${this.currentPlayerId}`);
        const playerData = {
            id: this.currentPlayerId,
            name: playerName,
            isHost: false,
            timeHandicap: Number(timeHandicap) || 30,     // 20, 30 (default), 45, 60 seconds
            scoreMultiplier: Number(scoreMultiplier) || 1.25, // 1.0x, 1.25x, 1.5x
            score: 0
        };

        await set(playerRef, playerData);
        console.log(`Joined Firebase Room: ${cleanCode} as ${playerName}`);
        return snapshot.val();
    }

    /**
     * 3. LISTEN TO REALTIME ROOM UPDATES
     * Fires callback(roomData) instantly whenever Host or Player updates Firebase!
     */
    listenToRoom(roomCode, callback) {
        const cleanCode = roomCode.trim().toUpperCase();
        const roomRef = ref(db, `rooms/${cleanCode}`);

        // Attach Firebase Realtime Listener
        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        this.unsubscribeRoomListener = unsubscribe;
        return unsubscribe;
    }

    /**
     * 4. UPDATE ROOM GAME STATE (Host Actions)
     */
    async updateGameState(updates) {
        if (!this.currentRoomCode) return;
        const roomRef = ref(db, `rooms/${this.currentRoomCode}`);
        await update(roomRef, updates);
    }
}

// Global Singleton Instance
export const multiplayerService = new MultiplayerService();
