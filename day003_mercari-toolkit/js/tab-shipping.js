import { $, $$ } from './utils.js';
import { SHIPPING_METHODS } from './data.js';

function checkSizeFit(h, w, d, weight, method) {
  const ms = method.maxSize;
  const dims = [h, w, d].sort((a, b) => b - a);
  const longest = dims[0];
  const mid = dims[1];
  const shortest = dims[2];
  const sum = h + w + d;

  if (ms.sum !== null) {
    if (sum > ms.sum) return false;
    if (ms.w !== null && longest > ms.w) return false;
    if (method.maxWeight !== null && weight > 0 && weight > method.maxWeight) return false;
    return true;
  }

  if (ms.w !== null && longest > ms.w) return false;
  if (ms.h !== null && mid > ms.h) return false;
  if (ms.d !== null && shortest > ms.d) return false;
  if (method.maxWeight !== null && weight > 0 && weight > method.maxWeight) return false;
  return true;
}

let shippingDebounceTimer = null;

function renderShippingResults() {
  const price = parseInt($('#profitPrice').value) || 0;
  const fee = Math.floor(price * 0.1);
  const promo = $('#promoToggle').checked ? Math.floor(price * 0.05) : 0;
  const packaging = parseInt($('#packagingCost').value) || 0;
  const onlyAnonymous = $('#anonymousToggle').checked;

  const h = parseFloat($('#sizeH').value) || 0;
  const w = parseFloat($('#sizeW').value) || 0;
  const d = parseFloat($('#sizeD').value) || 0;
  const weight = parseFloat($('#sizeWeight').value) || 0;
  const hasSize = h > 0 || w > 0 || d > 0 || weight > 0;

  // Deduplicate
  let methods = [];
  const seenNames = new Set();
  for (const m of SHIPPING_METHODS) {
    if (!seenNames.has(m.name)) {
      seenNames.add(m.name);
      methods.push(m);
    }
  }

  if (onlyAnonymous) {
    methods = methods.filter(m => m.anonymous);
  }

  // Split fit / not-fit
  let fitMethods, notFitMethods;
  if (hasSize) {
    fitMethods = [];
    notFitMethods = [];
    methods.forEach(m => {
      if (checkSizeFit(h, w, d, weight, m)) {
        fitMethods.push(m);
      } else {
        notFitMethods.push(m);
      }
    });
  } else {
    fitMethods = methods;
    notFitMethods = [];
  }

  // Sort fit methods by cost
  fitMethods.sort((a, b) => a.cost - b.cost);
  notFitMethods.sort((a, b) => a.cost - b.cost);

  // Find best profit & cheapest anonymous
  let bestProfit = -Infinity;
  if (price > 0) {
    fitMethods.forEach(m => {
      const profit = price - fee - promo - m.cost - packaging;
      if (profit > bestProfit) bestProfit = profit;
    });
  }
  const cheapestAnonymous = hasSize ? fitMethods.find(m => m.anonymous) : null;

  // Render table
  let html = '';
  if (hasSize && fitMethods.length === 0) {
    html += '<p style="color:#e74c3c;font-size:0.85rem;margin-bottom:0.75rem;">該当する配送方法が見つかりません。サイズを確認してください。</p>';
  }

  if (fitMethods.length > 0) {
    html += '<div style="overflow-x:auto;">';
    html += '<table class="shipping-table"><thead><tr>';
    html += '<th>配送方法</th><th>送料</th>';
    if (price > 0) {
      html += '<th>手数料(10%)</th>';
      if (promo > 0) html += '<th>プロモ(5%)</th>';
      html += '<th>利益</th>';
    }
    html += '</tr></thead><tbody>';

    const cols = 2 + (price > 0 ? 2 + (promo > 0 ? 1 : 0) : 0);
    let currentGroup = '';
    fitMethods.forEach(m => {
      if (m.group !== currentGroup) {
        currentGroup = m.group;
        const anon = m.anonymous ? '（匿名）' : '（非匿名）';
        html += `<tr class="group-header"><td colspan="${cols}">${currentGroup} ${anon}</td></tr>`;
      }
      const profit = price > 0 ? price - fee - promo - m.cost - packaging : 0;
      const isBest = price > 0 && profit === bestProfit && profit > 0;
      const profitClass = profit < 0 ? 'negative' : (profit > 0 ? 'positive' : '');
      const rowClass = isBest ? 'best-profit' : '';
      const isRecommend = hasSize && m === cheapestAnonymous;

      html += `<tr class="${rowClass}">`;
      html += `<td>${m.name}`;
      if (isRecommend) html += ` <span class="badge-recommend">オススメ</span>`;
      if (m.note) html += `<br><span style="font-size:0.7rem;color:#999;">${m.note}</span>`;
      html += `</td>`;
      html += `<td>${m.cost.toLocaleString()}円</td>`;
      if (price > 0) {
        html += `<td>${fee.toLocaleString()}円</td>`;
        if (promo > 0) html += `<td>${promo.toLocaleString()}円</td>`;
        html += `<td class="${profitClass}">${profit.toLocaleString()}円</td>`;
      }
      html += `</tr>`;
    });
    html += '</tbody></table></div>';
  }

  // Not-fit section
  if (notFitMethods.length > 0) {
    html += '<div class="not-fit-section">';
    html += `<button class="not-fit-toggle" id="notFitToggle">&#9660; サイズ外の配送方法（${notFitMethods.length}件）</button>`;
    html += '<div class="not-fit-list" id="notFitList" style="overflow-x:auto;">';
    html += '<table class="shipping-table"><tbody>';
    notFitMethods.forEach(m => {
      html += `<tr style="opacity:0.4;"><td>${m.name}</td><td>${m.cost.toLocaleString()}円</td>`;
      if (price > 0) {
        const profit = price - fee - promo - m.cost - packaging;
        html += `<td>${fee.toLocaleString()}円</td>`;
        if (promo > 0) html += `<td>${promo.toLocaleString()}円</td>`;
        html += `<td>${profit.toLocaleString()}円</td>`;
      }
      html += `</tr>`;
    });
    html += '</tbody></table></div></div>';
  }

  $('#shippingResults').innerHTML = html;

  // Toggle listener
  const toggleBtn = $('#notFitToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const list = $('#notFitList');
      const isVisible = list.classList.toggle('visible');
      toggleBtn.innerHTML = (isVisible ? '&#9650;' : '&#9660;') + ` サイズ外の配送方法（${notFitMethods.length}件）`;
    });
  }
}

function onShippingInput() {
  clearTimeout(shippingDebounceTimer);
  shippingDebounceTimer = setTimeout(renderShippingResults, 200);
}

export function initShippingTab() {
  $('#profitPrice').addEventListener('input', onShippingInput);
  $('#packagingCost').addEventListener('input', onShippingInput);
  ['sizeH', 'sizeW', 'sizeD', 'sizeWeight'].forEach(id => {
    $(`#${id}`).addEventListener('input', onShippingInput);
  });
  $('#anonymousToggle').addEventListener('change', renderShippingResults);
  $('#promoToggle').addEventListener('change', renderShippingResults);
  renderShippingResults();
}
