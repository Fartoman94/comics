import type { Project } from '../types'
import { renderPage } from './render'
import { downloadBlob, safeFilename } from './storage'
import type { ExportProgress } from './export'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function toDataURL(url: string) {
  const blob = await (await fetch(url)).blob()
  return new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.readAsDataURL(blob)
  })
}

/** Genera un único .html autocontenido con el visor de libro: para compartir o subir a cualquier hosting. */
export async function exportWebBook(project: Project, onProgress?: ExportProgress) {
  const ratio = Math.max(0.5, Math.min(2, 2000 / project.format.height))
  const pages: string[] = []
  for (let i = 0; i < project.pages.length; i++) {
    onProgress?.(i, project.pages.length)
    pages.push(await renderPage(project, project.pages[i], { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.86 }))
  }
  onProgress?.(project.pages.length, project.pages.length)
  const logo = await toDataURL('/brand/matelabs-logo.png').catch(() => '')
  const html = template(project, pages, logo)
  downloadBlob(new Blob([html], { type: 'text/html' }), `${safeFilename(project.title)}-libro.html`)
}

function template(p: Project, pages: string[], logo: string) {
  const data = JSON.stringify({ pages, rtl: p.readingDirection === 'rtl', vertical: p.readingDirection === 'vertical', ratio: p.format.width / p.format.height })
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.synopsis || p.title)}">
<meta name="generator" content="Viñeta Studio by MateLabs">
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#08080a;color:#fff;font-family:Inter,system-ui,sans-serif;overflow:hidden}
body{background:radial-gradient(ellipse at 50% 45%,rgba(255,255,255,.07),transparent 60%),#08080a}
header{position:fixed;inset:0 0 auto;height:56px;display:flex;align-items:center;gap:12px;padding:0 16px;background:linear-gradient(#000c,transparent);z-index:5;transition:opacity .3s}
header h1{font:400 22px Bangers,cursive;letter-spacing:1px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header small{color:#fff9;font-size:12px}
.sp{flex:1}button{background:#ffffff1a;border:0;color:#fff;border-radius:10px;height:36px;padding:0 12px;font:600 12px Inter;cursor:pointer}
button:hover{background:#ffffff33}
#stage{position:absolute;inset:56px 12px 84px;display:flex;align-items:center;justify-content:center}
#book{filter:drop-shadow(0 30px 45px #000a)}
.page{background:#fdfcf8;overflow:hidden;position:relative}.page img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;user-select:none}
.page.--left:after,.page.--right:after{content:"";position:absolute;inset:0;pointer-events:none}
.page.--left:after{background:linear-gradient(to left,#0003,#0000000f 4%,transparent 12%)}.page.--right:after{background:linear-gradient(to right,#0003,#0000000f 4%,transparent 12%)}
footer{position:fixed;inset:auto 0 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;background:linear-gradient(transparent,#000d);z-index:5;transition:opacity .3s}
input[type=range]{flex:1;accent-color:#ff5a36}#num{width:60px;text-align:center;font-size:12px;color:#fffc;font-variant-numeric:tabular-nums}
.credit{display:flex;align-items:center;gap:6px;color:#fff8;font-size:11px;text-decoration:none;white-space:nowrap}.credit b{color:#34d399}.credit img{width:18px;height:18px}
#scroll{position:absolute;inset:0;overflow-y:auto;padding-top:56px;display:none}#scroll img{display:block;width:100%;max-width:820px;margin:0 auto}
.hide header,.hide footer{opacity:0;pointer-events:none}
.end{text-align:center;padding:48px 16px;font:400 40px Bangers}
</style>
</head>
<body>
<header><div style="min-width:0"><h1>${esc(p.title)}</h1>${p.author ? `<small>${esc(p.author)}</small>` : ''}</div><div class="sp"></div><button id="mode">Scroll</button><button id="fs">⛶</button></header>
<div id="stage"><div id="book"></div></div>
<div id="scroll"></div>
<footer><button id="prev">‹</button><input id="range" type="range" min="1" value="1"><span id="num"></span><button id="next">›</button>
<a class="credit" href="https://matelabs.site/" target="_blank" rel="noopener">Creado por ${logo ? `<img src="${logo}" alt="">` : ''}<b>MateLabs</b></a></footer>
<script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js"></script>
<script>
const D=${data};const N=D.pages.length;const order=D.rtl?[...D.pages.keys()].reverse():[...D.pages.keys()];
let pf=null,mode=D.vertical?'scroll':'book',cur=D.rtl?N-1:0,t;
const $=id=>document.getElementById(id),range=$('range');range.max=N;range.style.direction=D.rtl?'rtl':'ltr';
const sc=$('scroll');D.pages.forEach(src=>{const i=new Image();i.src=src;i.loading='lazy';sc.appendChild(i)});sc.insertAdjacentHTML('beforeend','<div class="end">FIN</div>');
function human(){return D.rtl?N-cur:cur+1}
function sync(){range.value=human();$('num').textContent=human()+' / '+N}
function build(){const st=$('stage'),W=st.clientWidth,H=st.clientHeight,portrait=W<700||W/H<D.ratio*1.25;
 const pw=Math.floor(portrait?Math.min(W,H*D.ratio):Math.min(W/2,H*D.ratio)),ph=Math.floor(pw/D.ratio);
 if(pf){cur=pf.getCurrentPageIndex();pf.destroy()}const host=$('stage');host.innerHTML='<div id="book"></div>';const book=$('book');
 const els=order.map((k,i)=>{const d=document.createElement('div');d.className='page';d.dataset.density=(i===0||i===N-1)?'hard':'soft';d.innerHTML='<img src="'+D.pages[k]+'">';book.appendChild(d);return d});
 pf=new St.PageFlip(book,{width:pw,height:ph,size:'fixed',showCover:true,usePortrait:portrait,mobileScrollSupport:false,maxShadowOpacity:.55,flippingTime:750,startPage:cur,autoSize:false});
 pf.loadFromHTML(els);pf.on('flip',e=>{cur=e.data;sync()});sync()}
function next(){D.rtl?pf.flipPrev():pf.flipNext()}function prev(){D.rtl?pf.flipNext():pf.flipPrev()}
$('next').onclick=()=>D.rtl?prev():next();$('prev').onclick=()=>D.rtl?next():prev();
range.oninput=()=>{const n=+range.value;pf&&pf.turnToPage(D.rtl?N-n:n-1);cur=D.rtl?N-n:n-1;sync()};
addEventListener('keydown',e=>{if(mode!=='book')return;if(e.key==='ArrowRight')D.rtl?prev():next();if(e.key==='ArrowLeft')D.rtl?next():prev()});
function setMode(m){mode=m;$('stage').style.display=m==='book'?'flex':'none';sc.style.display=m==='scroll'?'block':'none';document.querySelector('footer').style.display=m==='book'?'flex':'none';$('mode').textContent=m==='book'?'Scroll':'Libro';if(m==='book')build()}
$('mode').onclick=()=>setMode(mode==='book'?'scroll':'book');$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>mode==='book'&&build(),200)});
function poke(){document.body.classList.remove('hide');clearTimeout(t);t=setTimeout(()=>document.body.classList.add('hide'),3200)}
addEventListener('pointermove',poke);addEventListener('pointerdown',poke);poke();setMode(mode);
</script>
</body>
</html>`
}
