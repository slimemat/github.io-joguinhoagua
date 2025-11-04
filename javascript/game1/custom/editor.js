// /javascript/game1/custom/editor.js
// Arquivo principal que inicializa os módulos do editor.

import { ui } from './EditorUI.js';
import { store } from './QuestionStore.js'; // 1. Importa o store

// Adiciona um listener para garantir que o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Diz ao store para carregar os dados da memória
    store.load();
    
    // 3. Inicializa a UI (popula sprites, etc.)
    ui.initialize();
    
    // 4. Diz à UI para desenhar as perguntas que o store acabou de carregar
    ui.renderQuestionList(); 
});