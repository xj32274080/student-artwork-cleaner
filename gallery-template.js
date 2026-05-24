(function exposeGalleryTemplate() {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[char]));
  }

  function safeJson(data) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }

  function buildIndexHtml(meta, options) {
    const title = escapeHtml(meta.exhibitionTitle || '童心绘世界');
    const subtitle = escapeHtml(meta.exhibitionSubtitle || '学生美术作品线上展');
    const intro = escapeHtml(meta.introText || '欢迎走进这场由孩子们共同完成的线上美术展。每一幅作品都保留了观察、想象和表达的痕迹，也记录着课堂里认真发生过的创造。');
    const schoolLine = [meta.schoolName, meta.className, meta.exhibitionDate].filter(Boolean).map(escapeHtml).join(' · ');
    const bodyClass = `theme-${options.themeName || 'museum'} filter-${options.filterName || 'original'} mode-${meta.displayMode || 'wall'}`;
    const musicFile = escapeHtml(meta.musicFileName || 'bgm.mp3');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="assets/css/gallery.css" />
</head>
<body class="${bodyClass}">
  <header class="cover-section" id="top">
    <div class="cover-atmosphere" aria-hidden="true"></div>
    <nav class="exhibition-nav" aria-label="展览导航">
      <a href="#top" class="nav-pill active">首页</a>
      <a href="#works">作品墙</a>
      <button id="navShowBtn" type="button">幻灯片</button>
      ${options.hasMusic ? '<button id="navMusicBtn" type="button">音乐</button>' : ''}
    </nav>
    <div class="cover-art left-art" aria-hidden="true"><img id="coverLeft" alt="" /></div>
    <div class="cover-art right-art" aria-hidden="true"><img id="coverRight" alt="" /></div>
    <section class="cover-content">
      <p class="eyebrow">${subtitle}</p>
      <h1>${title}</h1>
      <p class="cover-meta">${schoolLine}</p>
      <p class="cover-intro">${intro}</p>
      <div class="cover-actions">
        <a class="primary-action" href="#works">开始观展</a>
        <button class="secondary-action" id="startShowBtn" type="button">开始自动播放</button>
      </div>
      ${options.hasMusic ? `<div class="music-control"><button id="musicBtn" type="button">播放音乐</button><span id="musicState">音乐已准备</span><audio id="bgm" src="assets/music/${musicFile}" loop></audio></div>` : ''}
    </section>
  </header>

  <main>
    <section class="gallery-section" id="works">
      <div class="section-heading">
        <p>Selected Works</p>
        <h2>作品墙</h2>
        <span id="workCount"></span>
      </div>
      <section class="gallery-grid" id="galleryGrid" aria-label="学生作品墙"></section>
    </section>
  </main>

  <section class="viewer" id="viewer" aria-hidden="true" aria-label="大图欣赏">
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
  </section>

  <aside class="showbar" id="showbar" aria-label="播放控制">
    <button id="toggleShowBtn" type="button">开始自动播放</button>
    <button id="fullscreenBtn" type="button">全屏展示</button>
    <span id="showState">未播放</span>
  </aside>

  <footer class="exhibition-footer">
    <strong>${title}</strong>
    <span>${schoolLine}</span>
    <span>生成日期：${escapeHtml(new Date().toLocaleDateString('zh-CN'))}</span>
  </footer>

  <script>window.GALLERY_DATA=${safeJson(options.worksData)};</script>
  <script src="assets/js/gallery.js"></script>
</body>
</html>`;
  }

  function buildGalleryCss() {
    return `:root{--bg:#f7f3eb;--wall:#fbfaf7;--paper:#fff;--ink:#2f2a24;--muted:#756b61;--line:#ded2c1;--pale:#eee5d7;--accent:#8b735f;--accent-2:#b99b78;--shadow:0 20px 60px rgba(54,43,32,.14);--filter:none}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;padding-bottom:86px;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.65}a{color:inherit}button{font:inherit}
body.theme-museum{--bg:#f0ece4;--wall:#fbfaf7;--paper:#fff;--ink:#2f2a24;--muted:#6f655b;--line:#d8cdbd;--pale:#e8e0d3;--accent:#927457;--accent-2:#b79a76}
body.theme-garden{--bg:#fff4e4;--wall:#fff9ef;--paper:#fffef9;--ink:#5f3326;--muted:#8a6855;--line:#efc9a7;--pale:#ffe5ca;--accent:#d57949;--accent-2:#7f9d63}
body.theme-watercolor{--bg:#f7f4ff;--wall:#fffafe;--paper:#fff;--ink:#26345f;--muted:#66708e;--line:#d7d5ef;--pale:#eaf5ff;--accent:#7b91cf;--accent-2:#c18cca}
body.theme-star{--bg:#111827;--wall:#f8fafc;--paper:#fff;--ink:#f9fafb;--muted:#cbd5e1;--line:#334155;--pale:#1f2937;--accent:#f7c873;--accent-2:#8bb8ff;--shadow:0 20px 70px rgba(0,0,0,.32)}
body.filter-soft{--filter:brightness(1.06) contrast(1.03) saturate(1.04)}body.filter-warm{--filter:brightness(1.05) contrast(1.04) saturate(1.08) sepia(.08)}body.filter-fresh{--filter:brightness(1.07) contrast(1.05) saturate(1.08)}body.filter-film{--filter:brightness(1.03) contrast(1.07) saturate(.96) sepia(.06)}body.filter-contrast{--filter:brightness(1.03) contrast(1.16) saturate(1.12)}
.cover-section{position:relative;min-height:92vh;display:grid;align-items:center;overflow:hidden;padding:28px clamp(18px,4vw,54px) 72px;background:linear-gradient(180deg,rgba(255,255,255,.76),rgba(255,255,255,.46)),radial-gradient(circle at 18% 18%,var(--pale),transparent 30%),linear-gradient(135deg,var(--bg),#fff 60%,var(--pale));border-bottom:1px solid var(--line)}
.theme-museum .cover-section{background:linear-gradient(90deg,rgba(235,230,221,.86),rgba(255,255,255,.62) 30%,rgba(255,255,255,.62) 70%,rgba(235,230,221,.86)),linear-gradient(#f9f7f2,#eee8df)}
.theme-garden .cover-section{background:radial-gradient(circle at 10% 80%,rgba(127,157,99,.18),transparent 24%),radial-gradient(circle at 88% 18%,rgba(213,121,73,.18),transparent 22%),linear-gradient(180deg,#fff7e9,#fff1dc)}
.theme-watercolor .cover-section{background:radial-gradient(circle at 18% 24%,rgba(123,145,207,.22),transparent 28%),radial-gradient(circle at 78% 30%,rgba(193,140,202,.2),transparent 30%),radial-gradient(circle at 50% 74%,rgba(134,195,218,.18),transparent 36%),#fffafe}
.theme-star .cover-section{background:radial-gradient(circle at 20% 16%,rgba(247,200,115,.16),transparent 24%),radial-gradient(circle at 80% 10%,rgba(139,184,255,.16),transparent 28%),linear-gradient(180deg,#060b18,#111827 72%,#172033);color:#fff}
.cover-atmosphere{position:absolute;inset:0;pointer-events:none;opacity:.34;background-image:radial-gradient(circle,var(--accent) 0 1.3px,transparent 1.6px);background-size:72px 72px}.theme-museum .cover-atmosphere{background:linear-gradient(90deg,transparent 0 18%,rgba(255,255,255,.72) 18% 82%,transparent 82%),radial-gradient(circle,rgba(0,0,0,.18) 0 1px,transparent 1.4px);background-size:auto,120px 120px;opacity:.22}.theme-garden .cover-atmosphere{background-image:radial-gradient(circle at 10px 10px,var(--accent) 0 3px,transparent 4px),radial-gradient(circle at 46px 28px,var(--accent-2) 0 3px,transparent 4px);background-size:110px 80px;opacity:.22}.theme-watercolor .cover-atmosphere{background:radial-gradient(circle at 12% 30%,rgba(123,145,207,.18),transparent 18%),radial-gradient(circle at 76% 68%,rgba(193,140,202,.18),transparent 20%);opacity:1}.theme-star .cover-atmosphere{background-image:radial-gradient(circle,#fff 0 1px,transparent 1.4px),radial-gradient(circle,var(--accent) 0 1.6px,transparent 2px);background-size:72px 72px,170px 140px;opacity:.5}
.exhibition-nav{position:absolute;top:24px;left:50%;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:24px;padding:7px 14px;border:1px solid rgba(120,100,80,.18);border-radius:999px;background:rgba(255,255,255,.52);backdrop-filter:blur(12px);color:var(--muted);font-size:14px}.theme-star .exhibition-nav{background:rgba(15,23,42,.48);border-color:rgba(255,255,255,.16);color:#dbeafe}.exhibition-nav a,.exhibition-nav button{border:0;background:transparent;text-decoration:none;color:inherit;cursor:pointer}.exhibition-nav .active{padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.62);color:var(--accent);font-weight:700}.theme-star .exhibition-nav .active{background:rgba(247,200,115,.16);color:var(--accent)}
.cover-content{position:relative;z-index:2;max-width:900px;margin:auto;text-align:center}.eyebrow{margin:0 0 14px;color:var(--accent);font-weight:800;letter-spacing:.12em}.cover-content h1{margin:0;font-size:clamp(44px,8vw,96px);line-height:1.05;letter-spacing:0}.cover-meta{margin:18px 0 0;color:var(--muted);font-size:clamp(15px,2vw,20px)}.theme-star .cover-meta,.theme-star .cover-intro{color:#dbeafe}.cover-intro{max-width:720px;margin:26px auto 0;color:var(--muted);font-size:clamp(16px,2vw,19px)}.cover-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:34px}.primary-action,.secondary-action,.music-control button,.showbar button{border:1px solid var(--accent);border-radius:999px;padding:11px 22px;background:var(--accent);color:#fff;text-decoration:none;font-weight:800;cursor:pointer}.secondary-action,.showbar button{background:transparent;color:var(--accent)}.theme-star .secondary-action{color:#fff;border-color:rgba(255,255,255,.45)}.music-control{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:24px auto 0;color:var(--muted)}.theme-star .music-control{color:#dbeafe}.music-control button{padding:9px 18px}
.cover-art{position:absolute;z-index:1;width:min(18vw,230px);aspect-ratio:4/3;padding:10px;background:#fff;border:1px solid rgba(130,110,90,.22);box-shadow:0 18px 44px rgba(70,50,30,.16);display:none}.cover-art img{width:100%;height:100%;object-fit:contain;filter:var(--filter)}.left-art{left:8%;top:25%;transform:rotate(-3deg)}.right-art{right:8%;top:25%;transform:rotate(3deg)}.theme-museum .cover-art{display:block;border:9px solid #b39570;box-shadow:0 0 0 9px #fff,0 20px 45px rgba(60,45,30,.18);padding:0}.theme-garden .cover-art,.theme-watercolor .cover-art{display:block}.theme-garden .cover-art:before,.theme-garden .cover-art:after{content:"";position:absolute;width:54px;height:18px;background:rgba(217,167,98,.54);top:-10px;transform:rotate(-18deg)}.theme-garden .cover-art:before{left:-18px}.theme-garden .cover-art:after{right:-18px;transform:rotate(18deg)}.theme-watercolor .cover-art{border-color:#d8d9f0;box-shadow:0 20px 46px rgba(90,100,150,.14)}
main{background:var(--wall);color:#2f2a24}.gallery-section{padding:54px clamp(16px,4vw,54px) 92px}.section-heading{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px;max-width:1440px;margin:0 auto 28px}.section-heading p{grid-column:1/-1;margin:0;color:var(--accent);font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.section-heading h2{margin:0;font-size:clamp(30px,4vw,48px)}.section-heading span{color:#756b61}.gallery-grid{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:28px}.work-card{position:relative;margin:0;padding:14px 14px 16px;border:1px solid #dfd4c5;border-radius:10px;background:#fff;box-shadow:0 16px 45px rgba(60,45,30,.12);transition:transform .22s ease,box-shadow .22s ease}.work-card:hover{transform:translateY(-4px);box-shadow:0 24px 64px rgba(60,45,30,.18)}.work-card:before,.work-card:after{content:"";position:absolute;width:26px;height:26px;border-color:var(--accent);opacity:.42}.work-card:before{top:8px;left:8px;border-top:2px solid;border-left:2px solid}.work-card:after{right:8px;bottom:8px;border-right:2px solid;border-bottom:2px solid}.art-frame{height:306px;display:flex;align-items:center;justify-content:center;border:1px solid #eee4d6;border-radius:7px;background:#fff;overflow:hidden}.art-frame img{max-width:100%;max-height:100%;object-fit:contain;filter:var(--filter);cursor:pointer}.work-card figcaption{padding:14px 4px 2px;text-align:center}.work-card strong{display:block;color:#2f2a24;font-size:18px}.work-card span{display:block;margin-top:5px;color:#77695d;font-size:14px}.work-card em{display:block;margin-top:7px;color:#8b8176;font-size:13px;font-style:normal}
.viewer{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(8,10,15,.9);z-index:60;padding:24px}.viewer.open{display:flex}.viewer-stage{margin:0;max-width:min(1120px,88vw);max-height:92vh;text-align:center}.viewer-stage img{max-width:100%;max-height:76vh;object-fit:contain;background:#fff;border-radius:8px;filter:var(--filter);box-shadow:0 28px 90px rgba(0,0,0,.42)}.viewer-stage figcaption{padding-top:16px;color:#fff}.viewer-stage strong{display:block;font-size:22px}.viewer-stage span,.viewer-stage em{display:block;color:#d1d5db;font-style:normal}.viewer-close,.viewer-nav{position:absolute;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer}.viewer-close{top:22px;right:24px;width:44px;height:44px;border-radius:999px;font-size:30px}.viewer-nav{top:50%;transform:translateY(-50%);width:52px;height:74px;border-radius:14px;font-size:54px}.viewer-nav.prev{left:22px}.viewer-nav.next{right:22px}
.showbar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(20,23,30,.76);color:#fff;backdrop-filter:blur(12px);z-index:50}.showbar button{border-color:rgba(255,255,255,.32);color:#fff;padding:8px 14px}.showbar span{font-size:13px;color:#d1d5db}.exhibition-footer{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:28px 18px 112px;background:var(--wall);border-top:1px solid #e3d8c9;color:#756b61;font-size:14px}.exhibition-footer strong{color:#2f2a24}
@media(max-width:980px){.cover-art{display:none!important}}@media(max-width:720px){body{padding-bottom:132px}.cover-section{min-height:86vh;padding-bottom:58px}.exhibition-nav{left:18px;right:18px;transform:none;justify-content:space-around;gap:8px;font-size:13px}.section-heading{grid-template-columns:1fr;padding-top:20px}.gallery-grid{grid-template-columns:1fr;gap:20px}.art-frame{height:280px}.viewer{padding:12px}.viewer-nav{width:42px;height:58px;font-size:42px}.viewer-nav.prev{left:8px}.viewer-nav.next{right:8px}.showbar{width:calc(100vw - 24px);justify-content:center;flex-wrap:wrap;border-radius:18px}}`;
  }

  function buildGalleryJs() {
    return `let works=[];let current=0;let timer=null;const grid=document.getElementById('galleryGrid');const viewer=document.getElementById('viewer');const viewerImage=document.getElementById('viewerImage');const viewerTitle=document.getElementById('viewerTitle');const viewerMeta=document.getElementById('viewerMeta');const viewerNote=document.getElementById('viewerNote');const showState=document.getElementById('showState');const toggleShowBtn=document.getElementById('toggleShowBtn');const startShowBtn=document.getElementById('startShowBtn');const navShowBtn=document.getElementById('navShowBtn');
function esc(v){return String(v||'').replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]))}
function imgSrc(w){return 'assets/images/'+encodeURIComponent(w.imageFileName)}
function render(){grid.innerHTML=works.map((w,i)=>'<figure class="work-card"><div class="art-frame"><img src="'+imgSrc(w)+'" alt="'+esc(w.title)+'" data-index="'+i+'"></div><figcaption><strong>'+esc(w.title||('作品 '+(i+1)))+'</strong>'+(w.studentName?'<span>'+esc(w.studentName)+'</span>':'')+(w.note?'<em>'+esc(w.note)+'</em>':'')+'</figcaption></figure>').join('');document.getElementById('workCount').textContent=works.length+' 件作品';grid.querySelectorAll('img').forEach(img=>img.addEventListener('click',()=>openViewer(Number(img.dataset.index))));if(works[0]){const left=document.getElementById('coverLeft');const right=document.getElementById('coverRight');left.src=imgSrc(works[0]);right.src=imgSrc(works[Math.min(1,works.length-1)]||works[0])}}
function openViewer(index){if(!works.length)return;current=(index+works.length)%works.length;const w=works[current];viewerImage.src=imgSrc(w);viewerImage.alt=w.title||'';viewerTitle.textContent=w.title||'作品';viewerMeta.textContent=[w.studentName,w.className].filter(Boolean).join(' · ');viewerNote.textContent=w.note||'';viewer.classList.add('open');viewer.setAttribute('aria-hidden','false')}
function closeViewer(){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true')}
function next(delta=1){openViewer(current+delta)}
function play(){if(!works.length)return;if(!viewer.classList.contains('open'))openViewer(0);stop();timer=setInterval(()=>next(1),4000);toggleShowBtn.textContent='暂停自动播放';startShowBtn.textContent='暂停自动播放';navShowBtn.textContent='暂停';showState.textContent='播放中'}
function stop(){if(timer){clearInterval(timer);timer=null}toggleShowBtn.textContent='开始自动播放';startShowBtn.textContent='开始自动播放';navShowBtn.textContent='幻灯片';showState.textContent='已暂停'}
function toggle(){timer?stop():play()}
document.getElementById('viewerClose').onclick=closeViewer;document.getElementById('viewerPrev').onclick=()=>next(-1);document.getElementById('viewerNext').onclick=()=>next(1);toggleShowBtn.onclick=toggle;startShowBtn.onclick=toggle;navShowBtn.onclick=toggle;document.getElementById('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();if(e.key==='ArrowLeft')next(-1);if(e.key==='ArrowRight')next(1)});
const musicBtn=document.getElementById('musicBtn');const navMusicBtn=document.getElementById('navMusicBtn');const bgm=document.getElementById('bgm');async function toggleMusic(){if(!bgm)return;if(bgm.paused){await bgm.play();musicBtn&&(musicBtn.textContent='暂停音乐');document.getElementById('musicState')&&(document.getElementById('musicState').textContent='音乐播放中')}else{bgm.pause();musicBtn&&(musicBtn.textContent='播放音乐');document.getElementById('musicState')&&(document.getElementById('musicState').textContent='音乐已暂停')}}if(musicBtn&&bgm){bgm.loop=true;musicBtn.onclick=toggleMusic}if(navMusicBtn&&bgm){navMusicBtn.onclick=toggleMusic}
function boot(data){works=data.works||[];render();if(document.body.classList.contains('mode-slideshow')&&works.length)openViewer(0)}
if(window.GALLERY_DATA)boot(window.GALLERY_DATA);else fetch('data/works.json').then(r=>r.json()).then(boot);`;
  }

  window.GalleryTemplate = { buildIndexHtml, buildGalleryCss, buildGalleryJs };
})();
