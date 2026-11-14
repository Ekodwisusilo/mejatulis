// Data aplikasi di memori + penyimpanan ke IndexedDB (debounce) + meta.
import * as db from './db.js';
import {SCHEMA} from './config.js';
import {toast} from './util.js';

export const S={pieces:[],contests:[]};   // data pengguna
export const M={};                         // cache meta (lastBackupAt, lastChangeAt, dirHandle, ...)

export function norm(){S.pieces.forEach(p=>{p.prep=p.prep||{};if(p.beats&&Object.keys(p.beats).length&&!p.prep.Novel)p.prep.Novel=p.beats;delete p.beats;p.checks=p.checks||{}})}

export async function loadState(){
  const [pieces,contests,meta]=await Promise.all([db.get('data','pieces'),db.get('data','contests'),db.entries('meta')]);
  S.pieces=Array.isArray(pieces)?pieces:[];S.contests=Array.isArray(contests)?contests:[];
  Object.keys(M).forEach(k=>delete M[k]);Object.assign(M,meta);
  norm();
}
export function replaceData(d){S.pieces=d.pieces;S.contests=d.contests;norm()}
export async function setMeta(k,v){if(v==null){delete M[k];return db.del('meta',k)}M[k]=v;return db.put('meta',v,k)}

const subs=[];
export const onSaved=f=>subs.push(f);
let timer=null,chain=Promise.resolve(),pending=false,failed=false;
const ind=t=>{const s=document.querySelector('#sv');if(s)s.textContent=t};

// touch: simpan dengan jeda 0,5 detik (dipakai saat mengetik). save: simpan sekarang.
export function touch(){pending=true;ind('Menyimpan…');clearTimeout(timer);timer=setTimeout(()=>{timer=null;save()},500)}
export function save(){clearTimeout(timer);timer=null;pending=true;ind('Menyimpan…');chain=chain.then(write);return chain}
export function flush(){return(timer||pending)?save():chain}
async function write(){
  pending=false;
  try{
    const now=Date.now();
    await db.putMany([
      {store:'data',key:'pieces',value:S.pieces},{store:'data',key:'contests',value:S.contests},
      {store:'meta',key:'lastChangeAt',value:now},{store:'meta',key:'schemaVersion',value:SCHEMA}]);
    M.lastChangeAt=now;M.schemaVersion=SCHEMA;failed=false;
    if(!pending)ind('Tersimpan');
    subs.forEach(f=>{try{f()}catch(e){}});
    try{bc&&bc.postMessage('saved')}catch(e){}
  }catch(e){
    ind('Gagal menyimpan');
    if(!failed){failed=true;toast('Data belum bisa disimpan di peramban ini. Unduh cadangan agar tidak hilang.',[],8000)}
  }
}
// Simpan sisa ketikan saat tab disembunyikan atau ditutup.
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
addEventListener('pagehide',()=>{flush()});

// Beri tahu bila tab lain mengubah data, supaya tidak saling menimpa.
let bc=null;try{bc=new BroadcastChannel('meja-tulis')}catch(e){}
if(bc)bc.onmessage=()=>toast('Data berubah di tab lain. Muat ulang agar tidak saling menimpa.',[{label:'Muat ulang',fn:()=>location.reload()}]);
