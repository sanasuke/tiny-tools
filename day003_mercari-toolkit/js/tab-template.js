import { $, showToast, isMobile } from './utils.js';
import { getApiKey } from './apiKey.js';

async function callGemini(apiKey, prompt, maxRetries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '（生成結果が空でした）';
    }
    if (res.status === 429 && attempt < maxRetries) {
      const wait = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const err = await res.json().catch(() => ({}));
    if (res.status === 400) throw new Error('APIキーが無効です');
    if (res.status === 429) throw new Error('リクエスト上限に達しました。しばらく時間をおいてお試しください');
    throw new Error(err.error?.message || `APIエラー: ${res.status}`);
  }
}

export function initTemplateTab() {
  const generateBtn = $('#generateBtn');
  const generatedOutput = $('#generatedOutput');
  const generatedText = $('#generatedText');
  let isGenerating = false;

  generateBtn.addEventListener('click', async () => {
    if (isGenerating) return;
    const apiKey = getApiKey();
    if (!apiKey) { showToast('APIキーを保存してください'); return; }

    const name = $('#tmplName').value.trim();
    const hasAnyInput = [name, $('#tmplBrand').value, $('#tmplSize').value, $('#tmplPurchaseDate').value, $('#tmplUsage').value, $('#tmplAccessories').value, $('#tmplDamage').value, $('#tmplPrice').value, $('#tmplReference').value].some(v => v.trim());
    if (!hasAnyInput) { showToast('少なくとも1つの項目を入力してください'); return; }

    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    const fields = {
      カテゴリ: $('#tmplCategory').value,
      商品名: name,
      ブランド: $('#tmplBrand').value.trim(),
      商品の状態: $('#tmplCondition').value,
      サイズ: $('#tmplSize').value.trim(),
      購入時期: $('#tmplPurchaseDate').value.trim(),
      使用頻度: $('#tmplUsage').value.trim(),
      付属品: $('#tmplAccessories').value.trim(),
      欠損ダメージ: $('#tmplDamage').value.trim(),
      希望価格: $('#tmplPrice').value.trim()
    };

    const reference = $('#tmplReference').value.trim();

    let prompt = 'あなたはメルカリの出品説明文を作成するプロのライターです。\n';
    prompt += '以下の商品情報をもとに、魅力的で購入意欲を高める出品説明文を生成してください。\n';
    prompt += '説明文だけを出力してください（タイトルや見出しは不要）。\n\n';
    prompt += '【商品情報】\n';
    for (const [key, val] of Object.entries(fields)) {
      if (val) prompt += `- ${key}: ${val}\n`;
    }
    if (reference) {
      prompt += `\n【参考説明文】\n以下の文体やスタイルを参考にしてください:\n${reference}\n`;
    }

    try {
      const result = await callGemini(apiKey, prompt);
      generatedText.value = result;
      generatedOutput.classList.add('visible');
      generatedOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showToast(err.message);
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      generateBtn.textContent = '説明文を生成';
    }
  });

  $('#copyTextBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(generatedText.value).then(() => showToast('コピーしました'));
  });

  if (isMobile) {
    const mercariLink = $('#mercariLink');
    mercariLink.href = 'mercari://';
    mercariLink.removeAttribute('target');
  }
}
