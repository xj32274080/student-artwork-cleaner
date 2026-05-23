(function exposePptExport() {
  function hex(color) {
    return color.replace('#', '').toUpperCase();
  }

  function containSize(pixelWidth, pixelHeight, boxWidth, boxHeight) {
    const ratio = Math.min(boxWidth / pixelWidth, boxHeight / pixelHeight);
    return { w: pixelWidth * ratio, h: pixelHeight * ratio };
  }

  function displayName(item, fallbackIndex = 0) {
    return item.artworkTitle || item.name || `作品 ${fallbackIndex + 1}`;
  }

  function authorLine(item) {
    return [item.studentName, item.note].filter(Boolean).join(' · ');
  }

  function decorateSlide(slide, pptx, colors) {
    slide.background = { color: hex(colors.bg) };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.18,
      y: 0.15,
      w: 12.97,
      h: 7.2,
      fill: { color: hex(colors.bg) },
      line: { color: hex(colors.line), width: 1.2 },
    });
    const opts = { fontFace: 'Microsoft YaHei', fontSize: 22, color: hex(colors.accent), bold: true };
    slide.addText(colors.mark, { x: 0.35, y: 0.28, w: 0.5, h: 0.3, ...opts });
    slide.addText(colors.mark, { x: 12.52, y: 0.28, w: 0.5, h: 0.3, ...opts, rotate: 90 });
    slide.addText(colors.mark, { x: 0.35, y: 6.85, w: 0.5, h: 0.3, ...opts, rotate: 270 });
    slide.addText(colors.mark, { x: 12.52, y: 6.85, w: 0.5, h: 0.3, ...opts, rotate: 180 });
  }

  function addArtworkCard(slide, item, x, y, w, h, filterName, colors, pptx, big = false, index = 0) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: 0.08,
      fill: { color: hex(colors.card) },
      line: { color: hex(colors.line), width: 1 },
      shadow: { type: 'outer', color: 'BCA38A', opacity: 0.18, blur: 2, angle: 45, distance: 1 },
    });
    const displayCanvas = window.ImageCleaner.makeDisplayCanvas(item.outputCanvas, filterName);
    const imageData = displayCanvas.toDataURL('image/jpeg', 0.92);
    const padding = big ? 0.18 : 0.12;
    const captionHeight = big ? 0.5 : 0.34;
    const fit = containSize(displayCanvas.width, displayCanvas.height, w - padding * 2, h - padding * 2 - captionHeight);
    slide.addImage({ data: imageData, x: x + (w - fit.w) / 2, y: y + padding, w: fit.w, h: fit.h });
    slide.addText(displayName(item, index), {
      x: x + 0.1,
      y: y + h - captionHeight,
      w: w - 0.2,
      h: 0.22,
      fontFace: 'Microsoft YaHei',
      fontSize: big ? 12 : 9,
      bold: true,
      color: hex(colors.ink),
      align: 'center',
    });
    if (authorLine(item)) {
      slide.addText(authorLine(item), {
        x: x + 0.1,
        y: y + h - captionHeight + 0.23,
        w: w - 0.2,
        h: 0.2,
        fontFace: 'Microsoft YaHei',
        fontSize: big ? 10 : 7,
        color: hex(colors.muted),
        align: 'center',
      });
    }
  }

  async function downloadPptx(items, options) {
    if (typeof pptxgen === 'undefined') {
      throw new Error('PPT 生成库还没有加载成功，请检查网络或改用 libs 本地依赖。');
    }

    const meta = options.meta || {};
    const title = meta.exhibitionTitle || '学生美术作品展';
    const subtitle = [meta.schoolName, meta.className].filter(Boolean).join(' · ') || '童心 · 色彩 · 想象力';
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = '学生作品照片清洗器';
    pptx.subject = title;
    pptx.title = title;
    pptx.company = 'Generated locally';
    const colors = window.GalleryExport.themeColors(options.themeName);

    let slide = pptx.addSlide();
    decorateSlide(slide, pptx, colors);
    slide.addText(title, { x: 1.2, y: 1.65, w: 11, h: 0.8, fontFace: 'Microsoft YaHei', fontSize: 34, bold: true, color: hex(colors.ink), align: 'center' });
    slide.addText(subtitle, { x: 1.2, y: 2.55, w: 11, h: 0.5, fontFace: 'Microsoft YaHei', fontSize: 18, color: hex(colors.muted), align: 'center' });
    slide.addText(`共 ${items.length} 件作品`, { x: 1.2, y: 3.18, w: 11, h: 0.4, fontFace: 'Microsoft YaHei', fontSize: 14, color: hex(colors.muted), align: 'center' });

    for (let start = 0; start < items.length; start += 6) {
      slide = pptx.addSlide();
      decorateSlide(slide, pptx, colors);
      slide.addText('作品墙', { x: 0.55, y: 0.28, w: 4, h: 0.4, fontFace: 'Microsoft YaHei', fontSize: 18, bold: true, color: hex(colors.ink) });
      items.slice(start, start + 6).forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        addArtworkCard(slide, item, 0.65 + col * 4.15, 0.9 + row * 2.95, 3.45, 2.35, options.filterName, colors, pptx, false, start + index);
      });
    }

    items.forEach((item, index) => {
      slide = pptx.addSlide();
      decorateSlide(slide, pptx, colors);
      slide.addText(displayName(item, index), { x: 0.8, y: 0.35, w: 11.7, h: 0.45, fontFace: 'Microsoft YaHei', fontSize: 20, bold: true, color: hex(colors.ink), align: 'center' });
      addArtworkCard(slide, item, 1.65, 1.05, 10, 5.7, options.filterName, colors, pptx, true, index);
    });

    await pptx.writeFile({ fileName: `${title}_展示PPT.pptx` });
  }

  window.PptExport = { downloadPptx };
})();
