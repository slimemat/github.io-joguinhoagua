// infoPanel.js
export function showInfoPanel(text, onClose, image = null, imageClass = '') {
  const panel = document.createElement('div');
  panel.className = 'info-panel';
  let imageHTML = image ? `<img src="${image}" class="info-panel-img ${imageClass}" alt="">` : '';
  panel.innerHTML = `
    ${imageHTML}
    <p>${text}</p>
    <button id="close-info">OK<span class="key-hint">F</span></button>
  `;
  document.body.appendChild(panel);
  document.getElementById('close-info').onclick = () => {
    panel.remove();
    if (onClose) onClose();
  };
}