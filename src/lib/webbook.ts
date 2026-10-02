import type { Project } from '../types'
import { renderPage } from './render'
import { downloadBlob, safeFilename } from './storage'
import type { ExportProgress } from './export'
import { detectScript } from './fonts'
// El visor va incrustado: el libro web funciona como un único archivo, sin internet ni CDN.
import pageFlipSource from 'page-flip/dist/js/page-flip.browser.js?raw'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
/** Para meter código dentro de <script> sin que un "</script" lo corte. */
const inlineScript = (src: string) => src.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--')

async function toDataURL(url: string) {
  const blob = await (await fetch(url)).blob()
  return new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.readAsDataURL(blob)
  })
}

/** Idioma principal de la obra según sus textos (para lang del HTML y lectores de pantalla). */
export function projectLanguage(project: Project): 'es' | 'ja' | 'ko' | 'zh' {
  const count = { latin: 0, ja: 0, ko: 0, zh: 0 }
  for (const page of project.pages)
    for (const el of page.elements)
      if (el.type === 'text' || el.type === 'bubble')
        for (const ch of el.text) if (/\S/.test(ch)) count[detectScript(ch)]++
  // El japonés usa kanji (que detectScript cuenta como chino) junto con kana.
  if (count.ja > 0) count.ja += count.zh
  const best = (Object.entries(count) as [keyof typeof count, number][]).sort((a, b) => b[1] - a[1])[0]
  return !best || best[1] === 0 || best[0] === 'latin' ? 'es' : best[0]
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
  const html = webBookHtml(project, pages, logo)
  downloadBlob(new Blob([html], { type: 'text/html' }), `${safeFilename(project.title)}-libro.html`)
}

export function webBookHtml(p: Project, pages: string[], logo: string) {
  const lang = projectLanguage(p)
  const names = p.pages.map((pg, i) => pg.name || `Página ${i + 1}`)
  const data = JSON.stringify({ pages, names, rtl: p.readingDirection === 'rtl', vertical: p.readingDirection === 'vertical', ratio: p.format.width / p.format.height }).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.synopsis || p.title)}">
