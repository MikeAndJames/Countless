/**
 * ===================================================================
 * COUNTLESS - 16:9 LANDSCAPE PROPORTIONAL AUTO-SCALER (js/scaler.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - 16:9 Widescreen Virtual Canvas (960px x 540px)
 * - Optimized for mobile landscape phones and widescreen tablets.
 * - Fits 100% of screen with ZERO scrollbars!
 */

export function initAutoScaler() {
    const canvas = document.getElementById('gameViewport');
    if (!canvas) return;

    function scaleGame() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Show warning if in portrait mode
        const portraitWarning = document.getElementById('portraitWarning');
        if (windowHeight > windowWidth) {
            if (portraitWarning) portraitWarning.style.display = 'flex';
        } else {
            if (portraitWarning) portraitWarning.style.display = 'none';
        }

        // DYNAMIC WIDTH SCALING: Always fill 100% of the screen height (Y is maxed),
        // and stretch the canvas X to perfectly fit whatever the device width is!
        const targetHeight = 540;
        let scale = windowHeight / targetHeight;
        let dynamicWidth = windowWidth / scale;

        // SAFEGUARD: If the screen is squarish (like an iPad) and the dynamic width 
        // drops below 960px, it will crush our UI layout! 
        // In that case, we fall back to fitting the width and letterboxing the height.
        if (dynamicWidth < 960) {
            dynamicWidth = 960;
            scale = windowWidth / dynamicWidth;
        }

        // Apply the dynamic width so the game viewport expands horizontally
        canvas.style.width = `${dynamicWidth}px`;
        canvas.style.height = `${targetHeight}px`;

        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center center';
    }

    window.addEventListener('resize', scaleGame);
    window.addEventListener('orientationchange', () => setTimeout(scaleGame, 100));
    scaleGame();
}
