// js/OptionsManager.js
// Gerencia as configurações globais de áudio e as salva no localStorage.
// Este é um Singleton: uma única instância é usada por todos os jogos.

class OptionsManager {
    constructor() {
        // Tenta carregar as opções salvas, caso contrário, usa valores padrão
        this.options = this.loadOptions() || {
            musicVolume: 0.3,   // Volume salvo (usado pelo slider)
            sfxVolume: 0.8,     // Volume de efeitos sonoros
            musicEnabled: true  // Estado atual (toggle switch)
        };
        
        // ⭐️ Adicionado: Garante que as opções padrão sejam salvas na primeira inicialização
        this.saveOptions(); 
    }

    // --- Métodos de Carregamento/Salvamento ---
    loadOptions() {
        try {
            const savedOptions = localStorage.getItem('gameOptions');
            return savedOptions ? JSON.parse(savedOptions) : null;
        } catch (e) {
            console.error("Erro ao carregar opções do localStorage:", e);
            return null;
        }
    }

    saveOptions() {
        try {
            localStorage.setItem('gameOptions', JSON.stringify(this.options));
            // Dispara um evento para notificar todos os AudioManagers abertos
            window.dispatchEvent(new CustomEvent('globalOptionsUpdated', { detail: this.options }));
        } catch (e) {
            console.error("Erro ao salvar opções no localStorage:", e);
        }
    }

    // --- Getters ---
    
    // Retorna o volume efetivo: 0 se estiver mutado, ou o volume salvo.
    getMusicVolume() {
        return this.options.musicEnabled ? this.options.musicVolume : 0;
    }

    // ⭐️ Adicionado: Retorna o volume SALVO (último volume não zero), necessário para posicionar o slider
    getSavedMusicVolume() {
        return this.options.musicVolume;
    }

    getSfxVolume() {
        return this.options.sfxVolume;
    }

    isMusicEnabled() {
        return this.options.musicEnabled;
    }
    
    // --- Setters ---
    
    setMusicVolume(volume) {
        volume = Math.max(0, Math.min(1, parseFloat(volume)));
        
        // 1. Atualiza o volume salvo (importante para que o slider mantenha a posição)
        this.options.musicVolume = volume;
        
        // 2. A flag 'musicEnabled' é definida por um volume > 0
        this.options.musicEnabled = volume > 0;
        
        this.saveOptions();
    }

    setSfxVolume(volume) {
        this.options.sfxVolume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.saveOptions();
    }

    toggleMusicEnabled(isEnabled) {
        this.options.musicEnabled = isEnabled;
        
        // ⭐️ Lógica Adicional: Se o usuário está reabilitando (música on) e o volume salvo está em 0,
        // definimos um volume padrão para que a música toque imediatamente.
        if (isEnabled && this.options.musicVolume === 0) {
             this.options.musicVolume = 0.3;
        }
        
        this.saveOptions();
    }
}

// Exporta uma única instância para ser usada em todo o projeto (Singleton)
export const globalOptions = new OptionsManager();
