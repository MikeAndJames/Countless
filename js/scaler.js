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
        // Updated to 1170x540 (19.5:9) to fit modern wide phones perfectly!
        const targetWidth = 1170;
        const targetHeight = 540;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate scale to fit inside window while preserving 16:9 aspect ratio
        const scaleX = windowWidth / targetWidth;
        const scaleY = windowHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY);

        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center center';
    }

    window.addEventListener('resize', scaleGame);
    window.addEventListener('orientationchange', () => setTimeout(scaleGame, 100));
    scaleGame();
}
