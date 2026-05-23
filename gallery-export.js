(function exposeGalleryExport() {
  const themes = {
    flower: { bg: '#fff7ed', card: '#ffffff', ink: '#7c2d12', muted: '#a16207', line: '#fdba74', pale: '#ffedd5', accent: '#ea580c', mark: '✿' },
    watercolor: { bg: '#eff6ff', card: '#ffffff', ink: '#1e3a8a', muted: '#64748b', line: '#bae6fd', pale: '#dbeafe', accent: '#0ea5e9', mark: '◌' },
    museum: { bg: '#f8fafc', card: '#ffffff', ink: '#1f2937', muted: '#6b7280', line: '#cbd5e1', pale: '#e5e7eb', accent: '#475569', mark: '□' },
    star: { bg: '#faf5ff', card: '#ffffff', ink: '#581c87', muted: '#7e22ce', line: '#e9d5ff', pale: '#f3e8ff', accent: '#a855f7', mark: '✦' },
  };

  function themeColors(theme) {
    return themes[theme] || themes.flower;
  }

  async function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function safeFileName(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
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

  function buildGalleryHtml(items, imageNames, themeName, filterName, musicName) {
    const colors = themeColors(themeName);
    const filter = window.ImageCleaner.filterCss(filterName);
    const cards = items.map((item, index) => `
      <figure class="card">
        <div class="photo-wrap"><img src="images/${imageNames[index]}" alt="${escapeHtml(item.name)}" /></div>
        <figcaption>${escapeHtml(item.name || '学生作品')}</figcaption>
      </figure>`).join('\n');
    const audio = musicName
      ? `<div class="music"><button id="playBtn" type="button">播放 / 暂停音乐</button><audio id="bgm" src="music/${musicName}" loop controls></audio></div>`
      : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>学生美术作品展</title>
<style>
:root{--bg:${colors.bg};--card:${colors.card};--ink:${colors.ink};--muted:${colors.muted};--line:${colors.line};--pale:${colors.pale};--accent:${colors.accent};--filter:${filter};--mark:"${colors.mark}";}
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;background:radial-gradient(circle at top left,var(--pale),var(--bg) 52%,#fff);color:var(--ink);}
header{position:relative;overflow:hidden;text-align:center;padding:54px 20px 32px;border-bottom:1px solid var(--line);}header:before,header:after{content:var(--mark);position:absolute;top:18px;color:var(--accent);font-size:86px;opacity:.16;}header:before{left:8vw}header:after{right:8vw;transform:rotate(18deg)}
h1{margin:0;font-size:42px;letter-spacing:0}.sub{margin-top:12px;color:var(--muted);font-size:17px}.music{display:flex;gap:12px;justify-content:center;align-items:center;margin:22px auto 0;flex-wrap:wrap}.music button{border:0;border-radius:999px;background:var(--accent);color:white;padding:10px 18px;font-weight:700;cursor:pointer}.music audio{width:70%;max-width:320px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:26px;max-width:1500px;margin:0 auto;padding:32px}.card{position:relative;margin:0;padding:16px;border:1px solid var(--line);border-radius:8px;background:var(--card);box-shadow:0 18px 45px rgba(80,55,25,.13);transition:.22s transform,.22s box-shadow}.card:hover{transform:translateY(-4px);box-shadow:0 24px 58px rgba(80,55,25,.18)}.card:before{content:"";position:absolute;inset:9px;border:1px dashed var(--line);border-radius:6px;pointer-events:none;opacity:.75}.photo-wrap{display:flex;align-items:center;justify-content:center;height:300px;overflow:hidden;border:1px solid #f1e5d1;border-radius:6px;background:#fff}.photo-wrap img{max-width:100%;max-height:100%;object-fit:contain;filter:var(--filter);cursor:pointer}.card figcaption{text-align:center;padding:12px 4px 2px;color:var(--muted);font-size:16px}.lightbox{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.84);z-index:99}.lightbox.show{display:flex}.lightbox img{max-width:96vw;max-height:90vh;border-radius:8px;background:#fff;filter:var(--filter)}.corner{position:fixed;width:90px;height:90px;pointer-events:none;opacity:.35}.c1{left:18px;top:18px}.c2{right:18px;top:18px;transform:rotate(90deg)}.c3{left:18px;bottom:18px;transform:rotate(-90deg)}.c4{right:18px;bottom:18px;transform:rotate(180deg)}.corner:before{content:var(--mark);font-size:74px;color:var(--accent)}
@media(max-width:640px){h1{font-size:30px}.grid{padding:18px;gap:18px}.photo-wrap{height:250px}}
</style>
</head>
<body>
<div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>
<header><h1>学生美术作品展</h1><div class="sub">童心入画 · 色彩成诗 · 每一幅都值得被认真看见</div>${audio}</header>
<main class="grid">${cards}</main>
<div class="lightbox" id="lightbox"><img id="big" alt="作品大图"></div>
<script>
const lightbox=document.getElementById('lightbox');const big=document.getElementById('big');
document.querySelectorAll('.card img').forEach((img)=>{img.onclick=()=>{big.src=img.src;lightbox.classList.add('show')}});
lightbox.onclick=()=>lightbox.classList.remove('show');
const btn=document.getElementById('playBtn');const bgm=document.getElementById('bgm');if(btn&&bgm){btn.onclick=()=>{bgm.paused?bgm.play():bgm.pause()}}
<\/script>
</body>
</html>`;
  }

  async function buildCleanZip(items) {
    const zip = new JSZip();
    for (let index = 0; index < items.length; index += 1) {
      const blob = await canvasToBlob(items[index].outputCanvas);
      zip.file(safeFileName(`${String(index + 1).padStart(2, '0')}_${items[index].name}.jpg`), blob);
    }
    return zip.generateAsync({ type: 'blob' });
  }

  async function buildGalleryZip(items, options) {
    const zip = new JSZip();
    const imageNames = [];
    for (let index = 0; index < items.length; index += 1) {
      const name = safeFileName(`${String(index + 1).padStart(2, '0')}_${items[index].name}.jpg`);
      imageNames.push(name);
      const displayCanvas = window.ImageCleaner.makeDisplayCanvas(items[index].outputCanvas, options.filterName);
      zip.file(`images/${name}`, await canvasToBlob(displayCanvas));
    }

    let musicName = '';
    if (options.musicFile) {
      musicName = safeFileName(options.musicFile.name);
      zip.file(`music/${musicName}`, options.musicFile);
    }

    zip.file('index.html', buildGalleryHtml(items, imageNames, options.themeName, options.filterName, musicName));
    return zip.generateAsync({ type: 'blob' });
  }

  window.GalleryExport = {
    buildCleanZip,
    buildGalleryHtml,
    buildGalleryZip,
    canvasToBlob,
    downloadBlob,
    escapeHtml,
    safeFileName,
    themeColors,
  };
})();
