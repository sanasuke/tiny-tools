import { $, showToast } from './utils.js';
import { openModal } from './utils.js';

const STORAGE_KEY = 'tt-gemini-api-key';

export function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
export function saveApiKey(key) { localStorage.setItem(STORAGE_KEY, key); }
export function clearApiKeyStorage() { localStorage.removeItem(STORAGE_KEY); }

// ============================================================
// API Key UI (side effect: registers event listeners)
// ============================================================
const apiKeyInput = $('#apiKeyInput');

if (getApiKey()) {
  apiKeyInput.placeholder = '保存済み';
}

$('#saveKeyBtn').addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) { showToast('APIキーを入力してください'); return; }
  saveApiKey(key);
  apiKeyInput.value = '';
  apiKeyInput.placeholder = '保存済み';
  showToast('APIキーを保存しました');
});

$('#clearKeyBtn').addEventListener('click', () => {
  clearApiKeyStorage();
  apiKeyInput.value = '';
  apiKeyInput.placeholder = 'APIキーを入力...';
  showToast('APIキーをクリアしました');
});

$('#apiKeyHelpLink').addEventListener('click', (e) => { e.preventDefault(); openModal(); });
