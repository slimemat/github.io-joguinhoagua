// questionPanel.js
export function showQuestionPanel(text, onAnswer, image = null, imageClass = '', options = null) {
  const panel = document.createElement('div');
  panel.className = 'question-panel';
  let imageHTML = image ? `<img src="${image}" class="question-panel-img ${imageClass}" alt="">` : '';
  let buttonsHTML = '';



  if (options && options.length === 2) {
    buttonsHTML = `
      <div class="option-btn-group">
        <button class="option-btn" id="option1-btn">${options[0]}</button>
        <button class="option-btn" id="option2-btn">${options[1]}</button>
      </div>
    `;
  } else {
    buttonsHTML = `
      <button id="false-btn">Falso</button>
      <button id="true-btn">Verdadeiro</button>
    `;
  }

  panel.innerHTML = `
    ${imageHTML}
    <p>${text}</p>
    ${buttonsHTML}
  `;
  document.body.appendChild(panel);

  if (options && options.length === 2) {
    document.getElementById('option1-btn').onclick = () => {
      panel.remove();
      if (onAnswer) onAnswer(options[0]);
    };
    document.getElementById('option2-btn').onclick = () => {
      panel.remove();
      if (onAnswer) onAnswer(options[1]);
    };
  } else {
    document.getElementById('true-btn').onclick = () => {
      panel.remove();
      if (onAnswer) onAnswer('verdadeiro');
    };
    document.getElementById('false-btn').onclick = () => {
      panel.remove();
      if (onAnswer) onAnswer('falso');
    };
  }
}