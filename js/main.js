/**
 * ===================================================================
 * COUNTLESS - MAIN APP ENTRY & ROUTER (js/main.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Single Page App (SPA) Router: Switches active screen module smoothly.
 * - Handles top navigation tab clicks and screen cleanups.
 */

import { initAutoScaler } from './scaler.js';
import { multiplayerService } from './multiplayer.js';
import { renderSplashScreen } from './screens/splashScreen.js';
import { renderLobbyScreen } from './screens/lobbyScreen.js';
import { renderLettersRound, cleanupLettersRound } from './screens/lettersRound.js';
import { renderNumbersRound, cleanupNumbersRound } from './screens/numbersRound.js';
import { renderConundrumRound, cleanupConundrumRound } from './screens/conundrumRound.js';
import { renderScoreboardScreen } from './screens/scoreboardScreen.js';

let activeScreen = 'splash';

document.addEventListener('DOMContentLoaded', () => {
    initAutoScaler();

    // Check if mobile device (using simple width check or touch support)
    const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 1024);
    
    if (isMobile) {
        const overlay = document.getElementById('mobileFullscreenOverlay');
        const btnFs = document.getElementById('btnEnterFullscreen');
        
        if (overlay && btnFs) {
            // Show the overlay
            overlay.style.display = 'flex';
            
            btnFs.addEventListener('click', () => {
                // Request Fullscreen on the entire document
                const docEl = document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen();
                } else if (docEl.webkitRequestFullscreen) { // Safari
                    docEl.webkitRequestFullscreen();
                } else if (docEl.msRequestFullscreen) { // IE11
                    docEl.msRequestFullscreen();
                }
                
                // Hide the overlay
                overlay.style.display = 'none';
                
                // Wait a tiny bit for the screen to resize, then re-scale
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 500);
            });
        }
    }

    switchScreen('splash');
});

export function switchScreen(screenName, initialGameData = null) {
    // 1. Cleanup current screen
    if (activeScreen === 'letters') cleanupLettersRound();
    else if (activeScreen === 'numbers') cleanupNumbersRound();
    else if (activeScreen === 'conundrum') cleanupConundrumRound();

    // 1b. UNBIND ANY ACTIVE FIREBASE LISTENERS TO PREVENT GHOST EVENTS!
    if (multiplayerService && multiplayerService.unsubscribeRoomListener) {
        multiplayerService.unsubscribeRoomListener();
        multiplayerService.unsubscribeRoomListener = null;
    }

    activeScreen = screenName;
    if (multiplayerService) multiplayerService.activeScreenName = screenName;

    // 3. Render target screen into #appMount
    const appMount = document.getElementById('appMount');
    if (!appMount) return;

    if (screenName === 'splash') {
        renderSplashScreen(appMount, (targetScreen, gameData) => switchScreen(targetScreen, gameData));
    } else if (screenName === 'lobby') {
        renderLobbyScreen(appMount, (selectedRound, gameData) => switchScreen(selectedRound, gameData));
    } else if (screenName === 'letters') {
        renderLettersRound(appMount, initialGameData);
    } else if (screenName === 'numbers') {
        renderNumbersRound(appMount, initialGameData);
    } else if (screenName === 'conundrum') {
        renderConundrumRound(appMount, initialGameData);
    } else if (screenName === 'scoreboard') {
        renderScoreboardScreen(appMount, (targetScreen, gameData) => switchScreen(targetScreen, gameData));
    }
}
