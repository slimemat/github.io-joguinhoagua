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

export function initMilestones(milestones, maxScore, questions) {
    const container = document.getElementById('milestones');
    container.innerHTML = '';

    milestones.forEach((score, index) => {
        const div = document.createElement('div');

        // Se a pergunta correspondente oferece reward
        const question = questions[index]; // assumes mesma ordem do JSON
        if (question && question.feedback.correct.offers_reward) {
            div.classList.add('milestone-reward');
        } else {
            div.classList.add('milestone-info');
        }

        div.style.left = `${(score / maxScore) * 100}%`;

        container.appendChild(div);
    });
}


export function updateProgress(score) {
    const progressBar = document.getElementById('progress-bar');
    const maxScore = 100;
    progressBar.style.width = Math.min((score / maxScore) * 100, 100) + '%';

    const milestones = document.querySelectorAll('#milestones div');
    milestones.forEach(div => {
        const milestoneScore = parseInt(div.dataset.value);
        if (score >= milestoneScore) div.classList.add('milestone-active');
    });
}

export function showOverlay() {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
}

export function hideOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';
}

export function showPhaseEndPanel(callbacks) {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div>Parabéns! Você chegou a 100 pontos!</div>
        <button id="continue-btn">Continuar jogando</button>
        <button id="map-btn">Voltar ao mapa</button>
    `;
    document.body.appendChild(panel);

    document.getElementById('continue-btn').onclick = () => { 
        panel.remove(); 
        callbacks.continue(); 
    };
    document.getElementById('map-btn').onclick = () => { 
        panel.remove(); 
        callbacks.map(); 
    };
}
