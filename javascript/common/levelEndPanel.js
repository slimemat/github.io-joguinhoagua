// javascript/levelEndPanel.js

import { showOverlay, hideOverlay } from "./ui.js";

export function showLevelEndPanel({ continue: onContinue, map: onMap }) {
    showOverlay();

    const panel = document.createElement('div');
    panel.id = 'level-end-panel'; // <=== super importante para o CSS
    panel.innerHTML = `
        <div class="panel-title">Parabéns!</div>
        <p>Você completou a fase!</p>
        <div class="panel-buttons">
            <button id="continue-btn">Continuar <span class="key-hint">C</span></button>
            <button id="map-btn">Voltar ao mapa <span class="key-hint">M</span></button>
        </div>
    `;

    document.body.appendChild(panel);

    const removePanel = () => {
        panel.remove();
        hideOverlay();
    };

    document.getElementById('continue-btn').onclick = () => {
        removePanel();
        if (onContinue) onContinue();
    };

    document.getElementById('map-btn').onclick = () => {
        removePanel();
        if (onMap) onMap();
    };

    // Optional: keyboard shortcuts like in infoPanel
    window.addEventListener('keydown', function keyHandler(e) {
        if (e.key.toLowerCase() === 'c') {
            removePanel();
            if (onContinue) onContinue();
            window.removeEventListener('keydown', keyHandler);
        }
        if (e.key.toLowerCase() === 'm') {
            removePanel();
            if (onMap) onMap();
            window.removeEventListener('keydown', keyHandler);
        }
    });
}
