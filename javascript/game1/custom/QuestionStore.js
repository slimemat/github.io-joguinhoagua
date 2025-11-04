// /javascript/game1/custom/QuestionStore.js
// Gerencia o estado das perguntas (lendo e salvando no localStorage).

class QuestionStore {
    constructor() {
        // Chave única para o localStorage do Jogo 1
        this.localStorageKey = 'game1_customQuestions';
        
        // Array que armazena as perguntas em memória
        this.questions = [];
    }

    /**
     * Carrega as perguntas do localStorage para a memória (this.questions).
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.localStorageKey);
            if (savedData) {
                this.questions = JSON.parse(savedData);
                console.log('Perguntas carregadas do localStorage:', this.questions);
            } else {
                // Se não houver nada salvo, começa com um array vazio
                this.questions = [];
                console.log('Nenhuma pergunta personalizada encontrada. Começando do zero.');
            }
        } catch (e) {
            console.error('Erro ao carregar perguntas do localStorage:', e);
            this.questions = [];
        }
    }

    /**
     * Salva o array 'this.questions' (da memória) no localStorage.
     */
    save() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.questions));
            console.log('Perguntas salvas no localStorage.');
        } catch (e) {
            console.error('Erro ao salvar perguntas no localStorage:', e);
        }
    }

    /**
     * Retorna todas as perguntas.
     * @returns {Array}
     */
    getQuestions() {
        return this.questions;
    }

    /**
     * Adiciona uma nova pergunta ao array e salva.
     * @param {Object} question - O objeto da nova pergunta.
     */
    add(question) {
        // Simula um ID único (em um app real, seria um UUID)
        question.id = new Date().getTime(); 
        this.questions.push(question);
        this.save();
    }

    /**
     * Atualiza uma pergunta existente pelo ID e salva.
     * @param {number} id - O ID da pergunta a ser atualizada.
     * @param {Object} updatedQuestionData - Os novos dados da pergunta.
     */
    update(id, updatedQuestionData) {
        const index = this.questions.findIndex(q => q.id === id);
        if (index !== -1) {
            // Mantém o ID original e mescla os dados atualizados
            this.questions[index] = { ...this.questions[index], ...updatedQuestionData, id: id };
            this.save();
        } else {
            console.warn(`Pergunta com ID ${id} não encontrada para atualização.`);
        }
    }

    /**
     * Deleta uma pergunta pelo ID e salva.
     * @param {number} id - O ID da pergunta a ser deletada.
     */
    delete(id) {
        this.questions = this.questions.filter(q => q.id !== id);
        this.save();
    }

    /**
     * Retorna uma pergunta específica pelo ID.
     * @param {number} id - O ID da pergunta.
     * @returns {Object | undefined}
     */
    getById(id) {
        return this.questions.find(q => q.id === id);
    }
    
    /**
     * Atualiza a ordem das perguntas (usado pelo drag-and-drop) e salva.
     * @param {Array} newOrderedQuestions - O array de perguntas na nova ordem.
     */
    reorder(newOrderedQuestions) {
        this.questions = newOrderedQuestions;
        this.save();
    }

    /**
     * Substitui TODAS as perguntas atuais pelas novas (usado na importação).
     * @param {Array} newQuestions - O novo array de perguntas.
     */
    overwrite(newQuestions) {
        this.questions = newQuestions;
        this.save(); // Salva a lista importada no localStorage
    }
}

// Exporta uma instância única (Singleton)
export const store = new QuestionStore();