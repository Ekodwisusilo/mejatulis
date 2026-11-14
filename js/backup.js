// Cadangan: ekspor/impor JSON, pengingat, Bagikan (HP), dan cadangan otomatis ke folder (desktop).
import * as db from './db.js';
import {S,M,setMeta,replaceData,save,onSaved} from './state.js';
import {SCHEMA,TYPES,STAGES,CSTAT} from './config.js';
import {snapshotAll,trimAll} from './history.js';
import {$,esc,uid,saveFile,ymd,toast,fmtDateTime,agoText,daysAgo} from './util.js';

/* ---------- Membuat cadangan ---------- */
export async function buildBackup(){
  return{app:'meja-tulis',schemaVersion:SCHEMA,exportedAt:new Date().toISOString(),
    data:{pieces:S.pieces,contests:S.contests},snapshots:await db.all('snapshots')};
}
async function markBackedUp(){await setMeta('lastBackupAt',Date.now());document.dispatchEvent(new Event('mt:backup'))}

export async function exportJSON(){
  const b=await buildBackup();
  saveFile(`meja-tulis-cadangan-${ymd()}.json`,new Blob([JSON.stringify(b,null,1)],{type:'application/json'}));
  await markBackedUp();
}

/* ---------- Bagikan (Web Share API dengan berkas) ---------- */
export function canShareFiles(){
  try{return!!(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File(['{}'],'cadangan.json',{type:'application/json'})]}))}catch(e){return false}
}
export async function shareBackup(){
  const b=await buildBackup();
  const f=new File([JSON.stringify(b,null,1)],`meja-tulis-cadangan-${ymd()}.json`,{type:'application/json'});
  try{await navigator.share({files:[f],title:'Cadangan Meja Tulis'});await markBackedUp()}
  catch(e){if(!e||e.name!=='AbortError')toast('Cadangan belum bisa dibagikan. Coba tombol Unduh cadangan.',[],5000)}
}

/* ---------- Validasi isi cadangan ---------- */
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const str=v=>typeof v==='string'?v:v==null?'':String(v);
const fail=error=>({ok:false,error});

function cleanPiece(p,seen){
  if(!isObj(p))return null;
  let id=str(p.id);if(!id||seen.has(id))id=uid();seen.add(id);
  return{...p,id,title:str(p.title),type:str(p.type)||'Lainnya',stage:STAGES.includes(p.stage)?p.stage:'Persiapan',
    target:p.target==null?'':p.target,draft:str(p.draft),notes:str(p.notes),contestId:str(p.contestId),
    checks:isObj(p.checks)?p.checks:{},prep:isObj(p.prep)?p.prep:{}};
}
function cleanContest(c,seen){
  if(!isObj(c))return null;
  let id=str(c.id);if(!id||seen.has(id))id=uid();seen.add(id);
  return{...c,id,name:str(c.name)||'Lomba tanpa nama',deadline:str(c.deadline),genre:str(c.genre),link:str(c.link),
    status:CSTAT.includes(c.status)?c.status:'Mengincar',notes:str(c.notes)};
}
export function validate(raw){
  if(!isObj(raw))return fail('Isi berkas bukan cadangan Meja Tulis.');
  let pieces,contests,snaps=[],exportedAt=null,schema=0,legacy=false;
  if(raw.app==='meja-tulis'&&isObj(raw.data)){
    pieces=raw.data.pieces;contests=raw.data.contests;snaps=Array.isArray(raw.snapshots)?raw.snapshots:[];
    exportedAt=raw.exportedAt||null;schema=Number(raw.schemaVersion)||1;
  }else if(!raw.app&&Array.isArray(raw.pieces)&&Array.isArray(raw.contests)){
    legacy=true;pieces=raw.pieces;contests=raw.contests;                       // format lama
  }else return fail('Berkas ini bukan cadangan Meja Tulis.');
  if(schema>SCHEMA)return fail('Cadangan ini dibuat oleh versi Meja Tulis yang lebih baru. Perbarui aplikasi dulu.');
  if(!Array.isArray(pieces)||!Array.isArray(contests))return fail('Isi cadangan tidak lengkap.');
  const sp=new Set(),sc=new Set();
  const P=pieces.map(p=>cleanPiece(p,sp)),C=contests.map(c=>cleanContest(c,sc));
  const okP=P.filter(Boolean),okC=C.filter(Boolean);
  const ids=new Set(okP.map(p=>p.id)),sid=new Set();
  const okS=snaps.filter(s=>isObj(s)&&typeof s.pieceId==='string'&&ids.has(s.pieceId)&&typeof s.createdAt==='number'&&typeof s.draft==='string')
    .map(s=>{let id=str(s.id);if(!id||sid.has(id))id='s'+uid()+uid();sid.add(id);return{...s,id,notes:str(s.notes),prep:isObj(s.prep)?s.prep:{},words:Number(s.words)||0,sig:str(s.sig)}});
  return{ok:true,pieces:okP,contests:okC,snapshots:okS,exportedAt,legacy,schemaVersion:schema,
    dropped:(P.length-okP.length)+(C.length-okC.length)};
}
export function parseBackup(text){let raw;try{raw=JSON.parse(text)}catch(e){return fail('Berkas bukan JSON yang valid.')}return validate(raw)}

