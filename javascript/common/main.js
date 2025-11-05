// EM /javascript/common/main.js

import Game from '../game1/Game.js';
import { setupUIEventListeners } from './ui.js';
import { initUIPanel } from './ui-panel.js';
import { optionsModal } from '../../javascript/menu/OptionsModal.js'; 

// --- EVENTO 1: LOAD (Para o Jogo) ---
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const game = new Game(canvas);
        initUIPanel(game);
        setupUIEventListeners(game);
    } else {
        console.error("Elemento canvas do jogo não encontrado!");
    }
});


// --- EVENTO 2: DOMCONTENTLOADED (Para registrar a aba) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Define o HTML que irá dentro da nova aba
    const editorTabHTML = `
        <h2 style="font-family: 'Press Start 2P', cursive; font-size: 1.2rem; color: #fff;">Editor de Perguntas</h2>
        <p style="color: #fff;">
            Acesse o editor para criar, excluir ou modificar os conjuntos de perguntas para este jogo.
        </p>
        <a href="../../custom/editorgame1.html" class="menu-button game1-editor-btn" style="background-color: #00c853; border-bottom: 4px solid #009624;">
            Abrir Editor
        </a>
    `;
    
    // 2. Registra a nova aba no modal
    optionsModal.addTab('editor', 'Editor (Jogo 1)', editorTabHTML);
});