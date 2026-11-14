// Pembungkus kecil IndexedDB. Store: data (pieces, contests), snapshots, meta.
const NAME='meja-tulis',VER=1;
let dbp=null;
export const open=()=>dbp||(dbp=new Promise((res,rej)=>{
  if(!('indexedDB' in window))return rej(new Error('IndexedDB tidak tersedia di peramban ini.'));
  const r=indexedDB.open(NAME,VER);
  r.onupgradeneeded=()=>{const d=r.result;
    if(!d.objectStoreNames.contains('data'))d.createObjectStore('data');
    if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta');
    if(!d.objectStoreNames.contains('snapshots')){const s=d.createObjectStore('snapshots',{keyPath:'id'});s.createIndex('pieceTime',['pieceId','createdAt'])}};
  r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();res(r.result)};
  r.onerror=()=>{dbp=null;rej(r.error)};
}));
const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const done=tx=>new Promise((res,rej)=>{tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('Transaksi dibatalkan'))});
const putTo=(os,value,key)=>os.keyPath?os.put(value):os.put(value,key);

export async function get(store,key){const d=await open();return req(d.transaction(store).objectStore(store).get(key))}
export async function all(store){const d=await open();return req(d.transaction(store).objectStore(store).getAll())}
export async function put(store,value,key){const d=await open();const tx=d.transaction(store,'readwrite');putTo(tx.objectStore(store),value,key);return done(tx)}
// ops: [{store,key,value}] ditulis dalam satu transaksi (semua berhasil atau tidak sama sekali).
export async function putMany(ops){if(!ops.length)return;const d=await open();const tx=d.transaction([...new Set(ops.map(o=>o.store))],'readwrite');ops.forEach(o=>putTo(tx.objectStore(o.store),o.value,o.key));return done(tx)}
export async function del(store,key){const d=await open();const tx=d.transaction(store,'readwrite');tx.objectStore(store).delete(key);return done(tx)}
export async function delMany(store,keys){if(!keys.length)return;const d=await open();const tx=d.transaction(store,'readwrite');keys.forEach(k=>tx.objectStore(store).delete(k));return done(tx)}
// Semua isi store key-value sebagai objek {kunci: nilai}.
export async function entries(store){const d=await open();return new Promise((res,rej)=>{const out={};const c=d.transaction(store).objectStore(store).openCursor();c.onsuccess=()=>{const cur=c.result;if(cur){out[cur.key]=cur.value;cur.continue()}else res(out)};c.onerror=()=>rej(c.error)})}
// Snapshot satu tulisan, urut dari yang terlama.
export async function snapshotsOf(pieceId){const d=await open();return req(d.transaction('snapshots').objectStore('snapshots').index('pieceTime').getAll(IDBKeyRange.bound([pieceId,0],[pieceId,Infinity])))}
