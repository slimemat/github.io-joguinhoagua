// js/ui/OptionsModal.js
// Componente de Modal de Opções reutilizável.
// Ele se injeta em qualquer página e se conecta ao OptionsManager.

import { globalOptions } from './OptionsManager.js';

class OptionsModal {
    constructor() {
        this.modalElement = null;
        this.menuContainer = null;
        this.createModal();
        this.bindInternalEvents();
    }

    // 1. Cria o HTML do modal e o injeta no <body>
    createModal() {
        const modalHTML = `
            <div id="options-modal-overlay" class="modal-overlay hidden">
                <div class="menu-container">
                    
                    <ul class="modal-tabs">
                        <li class="modal-tab active" data-tab="audio">Áudio</li>
                        </ul>

                    <div class="modal-tab-content">
                    
                        <div id="tab-audio" class="tab-panel active">
                            <h2>Controles de Áudio</h2>
                            
                            <div class="control-group">
                                <label for="modal-music-volume">
                                    <span>Volume da Música:</span>
                                    <span id="modal-music-volume-value">30%</span>
                                </label>
                                <input type="range" id="modal-music-volume" min="0" max="1" step="0.05">
                            </div>
                            
                            <div class="control-group">
                                <label for="modal-sfx-volume">
                                    <span>Volume Efeitos:</span>
                                    <span id="modal-sfx-volume-value">80%</span>
                                </label>
                                <input type="range" id="modal-sfx-volume" min="0" max="1" step="0.05">
                            </div>

                            <hr style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">

                            <div class="toggle-group">
                                <label for="modal-music-toggle">Música de Fundo</label>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="modal-music-toggle">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        </div> <div class="button-container modal-footer-buttons">
                        <a href="#" class="menu-button" id="modal-close-options-button">Fechar</a>
                    </div>

                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('options-modal-overlay');
        
        // Armazena referências para os containers de abas
        this.tabList = this.modalElement.querySelector('.modal-tabs');
        this.tabContent = this.modalElement.querySelector('.modal-tab-content');
    }

    // 2. Conecta os eventos internos (sliders, toggle, fechar)
    bindInternalEvents() {
        // Encontra os elementos DENTRO do modal que acabamos de criar
        const closeButton = this.modalElement.querySelector('#modal-close-options-button');
        const musicSlider = this.modalElement.querySelector('#modal-music-volume');
        const sfxSlider = this.modalElement.querySelector('#modal-sfx-volume');
        const musicVolumeValue = this.modalElement.querySelector('#modal-music-volume-value');
        const sfxVolumeValue = this.modalElement.querySelector('#modal-sfx-volume-value');
        const musicToggle = this.modalElement.querySelector('#modal-music-toggle');
        
        // --- Botão Fechar ---
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });

        // --- Sliders e Toggle (lógica que estava em options.js) ---
        musicSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            globalOptions.setMusicVolume(volume);
            musicVolumeValue.textContent = `${Math.round(volume * 100)}%`;
            musicToggle.checked = volume > 0;
        });

        sfxSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            globalOptions.setSfxVolume(volume);
            sfxVolumeValue.textContent = `${Math.round(volume * 100)}%`;
        });

        musicToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            globalOptions.toggleMusicEnabled(isChecked);
            
            if (!isChecked) {
                musicSlider.value = 0;
                musicVolumeValue.textContent = `0%`;
            } else {
                const savedVolume = globalOptions.getSavedMusicVolume();
                musicSlider.value = savedVolume; 
                musicVolumeValue.textContent = `${Math.round(savedVolume * 100)}%`;
            }
        });

        // =======================================================
        // ADICIONADO: Listener para a aba "Áudio" padrão
        // =======================================================
        const audioTab = this.modalElement.querySelector('.modal-tab[data-tab="audio"]');
        if (audioTab) {
            audioTab.addEventListener('click', () => {
                // Desativa todas as abas e painéis
                this.modalElement.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                this.modalElement.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

                // Ativa a aba de áudio
                audioTab.classList.add('active');
                this.modalElement.querySelector('#tab-audio').classList.add('active');
            });
        }
    }

    /**
     * Registra uma nova aba no modal de opções.
     * @param {string} id - Um ID único para a aba (ex: 'editor')
     * @param {string} title - O texto que aparecerá na aba (ex: 'Editor (Jg 1)')
     * @param {string} contentHTML - O HTML que deve aparecer no painel da aba
     */
    addTab(id, title, contentHTML) {
        if (!this.tabList || !this.tabContent) return;

        // 1. Cria a Aba (botão)
        const tab = document.createElement('li');
        tab.className = 'modal-tab';
        tab.dataset.tab = id;
        tab.textContent = title;
        this.tabList.appendChild(tab);

        // 2. Cria o Painel de Conteúdo
        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.id = `tab-${id}`;
        panel.innerHTML = contentHTML;
        this.tabContent.appendChild(panel);

        // 3. Adiciona o evento de clique na Aba
        tab.addEventListener('click', () => {
            // Desativa todas as abas e painéis
            this.modalElement.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            this.modalElement.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            // Ativa a aba e o painel clicados
            tab.classList.add('active');
            panel.classList.add('active');
        });
    }
    
    // 3. Sincroniza os controles com os dados do OptionsManager
    initializeControls() {
        const musicSlider = this.modalElement.querySelector('#modal-music-volume');
        const sfxSlider = this.modalElement.querySelector('#modal-sfx-volume');
        const musicVolumeValue = this.modalElement.querySelector('#modal-music-volume-value');
        const sfxVolumeValue = this.modalElement.querySelector('#modal-sfx-volume-value');
        const musicToggle = this.modalElement.querySelector('#modal-music-toggle');
        
        const savedMusicVolume = globalOptions.getSavedMusicVolume();
        musicSlider.value = savedMusicVolume;

        if (!globalOptions.isMusicEnabled()) {
            musicSlider.value = 0;
            musicVolumeValue.textContent = `0%`;
        } else {
            musicVolumeValue.textContent = `${Math.round(savedMusicVolume * 100)}%`;
        }
        
        sfxSlider.value = globalOptions.getSfxVolume();
        sfxVolumeValue.textContent = `${Math.round(globalOptions.getSfxVolume() * 100)}%`;
        
        musicToggle.checked = globalOptions.isMusicEnabled();
    }

    // 4. Métodos públicos para mostrar/esconder
    show() {
        this.initializeControls();
        this.modalElement.classList.remove('hidden');
        document.body.classList.add('modal-active');
        
        //Procura APENAS o container do menu principal pelo ID
        this.menuContainer = document.getElementById('main-menu-container'); 
        if (this.menuContainer) {
            this.menuContainer.style.opacity = '0';
        }
    }

    hide() {
        this.modalElement.classList.add('hidden');
        document.body.classList.remove('modal-active'); // Reativa o cursor customizado
        
        //Restaura APENAS o container do menu principal pelo ID
        if (this.menuContainer) {
            this.menuContainer.style.opacity = '1';
        }
    }
}

// Exporta uma única instância (Singleton)
// Qualquer script pode importar 'optionsModal' e apenas chamar .show()
export const optionsModal = new OptionsModal();
