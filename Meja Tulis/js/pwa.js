// PWA: pendaftaran service worker, toast versi baru, dan tombol "Pasang aplikasi".
import {toast} from './util.js';
import {flush} from './state.js';

let deferred=null;
const subs=[],emit=()=>subs.forEach(f=>{try{f()}catch(e){}});
export const onPwaChange=f=>subs.push(f);
export const canInstall=()=>!!deferred;
export const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
export const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
export async function promptInstall(){
  if(!deferred)return;
  deferred.prompt();
  try{await deferred.userChoice}catch(e){}
  deferred=null;emit();
}

function announce(worker){
  toast('Versi baru tersedia.',[{label:'Muat ulang',fn:async()=>{await flush();worker.postMessage({type:'SKIP_WAITING'})}}]);
}
export function initPwa(){
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;emit()});
  addEventListener('appinstalled',()=>{deferred=null;emit()});
  if(!('serviceWorker' in navigator))return;
  const hadController=!!navigator.serviceWorker.controller;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;reloading=true;location.reload()});
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    if(reg.waiting&&navigator.serviceWorker.controller)announce(reg.waiting);
    reg.addEventListener('updatefound',()=>{
      const w=reg.installing;if(!w)return;
      w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)announce(w)});
    });
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
  }).catch(()=>{});
}
