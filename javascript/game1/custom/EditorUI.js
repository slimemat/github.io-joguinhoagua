// /javascript/game1/custom/EditorUI.js

import { store } from './QuestionStore.js';
// 1. IMPORTAR O NOVO FILE HANDLER
import { fileHandler } from './FileHandler.js';

class EditorUI {
    constructor() {
        this.availableSprites = [
            // ... (sua lista de sprites) ...
            { name: "Nenhum", path: "", class: "" },
            { name: "Gelo", path: "../../assets/icecubeguy.png", class: "img-panel" },
            { name: "Copo (Evaporação)", path: "../../assets/evaporation_glass.gif", class: "img-panel" },
            { name: "Nuvem", path: "../../assets/cloud_sprite.gif", class: "img-panel" },
            { name: "Árvores (Amazônia)", path: "../../assets/amazontrees.gif", class: "img-panel" },
            { name: "Planeta Derretendo", path: "../../assets/planet_melt.gif", class: "img-panel" },
            { name: "Rio", path: "../../assets/river.gif", class: "img-panel" },
            { name: "Nuvem Poluída", path: "../../assets/polluted-cloud.gif", class: "img-panel" },
            { name: "Tratamento de Água", path: "../../assets/water-treatment.gif", class: "img-panel" },
            { name: "Lixo Eletrônico", path: "../../assets/e-trash.gif", class: "img-panel" },
            { name: "Mangueira", path: "../../assets/water-hose.gif", class: "img-panel" }
        ];

        // Mapeamento de todos os elementos
        this.form = document.getElementById('question-form');
        this.questionList = document.getElementById('question-list');
        this.spriteSelect = document.getElementById('form-image');
        this.questionTypeSelect = document.getElementById('form-question-type');
        this.tfOptions = document.getElementById('answer-options-tf');
        this.mcOptions = document.getElementById('answer-options-mc');
        
        this.formTitle = document.getElementById('form-title');
        this.saveButton = document.getElementById('btn-save');
        this.cancelButton = document.getElementById('btn-cancel');

        // 2. ADICIONAR REFERÊNCIAS AOS BOTÕES DE IMPORT/EXPORT
        this.exportButton = document.getElementById('btn-export');
        this.importButton = document.getElementById('btn-import');
        this.importFileInput = document.getElementById('import-file-input'); // O input escondido

        // Referências aos campos de input
        this.formInfo = document.getElementById('form-info');
        // ... (resto dos campos do formulário) ...
        this.formQuestionText = document.getElementById('form-question-text');
        this.formAnswerTf = document.getElementById('form-answer-tf');
        this.formOption1 = document.getElementById('form-option-1');
        this.formOption2 = document.getElementById('form-option-2');
        this.formAnswerMc = document.getElementById('form-answer-mc');
        this.formFeedbackCorrectTitle = document.getElementById('form-feedback-correct-title');
        this.formFeedbackCorrectText = document.getElementById('form-feedback-correct-text');
        this.formFeedbackIncorrectTitle = document.getElementById('form-feedback-incorrect-title');
        this.formFeedbackIncorrectText = document.getElementById('form-feedback-incorrect-text');
        this.formOffersReward = document.getElementById('form-offers-reward');

        this.setSelector = document.getElementById('set-selector');
        this.btnNewSet = document.getElementById('btn-new-set');
        this.btnRenameSet = document.getElementById('btn-rename-set');
        this.btnDeleteSet = document.getElementById('btn-delete-set');
        this.formLockedWarning = document.getElementById('form-locked-warning');
    }

    initialize() {
        this.populateSpriteDropdown();
        this.bindEvents();
        this.bindSetManagerEvents();
    }

    populateSpriteDropdown() {
        if (!this.spriteSelect) return;
        this.availableSprites.forEach(sprite => {
            const option = document.createElement('option');
            option.value = sprite.path;
            option.textContent = sprite.name;
            option.dataset.imageClass = sprite.class;
            this.spriteSelect.appendChild(option);
        });
    }

