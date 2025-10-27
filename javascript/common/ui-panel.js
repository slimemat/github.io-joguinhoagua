// javascript/common/ui-panel.js
import { optionsModal } from '../menu/OptionsModal.js';

export function initUIPanel(game) {
    const pauseBtn = document.getElementById('ui-pause-btn');
    const restartBtn = document.getElementById('ui-restart-btn');
    const optionsBtn = document.getElementById('ui-options-btn');
    const menuBtn = document.getElementById('ui-menu-btn');

    // Updated ID for the confirmation overlay
    const confirmOverlay = document.getElementById('confirm-overlay');
    const yesBtn = document.getElementById('confirm-yes-btn');
    const noBtn = document.getElementById('confirm-no-btn');
    const pauseOverlay = document.getElementById('pause-overlay');

    const originalModalHide = optionsModal.hide.bind(optionsModal);

    // Sobrescrevemos a função .hide() do modal (para pausar no game1)
    optionsModal.hide = () => {
        originalModalHide();
        const confirmOverlay = document.getElementById('confirm-overlay');
        if (game.paused && confirmOverlay.classList.contains('hidden')) {
            game.pauseManager.silentUnpause();
        }
    };

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            game.pauseManager.togglePause();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            if (!game.paused) {
                game.pauseManager.togglePause();
            }
            confirmOverlay.classList.remove('hidden');
        });
    }

    if (yesBtn) {
        yesBtn.addEventListener('click', () => {
            // Make sure this path is correct for your project structure
            window.location.href = '../../index.html'; 
        });
    }

    if (noBtn) {
        noBtn.addEventListener('click', () => {
            confirmOverlay.classList.add('hidden');
            if (game.paused) {
                game.pauseManager.togglePause();
            }
        });
    }

    if (optionsBtn) {
        optionsBtn.addEventListener('click', () => {
            if (!game.paused) {
                game.pauseManager.silentPause();
            }
            optionsModal.show();
        });
    }
}
