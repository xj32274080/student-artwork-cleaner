(function exposeGalleryExport() {
  const themes = {
    museum: { label: '小小美术馆', mark: '□' },
    garden: { label: '童心花园', mark: '✿' },
    watercolor: { label: '水彩时光', mark: '◌' },
    star: { label: '星空画廊', mark: '✦' },
  };

  const filterLabels = {
    original: '原色展示',
    soft: '柔和提亮',
    warm: '暖色童年',
    fresh: '清新明亮',
    film: '轻胶片感',
    contrast: '高对比展览',
  };

  function themeColors(theme) {
    const map = {
      museum: { bg: '#f0ece4', card: '#ffffff', ink: '#2f2a24', muted: '#6f655b', line: '#d8cdbd', pale: '#e8e0d3', accent: '#927457', mark: '□' },
      garden: { bg: '#fff4e4', card: '#ffffff', ink: '#5f3326', muted: '#8a6855', line: '#efc9a7', pale: '#ffe5ca', accent: '#d57949', mark: '✿' },
      watercolor: { bg: '#f7f4ff', card: '#ffffff', ink: '#26345f', muted: '#66708e', line: '#d7d5ef', pale: '#eaf5ff', accent: '#7b91cf', mark: '◌' },
      star: { bg: '#111827', card: '#ffffff', ink: '#f9fafb', muted: '#cbd5e1', line: '#334155', pale: '#1f2937', accent: '#f7c873', mark: '✦' },
    };
    return map[theme] || map.museum;
  }

  async function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function safeFileName(name) {
    return String(name).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'artwork';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[char]));
  }

  function downloadBlob(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function displayName(item, index = 0) {
    return item.title || item.artworkTitle || item.name || `作品 ${index + 1}`;
  }

  function buildWorks(items, imageNames) {
    return items.map((item, index) => ({
      id: item.id || `work-${index + 1}`,
      imageFileName: imageNames[index],
      originalFileName: item.imageFileName || item.fileName || '',
      title: displayName(item, index),
      studentName: item.studentName || '',
      className: item.className || '',
      note: item.note || '',
      selected: item.selected !== false,
      displayOrder: item.displayOrder || index + 1,
    }));
  }

  async function buildCleanZip(items) {
    const zip = new JSZip();
    for (let index = 0; index < items.length; index += 1) {
      const blob = await canvasToBlob(items[index].outputCanvas);
      zip.file(safeFileName(`${String(index + 1).padStart(3, '0')}_${displayName(items[index], index)}.jpg`), blob);
    }
    return zip.generateAsync({ type: 'blob' });
  }

  async function buildGalleryZip(items, options) {
    const zip = new JSZip();
    const root = zip.folder('gallery-export');
    const images = root.folder('assets/images');
    const music = root.folder('assets/music');
    root.folder('assets/css').file('gallery.css', window.GalleryTemplate.buildGalleryCss());
    root.folder('assets/js').file('gallery.js', window.GalleryTemplate.buildGalleryJs());

    const imageNames = [];
    for (let index = 0; index < items.length; index += 1) {
      const name = `${String(index + 1).padStart(3, '0')}.jpg`;
      imageNames.push(name);
      images.file(name, await canvasToBlob(items[index].outputCanvas));
    }

    let hasMusic = false;
    let musicFileName = '';
    if (options.musicFile) {
      hasMusic = true;
      const ext = (options.musicFile.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp3').toLowerCase();
      musicFileName = `bgm${ext}`;
      music.file(musicFileName, options.musicFile);
    }

    const meta = {
      ...options.meta,
      themeName: options.themeName,
      themeLabel: themes[options.themeName]?.label || themes.museum.label,
      filterName: options.filterName,
      filterLabel: filterLabels[options.filterName] || filterLabels.original,
      displayMode: options.displayMode || 'wall',
      hasMusic,
      musicFileName,
    };
    const works = buildWorks(items, imageNames);
    const worksData = { meta, works };
    root.folder('data').file('works.json', JSON.stringify(worksData, null, 2));
    root.file('index.html', window.GalleryTemplate.buildIndexHtml(meta, {
      themeName: options.themeName,
      filterName: options.filterName,
      hasMusic,
      worksData,
    }));
    return zip.generateAsync({ type: 'blob' });
  }

  window.GalleryExport = {
    buildCleanZip,
    buildGalleryZip,
    canvasToBlob,
    downloadBlob,
    escapeHtml,
    safeFileName,
    themeColors,
  };
})();
