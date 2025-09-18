// javascript/common/feedbackPanel.js

/**
 * Displays a rich feedback panel after an answer.
 * @param {object} options - The configuration for the panel.
 * @param {boolean} options.isCorrect - Determines the panel's color scheme.
 * @param {string} options.title - The title text (e.g., "Parabéns!").
 * @param {string} options.text - The main explanation text.
 * @param {string|null} options.image - URL for an optional image.
 * @param {function} options.onClose - The function to call when the panel is closed.
 * @param {Array<{text: string, callback: function}>|null} options.actionButtons - Optional buttons for choices.
 */
export function showFeedbackPanel({ isCorrect, title, text, image, onClose, actionButtons = null, choicePrompt = null }) {
  const panel = document.createElement('div');
  panel.className = `feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`;
  const imageHTML = image ? `<img src="${image}" class="img-panel" alt="Feedback Image">` : '';

  const choicePromptHTML = choicePrompt ? `<p class="choice-prompt">${choicePrompt}</p>` : '';

  let buttonsHTML = '';
  if (actionButtons && actionButtons.length > 0) {
    // roguelike choice button as a reward
    buttonsHTML = actionButtons.map((btn, index) => 
      `<button class="action-btn" id="action-btn-${index}">
         <span class="btn-title">${btn.title}</span>
         <span class="btn-subtitle">${btn.subtitle}</span>
       </button>`
    ).join('');
  } else {
    // incorrect answers
    buttonsHTML = '<button class="action-btn" id="continue-btn">Continuar<span class="key-hint">F</span></button>';
  }

  panel.innerHTML = `
    <h1>${title}</h1>
    ${imageHTML}
    <p>${text}</p>
    ${choicePromptHTML} 
    <div class="button-group">
    ${buttonsHTML}
    </div>
  `;

  document.body.appendChild(panel);

  // --- Event Handlers ---
  const closePanel = () => {
    panel.remove();
    if (onClose) onClose();
  };

  if (actionButtons && actionButtons.length > 0) {
    actionButtons.forEach((btn, index) => {
      document.getElementById(`action-btn-${index}`).onclick = () => {
        if (btn.callback) {btn.callback(); }
        console.log(`Choice button '${btn.title}' clicked.`); 
        closePanel();
      };
    });
  } else {
    document.getElementById('continue-btn').onclick = closePanel;
  }
}