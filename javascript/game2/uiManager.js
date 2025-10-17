// uiManager.js

export default class UIManager {
    constructor() {
        // Find all the UI elements when the manager is created
        this.waterCountEl = document.getElementById('water-count');
        this.onNextLevelCallback = null;
    }

    /**
     * Stores the function to be called when the "Next Level" button is clicked.
     * @param {Function} onNextLevel - The function to call.
     */
    setupNextLevelButton(onNextLevel) {
        this.onNextLevelCallback = onNextLevel;
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
     * Creates and displays a styled "win" panel at the bottom left of the game.
     */
    showWinMessage() {
        // If the panel already exists, do nothing.
        if (document.getElementById('level-win-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'level-win-panel';
        panel.innerHTML = `
            <div class="panel-title">Fase Concluída!</div>
            <p>Você guiou a água com sucesso!</p>
            <button id="dynamic-next-level-btn">Próxima Fase</button>
        `;

        // Append the panel to the main game container to position it correctly.
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(panel);
        }

        // Add the click event listener to the new button.
        const nextLevelBtn = document.getElementById('dynamic-next-level-btn');
        if (nextLevelBtn && this.onNextLevelCallback) {
            nextLevelBtn.addEventListener('click', this.onNextLevelCallback);
        }
    }

    /**
     * Finds and removes the win panel from the DOM.
     */
    hideWinMessage() {
        const panel = document.getElementById('level-win-panel');
        if (panel) {
            panel.remove();
        }
    }
}
