(function startApp() {
  let cvReady = false;
  let items = [];
  let currentIndex = -1;
  let musicFile = null;
  const viewState = { scale: 1, offsetX: 0, offsetY: 0, dragging: -1 };

  const $ = (id) => document.getElementById(id);
  const fileInput = $('fileInput');
  const dropZone = $('dropZone');
  const imageList = $('imageList');
  const viewCanvas = $('viewCanvas');
  const viewContext = viewCanvas.getContext('2d');

  function setStatus(message) {
    $('statusBox').textContent = message;
  }

  function bindRange(id, labelId) {
    const input = $(id);
    const label = $(labelId);
    input.addEventListener('input', () => {
      label.textContent = input.value;
    });
  }

  function waitForOpenCvRuntime() {
    if (window.cv?.Mat) {
      cvReady = true;
      setStatus('OpenCV 已加载。可以导入照片开始处理。');
      updateButtons();
      return;
    }

    window.addEventListener('opencv-script-loaded', () => {
      if (window.cv) {
        cv.onRuntimeInitialized = () => {
          cvReady = true;
          setStatus('OpenCV 已加载。可以导入照片开始处理。');
          updateButtons();
        };
      }
    });
  }

  async function handleFiles(files) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setStatus(`正在读取 ${imageFiles.length} 张图片……`);
    for (const file of imageFiles) {
      try {
        items.push(await loadImageItem(file));
      } catch (error) {
        console.error(error);
      }
    }

    renderList();
    if (currentIndex === -1 && items.length) selectIndex(0);
    setStatus(`已导入 ${items.length} 张。建议先逐张自动找边，确认边框后再清洗。`);
    updateButtons();
  }

  function loadImageItem(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSide = 2200;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve({
          name: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          canvas,
          points: window.ImageCleaner.defaultPoints(canvas),
          outputCanvas: null,
          status: '待处理',
          note: '',
        });
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  function renderList() {
    imageList.innerHTML = '';
    items.forEach((item, index) => {
      const node = document.createElement('div');
      node.className = `image-item${index === currentIndex ? ' active' : ''}`;
      node.onclick = () => selectIndex(index);

      const thumb = document.createElement('img');
      thumb.className = 'thumb';
      thumb.alt = item.fileName;
      thumb.src = (item.outputCanvas || item.canvas).toDataURL('image/jpeg', 0.7);

      const meta = document.createElement('div');
      const tagClass = item.status === '已清洗' ? 'ok' : item.status.includes('复核') ? 'warn' : '';
      meta.innerHTML = `<div class="item-name">${window.GalleryExport.escapeHtml(item.fileName)}</div><span class="tag ${tagClass}">${item.status}</span>`;

      node.append(thumb, meta);
      imageList.appendChild(node);
    });
  }

  function selectIndex(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    renderList();
    renderCurrent();
    updatePreview();
    updateButtons();
  }

  function updateButtons() {
    const hasCurrent = currentIndex >= 0;
    ['prevBtn', 'nextBtn', 'autoBtn', 'processBtn', 'rotateLeftBtn', 'rotateRightBtn', 'processAllBtn', 'downloadZipBtn', 'downloadGalleryBtn', 'downloadPptBtn'].forEach((id) => {
      $(id).disabled = !hasCurrent;
    });
    $('autoBtn').disabled = !hasCurrent || !cvReady;
    $('processBtn').disabled = !hasCurrent || !cvReady;
    $('processAllBtn').disabled = !hasCurrent || !cvReady;
    $('prevBtn').disabled = !hasCurrent || currentIndex <= 0;
    $('nextBtn').disabled = !hasCurrent || currentIndex >= items.length - 1;
  }

  function renderCurrent() {
    viewContext.clearRect(0, 0, viewCanvas.width, viewCanvas.height);
    if (currentIndex < 0) {
      $('currentName').textContent = '还没有导入照片';
      $('currentMeta').textContent = '请选择一批学生作品照片。';
      viewContext.fillStyle = '#fffdf8';
      viewContext.fillRect(0, 0, viewCanvas.width, viewCanvas.height);
      viewContext.fillStyle = '#7a6d61';
      viewContext.font = '24px sans-serif';
      viewContext.textAlign = 'center';
      viewContext.fillText('导入照片后，在这里调整作品四角', viewCanvas.width / 2, viewCanvas.height / 2);
      return;
    }

    const item = items[currentIndex];
    $('currentName').textContent = item.fileName;
    $('currentMeta').textContent = `${currentIndex + 1} / ${items.length} · ${item.canvas.width}×${item.canvas.height} · ${item.status}`;

    const scale = Math.min(viewCanvas.width / item.canvas.width, viewCanvas.height / item.canvas.height);
    const width = item.canvas.width * scale;
    const height = item.canvas.height * scale;
    const offsetX = (viewCanvas.width - width) / 2;
    const offsetY = (viewCanvas.height - height) / 2;
    viewState.scale = scale;
    viewState.offsetX = offsetX;
    viewState.offsetY = offsetY;

    viewContext.fillStyle = '#fff';
    viewContext.fillRect(0, 0, viewCanvas.width, viewCanvas.height);
    viewContext.drawImage(item.canvas, offsetX, offsetY, width, height);
    drawPolygon(item.points, scale, offsetX, offsetY);
  }

  function drawPolygon(points, scale, offsetX, offsetY) {
    if (!points || points.length !== 4) return;
    viewContext.save();
    viewContext.lineWidth = 4;
    viewContext.strokeStyle = '#f97316';
    viewContext.fillStyle = 'rgba(249, 115, 22, .12)';
    viewContext.beginPath();
    points.forEach((point, index) => {
      const x = offsetX + point.x * scale;
      const y = offsetY + point.y * scale;
      if (index === 0) viewContext.moveTo(x, y);
      else viewContext.lineTo(x, y);
    });
    viewContext.closePath();
    viewContext.fill();
    viewContext.stroke();

    points.forEach((point, index) => {
      const x = offsetX + point.x * scale;
      const y = offsetY + point.y * scale;
      viewContext.beginPath();
      viewContext.arc(x, y, 11, 0, Math.PI * 2);
      viewContext.fillStyle = '#ffedd5';
      viewContext.fill();
      viewContext.lineWidth = 3;
      viewContext.strokeStyle = '#ea580c';
      viewContext.stroke();
      viewContext.fillStyle = '#7c2d12';
      viewContext.font = 'bold 13px sans-serif';
      viewContext.textAlign = 'center';
      viewContext.textBaseline = 'middle';
      viewContext.fillText(String(index + 1), x, y);
    });
    viewContext.restore();
  }

  function pointerPos(event) {
    const pointer = event.touches ? event.touches[0] : event;
    const rect = viewCanvas.getBoundingClientRect();
    return {
      x: (pointer.clientX - rect.left) * (viewCanvas.width / rect.width),
      y: (pointer.clientY - rect.top) * (viewCanvas.height / rect.height),
    };
  }

  function startDrag(event) {
    if (currentIndex < 0) return;
    event.preventDefault();
    const item = items[currentIndex];
    const pos = pointerPos(event);
    let best = -1;
    let bestDistance = Infinity;
    item.points.forEach((point, index) => {
      const screenX = viewState.offsetX + point.x * viewState.scale;
      const screenY = viewState.offsetY + point.y * viewState.scale;
      const distance = Math.hypot(pos.x - screenX, pos.y - screenY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    if (bestDistance < 35) viewState.dragging = best;
  }

  function dragMove(event) {
    if (currentIndex < 0 || viewState.dragging < 0) return;
    event.preventDefault();
    const item = items[currentIndex];
    const pos = pointerPos(event);
    item.points[viewState.dragging] = {
      x: window.ImageCleaner.clamp((pos.x - viewState.offsetX) / viewState.scale, 0, item.canvas.width),
      y: window.ImageCleaner.clamp((pos.y - viewState.offsetY) / viewState.scale, 0, item.canvas.height),
    };
    renderCurrent();
  }

  function endDrag() {
    viewState.dragging = -1;
  }

  function getEnhanceSettings() {
    return {
      brightness: Number($('brightness').value),
      contrast: Number($('contrast').value),
      shadow: Number($('shadow').value),
      saturation: Number($('saturation').value),
    };
  }

  function autoDetectCurrent() {
    if (currentIndex < 0 || !cvReady) return;
    const item = items[currentIndex];
    const points = window.ImageCleaner.detectDocumentCorners(item.canvas);
    if (points) {
      item.points = points;
      item.status = '已找边';
      item.note = '自动找边成功，请检查橙色框是否贴合作品边缘。';
      setStatus(item.note);
    } else {
      item.status = '需复核';
      item.note = '自动找边失败。请手动拖动四个橙色点到作品四角。';
      setStatus(item.note);
    }
    renderList();
    renderCurrent();
  }

  function rotateCurrent(degrees) {
    if (currentIndex < 0) return;
    const item = items[currentIndex];
    const oldCanvas = item.canvas;
    const out = document.createElement('canvas');
    const context = out.getContext('2d');
    if (Math.abs(degrees) === 90) {
      out.width = oldCanvas.height;
      out.height = oldCanvas.width;
      context.translate(out.width / 2, out.height / 2);
      context.rotate((degrees * Math.PI) / 180);
      context.drawImage(oldCanvas, -oldCanvas.width / 2, -oldCanvas.height / 2);
    } else {
      out.width = oldCanvas.width;
      out.height = oldCanvas.height;
      context.drawImage(oldCanvas, 0, 0);
    }
    item.canvas = out;
    item.points = window.ImageCleaner.defaultPoints(out);
    item.outputCanvas = null;
    item.status = '已旋转，待处理';
    renderList();
    renderCurrent();
    updatePreview();
  }

  function processCurrent() {
    if (currentIndex < 0 || !cvReady) return;
    const item = items[currentIndex];
    const result = window.ImageCleaner.cropAndClean(item, getEnhanceSettings());
    if (result) {
      item.outputCanvas = result;
      item.status = '已清洗';
      item.note = '已生成清洗图。';
      setStatus(`${item.fileName}\n已裁切、拉正、清洗。`);
    } else {
      item.status = '需复核';
      setStatus(`${item.fileName}\n处理失败，请重新调整四个角。`);
    }
    renderList();
    renderCurrent();
    updatePreview();
  }

  async function processAll() {
    if (!items.length || !cvReady) return;
    let ok = 0;
    let review = 0;
    setStatus('正在批量自动找边并清洗……请不要关闭页面。');
    for (let index = 0; index < items.length; index += 1) {
      currentIndex = index;
      renderList();
      renderCurrent();
      await sleep(20);
      const points = window.ImageCleaner.detectDocumentCorners(items[index].canvas);
      if (points) {
        items[index].points = points;
        const result = window.ImageCleaner.cropAndClean(items[index], getEnhanceSettings());
        if (result) {
          items[index].outputCanvas = result;
          items[index].status = '已清洗';
          ok += 1;
        } else {
          items[index].status = '需复核';
          review += 1;
        }
      } else {
        items[index].status = '需复核';
        review += 1;
      }
    }
    renderList();
    renderCurrent();
    updatePreview();
    setStatus(`批量处理完成：成功 ${ok} 张，需要人工复核 ${review} 张。\n点击左侧列表查看“需复核”的照片，拖四角后再点“裁切清洗”。`);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function updatePreview() {
    const box = $('previewBox');
    box.innerHTML = '';
    if (currentIndex < 0 || !items[currentIndex].outputCanvas) {
      box.innerHTML = '<span>清洗后的预览会出现在这里</span>';
      return;
    }
    const image = document.createElement('img');
    image.alt = '清洗后的作品预览';
    image.src = items[currentIndex].outputCanvas.toDataURL('image/jpeg', 0.9);
    box.appendChild(image);
  }

  function cleanedItems() {
    return items.filter((item) => item.outputCanvas);
  }

  async function downloadCleanZip() {
    const done = cleanedItems();
    if (!done.length) {
      alert('还没有清洗后的图片。');
      return;
    }
    if (typeof JSZip === 'undefined') {
      alert('JSZip 还没有加载成功，请检查网络或改用 libs 本地依赖。');
      return;
    }
    setStatus('正在打包清洗图 ZIP……');
    const blob = await window.GalleryExport.buildCleanZip(done);
    window.GalleryExport.downloadBlob(blob, '清洗后的学生作品照片.zip');
    setStatus('清洗图 ZIP 已生成。');
  }

  async function downloadGalleryZip() {
    const done = cleanedItems();
    if (!done.length) {
      alert('还没有清洗后的图片。');
      return;
    }
    if (typeof JSZip === 'undefined') {
      alert('JSZip 还没有加载成功，请检查网络或改用 libs 本地依赖。');
      return;
    }
    setStatus('正在打包网页作品墙 ZIP……');
    const blob = await window.GalleryExport.buildGalleryZip(done, {
      themeName: $('galleryTheme').value,
      filterName: $('displayFilter').value,
      musicFile,
    });
    window.GalleryExport.downloadBlob(blob, '学生作品网页展廊.zip');
    setStatus('网页作品墙 ZIP 已生成。解压后打开 index.html 即可。');
  }

  async function downloadPptx() {
    const done = cleanedItems();
    if (!done.length) {
      alert('还没有清洗后的图片。');
      return;
    }
    try {
      setStatus('正在生成 PPT……');
      await window.PptExport.downloadPptx(done, {
        themeName: $('galleryTheme').value,
        filterName: $('displayFilter').value,
      });
      setStatus('PPT 已生成。PPT 不自动嵌入音乐，音乐请优先用网页作品墙播放。');
    } catch (error) {
      alert(error.message);
      setStatus(error.message);
    }
  }

  function bindEvents() {
    bindRange('brightness', 'brightnessVal');
    bindRange('contrast', 'contrastVal');
    bindRange('shadow', 'shadowVal');
    bindRange('saturation', 'saturationVal');

    fileInput.addEventListener('change', (event) => handleFiles([...event.target.files]));
    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('dragover');
      handleFiles([...event.dataTransfer.files]);
    });

    $('clearBtn').onclick = () => {
      items = [];
      currentIndex = -1;
      renderList();
      renderCurrent();
      updatePreview();
      updateButtons();
      setStatus('已清空。');
    };
    $('helpBtn').onclick = () => alert('使用方法：\n\n1. 批量导入照片。\n2. 选中一张，点“自动找边”。\n3. 如果橙色框不准，拖动四个圆点到作品四角。\n4. 点“裁切清洗”。\n5. 全部完成后下载 ZIP、网页作品墙或 PPT。\n\n注意：抽象画、边界不明显、作品被遮挡时，自动找边可能失败，需要手动点四角。');
    $('prevBtn').onclick = () => selectIndex(Math.max(0, currentIndex - 1));
    $('nextBtn').onclick = () => selectIndex(Math.min(items.length - 1, currentIndex + 1));
    $('autoBtn').onclick = autoDetectCurrent;
    $('processBtn').onclick = processCurrent;
    $('rotateLeftBtn').onclick = () => rotateCurrent(-90);
    $('rotateRightBtn').onclick = () => rotateCurrent(90);
    $('processAllBtn').onclick = processAll;
    $('downloadZipBtn').onclick = downloadCleanZip;
    $('downloadGalleryBtn').onclick = downloadGalleryZip;
    $('downloadPptBtn').onclick = downloadPptx;
    $('musicInput').addEventListener('change', (event) => {
      musicFile = event.target.files?.[0] || null;
      setStatus(musicFile ? `已选择背景音乐：${musicFile.name}` : '已取消背景音乐。');
    });

    viewCanvas.addEventListener('mousedown', startDrag);
    viewCanvas.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', endDrag);
    viewCanvas.addEventListener('touchstart', startDrag, { passive: false });
    viewCanvas.addEventListener('touchmove', dragMove, { passive: false });
    window.addEventListener('touchend', endDrag);
  }

  bindEvents();
  renderCurrent();
  updatePreview();
  updateButtons();
  waitForOpenCvRuntime();
})();
