// Migrasi sekali jalan: localStorage "meja-tulis-v1" -> IndexedDB.
// Data lama tidak dihapus. Migrasi dianggap berhasil hanya jika hasil baca ulang dari IndexedDB sama persis.
import * as db from './db.js';
import {KEY,SCHEMA} from './config.js';
import {M,setMeta} from './state.js';
import {toast} from './util.js';

export async function migrate(){
  if(M.migratedAt||M.migrationSkipped)return;
  let raw=null;
  try{raw=localStorage.getItem(KEY)}catch(e){return}
  if(!raw)return;                                   // tidak ada data lama
  let old;
  try{old=JSON.parse(raw)}catch(e){toast('Data lama tidak terbaca, jadi tidak dipindahkan. Data lama tetap utuh.',[],8000);return}
  if(!old||!Array.isArray(old.pieces)||!Array.isArray(old.contests))return;

  // Jika IndexedDB sudah berisi data, jangan menimpanya.
  const [p0,c0]=await Promise.all([db.get('data','pieces'),db.get('data','contests')]);
  if((p0&&p0.length)||(c0&&c0.length)){await setMeta('migrationSkipped',Date.now());return}

  await db.putMany([{store:'data',key:'pieces',value:old.pieces},{store:'data',key:'contests',value:old.contests},
    {store:'meta',key:'schemaVersion',value:SCHEMA}]);
  // Verifikasi: baca ulang dan bandingkan dengan sumber.
  const [p1,c1]=await Promise.all([db.get('data','pieces'),db.get('data','contests')]);
  const same=JSON.stringify(p1)===JSON.stringify(old.pieces)&&JSON.stringify(c1)===JSON.stringify(old.contests);
  if(!same){
    await db.putMany([{store:'data',key:'pieces',value:[]},{store:'data',key:'contests',value:[]}]);
    toast('Pemindahan data lama gagal diverifikasi. Data lama tetap utuh di peramban ini.',[],10000);
    return;
  }
  await setMeta('migratedAt',Date.now());
  await setMeta('lastChangeAt',Date.now());          // belum pernah dicadangkan, jadi pengingat boleh muncul
  toast('Data lama berhasil dipindahkan ke penyimpanan baru.',[],5000);
}
