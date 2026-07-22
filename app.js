
(function () {
  'use strict';

  /* ============================================================
     ESTADO DA APLICAÇÃO
     ============================================================ */
  let photos = [];
  let idCounter = 0;
  let dragSrcIndex = null;

  const els = {
    fileInput: document.getElementById('file-input'),
    fileInputAdd: document.getElementById('file-input-add'),
    emptyState: document.getElementById('empty-state'),
    workspace: document.getElementById('workspace'),
    grid: document.getElementById('grid'),
    photoCount: document.getElementById('photo-count'),
    filename: document.getElementById('filename'),
    footerBar: document.getElementById('footer-bar'),
    generateBtn: document.getElementById('generate-btn'),
    generateLabel: document.getElementById('generate-label'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingDetail: document.getElementById('loading-detail'),
    srStatus: document.getElementById('sr-status'),
    themeToggle: document.getElementById('theme-toggle'),
  };

  /* ============================================================
     TEMA CLARO / ESCURO
     ============================================================ */
  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
    document.getElementById('icon-moon').classList.toggle('hidden', isDark);
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark);

  els.themeToggle.addEventListener('click', () => {
    applyTheme(!document.documentElement.classList.contains('dark'));
  });

  /* ============================================================
     COMPRESSÃO E DIMENSIONAMENTO ROBUSTO DE IMAGENS (MOBILE-SAFE)
     ============================================================ */
  const MAX_DIMENSION = 2000;
  const JPEG_QUALITY = 0.82;

  async function processImageFile(file) {
    let bitmap;
    
    try {
      // Tenta decodificar E redimensionar diretamente no hardware (previne estouro de RAM no S25 Ultra)
      bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
        resizeWidth: MAX_DIMENSION,
        resizeQuality: 'high'
      });
    } catch (err) {
      try {
        // Fallback sem opção de resize caso a GPU do aparelho rejeite
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch (err2) {
        bitmap = await loadImageFallback(file);
      }
    }

    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Fundo branco para evitar transparências pretas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    if (bitmap.close) bitmap.close();

    return {
      dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
      width: targetW,
      height: targetH,
      aspectRatio: targetW / targetH
    };
  }

  function loadImageFallback(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ============================================================
     HANDLERS DE ENTRADA DE ARQUIVOS
     ============================================================ */
  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const startIndex = photos.length;

    for (const file of files) {
      try {
        const processed = await processImageFile(file);
        photos.push({ id: ++idCounter, ...processed });
      } catch (err) {
        console.error('Falha ao processar imagem:', file.name, err);
      }
    }

    render();
    highlightNewCards(startIndex);
    announce(`${files.length} foto${files.length > 1 ? 's' : ''} adicionada${files.length > 1 ? 's' : ''}.`);
  }

  els.fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  els.fileInputAdd.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  /* ============================================================
     GERENCIAMENTO DA GRADE VISUAL
     ============================================================ */
  function render() {
    const hasPhotos = photos.length > 0;
    els.emptyState.classList.toggle('hidden', hasPhotos);
    els.workspace.classList.toggle('hidden', !hasPhotos);
    els.footerBar.classList.toggle('hidden', !hasPhotos);
    els.photoCount.textContent = `${photos.length} página${photos.length === 1 ? '' : 's'}`;

    els.grid.innerHTML = '';
    photos.forEach((photo, index) => {
      els.grid.appendChild(buildCard(photo, index));
    });
  }

  function buildCard(photo, index) {
    const card = document.createElement('div');
    card.className = 'group relative surface-2 rounded-xl overflow-hidden border border-hair';
    card.draggable = true;
    card.dataset.id = photo.id;

    card.innerHTML = `
      <div class="aspect-[3/4] w-full overflow-hidden" style="background:var(--paper)">
        <img src="${photo.dataUrl}" alt="Foto ${index + 1}" class="w-full h-full object-cover pointer-events-none select-none" draggable="false">
      </div>
      <span class="absolute top-1.5 left-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-black/55 text-white">${index + 1}</span>
      <button type="button" data-action="remove" aria-label="Remover foto ${index + 1}"
        class="focus-ring absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 hover:bg-[var(--danger)] flex items-center justify-center transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
      </button>
      <div class="absolute bottom-0 inset-x-0 flex justify-between px-1.5 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <button type="button" data-action="left" aria-label="Mover foto ${index + 1} para a esquerda" ${index === 0 ? 'disabled' : ''}
          class="focus-ring w-7 h-7 rounded-full bg-black/55 flex items-center justify-center disabled:opacity-30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button type="button" data-action="right" aria-label="Mover foto ${index + 1} para a direita" ${index === photos.length - 1 ? 'disabled' : ''}
          class="focus-ring w-7 h-7 rounded-full bg-black/55 flex items-center justify-center disabled:opacity-30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    `;

    card.querySelector('[data-action="remove"]').addEventListener('click', () => removePhoto(index));
    card.querySelector('[data-action="left"]').addEventListener('click', () => movePhoto(index, index - 1));
    card.querySelector('[data-action="right"]').addEventListener('click', () => movePhoto(index, index + 1));

    card.addEventListener('dragstart', () => {
      dragSrcIndex = index;
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcIndex === null || dragSrcIndex === index) return;
      movePhoto(dragSrcIndex, index);
      dragSrcIndex = null;
    });

    return card;
  }

  function highlightNewCards(fromIndex) {
    const cards = els.grid.children;
    for (let i = fromIndex; i < cards.length; i++) {
      cards[i].classList.add('card-enter');
    }
  }

  function removePhoto(index) {
    photos.splice(index, 1);
    render();
  }

  function movePhoto(from, to) {
    if (to < 0 || to >= photos.length) return;
    const [moved] = photos.splice(from, 1);
    photos.splice(to, 0, moved);
    render();
  }

  function announce(msg) {
    els.srStatus.textContent = msg;
  }

  /* ============================================================
     GERAÇÃO DO DOCUMENTO PDF (PADRONIZADO EM MM PARA EVITAR BUGS DE DPI)
     ============================================================ */
  // A4 padrão universal em milímetros
  const A4_MM = { w: 210, h: 297 };

  function getSelectedValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function computeMargin(pageW, pageH, marginMode) {
    if (marginMode === 'none') return 0;
    return Math.round(Math.min(pageW, pageH) * 0.04); // Margem proporcional segura em mm
  }

  async function generatePdf() {
    if (!photos.length) return;

    const pageSizeMode = getSelectedValue('pageSize');
    const marginMode = getSelectedValue('margin');
    const rawName = els.filename.value.trim() || 'documento';
    const finalName = rawName.replace(/\.pdf$/i, '') + '.pdf';

    setLoading(true, 'preparando páginas');
    await nextFrame();

    try {
      const { jsPDF } = window.jspdf;
      let pdf = null;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setLoading(true, `página ${i + 1} de ${photos.length}`);

        let pageW, pageH;

        if (pageSizeMode === 'a4') {
          pageW = A4_MM.w;
          pageH = A4_MM.h;
        } else {
          // Modo "Original": converte proporção de pixels da foto para milímetros (escala 0.264583 mm/px)
          const pxToMm = 0.264583;
          pageW = photo.width * pxToMm;
          pageH = photo.height * pxToMm;
        }

        const orientation = pageW > pageH ? 'landscape' : 'portrait';

        if (!pdf) {
          pdf = new jsPDF({
            unit: 'mm', // Usa MILÍMETROS por padrão para evitar bugs de resolução em High-DPI
            format: [pageW, pageH],
            orientation
          });
        } else {
          pdf.addPage([pageW, pageH], orientation);
        }

        const margin = computeMargin(pageW, pageH, marginMode);
        const usableW = Math.max(1, pageW - margin * 2);
        const usableH = Math.max(1, pageH - margin * 2);

        const imgRatio = photo.aspectRatio;
        const boxRatio = usableW / usableH;
        let drawW, drawH;

        if (imgRatio > boxRatio) {
          drawW = usableW;
          drawH = usableW / imgRatio;
        } else {
          drawH = usableH;
          drawW = usableH * imgRatio;
        }

        const x = margin + (usableW - drawW) / 2;
        const y = margin + (usableH - drawH) / 2;

        // Renderiza a imagem perfeitamente dentro das margens físicas em mm
        pdf.addImage(photo.dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'MEDIUM');

        if (i % 2 === 1) await nextFrame();
      }

      setLoading(true, 'finalizando arquivo');
      await nextFrame();
      pdf.save(finalName);
      announce('PDF gerado e baixado com sucesso.');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      announce('Não foi possível gerar o PDF. Tente novamente.');
      alert('Não foi possível gerar o PDF. Tente novamente com menos fotos.');
    } finally {
      setLoading(false);
    }
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }

  function setLoading(isLoading, detail) {
    els.loadingOverlay.classList.toggle('hidden', !isLoading);
    els.generateBtn.disabled = isLoading;
    if (detail) els.loadingDetail.textContent = detail;
  }

  els.generateBtn.addEventListener('click', generatePdf);

})();