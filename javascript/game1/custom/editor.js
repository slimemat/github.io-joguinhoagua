// /javascript/game1/custom/editor.js
// Arquivo principal que inicializa os módulos do editor.

import { ui } from './EditorUI.js';
import { store } from './QuestionStore.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Carrega o gerenciador de sets
    store.loadManager();
    
    // 2. Carrega as perguntas do SET ATIVO
    store.loadQuestions();
    
    // 3. Inicializa a UI (popula sprites, liga eventos do form)
    ui.initialize();
    
    // 4. Popula o NOVO seletor de sets
    ui.populateSetSelector();
    
    // 5. Desenha a lista de perguntas do set ativo (e habilita/desabilita o form)
    ui.renderQuestionList(); 


});