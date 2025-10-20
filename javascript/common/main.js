// javascript/main.js
// Este é o ponto de entrada. Ele inicializa o jogo e a interface.

import Game from '../game1/Game.js';
import { setupUIEventListeners } from './ui.js';
import { initUIPanel } from './ui-panel.js';

// Espera a página carregar completamente antes de iniciar qualquer coisa.
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // 1. Cria a instância principal do jogo, que vai controlar tudo.
        const game = new Game(canvas);

        initUIPanel(game);
        
        // 2. Configura os eventos dos botões da interface (Start, Toggle Music).
        //    Passamos a instância do 'game' para que a UI possa se comunicar com ele.
        setupUIEventListeners(game);
    } else {
        console.error("Elemento canvas do jogo não encontrado!");
    }
});