/* ---------- Mengganti data dengan cadangan ---------- */
export async function applyBackup(parsed,{savePre=true}={}){
  await snapshotAll('impor');                                    // simpan versi tiap tulisan sebelum diganti
  if(savePre)await setMeta('preImport',await buildBackup());     // salinan utuh, agar impor bisa dibatalkan
  replaceData(parsed);
  if(parsed.snapshots.length)await db.putMany(parsed.snapshots.map(s=>({store:'snapshots',value:s})));
  await trimAll();
  await save();
}
export async function undoImport(){
  const p=M.preImport?validate(M.preImport):null;
  if(!p||!p.ok){toast('Tidak ada impor yang bisa dibatalkan.',[],4000);return false}
  if(!confirm('Kembalikan data seperti sebelum impor terakhir? Data saat ini akan diganti.'))return false;
  await applyBackup(p,{savePre:false});await setMeta('preImport',null);
  toast('Data dikembalikan seperti sebelum impor.',[],4000);return true;
}
// Dialog konfirmasi impor. Mengembalikan true bila pengguna setuju.
export function confirmImport(parsed){
  return new Promise(res=>{
    const d=$('#dlg');
    d.innerHTML=`<div class="dlg"><h2>Impor cadangan</h2>
    <div class="kv"><div><b>${parsed.pieces.length}</b> tulisan</div><div><b>${parsed.contests.length}</b> lomba</div><div><b>${parsed.snapshots.length}</b> versi riwayat</div>
    <div class="meta">${parsed.exportedAt?'Dicadangkan '+fmtDateTime(parsed.exportedAt):'Format lama, tanpa tanggal cadangan'}</div>
    ${parsed.dropped?`<div class="meta">${parsed.dropped} entri rusak dilewati.</div>`:''}</div>
    <div class="note">Data saat ini (${S.pieces.length} tulisan, ${S.contests.length} lomba) akan <b>diganti</b>. Sebelumnya aplikasi menyimpan salinan otomatis, jadi impor ini bisa dibatalkan dari halaman Data.</div>
    </div><div class="foot"><span></span><span class="tools"><button class="btn ghost" id="i-no">Batal</button><button class="btn" id="i-ok">Ganti dengan cadangan</button></span></div>`;
    let out=false;
    $('#i-no').onclick=()=>d.close();$('#i-ok').onclick=()=>{out=true;d.close()};
    d.addEventListener('close',()=>res(out),{once:true});
    d.showModal();
  });
}
export async function importFile(file){
  const parsed=parseBackup(await file.text());
  if(!parsed.ok){alert(parsed.error+'\nPilih berkas hasil ekspor Meja Tulis.');return false}
  if(!await confirmImport(parsed))return false;
  await applyBackup(parsed);
  toast('Impor selesai.',[],4000);return true;
}

