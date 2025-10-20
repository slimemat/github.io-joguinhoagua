// uiManager.js

export default class UIManager {
    constructor() {
        this.pipeWaterLevel = document.getElementById('pipe-water-level');
        this.pipeGoalAmount = document.getElementById('pipe-goal-amount');
        this.pipeCurrentAmount = document.getElementById('pipe-current-amount');
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
     * Agora controla a altura da água no visualizador.
     * @param {number} collected - A quantidade atual de partículas coletadas.
     * @param {number} goal - A meta de partículas para vencer.
     */
    updateScore(collected, goal) {
        if (this.pipeWaterLevel && this.pipeGoalAmount && this.pipeCurrentAmount) {
                 
            // 1. Exibe a meta no topo do cano.
            // Se a água coletada for MAIOR que a meta, mostra a quantidade atual em vez da meta.
            if (collected > goal && goal > 0) {
                this.pipeGoalAmount.textContent = collected;
            } else {
                this.pipeGoalAmount.textContent = goal;
            }
            
            // 2. porcentagem do cano
            const percentage = goal > 0 ? (collected / goal) * 100 : 0;
            this.pipeWaterLevel.style.height = `${Math.min(percentage, 100)}%`;
            
            this.pipeCurrentAmount.textContent = collected;
            if (percentage > 5 && percentage < 105) {
                this.pipeCurrentAmount.style.opacity = '1';
            } else {
                this.pipeCurrentAmount.style.opacity = '0';
            }
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

    /**
     * Creates and displays a styled "Final" panel.
     * @param {Function} onRestart - Callback function for the "Jogar Novamente" button.
     * @param {Function} onGoToMap - Callback function for the "Ir ao mapa" button.
     */
    showFinalMessage(onRestart, onGoToMap) {
        if (document.getElementById('level-final-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'level-final-panel';
        panel.innerHTML = `
            <div class="panel-title">Parabéns!</div>
            <p>Você concluiu tratamento das águas!</p>
            <button id="dynamic-restart-btn">Jogar Novamente</button>
            <button id="dynamic-map-btn">Voltar ao Mapa</button>
        `;

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(panel);
        }

        const restartBtn = document.getElementById('dynamic-restart-btn');
        if (restartBtn && onRestart) {
            restartBtn.addEventListener('click', () => {
                this.hideFinalMessage();
                onRestart();
            });
        }

        const mapBtn = document.getElementById('dynamic-map-btn');
        if (mapBtn && onGoToMap) {
            mapBtn.addEventListener('click', onGoToMap);
        }
    }
    
    /**
     * Finds and removes the final panel from the DOM.
     */
    hideFinalMessage() {
        const panel = document.getElementById('level-final-panel');
        if (panel) {
            panel.remove();
        }
    }
}
