import { $, showToast, isMobile } from './utils.js';

// JSZip is loaded via CDN script tag in index.html (window.JSZip)
const JSZip = window.JSZip;

const MAX_PHOTOS = 10;
const OUTPUT_SIZE = 720;

let photos = [];
let selectedPhotoIndex = -1;

function processPhoto(photoData) {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  const img = photoData.origImg;
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;

  const filterStr = `brightness(${photoData.brightness}%) saturate(${photoData.saturation}%)`;
  if (typeof ctx.filter !== 'undefined') {
    ctx.filter = filterStr;
  }

  ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.filter = 'none';
  photoData.canvas = canvas;
}

function renderPhotoGrid() {
  const photoGrid = $('#photoGrid');
  photoGrid.innerHTML = '';
  photos.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'photo-item' + (i === selectedPhotoIndex ? ' selected' : '');
    item.appendChild(p.canvas);

    p.canvas.style.filter = `brightness(${p.brightness}%) saturate(${p.saturation}%)`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'photo-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photos.splice(i, 1);
      if (selectedPhotoIndex === i) selectedPhotoIndex = -1;
      else if (selectedPhotoIndex > i) selectedPhotoIndex--;
      renderPhotoGrid();
      updatePhotoUI();
    });
    item.appendChild(removeBtn);

    const indexBadge = document.createElement('span');
    indexBadge.className = 'photo-index';
    indexBadge.textContent = i + 1;
    item.appendChild(indexBadge);

    item.addEventListener('click', () => {
      if (selectedPhotoIndex === i) {
        selectedPhotoIndex = -1;
      } else {
        selectedPhotoIndex = i;
      }
      renderPhotoGrid();
      syncSliders();
    });

    photoGrid.appendChild(item);
  });
}

function syncSliders() {
  if (selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length) {
    const p = photos[selectedPhotoIndex];
    $('#brightnessSlider').value = p.brightness;
    $('#saturationSlider').value = p.saturation;
    $('#brightnessVal').textContent = p.brightness;
    $('#saturationVal').textContent = p.saturation;
  }
}

function updatePhotoUI() {
  const hasPhotos = photos.length > 0;
  $('#sliderControls').style.display = hasPhotos ? '' : 'none';
  $('#downloadActions').style.display = hasPhotos ? '' : 'none';
}

function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  const remaining = MAX_PHOTOS - photos.length;
  if (remaining <= 0) {
    showToast(`最大${MAX_PHOTOS}枚までです`);
    return;
  }
  const toAdd = files.slice(0, remaining);
  if (files.length > remaining) {
    showToast(`${remaining}枚のみ追加しました（上限${MAX_PHOTOS}枚）`);
  }

  toAdd.forEach(file => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const photoData = {
          file,
          origImg: img,
          brightness: 100,
          saturation: 100,
          canvas: null
        };
        photos.push(photoData);
        processPhoto(photoData);
        renderPhotoGrid();
        updatePhotoUI();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function getPhotoBlob(photoData) {
  return new Promise(resolve => {
    processPhoto(photoData);
    photoData.canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
  });
}

export function initPhotoTab() {
  if (isMobile) {
    $('#dropZoneText').textContent = 'タップして画像を選択';
  }

  const dropZone = $('#dropZone');
  const photoFileInput = $('#photoFileInput');

  dropZone.addEventListener('click', () => photoFileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  photoFileInput.addEventListener('change', () => {
    handleFiles(photoFileInput.files);
    photoFileInput.value = '';
  });

  $('#brightnessSlider').addEventListener('input', () => {
    const val = parseInt($('#brightnessSlider').value);
    $('#brightnessVal').textContent = val;
    if (selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length) {
      photos[selectedPhotoIndex].brightness = val;
      processPhoto(photos[selectedPhotoIndex]);
      renderPhotoGrid();
    }
  });

  $('#saturationSlider').addEventListener('input', () => {
    const val = parseInt($('#saturationSlider').value);
    $('#saturationVal').textContent = val;
    if (selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length) {
      photos[selectedPhotoIndex].saturation = val;
      processPhoto(photos[selectedPhotoIndex]);
      renderPhotoGrid();
    }
  });

  $('#applyAllBtn').addEventListener('click', () => {
    const b = parseInt($('#brightnessSlider').value);
    const s = parseInt($('#saturationSlider').value);
    photos.forEach(p => {
      p.brightness = b;
      p.saturation = s;
      processPhoto(p);
    });
    renderPhotoGrid();
    showToast('全画像に適用しました');
  });

  $('#downloadZipBtn').addEventListener('click', async () => {
    if (photos.length === 0) return;
    const zip = new JSZip();
    for (let i = 0; i < photos.length; i++) {
      const blob = await getPhotoBlob(photos[i]);
      zip.file(`photo_${i + 1}.jpg`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'mercari_photos.zip';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('ZIPをダウンロードしました');
  });

  $('#downloadAllIndividual').addEventListener('click', async () => {
    for (let i = 0; i < photos.length; i++) {
      const blob = await getPhotoBlob(photos[i]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `photo_${i + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    showToast('ダウンロードしました');
  });
}
