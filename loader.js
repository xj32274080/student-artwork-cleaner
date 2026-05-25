(function exposeLoader() {
  const LOCAL_OPENCV = 'libs/opencv.js';
  const CDN_OPENCV = 'https://docs.opencv.org/4.x/opencv.js';
  const LOCAL_JSZIP = 'libs/jszip.min.js';
  const CDN_JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const LOCAL_PPTX = 'libs/pptxgen.bundle.js';
  const CDN_PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  let openCvPromise = null;
  let jsZipPromise = null;
  let pptxPromise = null;

  function hasUsableOpenCv() {
    return Boolean(window.cv && typeof window.cv.imread === 'function' && typeof window.cv.Mat === 'function');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-loader-src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error(`加载失败：${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.loaderSrc = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`加载失败：${src}`));
      document.head.appendChild(script);
    });
  }

  function waitForRuntime(timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();

      function done() {
        resolve(window.cv);
      }

      function poll() {
        if (hasUsableOpenCv()) {
          done();
          return;
        }
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('OpenCV 加载失败，请检查网络或本地 libs。'));
          return;
        }
        setTimeout(poll, 80);
      }

      if (hasUsableOpenCv()) {
        done();
        return;
      }

      if (window.cv && typeof window.cv.then === 'function') {
        window.cv.then(() => waitForRuntime(timeoutMs).then(resolve, reject), reject);
        return;
      }

      if (window.cv) {
        const previous = window.cv.onRuntimeInitialized;
        window.cv.onRuntimeInitialized = function onRuntimeInitialized() {
          if (typeof previous === 'function') previous();
          done();
        };
      }

      poll();
    });
  }

  async function loadOpenCv() {
    if (openCvPromise) return openCvPromise;

    openCvPromise = (async () => {
      if (window.__USE_MOCK_CV__ && window.MockOpenCv) {
        window.cv = window.MockOpenCv;
        return window.cv;
      }

      if (hasUsableOpenCv()) return window.cv;

      if (!window.cv) {
        try {
          await loadScript(LOCAL_OPENCV);
        } catch (localError) {
          await loadScript(CDN_OPENCV);
        }
      }

      if (window.cv && typeof window.cv.then === 'function') {
        window.cv = await window.cv;
      }

      return waitForRuntime();
    })();

    return openCvPromise;
  }

  async function loadWithFallback(localSrc, cdnSrc, isReady) {
    if (isReady()) return;
    try {
      await loadScript(localSrc);
    } catch (localError) {
      await loadScript(cdnSrc);
    }
    if (!isReady()) throw new Error(`依赖加载失败：${cdnSrc}`);
  }

  function loadJSZip() {
    if (!jsZipPromise) {
      jsZipPromise = loadWithFallback(LOCAL_JSZIP, CDN_JSZIP, () => typeof window.JSZip !== 'undefined');
    }
    return jsZipPromise;
  }

  function loadPptxGen() {
    if (!pptxPromise) {
      pptxPromise = loadWithFallback(LOCAL_PPTX, CDN_PPTX, () => typeof window.pptxgen !== 'undefined');
    }
    return pptxPromise;
  }

  function warmupOptionalLibraries() {
    setTimeout(() => {
      loadJSZip().catch(() => {});
      loadPptxGen().catch(() => {});
    }, 600);
  }

  window.AppLoader = { loadJSZip, loadOpenCv, loadPptxGen, warmupOptionalLibraries };
})();
