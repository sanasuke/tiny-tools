export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);
export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ============================================================
// Toast
// ============================================================
let toastTimer = null;
export function showToast(msg) {
  const toastEl = $('#toast');
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

// ============================================================
// Tab Switching
// ============================================================
export function switchTab(tabId) {
  $$('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === tabId));
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tabId}`));
  closeSidebar();
}

$$('.sidebar-nav a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(a.dataset.tab);
  });
});

// ============================================================
// Mobile Sidebar
// ============================================================
export function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#overlay').classList.add('active');
}

export function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.remove('active');
}

$('#fab').addEventListener('click', () => {
  $('#sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
});

$('#overlay').addEventListener('click', closeSidebar);

// ============================================================
// Modal
// ============================================================
export function openModal() { $('#helpModal').classList.add('active'); }
export function closeModal() { $('#helpModal').classList.remove('active'); }

$('#modalCloseBtn').addEventListener('click', closeModal);
$('#helpModal').addEventListener('click', (e) => { if (e.target === $('#helpModal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
