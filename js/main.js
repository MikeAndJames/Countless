/**
 * ===================================================================
 * COUNTLESS - MAIN APP ENTRY & ROUTER (js/main.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Single Page App (SPA) Router: Switches active screen module smoothly.
 * - Handles top navigation tab clicks and screen cleanups.
 */

import { initAutoScaler } from './scaler.js';
import { renderLobbyScreen } from './screens/lobbyScreen.js';
import { renderLettersRound, cleanupLettersRound } from './screens/lettersRound.js';
import { renderNumbersRound, cleanupNumbersRound } from './screens/numbersRound.js';
import { renderConundrumRound, cleanupConundrumRound } from './screens/conundrumRound.js';

let activeScreen = 'letters';

document.addEventListener('DOMContentLoaded', () => {
    initAutoScaler();
    initNavigation();
    switchScreen('letters');
});

function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const screenName = tab.getAttribute('data-screen');
            switchScreen(screenName);
        });
    });
}

export function switchScreen(screenName) {
    // 1. Cleanup current screen
    if (activeScreen === 'letters') cleanupLettersRound();
    else if (activeScreen === 'numbers') cleanupNumbersRound();
    else if (activeScreen === 'conundrum') cleanupConundrumRound();

    activeScreen = screenName;

    // 2. Update navigation active highlight
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        if (tab.getAttribute('data-screen') === screenName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // 3. Render target screen into #appMount
    const appMount = document.getElementById('appMount');
    if (!appMount) return;

    if (screenName === 'lobby') {
        renderLobbyScreen(appMount, (selectedRound) => switchScreen(selectedRound));
    } else if (screenName === 'letters') {
        renderLettersRound(appMount);
    } else if (screenName === 'numbers') {
        renderNumbersRound(appMount);
    } else if (screenName === 'conundrum') {
        renderConundrumRound(appMount);
    }
}
