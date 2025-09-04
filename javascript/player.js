// javascript/player.js
// A classe Player gerencia tudo relacionado ao personagem: movimento, estados e aparência.

import { PLAYER_STATES } from './config.js';

export default class Player {
    constructor(game) {
        // CORREÇÃO: O erro indica que o construtor pode estar recebendo um objeto
        // incorreto (como uma instância de 'Item'). Esta linha garante que estamos
        // usando a referência correta para o objeto principal do jogo.
        this.game = game.game || game;

        this.states = PLAYER_STATES;
        this.currentStateIndex = 0;

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
    
    // Atualiza a lógica do jogador a cada frame do jogo.
    update(keys) {
        const currentState = this.states[this.currentStateIndex];
        
        // Movimento horizontal (comum a vários estados)
        if (keys["ArrowLeft"] || keys["a"]) {
            this.x -= this.speedX;
            this.element.style.transform = "scaleX(1)";
        }
        if (keys["ArrowRight"] || keys["d"]) {
            this.x += this.speedX;
            this.element.style.transform = "scaleX(-1)";
        }
        
        // Movimento vertical (específico do estado, baseado no 'config.js')
        this.y += currentState.gravity; // Aplica a "gravidade" de cada estado
        if ((keys["ArrowUp"] || keys["w"]) && currentState.canFly) {
            this.y -= this.speedY;
        }
        if ((keys["ArrowDown"] || keys["s"]) && currentState.canFall) {
            this.y += this.speedY;
        }

        // Limita o jogador dentro do canvas.
        this.clampPosition();
        // Aplica a nova posição ao elemento no HTML.
        this.updatePosition();
    }

    // Atualiza a posição do elemento no DOM.
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    // Impede o jogador de sair da tela.
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
    
    // Muda para o próximo estado (líquido -> vapor -> etc).
    changeState() {
        this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
        this.element.src = this.states[this.currentStateIndex].src;
    }
}