    bindEvents() {
        // Listener para o dropdown de TIPO de pergunta
        this.questionTypeSelect.addEventListener('change', (e) => {
            this.toggleAnswerPanels(e.target.value);
        });
        
        // Listener para o SUBMIT do formulário
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Listener para cliques na LISTA (Delegação de Evento)
        this.questionList.addEventListener('click', (e) => this.handleListClick(e));

        // Listener para o botão CANCELAR
        this.cancelButton.addEventListener('click', () => this.clearForm());

        // 3. ADICIONAR LISTENERS DE IMPORT/EXPORT
        this.exportButton.addEventListener('click', () => fileHandler.exportToJSON());
        
        // Clicar no botão 'Importar' visível, dispara o clique no input 'file' escondido
        this.importButton.addEventListener('click', () => this.importFileInput.click());
        
        // Quando um arquivo é selecionado no input escondido, lida com ele
        this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    /**
     * Liga os eventos aos botões do gerenciador de sets.
     */
    bindSetManagerEvents() {
        this.setSelector.addEventListener('change', (e) => this.handleSetChange(e.target.value));
        this.btnNewSet.addEventListener('click', () => this.handleNewSet());
        this.btnRenameSet.addEventListener('click', () => this.handleRenameSet());
        this.btnDeleteSet.addEventListener('click', () => this.handleDeleteSet());
    }

    toggleAnswerPanels(type) {
        if (type === 'tf') {
            this.tfOptions.style.display = 'block';
            this.mcOptions.style.display = 'none';
        } else {
            this.tfOptions.style.display = 'none';
            this.mcOptions.style.display = 'block';
        }
    }
    
    renderQuestionList() {
        const questions = store.getQuestions();
        this.questionList.innerHTML = '';
        
        // Verifica se o set atual é o 'default' (somente leitura)
        const isReadOnly = store.getManager().activeSetKey === 'default';

        if (isReadOnly) {
            this.questionList.innerHTML = '<li class="empty-list-item">Este é o conjunto "Padrão". Ele não pode ser editado. Crie um novo conjunto para adicionar perguntas.</li>';
        } else if (questions.length === 0) {
            this.questionList.innerHTML = '<li class="empty-list-item">Nenhuma pergunta criada. Comece usando o formulário ao lado.</li>';
        }
        
        // Habilita/desabilita o formulário
        this.toggleFormAccess(isReadOnly);
        
        questions.forEach(question => {
            const li = document.createElement('li');
            li.dataset.id = question.id; 
            
            // Não mostra botões de "Editar/Excluir" se for 'default'
            // (Embora não deva haver perguntas 'default' listadas aqui, é uma segurança)
            li.innerHTML = `
                <span class="question-text">${question.question.text}</span>
                ${!isReadOnly ? `
                <div class="question-controls">
                    <button class="btn-edit">Editar</button>
                    <button class="btn-delete">Excluir</button>
                </div>
                ` : ''}
            `;
            this.questionList.appendChild(li);
        });
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const formData = this.getFormData();
        if (!formData) return;
        const editingId = this.form.dataset.editingId ? parseInt(this.form.dataset.editingId) : null;
        if (editingId) {
            store.update(editingId, formData);
        } else {
            store.add(formData);
        }
        this.renderQuestionList();
        this.clearForm();
    }

    getFormData() {
        const type = this.questionTypeSelect.value;
        const selectedSprite = this.spriteSelect.options[this.spriteSelect.selectedIndex];
        const question = {
            info: this.formInfo.value.trim(),
            question: { text: this.formQuestionText.value.trim() },
            image: selectedSprite.value,
            imageClass: selectedSprite.dataset.imageClass || '',
            feedback: {
                correct: {
                    title: this.formFeedbackCorrectTitle.value.trim(),
                    text: this.formFeedbackCorrectText.value.trim(),
                    offers_reward: this.formOffersReward.checked,
                    choice_prompt: this.formOffersReward.checked ? "Escolha sua recompensa!" : null
                },
                incorrect: {
                    title: this.formFeedbackIncorrectTitle.value.trim(),
                    text: this.formFeedbackIncorrectText.value.trim()
                }
            }
        };
        if (type === 'tf') {
            question.question.answer = this.formAnswerTf.value;
            question.question.type = 'tf'; 
        } else {
            const option1 = this.formOption1.value.trim();
            const option2 = this.formOption2.value.trim();
            const answerIndex = this.formAnswerMc.value;
            question.question.type = 'multichoice';
            question.question.options = [option1, option2];
            question.question.answer = (answerIndex === '1') ? option1 : option2;
        }
        if (!question.question.text || !question.info) {
            alert('Por favor, preencha pelo menos a Info e o Texto da Pergunta.');
            return null;
        }
        return question;
    }

    clearForm() {
        
        this.form.reset();
        this.toggleAnswerPanels('tf');
        this.formTitle.textContent = 'Adicionar Nova Pergunta';
        this.saveButton.textContent = 'Salvar Pergunta';
        this.form.dataset.editingId = '';
    }

    handleListClick(event) {
        
        const target = event.target;
        const li = target.closest('li');
        if (!li || !li.dataset.id) return; 
        const id = parseInt(li.dataset.id);
        if (target.classList.contains('btn-delete')) {
            this.handleDelete(id);
        }
        if (target.classList.contains('btn-edit')) {
            this.handleEdit(id);
        }
    }

    handleDelete(id) {
        
        if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
            store.delete(id);
        }
        this.renderQuestionList();
    }