<meta name="generator" content="Viñeta Studio by MateLabs">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#08080a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden}
body{background:radial-gradient(ellipse at 50% 45%,rgba(255,255,255,.07),transparent 60%),#08080a}
header{position:fixed;inset:0 0 auto;height:56px;display:flex;align-items:center;gap:12px;padding:0 16px;background:linear-gradient(#000c,transparent);z-index:5;transition:opacity .3s}
header h1{font:800 20px/1.1 system-ui,sans-serif;letter-spacing:.5px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header small{color:#fff9;font-size:12px}
.sp{flex:1}button{background:#ffffff1a;border:0;color:#fff;border-radius:10px;height:36px;min-width:36px;padding:0 12px;font:600 12px system-ui,sans-serif;cursor:pointer}
button:hover,button:focus-visible{background:#ffffff33}button:focus-visible,input:focus-visible{outline:2px solid #ff5a36;outline-offset:2px}
#stage{position:absolute;inset:56px 12px var(--bar,96px);display:flex;align-items:center;justify-content:center;touch-action:pinch-zoom;user-select:none}
#book{filter:drop-shadow(0 30px 45px #000a)}
.page{background:#fdfcf8;overflow:hidden;position:relative}.page img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;user-select:none}
.page.--left:after,.page.--right:after{content:"";position:absolute;inset:0;pointer-events:none}
.page.--left:after{background:linear-gradient(to left,#0003,#0000000f 4%,transparent 12%)}.page.--right:after{background:linear-gradient(to right,#0003,#0000000f 4%,transparent 12%)}
footer{position:fixed;inset:auto 0 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;background:linear-gradient(transparent,#000d);z-index:5;transition:opacity .3s}
input[type=range]{flex:1;min-width:0;accent-color:#ff5a36}#num{min-width:60px;text-align:center;font-size:12px;color:#fffc;font-variant-numeric:tabular-nums}
.credit{display:flex;align-items:center;gap:6px;color:#fff8;font-size:11px;text-decoration:none;white-space:nowrap}.credit b{color:#34d399}.credit img{width:18px;height:18px}
#scroll{position:absolute;inset:0;overflow-y:auto;padding-top:56px;display:none}#scroll img{display:block;width:100%;max-width:820px;margin:0 auto}
.hide header,.hide footer{opacity:0}header:focus-within,footer:focus-within{opacity:1}
.end{text-align:center;padding:48px 16px;font:800 40px system-ui,sans-serif}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:520px){.credit{display:none}}
</style>
</head>
<body>
<header><div style="min-width:0"><h1>${esc(p.title)}</h1>${p.author ? `<small>${esc(p.author)}</small>` : ''}</div><div class="sp"></div><button id="mode" aria-label="Cambiar a lectura en scroll">Scroll</button><button id="fs" aria-label="Pantalla completa">⛶</button></header>
<main id="stage" aria-label="Libro"><div id="book"></div></main>
<div id="scroll" aria-label="Lectura en scroll"></div>
<footer><button id="left" aria-label="${p.readingDirection === 'rtl' ? 'Página siguiente' : 'Página anterior'}">‹</button><input id="range" type="range" min="1" value="1" aria-label="Ir a página"><span id="num"></span><button id="right" aria-label="${p.readingDirection === 'rtl' ? 'Página anterior' : 'Página siguiente'}">›</button>
<a class="credit" href="https://matelabs.site/" target="_blank" rel="noopener">Creado por ${logo ? `<img src="${logo}" alt="">` : ''}<b>MateLabs</b></a></footer>
<div id="live" class="sr" aria-live="polite"></div>
<script>${inlineScript(pageFlipSource)}</script>
<script>
const D=${data};const N=D.pages.length;const order=D.rtl?[...D.pages.keys()].reverse():[...D.pages.keys()];
let pf=null,mode=D.vertical?'scroll':'book',cur=D.rtl?N-1:0,t,bookOk=true;
const $=id=>document.getElementById(id),range=$('range');range.max=N;range.style.direction=D.rtl?'rtl':'ltr';
const sc=$('scroll');D.pages.forEach((src,i)=>{const im=new Image();im.src=src;im.loading=i>2?'lazy':'eager';im.alt=D.names[i];sc.appendChild(im)});sc.insertAdjacentHTML('beforeend','<div class="end">FIN</div>');
const logical=b=>D.rtl?N-1-b:b,bookIdx=l=>D.rtl?N-1-l:l;
function shown(){const sp=pf&&pf.getOrientation&&pf.getOrientation()==='landscape';let a=[cur];if(sp&&cur>0){const l=cur%2?cur:cur-1;a=[l,l+1].filter(i=>i<N)}return a.map(logical).sort((x,y)=>x-y)}
function sync(){const s=shown();range.value=s[0]+1;const txt=s.length>1?'Páginas '+(s[0]+1)+'–'+(s[s.length-1]+1)+' de '+N:'Página '+(s[0]+1)+' de '+N;$('num').textContent=txt;range.setAttribute('aria-valuetext',txt);$('live').textContent=txt}
function build(){const st=$('stage');st.style.setProperty('--bar',(document.querySelector('footer').offsetHeight+8)+'px');const W=st.clientWidth,H=st.clientHeight,portrait=W<700||W/H<D.ratio*1.25;
 const pw=Math.floor(portrait?Math.min(W,H*D.ratio):Math.min(W/2,H*D.ratio)),ph=Math.floor(pw/D.ratio);
 if(pf){cur=pf.getCurrentPageIndex();try{pf.destroy()}catch(e){}}st.innerHTML='<div id="book"></div>';const book=$('book');
 const els=order.map((k,i)=>{const d=document.createElement('div');d.className='page';d.dataset.density=(i===0||i===N-1)?'hard':'soft';const im=document.createElement('img');im.src=D.pages[k];im.alt=D.names[k];d.appendChild(im);book.appendChild(d);return d});
 pf=new St.PageFlip(book,{width:pw,height:ph,size:'fixed',showCover:true,usePortrait:portrait,mobileScrollSupport:false,maxShadowOpacity:.55,flippingTime:650,startPage:cur,autoSize:false,useMouseEvents:false});
 pf.loadFromHTML(els);if(pf.getCurrentPageIndex()!==cur)pf.turnToPage(cur);pf.on('flip',e=>{cur=e.data;sync()});sync()}
// Avanzar (+1) siempre es ir a la página siguiente de la historia, en cómic y en manga.
function step(s){if(!pf||!s)return;((s===1)!==D.rtl)?pf.flipNext('bottom'):pf.flipPrev('bottom')}
function goTo(l){l=Math.max(0,Math.min(N-1,l));cur=bookIdx(l);pf&&pf.turnToPage(cur);sync()}
$('left').onclick=()=>step(D.rtl?1:-1);$('right').onclick=()=>step(D.rtl?-1:1);
range.oninput=()=>goTo(+range.value-1);
addEventListener('keydown',e=>{if(mode!=='book'||e.target===range)return;const k=e.key;let s=0;
 if(k==='ArrowRight')s=D.rtl?-1:1;else if(k==='ArrowLeft')s=D.rtl?1:-1;else if(k==='PageDown'||(k===' '&&e.target.tagName!=='BUTTON'))s=1;else if(k==='PageUp')s=-1;else if(k==='Home')return goTo(0);else if(k==='End')return goTo(N-1);
 if(s){e.preventDefault();step(s)}});
// Gestos: deslizar o arrastrar la hoja, y tocar los costados. Dos dedos (pellizco) no pasan página.
const ptr=new Map();let multi=false;const stage=$('stage');
stage.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()});if(ptr.size>1)multi=true});
function rel(e,cancel){const s=ptr.get(e.pointerId);ptr.delete(e.pointerId);const m=multi;if(!ptr.size)multi=false;if(!s||cancel||m||mode!=='book')return;
 const dx=e.clientX-s.x,dy=e.clientY-s.y,dt=performance.now()-s.t,r=$('book').getBoundingClientRect();
 if(Math.hypot(dx,dy)<12&&dt<400){const x=(e.clientX-r.left)/Math.max(1,r.width);if(x>.38&&x<.62)return;step(((x>=.62)!==D.rtl)?1:-1);return}
 const d=Math.abs(dx);if(d<40||d<Math.abs(dy)*.7)return;if(d/Math.max(dt,1)<=.35&&d<r.width*.18)return;step(((dx<0)!==D.rtl)?1:-1)}
stage.addEventListener('pointerup',e=>rel(e,false));stage.addEventListener('pointercancel',e=>rel(e,true));
function setMode(m){if(m==='book'&&!bookOk)m='scroll';mode=m;$('stage').style.display=m==='book'?'flex':'none';sc.style.display=m==='scroll'?'block':'none';document.querySelector('footer').style.display=m==='book'?'flex':'none';
 $('mode').textContent=m==='book'?'Scroll':'Libro';$('mode').setAttribute('aria-label',m==='book'?'Cambiar a lectura en scroll':'Cambiar a lectura de libro');
 if(m==='book'){try{build()}catch(err){
  // Si el visor de libro no puede arrancar, la obra se lee igual en scroll.
  console.error(err);bookOk=false;$('mode').style.display='none';setMode('scroll')}}}
if(typeof St==='undefined'){bookOk=false;$('mode').style.display='none'}
$('mode').onclick=()=>setMode(mode==='book'?'scroll':'book');$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>mode==='book'&&build(),200)});
function poke(){document.body.classList.remove('hide');clearTimeout(t);t=setTimeout(()=>document.body.classList.add('hide'),3200)}
addEventListener('pointermove',poke);addEventListener('pointerdown',poke);addEventListener('keydown',poke);poke();setMode(mode);
</script>
</body>
</html>`
}
