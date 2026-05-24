# 学生美术作品照片清洗器

一个本地可运行的小网页项目，用来批量处理学生美术作品照片：导入照片、自动找边、手动拖四角、裁切拉正、提亮去灰、下载清洗图 ZIP、生成网页作品墙、生成展示 PPT。

## 文件结构

```text
student-artwork-cleaner/
  index.html
  styles.css
  app.js
  image-cleaner.js
  gallery-export.js
  ppt-export.js
  libs/
  README.md
```

## 如何运行

方式一：直接双击 `index.html`。

方式二：用本地静态服务器打开，适合调试：

```powershell
cd D:\codex-work\student-artwork-cleaner
python -m http.server 8080
```

然后在浏览器访问：

```text
http://localhost:8080
```

## 如何测试

首次运行测试前安装依赖：

```powershell
cd D:\codex-work\student-artwork-cleaner
npm install
npx playwright install chromium
```

运行语法检查：

```powershell
npm run lint
```

运行端到端 smoke test：

```powershell
npm test
```

测试会自动生成一张模拟作品照片，不依赖真实学生照片。为避免测试被外网 CDN 和 OpenCV 编译耗时影响，smoke test 会注入轻量 OpenCV 测试桩，用来验证导入、清洗流程、清洗图 ZIP 和网页作品墙 ZIP 导出；真实页面仍使用 OpenCV.js。

## 外部依赖与 libs 离线方案

当前 `index.html` 默认从 CDN 加载：

- JSZip：生成 ZIP
- PptxGenJS：生成 PPTX
- OpenCV.js：自动找边、透视裁切

OpenCV 会优先尝试 `libs/opencv.js`，本地文件不存在时再尝试 CDN。如果 CDN 不稳定，可以把这些文件下载到 `libs/`：

```text
libs/jszip.min.js
libs/pptxgen.bundle.js
libs/opencv.js
```

JSZip 和 PptxGenJS 当前仍在 `index.html` 中从 CDN 加载；如需完全离线，可以把 script 改成：

```html
<script src="libs/jszip.min.js"></script>
<script src="libs/pptxgen.bundle.js"></script>
```

## 功能说明

- 清洗图 ZIP 使用原始清洗结果，不叠加展示滤镜。
- 网页作品墙和 PPT 会应用“展示滤镜”，但不会破坏或覆盖原始清洗图。
- 网页作品墙支持主题切换、展示滤镜和背景音乐上传。
- PPT 至少包含封面页、作品墙页、单作品展示页。
- 所有照片处理都在本地浏览器完成，不上传文件。
- 大量手机照片会占用较多浏览器内存，建议分批处理，比如每批 30-50 张。

## 注意事项

自动找边依赖 OpenCV.js。边界不明显、作品被遮挡、背景复杂或抽象画边缘较弱时，自动找边可能失败；这时请拖动四个橙色角点后再点击“裁切清洗”。

目前导入格式建议使用 JPG / PNG / WEBP。iPhone 的 HEIC / HEIF 照片很多浏览器不能直接解码，请先在系统相册或图片工具中转换为 JPG 后再导入。