    handleEdit(id) {
        
        const question = store.getById(id);
        if (!question) return;
        this.fillForm(question);
        this.form.dataset.editingId = id;
        this.formTitle.textContent = 'Editar Pergunta';
        this.saveButton.textContent = 'Salvar Alterações';
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    fillForm(question) {
        
        this.formInfo.value = question.info;
        this.formQuestionText.value = question.question.text;
        this.spriteSelect.value = question.image;
        this.formFeedbackCorrectTitle.value = question.feedback.correct.title;
        this.formFeedbackCorrectText.value = question.feedback.correct.text;
        this.formFeedbackIncorrectTitle.value = question.feedback.incorrect.title;
        this.formFeedbackIncorrectText.value = question.feedback.incorrect.text;
        this.formOffersReward.checked = question.feedback.correct.offers_reward;
        if (question.question.type === 'multichoice' && question.question.options) {
            this.questionTypeSelect.value = 'mc';
            this.toggleAnswerPanels('mc');
            this.formOption1.value = question.question.options[0];
            this.formOption2.value = question.question.options[1];
            const correctIndex = question.question.answer === question.question.options[0] ? '1' : '2';
            this.formAnswerMc.value = correctIndex;
        } else {
            this.questionTypeSelect.value = 'tf';
            this.toggleAnswerPanels('tf');
            this.formAnswerTf.value = question.question.answer;
        }
    }

    // 4. ADICIONAR ESTE NOVO MÉTODO
    /**
     * Lida com a seleção do arquivo de importação.
     */
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return; // O usuário clicou em 'Cancelar'

        fileHandler.importFromJSON(file);

        // Limpa o valor do input para permitir importar o mesmo arquivo novamente
        event.target.value = null;
    }

    /**
     * Habilita ou desabilita todos os campos do formulário.
     * @param {boolean} isDisabled - True para desabilitar, false para habilitar.
     */
    toggleFormAccess(isDisabled) {
        const formElements = this.form.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = isDisabled;
        }
        
        // Também controla os botões de renomear/excluir set
        this.btnRenameSet.style.display = isDisabled ? 'none' : 'block';
        this.btnDeleteSet.style.display = isDisabled ? 'none' : 'block';

        if (this.formLockedWarning) {
            if (isDisabled) {
                this.formLockedWarning.classList.remove('hidden');
            } else {
                this.formLockedWarning.classList.add('hidden');
            }
        }
    }

    /**
     * Popula o dropdown <select> com a lista de sets do store.
     */
    populateSetSelector() {
        this.setSelector.innerHTML = '';
        const manager = store.getManager();
        
        manager.sets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.key;
            option.textContent = set.name;
            if (set.builtIn) {
                option.textContent += " (Padrão)";
            }
            this.setSelector.appendChild(option);
        });
        
        // Define o valor selecionado
        this.setSelector.value = manager.activeSetKey;
    }

    /**
     * Recarrega a aplicação inteira (store e UI)
     */
    reloadEditorState() {
        store.loadQuestions();
        this.populateSetSelector();
        this.renderQuestionList();
        this.clearForm();
    }

    /**
     * Chamado quando o usuário troca o set no dropdown.
     */
    handleSetChange(newKey) {
        store.switchActiveSet(newKey);
        this.reloadEditorState();
    }

    /**
     * Chamado quando o usuário clica em "Novo Set".
     */
    handleNewSet() {
        const name = prompt("Digite o nome para o novo conjunto de perguntas:", "Minhas Perguntas");
        if (name) {
            store.createNewSet(name);
            this.reloadEditorState();
        }
    }
    
    /**
     * Chamado quando o usuário clica em "Renomear".
     */
    handleRenameSet() {
        const currentSet = store.getManager().sets.find(s => s.key === store.getManager().activeSetKey);
        if (!currentSet) return;
        
        const newName = prompt("Digite o novo nome para este conjunto:", currentSet.name);
        if (newName && newName !== currentSet.name) {
            store.renameActiveSet(newName);
            this.populateSetSelector(); // Apenas atualiza o seletor
        }
    }

    /**
     * Chamado quando o usuário clica em "Excluir".
     */
    handleDeleteSet() {
        const currentSet = store.getManager().sets.find(s => s.key === store.getManager().activeSetKey);
        if (!currentSet) return;

        if (confirm(`Tem certeza que deseja excluir o conjunto "${currentSet.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            store.deleteActiveSet();
            this.reloadEditorState();
        }
    }
}

// Exporta uma instância única (Singleton)
export const ui = new EditorUI();