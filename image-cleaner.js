(function exposeImageCleaner() {
  function defaultPoints(canvas) {
    const marginX = canvas.width * 0.08;
    const marginY = canvas.height * 0.08;
    return [
      { x: marginX, y: marginY },
      { x: canvas.width - marginX, y: marginY },
      { x: canvas.width - marginX, y: canvas.height - marginY },
      { x: marginX, y: canvas.height - marginY },
    ];
  }

  function orderPoints(points) {
    const sum = points.map((point) => point.x + point.y);
    const diff = points.map((point) => point.x - point.y);
    const topLeft = points[sum.indexOf(Math.min(...sum))];
    const bottomRight = points[sum.indexOf(Math.max(...sum))];
    const topRight = points[diff.indexOf(Math.max(...diff))];
    const bottomLeft = points[diff.indexOf(Math.min(...diff))];
    return [topLeft, topRight, bottomRight, bottomLeft].map((point) => ({ x: point.x, y: point.y }));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function detectDocumentCorners(canvas) {
    if (!window.cv) return null;
    let src;
    let gray;
    let blur;
    let edges;
    let contours;
    let hierarchy;
    try {
      src = cv.imread(canvas);
      gray = new cv.Mat();
      blur = new cv.Mat();
      edges = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
      cv.Canny(blur, edges, 45, 140);
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let best = null;
      let bestArea = 0;
      const imageArea = canvas.width * canvas.height;
      for (let index = 0; index < contours.size(); index += 1) {
        const contour = contours.get(index);
        const area = cv.contourArea(contour);
        if (area < imageArea * 0.08) {
          contour.delete();
          continue;
        }
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.025 * perimeter, true);
        if (approx.rows === 4 && area > bestArea) {
          const data = approx.data32S;
          best = [];
          for (let pointIndex = 0; pointIndex < 4; pointIndex += 1) {
            best.push({ x: data[pointIndex * 2], y: data[pointIndex * 2 + 1] });
          }
          bestArea = area;
        }
        approx.delete();
        contour.delete();
      }
      return best ? orderPoints(best) : null;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      [src, gray, blur, edges, contours, hierarchy].forEach((mat) => {
        if (mat && !mat.isDeleted?.()) mat.delete?.();
      });
    }
  }

  function cropAndClean(item, settings) {
    if (!window.cv) return null;
    let src;
    let dst;
    let transform;
    let srcTri;
    let dstTri;
    try {
      const points = orderPoints(item.points);
      const maxWidth = Math.max(100, Math.round(Math.max(distance(points[2], points[3]), distance(points[1], points[0]))));
      const maxHeight = Math.max(100, Math.round(Math.max(distance(points[1], points[2]), distance(points[0], points[3]))));

      src = cv.imread(item.canvas);
      srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        points[0].x, points[0].y,
        points[1].x, points[1].y,
        points[2].x, points[2].y,
        points[3].x, points[3].y,
      ]);
      dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        maxWidth, 0,
        maxWidth, maxHeight,
        0, maxHeight,
      ]);
      transform = cv.getPerspectiveTransform(srcTri, dstTri);
      dst = new cv.Mat();
      cv.warpPerspective(src, dst, transform, new cv.Size(maxWidth, maxHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));

      const rectified = document.createElement('canvas');
      cv.imshow(rectified, dst);
      const finalCanvas = addMarginAndResize(rectified, 1800, 48);
      enhanceCanvas(finalCanvas, settings);
      return finalCanvas;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      [src, dst, transform, srcTri, dstTri].forEach((mat) => {
        if (mat && !mat.isDeleted?.()) mat.delete?.();
      });
    }
  }

  function addMarginAndResize(srcCanvas, maxLong = 1800, margin = 48) {
    const scale = Math.min(1, (maxLong - margin * 2) / Math.max(srcCanvas.width, srcCanvas.height));
    const width = Math.round(srcCanvas.width * scale);
    const height = Math.round(srcCanvas.height * scale);
    const out = document.createElement('canvas');
    out.width = width + margin * 2;
    out.height = height + margin * 2;
    const context = out.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, out.width, out.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(srcCanvas, margin, margin, width, height);
    return out;
  }

  function enhanceCanvas(canvas, settings) {
    const context = canvas.getContext('2d');
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
    const saturation = 1 + settings.saturation / 100;

    for (let index = 0; index < data.length; index += 4) {
      let red = data[index];
      let green = data[index + 1];
      let blue = data[index + 2];
      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
      const shadowLift = settings.shadow * Math.pow(1 - luminance / 255, 2);

      red = contrastFactor * (red - 128) + 128 + settings.brightness + shadowLift;
      green = contrastFactor * (green - 128) + 128 + settings.brightness + shadowLift;
      blue = contrastFactor * (blue - 128) + 128 + settings.brightness + shadowLift;

      const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
      data[index] = clamp(gray + (red - gray) * saturation, 0, 255);
      data[index + 1] = clamp(gray + (green - gray) * saturation, 0, 255);
      data[index + 2] = clamp(gray + (blue - gray) * saturation, 0, 255);
    }
    context.putImageData(image, 0, 0);
  }

  function makeDisplayCanvas(srcCanvas, filterName) {
    const out = document.createElement('canvas');
    out.width = srcCanvas.width;
    out.height = srcCanvas.height;
    const context = out.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, out.width, out.height);
    context.filter = filterCss(filterName);
    context.drawImage(srcCanvas, 0, 0);
    context.filter = 'none';
    return out;
  }

  function filterCss(name) {
    const filters = {
      natural: 'none',
      soft: 'brightness(1.06) contrast(1.04) saturate(1.04)',
      warm: 'brightness(1.05) contrast(1.04) saturate(1.12) sepia(.08)',
      fresh: 'brightness(1.07) contrast(1.06) saturate(1.08)',
      vivid: 'brightness(1.04) contrast(1.12) saturate(1.22)',
    };
    return filters[name] || filters.natural;
  }

  window.ImageCleaner = {
    clamp,
    cropAndClean,
    defaultPoints,
    detectDocumentCorners,
    filterCss,
    makeDisplayCanvas,
    orderPoints,
  };
})();
