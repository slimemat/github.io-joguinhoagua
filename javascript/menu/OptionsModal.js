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
        // O HTML é armazenado como uma string de template
        const modalHTML = `
            <div id="options-modal-overlay" class="modal-overlay hidden">
                <!-- Reutiliza o estilo .menu-container do seu CSS principal -->
                <div class="menu-container">
                    <div id="options-menu-content">
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

                        <!-- Reutiliza o estilo .menu-button -->
                       <div class="button-container">
                            <a href="#" class="menu-button" id="modal-close-options-button">Fechar</a>
                        </div>

                    </div>
                </div>
            </div>
        `;
        
        // Injeta o HTML no final do <body>
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Armazena a referência ao elemento do modal
        this.modalElement = document.getElementById('options-modal-overlay');
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
