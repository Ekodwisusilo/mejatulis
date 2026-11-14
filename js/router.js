// Navigasi berbasis hash: #dash #pieces #contests #data #guide #p/<id>
// Memakai pushState supaya tombol Back di HP bekerja, dan tahu apakah ada halaman sebelumnya di dalam aplikasi.
const VIEWS=['dash','pieces','contests','data','guide'];
let handler=null,cur=null;

export function parseHash(h=location.hash){
  const s=h.replace(/^#\/?/,'');
  if(s.startsWith('p/')&&s.length>2)return{name:'editor',id:decodeURIComponent(s.slice(2))};
  return{name:VIEWS.includes(s)?s:'dash'};
}
const hashOf=r=>r.name==='editor'?'p/'+encodeURIComponent(r.id):r.name;

function run(){const r=parseHash(),k=hashOf(r);if(k===cur)return;cur=k;handler&&handler(r)}

export function navigate(to,{replace=false}={}){
  const target='#'+to.replace(/^#/,'');
  if(target===location.hash)return;
  const n=((history.state&&history.state.n)||0)+1;
  if(replace)history.replaceState({n:(history.state&&history.state.n)||0},'',target);
  else history.pushState({n},'',target);
  run();
}
// Kembali satu langkah di dalam aplikasi; kalau tidak ada riwayat, ke halaman cadangan.
export function back(fallback='pieces'){
  if(history.state&&history.state.n>0)history.back();else navigate(fallback,{replace:true});
}
export function initRouter(onRoute){
  handler=onRoute;
  if(!history.state)history.replaceState({n:0},'');
  addEventListener('popstate',run);addEventListener('hashchange',run);
  run();
}
