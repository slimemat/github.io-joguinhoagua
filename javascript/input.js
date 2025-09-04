// js/input.js
// Gerencia todos os inputs do teclado.

export default class InputHandler {
    constructor() {
        this.keys = {};
        
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            // A lógica de changeState foi movida para o Player,
            // mas o evento pode ser capturado aqui se necessário.
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });
    }
}
