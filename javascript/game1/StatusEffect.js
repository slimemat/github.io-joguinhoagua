// javascript/StatusEffect.js
export default class StatusEffect {
    constructor(player) {
        this.player = player;
        this.activeEffects = new Map(); // { effectName: timeoutId }
    }

    apply(effect, duration, applyFn, removeFn) {
        // evita reaplicar se já está ativo
        if (this.activeEffects.has(effect)) return;

        applyFn(this.player);

        const timeoutId = setTimeout(() => {
            removeFn(this.player);
            this.activeEffects.delete(effect);
        }, duration);

        this.activeEffects.set(effect, timeoutId);
    }

    clear(effect) {
        if (this.activeEffects.has(effect)) {
            clearTimeout(this.activeEffects.get(effect));
            this.activeEffects.delete(effect);
        }
    }

    clearAll() {
        this.activeEffects.forEach(timeoutId => clearTimeout(timeoutId));
        this.activeEffects.clear();
    }
}
