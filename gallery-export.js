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
      museum: { bg: '#f7f3eb', card: '#ffffff', ink: '#2f2a24', muted: '#756b61', line: '#ded2c1', pale: '#eee5d7', accent: '#8b735f', mark: '□' },
      garden: { bg: '#fff7ed', card: '#ffffff', ink: '#6f3527', muted: '#9a6b54', line: '#efc9b7', pale: '#ffe8dc', accent: '#d26c4a', mark: '✿' },
      watercolor: { bg: '#f5f4ff', card: '#ffffff', ink: '#26345f', muted: '#68708f', line: '#d6d8f4', pale: '#e9f5ff', accent: '#7a9bd1', mark: '◌' },
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

  function buildIndexHtml(meta, themeName, filterName, hasMusic, worksData) {
    const title = escapeHtml(meta.exhibitionTitle || '童心绘世界');
    const subtitle = escapeHtml(meta.exhibitionSubtitle || '学生美术作品线上展');
    const intro = escapeHtml(meta.introText || '欢迎走进这场由孩子们共同完成的线上美术展。每一幅作品都保留了观察、想象和表达的痕迹，也记录着课堂里认真发生过的创造。');
    const schoolLine = [meta.schoolName, meta.className, meta.exhibitionDate].filter(Boolean).map(escapeHtml).join(' · ');
    const bodyClass = `theme-${themeName || 'museum'} filter-${filterName || 'original'} mode-${meta.displayMode || 'wall'}`;
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="assets/css/gallery.css" />
</head>
<body class="${bodyClass}">
  <header class="hero" id="top">
    <div class="hero-art" aria-hidden="true"></div>
    <nav class="hero-nav">
      <span>${subtitle}</span>
      <a href="#works">作品墙</a>
    </nav>
    <div class="hero-inner">
      <p class="kicker">${subtitle}</p>
      <h1>${title}</h1>
      <p class="meta">${schoolLine}</p>
      <p class="intro">${intro}</p>
      <div class="hero-actions">
        <a class="primary-action" href="#works">开始欣赏</a>
        <button class="secondary-action" id="startShowBtn" type="button">开始自动播放</button>
      </div>
      ${hasMusic ? `<div class="music-panel"><button id="musicBtn" type="button">播放音乐</button><span id="musicState">音乐已准备</span><audio id="bgm" src="assets/music/${escapeHtml(meta.musicFileName || 'bgm.mp3')}"></audio></div>` : ''}
    </div>
  </header>

  <main>
    <section class="section-head" id="works">
      <p>Gallery Wall</p>
      <h2>作品墙</h2>
      <span id="workCount"></span>
    </section>
    <section class="gallery-grid" id="galleryGrid" aria-label="作品墙"></section>
  </main>

  <div class="viewer" id="viewer" aria-hidden="true">
    <button class="viewer-close" id="viewerClose" type="button" aria-label="关闭">×</button>
    <button class="viewer-nav prev" id="viewerPrev" type="button" aria-label="上一张">‹</button>
    <figure class="viewer-stage">
      <img id="viewerImage" alt="" />
      <figcaption>
        <strong id="viewerTitle"></strong>
        <span id="viewerMeta"></span>
        <em id="viewerNote"></em>
      </figcaption>
    </figure>
    <button class="viewer-nav next" id="viewerNext" type="button" aria-label="下一张">›</button>
  </div>

  <div class="showbar" id="showbar">
    <button id="toggleShowBtn" type="button">开始自动播放</button>
    <button id="fullscreenBtn" type="button">全屏展示</button>
    <span id="showState">未播放</span>
  </div>

  <script>window.GALLERY_DATA=${JSON.stringify(worksData).replace(/</g, '\\u003c')};</script>
  <script src="assets/js/gallery.js"></script>
</body>
</html>`;
  }

  function buildGalleryCss() {
    return `:root{--bg:#f7f3eb;--paper:#fff;--ink:#2f2a24;--muted:#756b61;--line:#ded2c1;--pale:#eee5d7;--accent:#8b735f;--shadow:0 20px 60px rgba(54,43,32,.14);--filter:none}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;padding-bottom:86px;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.65}a{color:inherit}button{font:inherit}
body.theme-garden{--bg:#fff7ed;--ink:#6f3527;--muted:#9a6b54;--line:#efc9b7;--pale:#ffe8dc;--accent:#d26c4a}
body.theme-watercolor{--bg:#f5f4ff;--ink:#26345f;--muted:#68708f;--line:#d6d8f4;--pale:#e9f5ff;--accent:#7a9bd1}
body.theme-star{--bg:#111827;--ink:#f9fafb;--muted:#cbd5e1;--line:#334155;--pale:#1f2937;--accent:#f7c873;--shadow:0 20px 70px rgba(0,0,0,.32)}
body.filter-soft{--filter:brightness(1.06) contrast(1.03) saturate(1.04)}body.filter-warm{--filter:brightness(1.05) contrast(1.04) saturate(1.08) sepia(.08)}body.filter-fresh{--filter:brightness(1.07) contrast(1.05) saturate(1.08)}body.filter-film{--filter:brightness(1.03) contrast(1.07) saturate(.96) sepia(.06)}body.filter-contrast{--filter:brightness(1.03) contrast(1.16) saturate(1.12)}
.hero{position:relative;min-height:92vh;padding:28px clamp(18px,4vw,54px) 72px;display:grid;align-items:center;overflow:hidden;background:radial-gradient(circle at 20% 12%,var(--pale),transparent 32%),linear-gradient(135deg,var(--bg),#fff 58%,var(--pale))}
.theme-star .hero{background:radial-gradient(circle at 20% 18%,rgba(247,200,115,.16),transparent 28%),linear-gradient(135deg,#0b1120,#172033 62%,#111827)}
.hero:after{content:"";position:absolute;left:clamp(18px,5vw,70px);right:clamp(18px,5vw,70px);bottom:22px;height:1px;background:var(--line)}.hero-art{position:absolute;inset:0;pointer-events:none;opacity:.45;background-image:radial-gradient(circle,var(--accent) 0 1.5px,transparent 1.7px);background-size:74px 74px}.theme-museum .hero-art{opacity:.18}.theme-star .hero-art{opacity:.3;background-size:58px 58px}
.hero-nav{position:absolute;top:24px;left:clamp(18px,4vw,54px);right:clamp(18px,4vw,54px);display:flex;justify-content:space-between;gap:16px;color:var(--muted);font-size:14px}.hero-nav a{text-decoration:none;border-bottom:1px solid currentColor}.hero-inner{position:relative;max-width:920px;margin:auto;text-align:center}.kicker{margin:0 0 16px;color:var(--accent);font-weight:700;letter-spacing:.12em;text-transform:uppercase}.hero h1{margin:0;font-size:clamp(44px,8vw,96px);line-height:1.04;letter-spacing:0}.meta{margin:20px 0 0;color:var(--muted);font-size:clamp(15px,2vw,20px)}.intro{max-width:720px;margin:28px auto 0;color:var(--muted);font-size:clamp(16px,2vw,19px)}.hero-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:36px}.primary-action,.secondary-action,.music-panel button,.showbar button{border:1px solid var(--accent);border-radius:999px;padding:11px 22px;background:var(--accent);color:#fff;text-decoration:none;font-weight:700;cursor:pointer}.secondary-action,.showbar button{background:transparent;color:var(--accent)}.music-panel{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:24px auto 0;color:var(--muted)}.music-panel button{padding:9px 18px}
main{padding:44px clamp(16px,4vw,54px) 86px}.section-head{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px;max-width:1440px;margin:0 auto 24px}.section-head p{grid-column:1/-1;margin:0;color:var(--accent);font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.section-head h2{margin:0;font-size:clamp(28px,4vw,48px)}.section-head span{color:var(--muted)}
.gallery-grid{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:28px}.work-card{position:relative;margin:0;padding:14px 14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--paper);box-shadow:var(--shadow);transition:transform .22s ease,box-shadow .22s ease}.work-card:hover{transform:translateY(-4px);box-shadow:0 26px 72px rgba(54,43,32,.18)}.work-card:before,.work-card:after{content:"";position:absolute;width:26px;height:26px;border-color:var(--accent);opacity:.42}.work-card:before{top:8px;left:8px;border-top:2px solid;border-left:2px solid}.work-card:after{right:8px;bottom:8px;border-right:2px solid;border-bottom:2px solid}.art-frame{height:310px;display:flex;align-items:center;justify-content:center;border:1px solid #eee4d6;border-radius:7px;background:#fff;overflow:hidden}.art-frame img{max-width:100%;max-height:100%;object-fit:contain;filter:var(--filter);cursor:pointer}.work-card figcaption{padding:14px 4px 2px;text-align:center}.work-card strong{display:block;color:#2f2a24;font-size:18px}.work-card span{display:block;margin-top:5px;color:#77695d;font-size:14px}.work-card em{display:block;margin-top:7px;color:#8b8176;font-size:13px;font-style:normal}
.viewer{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(8,10,15,.88);z-index:60;padding:24px}.viewer.open{display:flex}.viewer-stage{margin:0;max-width:min(1120px,88vw);max-height:92vh;text-align:center}.viewer-stage img{max-width:100%;max-height:76vh;object-fit:contain;background:#fff;border-radius:8px;filter:var(--filter);box-shadow:0 28px 90px rgba(0,0,0,.42)}.viewer-stage figcaption{padding-top:16px;color:#fff}.viewer-stage strong{display:block;font-size:22px}.viewer-stage span,.viewer-stage em{display:block;color:#d1d5db;font-style:normal}.viewer-close,.viewer-nav{position:absolute;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer}.viewer-close{top:22px;right:24px;width:44px;height:44px;border-radius:999px;font-size:30px}.viewer-nav{top:50%;transform:translateY(-50%);width:52px;height:74px;border-radius:14px;font-size:54px}.viewer-nav.prev{left:22px}.viewer-nav.next{right:22px}
.showbar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(20,23,30,.76);color:#fff;backdrop-filter:blur(12px);z-index:50}.showbar button{border-color:rgba(255,255,255,.32);color:#fff;padding:8px 14px}.showbar span{font-size:13px;color:#d1d5db}
@media(max-width:720px){body{padding-bottom:132px}.hero{min-height:86vh;padding-bottom:58px}.hero-nav{position:relative;inset:auto;margin-bottom:60px}.section-head{grid-template-columns:1fr;padding-top:20px}.gallery-grid{grid-template-columns:1fr;gap:20px}.art-frame{height:280px}.viewer{padding:12px}.viewer-nav{width:42px;height:58px;font-size:42px}.viewer-nav.prev{left:8px}.viewer-nav.next{right:8px}.showbar{width:calc(100vw - 24px);justify-content:center;flex-wrap:wrap;border-radius:18px}}`;
  }

  function buildGalleryJs() {
    return `let works=[];let current=0;let timer=null;const grid=document.getElementById('galleryGrid');const viewer=document.getElementById('viewer');const viewerImage=document.getElementById('viewerImage');const viewerTitle=document.getElementById('viewerTitle');const viewerMeta=document.getElementById('viewerMeta');const viewerNote=document.getElementById('viewerNote');const showState=document.getElementById('showState');const toggleShowBtn=document.getElementById('toggleShowBtn');const startShowBtn=document.getElementById('startShowBtn');
function esc(v){return String(v||'').replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]))}
function render(){grid.innerHTML=works.map((w,i)=>'<figure class="work-card"><div class="art-frame"><img src="assets/images/'+encodeURIComponent(w.imageFileName)+'" alt="'+esc(w.title)+'" data-index="'+i+'"></div><figcaption><strong>'+esc(w.title||('作品 '+(i+1)))+'</strong>'+(w.studentName?'<span>'+esc(w.studentName)+'</span>':'')+(w.note?'<em>'+esc(w.note)+'</em>':'')+'</figcaption></figure>').join('');document.getElementById('workCount').textContent=works.length+' 件作品';grid.querySelectorAll('img').forEach(img=>img.addEventListener('click',()=>openViewer(Number(img.dataset.index))))}
function openViewer(index){current=(index+works.length)%works.length;const w=works[current];viewerImage.src='assets/images/'+encodeURIComponent(w.imageFileName);viewerImage.alt=w.title||'';viewerTitle.textContent=w.title||'作品';viewerMeta.textContent=[w.studentName,w.className].filter(Boolean).join(' · ');viewerNote.textContent=w.note||'';viewer.classList.add('open');viewer.setAttribute('aria-hidden','false')}
function closeViewer(){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true')}
function next(delta=1){openViewer(current+delta)}
function play(){if(!works.length)return;if(!viewer.classList.contains('open'))openViewer(0);stop();timer=setInterval(()=>next(1),4000);toggleShowBtn.textContent='暂停自动播放';startShowBtn.textContent='暂停自动播放';showState.textContent='播放中'}
function stop(){if(timer){clearInterval(timer);timer=null}toggleShowBtn.textContent='开始自动播放';startShowBtn.textContent='开始自动播放';showState.textContent='已暂停'}
function toggle(){timer?stop():play()}
document.getElementById('viewerClose').onclick=closeViewer;document.getElementById('viewerPrev').onclick=()=>next(-1);document.getElementById('viewerNext').onclick=()=>next(1);toggleShowBtn.onclick=toggle;startShowBtn.onclick=toggle;document.getElementById('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();if(e.key==='ArrowLeft')next(-1);if(e.key==='ArrowRight')next(1)});
const musicBtn=document.getElementById('musicBtn');const bgm=document.getElementById('bgm');if(musicBtn&&bgm){bgm.loop=true;musicBtn.onclick=async()=>{if(bgm.paused){await bgm.play();musicBtn.textContent='暂停音乐';document.getElementById('musicState').textContent='音乐播放中'}else{bgm.pause();musicBtn.textContent='播放音乐';document.getElementById('musicState').textContent='音乐已暂停'}}}
function boot(data){works=data.works||[];render();if(document.body.classList.contains('mode-slideshow')&&works.length)openViewer(0)}
if(window.GALLERY_DATA)boot(window.GALLERY_DATA);else fetch('data/works.json').then(r=>r.json()).then(boot);`;
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
    root.folder('assets/css').file('gallery.css', buildGalleryCss());
    root.folder('assets/js').file('gallery.js', buildGalleryJs());

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
    root.file('index.html', buildIndexHtml(meta, options.themeName, options.filterName, hasMusic, worksData));
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