/* ---------- Pengingat ---------- */
let dismissed=false;
export function reminder(){
  const every=M.remindDays??7;if(!every||dismissed)return null;
  if(!S.pieces.length&&!S.contests.length)return null;
  const lb=M.lastBackupAt,lc=M.lastChangeAt||Date.now();
  if(!lb)return'Data belum pernah dicadangkan';
  if(lc>lb&&Date.now()-lb>every*864e5)return'Terakhir dicadangkan '+daysAgo(lb)+' hari lalu';
  return null;
}
export function renderBanner(){
  const b=$('#banner');if(!b)return;const t=reminder();
  if(!t){b.hidden=true;b.innerHTML='';return}
  b.hidden=false;
  b.innerHTML=`<span>${esc(t)}.</span><span class="tools"><button class="btn sm" id="bn-do">Cadangkan sekarang</button><button class="btn ghost sm" id="bn-x">Tutup</button></span>`;
}
export function renderFooter(){
  const f=$('#foot-status');if(!f)return;
  f.textContent='Data tersimpan di perangkat ini. '+(M.lastBackupAt?'Cadangan terakhir: '+agoText(M.lastBackupAt)+'.':'Belum pernah dicadangkan.');
}

/* ---------- Cadangan otomatis ke folder (File System Access API) ---------- */
export const dirSupported=()=>typeof window.showDirectoryPicker==='function';
let dirTimer=null,folderError='';
export const lastFolderError=()=>folderError;
export async function folderState(){
  const h=M.dirHandle;if(!h)return{state:'off'};
  try{const p=await h.queryPermission({mode:'readwrite'});return{state:p==='granted'?'ok':'perm',name:h.name}}
  catch(e){return{state:'perm',name:h.name}}
}
export async function chooseFolder(){
  try{
    const h=await window.showDirectoryPicker({id:'meja-tulis',mode:'readwrite'});
    await setMeta('dirHandle',h);
    if(await writeFolder())toast('Cadangan otomatis aktif.',[],3500);
    else toast('Folder dipilih, tapi belum bisa ditulisi: '+(folderError||'izin ditolak')+'.',[],6000);
  }catch(e){if(!e||e.name!=='AbortError')toast('Folder tidak bisa dipakai: '+(e&&e.message||'galat'),[],6000)}
  document.dispatchEvent(new Event('mt:backup'));
}
export async function regrant(){
  const h=M.dirHandle;if(!h)return;
  try{if(await h.requestPermission({mode:'readwrite'})==='granted')await writeFolder()}catch(e){}
  document.dispatchEvent(new Event('mt:backup'));
}
export async function disableFolder(){await setMeta('dirHandle',null);await setMeta('lastFolderAt',null);document.dispatchEvent(new Event('mt:backup'))}
export async function writeFolder(){
  const h=M.dirHandle;if(!h)return false;
  try{
    if(await h.queryPermission({mode:'readwrite'})!=='granted')return false;
    const b=await buildBackup(),fh=await h.getFileHandle(`meja-tulis-${ymd()}.json`,{create:true});
    const w=await fh.createWritable();await w.write(JSON.stringify(b));await w.close();   // timpa berkas hari yang sama
    await prune(h);
    folderError='';await setMeta('lastFolderAt',Date.now());await markBackedUp();return true;
  }catch(e){folderError=e&&e.message||'galat tak dikenal';document.dispatchEvent(new Event('mt:backup'));return false}
}
// Simpan 14 berkas harian terakhir. Hanya menyentuh berkas bernama meja-tulis-YYYY-MM-DD.json.
async function prune(h){
  const names=[];
  for await(const [n,e] of h.entries())if(e.kind==='file'&&/^meja-tulis-\d{4}-\d{2}-\d{2}\.json$/.test(n))names.push(n);
  names.sort();
  for(const n of names.slice(0,Math.max(0,names.length-14)))await h.removeEntry(n);
}

export async function initBackup(){
  onSaved(()=>{if(!M.dirHandle)return;clearTimeout(dirTimer);dirTimer=setTimeout(()=>writeFolder(),20000)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirTimer){clearTimeout(dirTimer);dirTimer=null;writeFolder()}});
  document.addEventListener('mt:backup',()=>{renderBanner();renderFooter()});
  document.addEventListener('click',async e=>{
    const t=e.target.closest('#bn-do,#bn-x');if(!t)return;
    if(t.id==='bn-x'){dismissed=true;renderBanner()}else await exportJSON();
  });
  renderBanner();renderFooter();
  if(M.dirHandle){
    const st=await folderState();
    if(st.state==='perm')toast('Cadangan otomatis ke folder butuh izin lagi.',[{label:'Izinkan lagi',fn:regrant}]);
    else if(st.state==='ok'&&(M.lastChangeAt||0)>(M.lastFolderAt||0))writeFolder();
  }
}
