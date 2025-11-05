// /javascript/game1/custom/QuestionStore.js
// Gerencia MÚLTIPLOS conjuntos de perguntas e qual está ativo.

class QuestionStore {
    constructor() {
        // Chave do "Gerenciador"
        this.managerKey = 'game1_question_manager';
        
        // Objeto que armazena o gerenciador (em memória)
        this.manager = {
            activeSetKey: 'default',
            sets: [
                { key: 'default', name: 'Padrão (do questions.json)', builtIn: true }
            ]
        };
        
        // Array que armazena as perguntas do set ATIVO
        this.questions = [];
    }

    // Prefixo para as chaves de dados
    _getSetDataKey(key) {
        return `game1_questions_${key}`;
    }

    /**
     * Carrega o "Manager" (lista de sets) do localStorage.
     */
    loadManager() {
        try {
            const savedManager = localStorage.getItem(this.managerKey);
            if (savedManager) {
                this.manager = JSON.parse(savedManager);
            } else {
                // Se não houver manager, salva o padrão
                this.saveManager();
            }
        } catch (e) {
            console.error('Erro ao carregar o gerenciador de sets:', e);
            // Redefine para o padrão em caso de erro
            this.saveManager();
        }
    }

    /**
     * Salva o objeto "Manager" no localStorage.
     */
    saveManager() {
        try {
            localStorage.setItem(this.managerKey, JSON.stringify(this.manager));
        } catch (e) {
            console.error('Erro ao salvar o gerenciador de sets:', e);
        }
    }

    /**
     * Carrega as perguntas do SET ATIVO (definido no manager).
     */
    loadQuestions() {
        const key = this.manager.activeSetKey;

        // O set 'default' é virtual, não tem dados no localStorage
        if (key === 'default') {
            this.questions = [];
            console.log("Carregando set 'Padrão' (somente leitura).");
            return;
        }

        try {
            const dataKey = this._getSetDataKey(key);
            const savedData = localStorage.getItem(dataKey);
            if (savedData) {
                this.questions = JSON.parse(savedData);
                console.log(`Perguntas carregadas do set: ${key}`);
            } else {
                this.questions = [];
            }
        } catch (e) {
            console.error(`Erro ao carregar perguntas do set ${key}:`, e);
            this.questions = [];
        }
    }

    /**
     * Salva as perguntas no SET ATIVO.
     */
    saveQuestions() {
        const key = this.manager.activeSetKey;

        // NUNCA salvar no set 'default'
        if (key === 'default') {
            console.warn("Não é possível salvar no set 'Padrão'.");
            return;
        }
        
        const dataKey = this._getSetDataKey(key);
        try {
            localStorage.setItem(dataKey, JSON.stringify(this.questions));
            console.log(`Perguntas salvas no set: ${key}`);
        } catch (e) {
            console.error(`Erro ao salvar perguntas no set ${key}:`, e);
        }
    }
    
    // --- Funções de Gerenciamento de Set ---

    getManager() {
        return this.manager;
    }

    /**
     * Cria um novo conjunto de perguntas.
     * @param {string} name - O nome do novo conjunto.
     * @returns {string} A chave do novo conjunto.
     */
    createNewSet(name) {
        if (!name) name = "Novo Conjunto";
        
        const newKey = `set_${new Date().getTime()}`;
        this.manager.sets.push({
            key: newKey,
            name: name,
            builtIn: false
        });
        
        // Salva o novo conjunto VAZIO no localStorage
        localStorage.setItem(this._getSetDataKey(newKey), JSON.stringify([]));
        
        // Torna o novo conjunto ativo
        this.manager.activeSetKey = newKey;
        this.saveManager();
        
        return newKey;
    }

    /**
     * Renomeia o conjunto ativo.
     * @param {string} newName - O novo nome.
     */
    renameActiveSet(newName) {
        if (this.manager.activeSetKey === 'default' || !newName) return;
        
        const set = this.manager.sets.find(s => s.key === this.manager.activeSetKey);
        if (set) {
            set.name = newName;
            this.saveManager();
        }
    }

    /**
     * Deleta o conjunto ativo.
     */
    deleteActiveSet() {
        const keyToDelete = this.manager.activeSetKey;
        if (keyToDelete === 'default') return;

        // Remove o set da lista
        this.manager.sets = this.manager.sets.filter(s => s.key !== keyToDelete);
        
        // Remove os dados do set
        localStorage.removeItem(this._getSetDataKey(keyToDelete));
        
        // Volta para o 'default'
        this.manager.activeSetKey = 'default';
        this.saveManager();
    }

    /**
     * Muda o conjunto ativo.
     * @param {string} newKey - A chave do conjunto para ativar.
     */
    switchActiveSet(newKey) {
        if (this.manager.sets.find(s => s.key === newKey)) {
            this.manager.activeSetKey = newKey;
            this.saveManager();
        }
    }
    
    // --- Funções de CRUD (Modificadas) ---
    // Elas agora usam saveQuestions() que salva no set ATIVO.

    getQuestions() {
        return this.questions;
    }

    add(question) {
        question.id = new Date().getTime(); 
        this.questions.push(question);
        this.saveQuestions(); // <- Mudou de save() para saveQuestions()
    }

    update(id, updatedQuestionData) {
        const index = this.questions.findIndex(q => q.id === id);
        if (index !== -1) {
            this.questions[index] = { ...this.questions[index], ...updatedQuestionData, id: id };
            this.saveQuestions(); // <- Mudou de save() para saveQuestions()
        }
    }

    delete(id) {
        this.questions = this.questions.filter(q => q.id !== id);
        this.saveQuestions(); // <- Mudou de save() para saveQuestions()
    }

    getById(id) {
        return this.questions.find(q => q.id === id);
    }
    
    reorder(newOrderedQuestions) {
        this.questions = newOrderedQuestions;
        this.saveQuestions(); // <- Mudou de save() para saveQuestions()
    }
}

export const store = new QuestionStore();