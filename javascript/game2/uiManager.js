// uiManager.js

export default class UIManager {
    constructor() {
        // Find all the UI elements when the manager is created
        this.waterCountEl = document.getElementById('water-count');
        this.winMessageEl = document.getElementById('win-message');
        this.nextLevelBtn = document.getElementById('next-level-btn');
    }

    /**
     * Sets up the event listener for the "Next Level" button.
     * It takes a function (a callback) to run when the button is clicked.
     * @param {Function} onNextLevel - The function to call when the button is clicked.
     */
    setupNextLevelButton(onNextLevel) {
        if (this.nextLevelBtn) {
            this.nextLevelBtn.addEventListener('click', onNextLevel);
        }
    }

    /**
     * Updates the score display on the screen.
     * @param {number} collected - The current number of collected particles.
     * @param {number} goal - The target number of particles to win.
     */
    updateScore(collected, goal) {
        if (this.waterCountEl) {
            this.waterCountEl.textContent = `${collected} / ${goal}`;
        }
    }

    /**
     * Makes the win message visible.
     */
    showWinMessage() {
        if (this.winMessageEl) {
            this.winMessageEl.style.display = 'block';
        }
    }

    /**
     * Hides the win message.
     */
    hideWinMessage() {
        if (this.winMessageEl) {
            this.winMessageEl.style.display = 'none';
        }
    }
}
