// javascript/item.js
// A classe Item gerencia o objeto coletável do jogo.

import { ITEM_IMAGES } from './config.js';

export default class Item {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('item');
        this.images = ITEM_IMAGES;

        // Garante que o item comece com a imagem correta.
        this.updateImage(0);
        // Coloca o item em uma posição aleatória inicial.
        this.randomizePosition(0);
    }

    // Move o item para uma nova posição aleatória na tela.
    randomizePosition(playerStateIndex) {
        const x = Math.floor(Math.random() * (this.game.width - this.element.clientWidth));
        const y = Math.floor(Math.random() * (this.game.height - this.element.clientHeight));
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        
        // Atualiza a imagem do item para corresponder ao novo estado do jogador.
        this.updateImage(playerStateIndex);
    }
    
    // Atualiza a imagem do item com base no estado atual do jogador.
    updateImage(playerStateIndex) {
        this.element.src = this.images[playerStateIndex];
    }
}
