// Titik masuk: buka database, migrasi, muat data, lalu jalankan tampilan.
import * as db from './db.js';
import {loadState,setMeta,M} from './state.js';
import {migrate} from './migrate.js';
import {initViews} from './views.js';
import {initBackup} from './backup.js';
import {initDataView} from './data-view.js';
import {startTimer} from './history.js';
import {initPwa} from './pwa.js';
import {toast} from './util.js';

async function boot(){
  try{
    await db.open();
    await loadState();
    await migrate();
    await loadState();           // muat ulang setelah migrasi
  }catch(e){
    toast('Penyimpanan tidak tersedia di peramban ini (mungkin mode pribadi). Perubahan tidak akan tersimpan.',[],10000);
  }
  initDataView();
  initViews();
  startTimer();
  await initBackup();
  initPwa();
  // Minta penyimpanan permanen supaya peramban tidak menghapus data saat ruang menipis.
  try{
    if(navigator.storage&&navigator.storage.persist&&!(await navigator.storage.persisted())){
      const ok=await navigator.storage.persist();await setMeta('persistGranted',ok);
    }
  }catch(e){}
}
boot();
