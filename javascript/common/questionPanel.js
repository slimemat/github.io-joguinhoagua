import { showOverlay, hideOverlay } from "./ui.js";

// questionPanel.js
export function showQuestionPanel(text, onAnswer, image = null, imageClass = '', options = null) {
  showOverlay();
  const panel = document.createElement('div');
  panel.className = 'question-panel';
  let buttonsHTML = '';



  if (options && options.length === 2) {
    buttonsHTML = `
      <div class="option-btn-group">
        <button class="option-btn" id="option1-btn">${options[0]}<span class="key-hint">1</span></button>
        <button class="option-btn" id="option2-btn">${options[1]}<span class="key-hint">2</span></button>
      </div>
    `;
  } else {
    buttonsHTML = `
      <button id="false-btn">Falso<span class="key-hint">1</span></button>
      <button id="true-btn">Verdadeiro<span class="key-hint">2</span></button>
    `;
  }

  panel.innerHTML = `
    <div class="panel-title">Pergunta</div>
    <p>${text}</p>
    ${buttonsHTML}
  `;
  document.body.appendChild(panel);

  if (options && options.length === 2) {
    document.getElementById('option1-btn').onclick = () => {
      hideOverlay();
      panel.remove();
      if (onAnswer) onAnswer(options[0]);
    };
    document.getElementById('option2-btn').onclick = () => {
      hideOverlay();
      panel.remove();
      if (onAnswer) onAnswer(options[1]);
    };
  } else {
    document.getElementById('true-btn').onclick = () => {
      hideOverlay();
      panel.remove();
      if (onAnswer) onAnswer('verdadeiro');
    };
    document.getElementById('false-btn').onclick = () => {
      hideOverlay();
      panel.remove();
      if (onAnswer) onAnswer('falso');
    };
  }
}