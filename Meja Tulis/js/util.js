// Fungsi kecil yang dipakai banyak modul.
export const $=s=>document.querySelector(s);
export const uid=()=>Math.random().toString(36).slice(2,9);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const wc=t=>((t||"").trim().match(/\S+/g)||[]).length;
export const nf=n=>Math.round(n).toLocaleString("id-ID");
export const days=d=>{if(!d)return null;const t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(d+"T00:00:00")-t)/864e5)};
export const fmt=d=>d?new Date(d+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"Tanpa tenggat";
export const cd=n=>n===null?"":n<0?"lewat "+(-n)+" hari":n===0?"hari ini":n+" hari lagi";
export const slug=t=>(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'tulisan';
const p2=n=>String(n).padStart(2,'0');
export const ymd=(d=new Date())=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
export const fmtDateTime=ts=>new Date(ts).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const fmtBytes=n=>n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(1)+' MB';
// Berapa hari lalu (hari kalender, waktu setempat).
export function daysAgo(ts){const a=new Date(ts),b=new Date();a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.round((b-a)/864e5)}
export function agoText(ts){if(!ts)return'';const n=daysAgo(ts);return n<=0?'hari ini':n===1?'kemarin':n+' hari lalu'}

// Unduhan biasa lewat tautan sementara.
export function saveFile(name,data){
  try{const blob=data instanceof Blob?data:new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);return true}
  catch(e){alert('Unduhan tidak tersedia di peramban ini.');return false}
}

// Toast kecil di bawah layar. actions: [{label, fn}]. ms=0 berarti menetap sampai ditutup.
export function toast(msg,actions=[],ms=0){
  const box=$('#toasts');if(!box)return null;
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  const s=document.createElement('span');s.textContent=msg;t.appendChild(s);
  const close=()=>t.remove();
  actions.forEach(a=>{const b=document.createElement('button');b.className='btn sm';b.textContent=a.label;b.onclick=()=>{close();a.fn&&a.fn()};t.appendChild(b)});
  if(!ms&&!actions.length)ms=4000;
  if(ms)setTimeout(close,ms);
  box.appendChild(t);return t;
}
