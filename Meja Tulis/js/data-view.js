// Halaman "Data": penyimpanan, cadangan manual, pengingat, folder otomatis, pasang aplikasi.
import {S,M,setMeta} from './state.js';
import {$,esc,agoText,fmtDateTime,fmtBytes,toast} from './util.js';
import {exportJSON,shareBackup,canShareFiles,importFile,undoImport,renderBanner,renderFooter,
  dirSupported,folderState,chooseFolder,regrant,disableFolder,writeFolder,lastFolderError} from './backup.js';
import {canInstall,promptInstall,isStandalone,isIOS,onPwaChange} from './pwa.js';
import {navigate} from './router.js';

export function renderData(){
  const folder=dirSupported()?`<section><h3>Cadangan otomatis ke folder</h3>
    <p>Pilih satu folder di komputer ini (misalnya yang disinkronkan Google Drive atau OneDrive). Setiap ada perubahan, aplikasi menulis satu berkas per hari, <span class="meta">meja-tulis-TAHUN-BULAN-TANGGAL.json</span>, dan menyimpan 14 berkas terakhir.</p>
    <p class="meta" id="dv-folder-t">Memeriksa…</p>
    <span class="tools"><button class="btn" id="dv-pick" hidden>Pilih folder</button><button class="btn" id="dv-regrant" hidden>Izinkan lagi</button><button class="btn ghost" id="dv-fnow" hidden>Cadangkan ke folder sekarang</button><button class="btn danger" id="dv-foff" hidden>Matikan</button></span>
  </section>`:'';
  return `<div class="sec"><h2>Data dan cadangan</h2></div><div class="guide">
  <section><h3>Penyimpanan di perangkat ini</h3>
    <p>Tulisan dan lombamu disimpan di peramban perangkat ini dan tidak dikirim ke mana pun.</p>
    <p class="meta" id="dv-count"></p><p class="meta" id="dv-persist-t">Memeriksa…</p><p class="meta" id="dv-quota"></p>
    <span class="tools"><button class="btn ghost sm" id="dv-persist" hidden>Minta penyimpanan permanen</button></span>
  </section>
  <section><h3>Cadangan manual</h3>
    <p>Unduh semua tulisan, lomba, dan riwayat versi ke satu berkas .json. Simpan di tempat aman, misalnya Google Drive atau flashdisk.</p>
    <p class="meta" id="dv-last"></p>
    <span class="tools"><button class="btn" id="dv-export">Unduh cadangan</button><button class="btn" id="dv-share" ${canShareFiles()?'':'hidden'}>Bagikan cadangan</button><button class="btn ghost" id="dv-import">Impor cadangan</button><button class="btn ghost" id="dv-undo" hidden>Batalkan impor terakhir</button></span>
    <p class="meta">Impor menerima berkas cadangan dari aplikasi ini, termasuk format lama. Kamu akan melihat ringkasan dan diminta konfirmasi dulu.</p>
  </section>
  <section><h3>Pengingat cadangan</h3>
    <label>Ingatkan saya bila ada perubahan dan sudah lebih dari<select id="dv-remind">${[[3,'3 hari'],[7,'7 hari'],[14,'14 hari'],[0,'Jangan ingatkan']].map(([v,t])=>`<option value="${v}" ${(M.remindDays??7)===v?'selected':''}>${t}</option>`).join('')}</select></label>
  </section>
  ${folder}
  <section><h3>Pasang aplikasi</h3>
    <p class="meta" id="dv-install-t"></p>
    <span class="tools"><button class="btn" id="dv-install" hidden>Pasang aplikasi</button></span>
  </section></div>`;
}

const setT=(id,t)=>{const e=$(id);if(e)e.textContent=t};
const show=(id,on)=>{const e=$(id);if(e)e.hidden=!on};

export async function hydrateData(){
  if(!$('#dv-count'))return;
  setT('#dv-count',`${S.pieces.length} tulisan · ${S.contests.length} lomba`);
  setT('#dv-last',M.lastBackupAt?'Cadangan terakhir: '+fmtDateTime(M.lastBackupAt)+' ('+agoText(M.lastBackupAt)+')':'Belum pernah dicadangkan.');
  show('#dv-undo',!!M.preImport);
  // penyimpanan permanen
  try{
    const p=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null;
    setT('#dv-persist-t',p===null?'Status penyimpanan permanen tidak bisa dicek di peramban ini.':p?'Penyimpanan permanen: aktif. Peramban tidak akan menghapus datamu otomatis.':'Penyimpanan permanen: belum aktif. Peramban bisa menghapus data bila ruang perangkat menipis, jadi tetap buat cadangan.');
    show('#dv-persist',p===false);
    if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();if(e.usage!=null)setT('#dv-quota','Terpakai sekitar '+fmtBytes(e.usage)+(e.quota?' dari '+fmtBytes(e.quota)+' yang tersedia':'')+'.')}
  }catch(e){}
  // folder
  if(dirSupported()){
    const st=await folderState();
    const t=st.state==='off'?'Belum aktif.':st.state==='ok'?'Aktif di folder “'+st.name+'”.'+(M.lastFolderAt?' Terakhir ditulis '+fmtDateTime(M.lastFolderAt)+'.':''):'Folder “'+st.name+'” perlu izin lagi setelah aplikasi dibuka kembali.';
    setT('#dv-folder-t',t+(lastFolderError()?' Gagal menulis: '+lastFolderError()+'.':''));
    show('#dv-pick',st.state==='off');show('#dv-regrant',st.state==='perm');show('#dv-fnow',st.state==='ok');show('#dv-foff',st.state!=='off');
  }
  // pasang aplikasi
  const inst=canInstall(),sa=isStandalone();
  setT('#dv-install-t',sa?'Aplikasi sudah terpasang di perangkat ini.':inst?'Pasang supaya Meja Tulis terbuka seperti aplikasi biasa dan tetap bisa dipakai tanpa internet.':isIOS()?'Di iPhone atau iPad: buka lewat Safari, ketuk Bagikan, lalu pilih Tambah ke Layar Utama.':'Peramban ini belum menawarkan pemasangan. Di Chrome atau Edge, cari ikon pasang di bilah alamat atau menu peramban.');
  show('#dv-install',inst&&!sa);
}

export function initDataView(){
  onPwaChange(()=>hydrateData());
  document.addEventListener('mt:backup',()=>hydrateData());
  const fileIn=$('#file');
  fileIn.onchange=async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    if(await importFile(f)){navigate('dash')}
    hydrateData();
  };
  document.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t||!t.id.startsWith('dv-'))return;
    switch(t.id){
      case'dv-export':await exportJSON();break;
      case'dv-share':await shareBackup();break;
      case'dv-import':fileIn.click();break;
      case'dv-undo':if(await undoImport())navigate('dash');break;
      case'dv-persist':{const ok=await navigator.storage.persist();if(!ok)toast('Peramban belum mengizinkan. Pasang aplikasi atau pakai situs ini lebih sering, lalu coba lagi.',[],6000);hydrateData();break}
      case'dv-pick':await chooseFolder();break;
      case'dv-regrant':await regrant();break;
      case'dv-fnow':if(await writeFolder())toast('Cadangan ditulis ke folder.',[],3000);hydrateData();break;
      case'dv-foff':if(confirm('Matikan cadangan otomatis ke folder? Berkas yang sudah ada di folder tidak dihapus.'))await disableFolder();break;
      case'dv-install':await promptInstall();break;
    }
  });
  document.addEventListener('change',async e=>{
    if(e.target.id!=='dv-remind')return;
    await setMeta('remindDays',+e.target.value);renderBanner();renderFooter();
  });
}
