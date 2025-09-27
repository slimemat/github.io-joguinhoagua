// javascript/common/EffectsManager.js
export default class EffectsManager {
    constructor() {
        this.confettiContainer = document.createElement('div');
        this.confettiContainer.id = 'confetti-container';
        document.body.appendChild(this.confettiContainer);
    }

    showConfetti() {
        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.classList.add('confetti');
            c.style.left = `${Math.random() * 100}vw`;
            c.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            this.confettiContainer.appendChild(c);
            setTimeout(() => c.remove(), 3000);
        }
    }
}
