// Riwayat versi draf: snapshot otomatis + dialog pemulihan.
import * as db from './db.js';
import {S,save} from './state.js';
import {PREP} from './config.js';
import {$,uid,esc,wc,fmtDateTime,toast} from './util.js';

export const MAX=30;
const REASON={keluar:'Keluar dari editor',tahap:'Ganti tahap',impor:'Sebelum impor','batal-impor':'Sebelum batal impor',berkala:'Otomatis tiap 10 menit','sebelum-pulih':'Sebelum pemulihan'};

const hashStr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return(h>>>0).toString(36)+'.'+s.length};
const sigOf=p=>hashStr(JSON.stringify([p.draft||'',p.notes||'',p.prep||{}]));
const blank=p=>!(p.draft||'').trim()&&!(p.notes||'').trim()&&!Object.values(p.prep||{}).some(o=>Object.values(o||{}).some(x=>(x||'').trim()));

let q=Promise.resolve();   // antrean, supaya dua snapshot tulisan yang sama tidak berebut
export function snapshot(p,reason){const r=q.then(()=>doSnap(p,reason));q=r.catch(()=>{});return r.catch(()=>false)}
async function doSnap(p,reason){
  if(!p||blank(p))return false;
  const sig=sigOf(p),list=await db.snapshotsOf(p.id),last=list[list.length-1];
  if(last&&last.sig===sig){dirty.delete(p.id);return false}       // isi sama dengan snapshot terakhir
  const rec={id:'s'+Date.now().toString(36)+uid(),pieceId:p.id,createdAt:Date.now(),reason,sig,title:p.title||'',type:p.type,stage:p.stage,
    words:wc(p.draft),draft:p.draft||'',notes:p.notes||'',prep:JSON.parse(JSON.stringify(p.prep||{}))};
  await db.put('snapshots',rec);list.push(rec);
  if(list.length>MAX)await db.delMany('snapshots',list.slice(0,list.length-MAX).map(x=>x.id));
  dirty.delete(p.id);return true;
}
export async function snapshotAll(reason){for(const p of S.pieces)await snapshot(p,reason)}
// Pangkas ke 30 per tulisan (dipakai setelah impor).
export async function trimAll(){
  const all=await db.all('snapshots'),by={};all.forEach(s=>(by[s.pieceId]=by[s.pieceId]||[]).push(s));
  const drop=[];Object.values(by).forEach(l=>{l.sort((a,b)=>a.createdAt-b.createdAt);if(l.length>MAX)l.slice(0,l.length-MAX).forEach(s=>drop.push(s.id))});
  await db.delMany('snapshots',drop);
}
export async function deleteFor(pieceId){const l=await db.snapshotsOf(pieceId);await db.delMany('snapshots',l.map(s=>s.id))}

// Snapshot berkala: setiap 10 menit untuk tulisan yang berubah.
const dirty=new Set();
export const markDirty=id=>dirty.add(id);
export function startTimer(){setInterval(()=>{[...dirty].forEach(id=>{const p=S.pieces.find(x=>x.id===id);if(p)snapshot(p,'berkala');else dirty.delete(id)})},10*60*1000)}

export async function openHistory(p,onRestore){
  const d=$('#dlg'),list=(await db.snapshotsOf(p.id)).reverse();   // terbaru di atas
  let sel=0;
  const filled=s=>{const it=(PREP[s.type]||PREP.Lainnya).items.length,v=(s.prep&&s.prep[s.type])||{};return Object.values(v).filter(x=>(x||'').trim()).length+' dari '+it}
  const delta=i=>{const o=list[i+1];if(!o)return'';const n=list[i].words-o.words;return n===0?'±0 kata':(n>0?'+':'−')+Math.abs(n).toLocaleString('id-ID')+' kata'};
  function draw(){
    const s=list[sel];
    d.innerHTML=`<div class="dlg"><h2>Riwayat versi</h2>
    <p class="meta" style="margin:0">Versi disimpan otomatis saat kamu keluar dari editor, ganti tahap, atau sudah 10 menit menulis. Maksimal ${MAX} versi per tulisan; yang paling lama dihapus sendiri.</p>
    ${list.length?`<div class="hist"><div class="hlist">${list.map((x,i)=>`<button class="hrow" data-h="${i}" aria-pressed="${i===sel}"><b>${fmtDateTime(x.createdAt)}</b><span class="meta">${x.words.toLocaleString('id-ID')} kata${delta(i)?' · '+delta(i):''}</span></button>`).join('')}</div>
    <div><div class="meta" style="margin-bottom:6px">${esc(s.title||'Tanpa judul')} · ${esc(REASON[s.reason]||'Versi tersimpan')} · persiapan terisi ${filled(s)}</div><pre class="hprev">${s.draft.trim()?esc(s.draft):'(Draf masih kosong pada versi ini.)'}</pre></div></div>`
    :`<div class="empty">Belum ada versi tersimpan untuk tulisan ini. Versi pertama muncul saat kamu keluar dari editor.</div>`}
    </div><div class="foot"><span class="meta">Sekarang: ${wc(p.draft).toLocaleString('id-ID')} kata</span><span class="tools"><button class="btn ghost" id="h-close">Tutup</button>${list.length?'<button class="btn" id="h-ok">Pulihkan versi ini</button>':''}</span></div>`;
    d.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{sel=+b.dataset.h;draw()});
    $('#h-close').onclick=()=>d.close();
    const ok=$('#h-ok');if(ok)ok.onclick=async()=>{
      if(!confirm('Pulihkan versi '+fmtDateTime(s.createdAt)+'? Versi saat ini disimpan dulu di riwayat, jadi bisa dikembalikan lagi.'))return;
      await snapshot(p,'sebelum-pulih');
      p.draft=s.draft;p.notes=s.notes;p.prep=JSON.parse(JSON.stringify(s.prep||{}));
      await save();d.close();onRestore&&onRestore();toast('Versi dipulihkan.',[],3000);
    };
  }
  draw();
  if(!d.open)d.showModal();
}
