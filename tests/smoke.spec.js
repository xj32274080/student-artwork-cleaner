const { test, expect } = require('@playwright/test');
const fs = require('fs');
const http = require('http');
const JSZip = require('jszip');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let server;
let baseUrl;

test.beforeAll(async () => {
  server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const filePath = path.normalize(path.join(rootDir, decodeURIComponent(pathname)));

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      const types = {
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.svg': 'image/svg+xml',
      };
      response.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      response.end(data);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('imports, cleans, and exports generated artwork image', async ({ page }, testInfo) => {
  const fixturePath = path.join(testInfo.outputDir, 'tilted-artwork.svg');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(fixturePath, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760">
  <rect width="1000" height="760" fill="#2f3437"/>
  <polygon points="210,105 835,155 785,650 160,585" fill="#ffffff" stroke="#f2f2f2" stroke-width="8"/>
  <path d="M260 250 C380 150, 470 380, 620 230 S780 300, 690 455" fill="none" stroke="#d26c4a" stroke-width="26" stroke-linecap="round"/>
  <circle cx="370" cy="430" r="58" fill="#7da9a0" opacity="0.92"/>
  <rect x="500" y="420" width="160" height="90" rx="18" fill="#f0c36a"/>
</svg>`, 'utf8');

  await page.addInitScript(() => {
    window.__USE_MOCK_CV__ = true;
    window.MockOpenCv = {
      __mock: true,
      Mat: function Mat() {},
      imread() {
        return {};
      },
    };
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#statusBox')).toContainText(/正在加载 OpenCV|OpenCV 已就绪/);
  await expect(page.locator('#statusBox')).toContainText('OpenCV 已就绪', { timeout: 60000 });

  await page.locator('#fileInput').setInputFiles(fixturePath);
  await expect(page.locator('#imageList .image-item')).toHaveCount(1);

  await page.locator('#studentName').fill('测试学生');
  await page.locator('#artworkTitle').fill('自动化测试作品');
  await page.locator('#exhibitionTitle').fill('童心绘世界');
  await page.locator('#exhibitionSubtitle').fill('学生美术作品线上展');
  await page.locator('#schoolName').fill('测试小学');
  await page.locator('#className').fill('三年级 1 班');
  await page.locator('#introText').fill('这是一场由自动化测试生成的线上作品展。');
  await page.locator('#galleryTheme').selectOption('garden');
  await page.locator('#displayFilter').selectOption('soft');
  await page.locator('#autoBtn').click();
  await expect(page.locator('#statusBox')).toContainText(/自动找边成功|自动找边失败/, { timeout: 30000 });

  await page.locator('#processBtn').click();
  await expect(page.locator('#previewBox img')).toBeVisible({ timeout: 30000 });

  const cleanDownload = page.waitForEvent('download');
  await page.locator('#downloadZipBtn').click();
  const cleanZip = await cleanDownload;
  const cleanPath = await cleanZip.path();
  expect(fs.statSync(cleanPath).size).toBeGreaterThan(1000);

  const galleryDownload = page.waitForEvent('download');
  await page.locator('#downloadGalleryBtn').click();
  const galleryZip = await galleryDownload;
  const galleryPath = await galleryZip.path();
  expect(fs.statSync(galleryPath).size).toBeGreaterThan(1000);
  const zip = await JSZip.loadAsync(fs.readFileSync(galleryPath));
  expect(zip.file('gallery-export/index.html')).toBeTruthy();
  expect(zip.file('gallery-export/assets/css/gallery.css')).toBeTruthy();
  expect(zip.file('gallery-export/assets/js/gallery.js')).toBeTruthy();
  expect(zip.file('gallery-export/data/works.json')).toBeTruthy();
  expect(zip.file('gallery-export/assets/images/001.jpg')).toBeTruthy();
  const indexHtml = await zip.file('gallery-export/index.html').async('string');
  expect(indexHtml).toContain('童心绘世界');
  expect(indexHtml).toContain('assets/css/gallery.css');
  expect(indexHtml).toContain('assets/js/gallery.js');
  expect(indexHtml).not.toContain('照片清洗器');
  expect(indexHtml).not.toContain('管理端');
  expect(indexHtml).not.toContain('调试');
  expect(indexHtml).not.toContain('自动找边');
  const worksData = JSON.parse(await zip.file('gallery-export/data/works.json').async('string'));
  expect(worksData.works).toHaveLength(1);
  expect(worksData.works[0].title).toBe('自动化测试作品');

  await page.locator('#clearBtn').click();
  await expect(page.locator('#imageList .image-item')).toHaveCount(0);
});
