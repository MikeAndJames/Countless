/**
 * ===================================================================
 * COUNTLESS - AUDIO SYNTHESIZER (WEB AUDIO API)
 * ===================================================================
 * Educational Notes for Mike & James:
 * 1. Web Audio API allows us to generate sound waves (Sine, Triangle, Square)
 *    programmatically without needing MP3 file downloads.
 * 2. `export`: Allows other modules to import these sound functions cleanly.
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Play a simple sine wave tone
 * @param {number} freq Frequency in Hertz (e.g. 440 = A4 note)
 * @param {number} duration Duration in seconds
 */
export function playSound(freq, duration = 0.05) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch(e) {
        // Ignore audio policy blocks before user interaction
    }
}

/**
 * Play clock tick sound
 */
export function playTick(isEvenSecond) {
    const freq = isEvenSecond ? 750 : 550;
    playSound(freq, 0.03);
}

/**
 * Play end of round gong sound
 */
export function playGong() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.2);
        
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
    } catch(e) {}
}

/**
 * Play victory sound chime
 */
export function playVictoryChime() {
    playSound(523.25, 0.1); // C5
    setTimeout(() => playSound(659.25, 0.1), 100); // E5
    setTimeout(() => playSound(783.99, 0.25), 200); // G5
}
