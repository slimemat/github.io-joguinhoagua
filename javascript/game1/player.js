// javascript/player.js
// A classe Player gerencia tudo relacionado ao personagem: movimento, estados e aparência.

import { PLAYER_STATES } from './config.js';

export default class Player {
    /**
     * Cria uma instância do jogador
     * @param {Game} game - Referência para o objeto principal do jogo
     */
    constructor(game) {
        this.game = game.game || game;

        this.states = PLAYER_STATES;
        this.currentStateIndex = 0;

        // Flags para controlar “toque único” no topo/fundo
        this.touchedTop = false;
        this.touchedBottom = false;

        // Cria o elemento de imagem para o jogador
        this.element = document.createElement("img");
        this.element.src = this.states[this.currentStateIndex].src;
        this.element.style.position = "absolute";
        this.element.style.width = "120px";
        this.element.style.height = "120px";
        this.game.canvas.appendChild(this.element);

        // Posição inicial e velocidade
        this.x = 10;
        this.y = this.game.height - 130;
        this.speedX = 8;
        this.speedY = 8;
        
        this.updatePosition();
    }
    
    /**
     * Atualiza a lógica do jogador a cada frame do jogo
     * @param {Object} keys - Objeto contendo o estado de cada tecla
     */
    update(keys) {
        const currentState = this.states[this.currentStateIndex];
        
        // Movimento horizontal
        if (keys["ArrowLeft"] || keys["a"]) {
            this.x -= this.speedX;
            this.element.style.transform = "scaleX(1)";
        }
        if (keys["ArrowRight"] || keys["d"]) {
            this.x += this.speedX;
            this.element.style.transform = "scaleX(-1)";
        }
        
        // Movimento vertical
        this.y += currentState.gravity;
        if ((keys["ArrowUp"] || keys["w"]) && currentState.canFly) {
            this.y -= this.speedY;
        }
        if ((keys["ArrowDown"] || keys["s"]) && currentState.canFall) {
            this.y += this.speedY;
        }

        // Limita o jogador dentro do canvas
        this.clampPosition();

        // Aplica estados forçados, uma vez por toque
        this.applyForcedState();

        // Atualiza a posição no DOM
        this.updatePosition();
    }

    /**
     * Atualiza a posição do elemento no DOM
     */
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    /**
     * Impede o jogador de sair da tela
     */
    clampPosition() {
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.element.clientWidth) {
            this.x = this.game.width - this.element.clientWidth;
        }
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.height - this.element.clientHeight) {
            this.y = this.game.height - this.element.clientHeight;
        }
    }
    
    /**
     * Muda para o próximo estado (líquido -> vapor -> etc)
     */
    changeState() {
        this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
        this.element.src = this.states[this.currentStateIndex].src;
    }

    /**
     * Força o jogador para um estado específico se tocar topo ou fundo
     * Executa apenas uma vez por toque no topo ou fundo
     */
    applyForcedState() {
        const canvasHeight = this.game.height;
        const playerHeight = this.element.clientHeight;

        // Somente aplicar se estiver em um estado de transição
        const transitionStates = ["vapor", "chuva"];
        const currentStateName = this.states[this.currentStateIndex].name;

        /*
        console.log(
            `%c[DEBUG] Player Y: ${this.y}, Canvas Height: ${canvasHeight}, Current State: ${currentStateName}`,
            'color: orange; font-weight: bold;'
        );
        */

        // Topo do canvas → "nuvem"
        if (this.y <= 0) {
            if (!this.touchedTop && transitionStates.includes(currentStateName)) {
                const topIndex = this.states.findIndex(s => s.name === "nuvem");
                if (topIndex !== -1) {
                    this.currentStateIndex = topIndex;
                    this.element.src = this.states[this.currentStateIndex].src;
                    this.touchedTop = true;
                }
            }
        } else {
            this.touchedTop = false; // reseta quando sair do topo
        }

        // Chão do canvas → "liquido"
        if (this.y >= canvasHeight - playerHeight) {
            if (!this.touchedBottom && transitionStates.includes(currentStateName)) {
                const bottomIndex = this.states.findIndex(s => s.name === "liquido");
                if (bottomIndex !== -1) {
                    this.currentStateIndex = bottomIndex;
                    this.element.src = this.states[this.currentStateIndex].src;
                    this.touchedBottom = true;
                }
            }
        } else {
            this.touchedBottom = false; // reseta quando sair do chão
        }
    }
}
