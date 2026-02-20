import { $, showToast } from './utils.js';
import { KEYWORDS } from './data.js';

function updateTitleCounter() {
  const titleInput = $('#titleInput');
  const len = titleInput.value.length;
  $('#charCountNum').textContent = len;

  const pct = Math.min((len / 40) * 100, 100);
  $('#progressBar').style.width = pct + '%';

  let color;
  if (len <= 30) color = '#4a90d9';
  else if (len <= 38) color = '#f39c12';
  else color = '#e74c3c';

  $('#charCountNum').style.color = color;
  $('#progressBar').style.background = color;

  const charWarning = $('#charWarning');
  if (len === 0) {
    charWarning.textContent = '';
  } else if (len >= 35 && len < 40) {
    charWarning.textContent = `あと${40 - len}文字`;
    charWarning.style.color = len <= 38 ? '#f39c12' : '#e74c3c';
  } else if (len === 40) {
    charWarning.textContent = 'ちょうど上限です';
    charWarning.style.color = '#e74c3c';
  } else if (len > 40) {
    charWarning.textContent = `${len - 40}文字超過しています`;
    charWarning.style.color = '#e74c3c';
  } else {
    charWarning.textContent = '';
  }
}

function renderKeywordChips() {
  const cat = $('#keywordCategory').value;
  const words = KEYWORDS[cat] || [];
  const keywordChips = $('#keywordChips');
  keywordChips.innerHTML = words.map(w =>
    `<span class="keyword-chip" data-word="${w}">${w}</span>`
  ).join('');

  keywordChips.querySelectorAll('.keyword-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const word = chip.dataset.word;
      const input = $('#titleInput');
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const val = input.value;
      const newVal = val.substring(0, start) + word + val.substring(end);
      if (newVal.length <= 60) {
        input.value = newVal;
        const newPos = start + word.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();
        updateTitleCounter();
      } else {
        showToast('文字数上限を超えるため挿入できません');
      }
    });
  });
}

export function initTitleTab() {
  $('#titleInput').addEventListener('input', updateTitleCounter);
  $('#keywordCategory').addEventListener('change', renderKeywordChips);
  renderKeywordChips();
}
