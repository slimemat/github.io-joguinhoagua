// questionPanel.js
export function showQuestionPanel(text, onAnswer, image = null, imageClass = '') {
  const panel = document.createElement('div');
  panel.className = 'question-panel';
  let imageHTML = image ? `<img src="${image}" class="question-panel-img ${imageClass}" alt="">` : '';
  panel.innerHTML = `
    ${imageHTML}
    <p>${text}</p>
    <button id="true-btn">Verdadeiro</button>
    <button id="false-btn">Falso</button>
  `;
  document.body.appendChild(panel);
  document.getElementById('true-btn').onclick = () => {
    panel.remove();
    if (onAnswer) onAnswer('verdadeiro');
  };
  document.getElementById('false-btn').onclick = () => {
    panel.remove();
    if (onAnswer) onAnswer('falso');
  };
}