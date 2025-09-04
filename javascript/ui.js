// javascript/ui.js
// Gerencia os elementos da interface, como botões e placar.

export function setupUIEventListeners(game) {
    // ID do botão corrigido para 'start-button'
    const startButton = document.getElementById("start-button");
    const musicButton = document.getElementById("toggle-music");

    startButton?.addEventListener('click', () => {
        game.start();
    });

    musicButton?.addEventListener('click', () => {
        game.audio.toggleMusic();
    });
}

export function updateScore(score) {
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
        scoreElement.innerText = score;
    }
}

export function hideStartScreen() {
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
        startScreen.style.display = "none";
    }
}

export function showGameContainer() {
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
        gameContainer.style.display = "block";
    }
}
