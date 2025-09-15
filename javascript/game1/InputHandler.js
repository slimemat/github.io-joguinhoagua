// js/input.js
// Gerencia todos os inputs do teclado.

export default class InputHandler {
    /**
     * @param {function} onKeyPress - Callback chamado sempre que qualquer tecla é pressionada
     */
    constructor(onKeyPress = null) {
        this.keys = {};
        this.onKeyPress = onKeyPress;
        
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            if (this.onKeyPress) this.onKeyPress(e.key);
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });
    }
}
