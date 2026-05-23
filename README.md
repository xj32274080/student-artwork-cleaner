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

## 外部依赖与 libs 离线方案

当前 `index.html` 默认从 CDN 加载：

- JSZip：生成 ZIP
- PptxGenJS：生成 PPTX
- OpenCV.js：自动找边、透视裁切

如果 CDN 不稳定，可以把这些文件下载到 `libs/`：

```text
libs/jszip.min.js
libs/pptxgen.bundle.js
libs/opencv.js
```

然后把 `index.html` 里的三个 `<script src="https://...">` 改成：

```html
<script src="libs/jszip.min.js"></script>
<script src="libs/pptxgen.bundle.js"></script>
<script async src="libs/opencv.js" onload="onOpenCvLoaded()"></script>
```

## 功能说明

- 清洗图 ZIP 使用原始清洗结果，不叠加展示滤镜。
- 网页作品墙和 PPT 会应用“展示滤镜”，但不会破坏或覆盖原始清洗图。
- 网页作品墙支持主题切换、展示滤镜和背景音乐上传。
- PPT 至少包含封面页、作品墙页、单作品展示页。
- 所有照片处理都在本地浏览器完成，不上传文件。

## 注意事项

自动找边依赖 OpenCV.js。边界不明显、作品被遮挡、背景复杂或抽象画边缘较弱时，自动找边可能失败；这时请拖动四个橙色角点后再点击“裁切清洗”。
