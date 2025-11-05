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

    // 6. Isso deve rodar apenas no game1
    const modalButtonContainer = document.querySelector('#options-modal-overlay .button-container');

    const closeModalButton = document.getElementById('modal-close-options-button');
    
    if (modalButtonContainer && closeModalButton) {
        
        const editorBtn = document.createElement('a');
        editorBtn.href = '../../custom/editorgame1.html'; // Ajuste o caminho se necessário
        editorBtn.className = 'menu-button game1-editor-btn';
        editorBtn.textContent = 'Editor de Perguntas';
        
        modalButtonContainer.insertBefore(editorBtn, closeModalButton);
    }
});