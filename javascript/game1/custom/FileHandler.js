// /javascript/game1/custom/FileHandler.js
// Lida com a importação e exportação de arquivos JSON.

import { store } from './QuestionStore.js';
import { ui } from './EditorUI.js';

class FileHandler {

    /**
     * Pega as perguntas do 'store', formata como JSON e dispara o download.
     */
    exportToJSON() {
        const questions = store.getQuestions();

        // Formata os dados para ficarem idênticos ao seu questions.json original
        const dataToExport = {
            "pt-br": questions
        };

        const jsonString = JSON.stringify(dataToExport, null, 2); // O 'null, 2' formata o JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Cria um link 'fantasma' para disparar o download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'perguntas_personalizadas.json';
        document.body.appendChild(a);
        a.click();
        
        // Limpa o link
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Lê um arquivo JSON, valida, e o envia para o 'store'.
     * @param {File} file - O arquivo do <input type="file">
     */
    importFromJSON(file) {
        if (!file) {
            alert('Nenhum arquivo selecionado.');
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validação: Verifica se o JSON tem a estrutura esperada
                if (data && data.hasOwnProperty('pt-br') && Array.isArray(data['pt-br'])) {
                    const importedQuestions = data['pt-br'];
                    
                    // Garante que as perguntas importadas tenham IDs (caso seja o seu JSON original)
                    importedQuestions.forEach(q => {
                        if (!q.id) {
                            q.id = new Date().getTime() + Math.random(); // Gera um ID simples
                        }
                    });

                    // Envia os dados para o store (vamos criar este método)
                    store.overwrite(importedQuestions);

                    // Atualiza a UI para mostrar as novas perguntas
                    ui.renderQuestionList();
                    alert('Perguntas importadas com sucesso!');

                } else {
                    alert('Erro: O arquivo JSON não está no formato esperado. (Esperava uma chave "pt-br" com um array de perguntas)');
                }

            } catch (e) {
                console.error('Erro ao processar o arquivo JSON:', e);
                alert('Erro ao ler o arquivo. É um JSON válido?');
            }
        };

        reader.readAsText(file);
    }
}

// Exporta uma instância única (Singleton)
export const fileHandler = new FileHandler();