/**
 * ===================================================================
 * COUNTLESS - 180° COUNTDOWN CLOCK COMPONENT (js/clock.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * - Big Digits on the LEFT for maximum mobile readability.
 * - 180° SVG Semi-circle Sweeping Clock on the RIGHT.
 * - Dad's Formula: `angle = (timeSoFar / maxTime) * 180`
 * - 0° = North (Start), 180° = South (Finish)
 */

export class CountdownClockComponent {
    /**
     * @param {HTMLElement} container Parent DOM element to mount clock
     * @param {number} maxTime Total seconds (e.g. 15, 30, 60)
     */
    constructor(container, maxTime = 30) {
        this.container = container;
        this.maxTime = maxTime;
        this.timeSoFar = 0;
        this.mount();
    }

    mount() {
        this.container.innerHTML = `
            <div class="countdown-clock-wrapper">
                <!-- BIG DIGITAL NUMBER ON THE LEFT -->
                <div class="clock-digital-left">
                    <span id="clockDigitsText" class="clock-digits-val">30</span>
                </div>

                <!-- 180° SWEEPING SVG CLOCK ON THE RIGHT -->
                <div class="clock-svg-right">
                    <svg class="countdown-svg" viewBox="0 0 200 200">
                        <!-- Semi-circle track from North (100,20) to South (100,180) via East (180,100) -->
                        <path d="M 100 20 A 80 80 0 0 1 100 180" fill="none" stroke="#1e293b" stroke-width="14" stroke-linecap="round" />
                        
                        <!-- Progress arc sweep (0° to 180°) -->
                        <path id="clockArcProgress" d="M 100 20 A 80 80 0 0 1 100 20" fill="none" stroke="url(#goldGradient)" stroke-width="14" stroke-linecap="round" />

                        <!-- Gradients -->
                        <defs>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#f59e0b" />
                                <stop offset="100%" stop-color="#ef4444" />
                            </linearGradient>
                        </defs>

                        <!-- Clock Hand (Sweeper) -->
                        <g id="clockHandGroup" transform="translate(100, 100) rotate(0)">
                            <line x1="0" y1="0" x2="0" y2="-72" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />
                            <circle cx="0" cy="-72" r="7" fill="#fde047" />
                            <circle cx="0" cy="0" r="9" fill="#f59e0b" />
                        </g>
                    </svg>
                </div>
            </div>
        `;

        this.update(0);
    }

    /**
     * Update clock progress
     * @param {number} timeSoFar Seconds elapsed (0 to maxTime)
     */
    update(timeSoFar) {
        this.timeSoFar = Math.min(timeSoFar, this.maxTime);
        const remaining = Math.max(0, this.maxTime - this.timeSoFar);

        // Dad's Formula: angle = (timeSoFar / maxTime) * 180 (0° = North, 180° = South)
        const fraction = this.timeSoFar / this.maxTime;
        const angle = fraction * 180;

        // Update Hand Rotation (0° = North, 90° = East, 180° = South)
        const handGroup = this.container.querySelector('#clockHandGroup');
        if (handGroup) {
            handGroup.setAttribute('transform', `translate(100, 100) rotate(${angle})`);
        }

        // Update SVG Arc Progress
        const arcProgress = this.container.querySelector('#clockArcProgress');
        if (arcProgress) {
            const rad = (angle - 90) * (Math.PI / 180);
            const endX = 100 + 80 * Math.cos(rad);
            const endY = 100 + 80 * Math.sin(rad);
            const largeArcFlag = angle > 180 ? 1 : 0;
            arcProgress.setAttribute('d', `M 100 20 A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`);
        }

        // Update Digits
        const digitsText = this.container.querySelector('#clockDigitsText');
        if (digitsText) {
            digitsText.textContent = String(remaining).padStart(2, '0');
            if (remaining <= 10) {
                digitsText.classList.add('warning');
            } else {
                digitsText.classList.remove('warning');
            }
        }
    }
}
