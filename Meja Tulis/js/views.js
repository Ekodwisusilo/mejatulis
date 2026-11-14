// Tampilan: dashboard, tulisan, lomba, editor, dialog lomba, dan penghubung ke router.
import {STAGES,CHECKS,TYPES,CSTAT,PREP} from './config.js';
import {S,save,touch} from './state.js';
import {$,uid,esc,wc,nf,days,fmt,cd,slug,saveFile} from './util.js';
import {snapshot,markDirty,openHistory,deleteFor} from './history.js';
import {initRouter,navigate,back} from './router.js';
import {renderBanner,renderFooter} from './backup.js';
import {renderData,hydrateData} from './data-view.js';
import {renderGuide} from './guide.js';
import {docxBlob} from './docx.js';

let view='dash',filter='',ed=null,sideOpen=true;

function prog(p){const a=items(p).length,b=CHECKS.Menulis.length+CHECKS.Editorial.length;let d=prepDone(p);['Menulis','Editorial'].forEach(s=>CHECKS[s].forEach((_,i)=>{if(p.checks[s+':'+i])d++}));return Math.round(d/(a+b)*100)}
const cname=id=>(S.contests.find(c=>c.id===id)||{}).name||"";
function pieceCard(p){const w=wc(p.draft);return `<button class="card" data-p="${p.id}"><div class="t">${esc(p.title||"Tanpa judul")}</div><div class="meta">${esc(p.type)} · ${w}${p.target?" / "+p.target:""} kata</div>${p.contestId?`<div class="meta">Lomba: ${esc(cname(p.contestId))}</div>`:""}<div class="bar"><i style="width:${prog(p)}%"></i></div></button>`}

function renderDash(){
  const act=S.contests.filter(c=>["Mengincar","Disiapkan"].includes(c.status));
  const up=act.filter(c=>c.deadline&&days(c.deadline)>=0).sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,5);
  const words=S.pieces.reduce((n,p)=>n+wc(p.draft),0);
  const sent=S.contests.filter(c=>["Terkirim","Menang","Tidak lolos"].includes(c.status)).length;
  return `<div class="stats"><div class="stat"><b>${S.pieces.length}</b><span>tulisan</span></div><div class="stat"><b>${words.toLocaleString("id-ID")}</b><span>kata di semua draf</span></div><div class="stat"><b>${act.length}</b><span>lomba dibidik</span></div><div class="stat"><b>${sent}</b><span>lomba diikuti</span></div></div>
  <div class="sec"><h2>Tenggat terdekat</h2><button class="btn sm" data-new="c">Tambah lomba</button></div>
  ${up.length?`<div class="list">${up.map(c=>{const n=days(c.deadline);return `<button class="row" data-c="${c.id}"><span><b>${esc(c.name)}</b><br><span class="meta">${esc(c.genre||"Semua genre")} · ${fmt(c.deadline)}</span></span><span class="chip ${n<=7?"hot":""}">${cd(n)}</span></button>`}).join("")}</div>`:`<div class="empty">Belum ada tenggat. Tambahkan lomba yang ingin kamu ikuti.</div>`}
  <div class="sec"><h2>Alur tulisan</h2><button class="btn sm" data-new="p">Tulisan baru</button></div>
  <div class="pipe">${STAGES.map(s=>{const ps=S.pieces.filter(p=>p.stage===s);return `<div class="col"><h3>${s}<small>${ps.length}</small></h3>${ps.map(pieceCard).join("")||'<div class="meta" style="padding:6px 4px">Kosong</div>'}</div>`}).join("")}</div>`;
}
function renderPieces(){
  const ps=S.pieces.filter(p=>!filter||p.stage===filter);
  return `<div class="sec"><h2>Tulisan</h2><span class="tools"><select id="flt" aria-label="Saring tahap" style="width:auto"><option value="">Semua tahap</option>${STAGES.map(s=>`<option ${filter===s?"selected":""}>${s}</option>`).join("")}</select><button class="btn ghost sm" id="exall">Ekspor ke Word</button><button class="btn sm" data-new="p">Tulisan baru</button></span></div>
  ${ps.length?`<div class="list">${ps.map(p=>`<button class="row" data-p="${p.id}"><span><b>${esc(p.title||"Tanpa judul")}</b><br><span class="meta">${esc(p.type)} · ${wc(p.draft)} kata${p.contestId?" · "+esc(cname(p.contestId)):""}</span></span><span class="chip">${p.stage} · ${prog(p)}%</span></button>`).join("")}</div>`:`<div class="empty">Belum ada tulisan di tahap ini. Mulai dari gagasan kecil: satu puisi atau satu adegan.</div>`}`;
}
function renderContests(){
  const cs=[...S.contests].sort((a,b)=>(a.deadline||"9").localeCompare(b.deadline||"9"));
  return `<div class="sec"><h2>Lomba</h2><button class="btn sm" data-new="c">Tambah lomba</button></div>
  ${cs.length?`<div class="list">${cs.map(c=>{const n=days(c.deadline),open=["Mengincar","Disiapkan"].includes(c.status);const ps=S.pieces.filter(p=>p.contestId===c.id);return `<button class="row" data-c="${c.id}"><span><b>${esc(c.name)}</b><br><span class="meta">${esc(c.genre||"Semua genre")} · ${fmt(c.deadline)}${ps.length?" · "+ps.map(p=>esc(p.title||"Tanpa judul")).join(", "):""}</span></span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><span class="chip ${c.status==="Menang"?"gold":""}">${c.status}</span>${open&&n!==null&&n>=0?`<span class="chip ${n<=7?"hot":""}">${cd(n)}</span>`:""}</span></button>`}).join("")}</div>`:`<div class="empty">Daftar lomba masih kosong. Catat nama, tenggat, dan tautan ketentuannya.</div>`}`;
}
function opts(arr,sel){return arr.map(a=>`<option ${a===sel?"selected":""}>${a}</option>`).join("")}
const items=p=>(PREP[p.type]||PREP.Lainnya).items;
const pv=p=>(p.prep[p.type]=p.prep[p.type]||{});
const prepDone=p=>items(p).filter((_,i)=>(pv(p)[i]||'').trim()).length;
const prepOK=p=>prepDone(p)===items(p).length;
const grow=el=>{el.style.height='auto';el.style.height=el.scrollHeight+'px'};
const subOf=b=>[b[1],b[3]!=null?(b[3]===b[4]?b[3]+'%':b[3]+'–'+b[4]+'%'):''].filter(Boolean).join(' · ');
function stats(){const p=ed;if(!p)return;const w=wc(p.draft),tg=+p.target,it=items(p),d=prepDone(p);
const a=$('#wc');if(a)a.textContent=w+' kata'+(tg?' dari '+nf(tg):'');
['#pc','#sc'].forEach(s=>{const el=$(s);if(el)el.textContent=d+'/'+it.length+' terisi'});
const g=$('#go');if(g)g.disabled=d<it.length;
it.forEach((b,i)=>{document.querySelectorAll('[data-pos="'+i+'"]').forEach(el=>{el.textContent=tg&&b[3]!=null?'≈ kata '+(b[3]===b[4]?nf(tg*b[3]/100):nf(tg*b[3]/100)+'–'+nf(tg*b[4]/100)):''});
const si=document.querySelector('.si[data-i="'+i+'"]');if(si)si.classList.toggle('cur',!!(tg&&b[3]!=null&&p.stage==='Menulis'&&w>=tg*b[3]/100&&w<=tg*b[4]/100))})}
function renderEditor(){const p=ed,st=p.stage,it=items(p),s=PREP[p.type]||PREP.Lainnya,v=pv(p);
const con=S.contests.find(c=>c.id===p.contestId);
const top=`<div class="edtop"><button class="btn ghost sm" id="back">← Kembali</button><span class="tools"><span class="wc" id="sv">Tersimpan</span><button class="btn ghost sm" id="exw">Ekspor ke Word</button><button class="btn ghost sm" id="hist">Riwayat versi</button><button class="btn danger sm" id="del">Hapus</button></span></div>
<input id="e-title" class="etitle serif" placeholder="Judul tulisan" value="${esc(p.title)}">
<div class="g3"><label>Jenis<select id="e-type">${opts(TYPES,p.type)}</select></label><label>Target jumlah kata<input id="e-target" type="number" min="0" value="${esc(p.target)}"></label><label>Untuk lomba<select id="e-contest"><option value="">Tidak ada</option>${S.contests.map(c=>`<option value="${c.id}" ${c.id===p.contestId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label></div>
<div class="stepper">${STAGES.map((x,i)=>`<button class="stp ${x===st?'on':''} ${x!=='Persiapan'&&st==='Persiapan'&&!prepOK(p)?'lock':''}" data-stage="${x}">${i+1}. ${x}</button>`).join('')}</div>`;
if(st==='Persiapan')return top+`<div class="prepbox"><h2 style="margin:0 0 4px">${s.title}</h2><p class="meta">${s.intro}</p><p class="meta">Baca ketentuan lomba lebih dulu. Semua butir harus terisi untuk membuka tahap menulis. Isi tanda “-” pada butir yang tidak relevan.</p>${it.map((b,i)=>`<div class="pi"><label><span class="bh"><b>${i+1}. ${b[0]}</b>${subOf(b)?`<span class="meta">${subOf(b)}</span>`:''}<span class="meta" data-pos="${i}"></span></span><span class="meta">${b[2]}</span><textarea data-b="${i}" data-grow rows="1">${esc(v[i]||'')}</textarea></label></div>`).join('')}<div class="pi"><label><span class="bh"><b>Catatan riset dan ide</b><span class="meta">opsional</span></span><textarea id="e-notes" data-grow rows="1">${esc(p.notes)}</textarea></label></div><div class="gate"><span id="pc"></span><button class="btn" id="go">Selesaikan persiapan, mulai menulis</button></div></div>`;
const side=`<aside class="side"><h3>Persiapan <span class="wc" id="sc"></span></h3>${con?`<p class="meta" style="margin:2px 0">Lomba: ${esc(con.name)}${con.deadline?' · '+fmt(con.deadline)+' ('+cd(days(con.deadline))+')':''}</p>`:''}<p class="meta" style="margin:2px 0 6px">${s.title}. Klik isian mana pun untuk merevisi. Perubahan tersimpan otomatis.</p>${it.map((b,i)=>`<div class="si" data-i="${i}"><label><span class="bh"><b>${i+1}. ${b[0]}</b><span class="meta" data-pos="${i}"></span></span><textarea data-b="${i}" data-grow rows="1" placeholder="${esc(b[2])}">${esc(v[i]||'')}</textarea></label></div>`).join('')}<div class="si"><label><b>Catatan riset dan ide</b><textarea id="e-notes" data-grow rows="1">${esc(p.notes)}</textarea></label></div></aside>`;
const chk=CHECKS[st]?`<div class="stg" style="margin-top:14px"><h4>Daftar periksa ${st.toLowerCase()}</h4>${CHECKS[st].map((t,i)=>`<label class="chk"><input type="checkbox" data-k="${st}:${i}" ${p.checks[st+':'+i]?'checked':''}>${t}</label>`).join('')}</div>`:'';
const nxt=st==='Menulis'?`<button class="btn" id="next" data-to="Editorial">Lanjut ke Editorial</button>`:st==='Editorial'?`<button class="btn" id="next" data-to="Terkirim">Tandai sudah terkirim</button>`:'';
const msg=st==='Menulis'?'Selesai menulis draf? Lanjutkan ke penyuntingan.':st==='Editorial'?'Sudah disunting dan dikirim?':'Tulisan ini ditandai terkirim. Siap diekspor ke Word.';
const main=`<section><div class="mh"><button class="btn ghost sm" id="tgl">${sideOpen?'Sembunyikan':'Tampilkan'} persiapan</button><span class="wc" id="wc"></span></div><textarea id="e-draft" class="draft" placeholder="Mulai menulis di sini…">${esc(p.draft)}</textarea>${chk}<div class="gate"><span class="meta">${msg}</span>${nxt}</div></section>`;
return top+`<div class="ed ${sideOpen?'':'nosb'}">${side}${main}</div>`}
function openContest(id){
  const c=id?{...S.contests.find(x=>x.id===id)}:{id:uid(),name:"",deadline:"",genre:"",link:"",status:"Mengincar",notes:""};
  const isNew=!id,d=$("#dlg");
  d.innerHTML=`<div class="dlg"><h2>${isNew?"Lomba baru":"Sunting lomba"}</h2>
  <label>Nama lomba<input id="c-name" value="${esc(c.name)}"></label>
  <div class="g2"><label>Tenggat<input id="c-dl" type="date" value="${esc(c.deadline)}"></label><label>Status<select id="c-st">${opts(CSTAT,c.status)}</select></label></div>
  <div class="g2"><label>Genre atau tema<input id="c-genre" value="${esc(c.genre)}" placeholder="Misalnya cerpen, tema lingkungan"></label><label>Tautan ketentuan<input id="c-link" type="url" value="${esc(c.link)}" placeholder="https://"></label></div>
  <label>Catatan (syarat, hadiah, jumlah kata)<textarea class="s" id="c-notes">${esc(c.notes)}</textarea></label>
  ${c.link&&/^https?:\/\//.test(c.link)?`<a href="${esc(c.link)}" target="_blank" rel="noopener">Buka halaman ketentuan</a>`:""}
  </div><div class="foot"><span>${isNew?"":'<button class="btn danger" id="del">Hapus</button>'}</span><span class="tools"><button class="btn ghost" id="cancel">Batal</button><button class="btn" id="ok">Simpan lomba</button></span></div>`;
  $("#cancel").onclick=()=>d.close();
  if(!isNew)$("#del").onclick=()=>{if(confirm("Hapus lomba ini?")){S.contests=S.contests.filter(x=>x.id!==id);S.pieces.forEach(p=>{if(p.contestId===id)p.contestId=""});save();d.close();render()}};
  $("#ok").onclick=()=>{
    c.name=$("#c-name").value.trim()||"Lomba tanpa nama";c.deadline=$("#c-dl").value;c.status=$("#c-st").value;c.genre=$("#c-genre").value.trim();c.link=$("#c-link").value.trim();c.notes=$("#c-notes").value;
    if(isNew)S.contests.push(c);else S.contests[S.contests.findIndex(x=>x.id===id)]=c;
    save();d.close();render();
  };
  d.showModal();
}

/* ---------- Ekspor Word ---------- */
const exportWord=(list,name)=>saveFile(name+'.docx',docxBlob(list));
function exportAll(){const l=S.pieces.filter(p=>(!filter||p.stage===filter)&&(p.draft||'').trim());if(!l.length){alert('Belum ada tulisan berdraf pada tahap ini.');return}exportWord(l,l.length===1?slug(l[0].title):'kumpulan-tulisan'+(filter?'-'+slug(filter):''))}

/* ---------- Render dan routing ---------- */
function render(){
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-current",String(b.dataset.v===view)));
  $("#main").innerHTML=view==="editor"?renderEditor():view==="dash"?renderDash():view==="pieces"?renderPieces():view==="guide"?renderGuide():view==="data"?renderData():renderContests();
  if(view==="editor"){document.querySelectorAll("textarea[data-grow]").forEach(grow);stats()}
  if(view==="data")hydrateData();
  renderFooter();
}
// Keluar dari editor: buang tulisan kosong, simpan snapshot, simpan data.
function finishEditor(){
  const p=ed;ed=null;if(!p)return;
  const empty=p.stage==='Persiapan'&&!p.title&&!(p.draft||'').trim()&&!(p.notes||'').trim()&&!Object.values(p.prep).some(o=>Object.values(o).some(x=>(x||'').trim()));
  if(empty)S.pieces=S.pieces.filter(x=>x!==p);else snapshot(p,'keluar');
  save();
}
function handleRoute(r){
  if(ed&&!(r.name==='editor'&&r.id===ed.id))finishEditor();
  if(r.name==='editor'){
    const p=S.pieces.find(x=>x.id===r.id);
    if(!p){navigate('pieces',{replace:true});return}
    if(ed!==p){ed=p;sideOpen=window.innerWidth>820}
    view='editor';
  }else view=r.name;
  render();window.scrollTo(0,0);renderBanner();
}
function newPiece(){const p={id:uid(),title:'',type:'Cerpen',stage:'Persiapan',target:'',draft:'',notes:'',contestId:'',checks:{},prep:{}};S.pieces.push(p);navigate('p/'+p.id)}
function setStage(s){const p=ed;if(p.stage==='Persiapan'&&s!=='Persiapan'&&!prepOK(p)){alert('Lengkapi semua butir persiapan dulu. Butir yang tidak relevan boleh diisi tanda “-”.');return}if(s!==p.stage)snapshot(p,'tahap');p.stage=s;save();render();window.scrollTo(0,0)}

document.addEventListener('input',e=>{if(view!=='editor'||!ed)return;const t=e.target,p=ed;
if(t.id==='e-title')p.title=t.value;else if(t.id==='e-target')p.target=t.value;else if(t.id==='e-draft')p.draft=t.value;else if(t.id==='e-notes'){p.notes=t.value;grow(t)}
else if(t.dataset&&t.dataset.b!==undefined){pv(p)[t.dataset.b]=t.value;grow(t)}else return;
markDirty(p.id);touch();stats()});
document.addEventListener('change',e=>{if(view!=='editor'||!ed)return;const t=e.target,p=ed;
if(t.id==='e-type'){p.type=t.value;save();render()}
else if(t.id==='e-contest'){p.contestId=t.value;save();render()}
else if(t.dataset&&t.dataset.k){p.checks[t.dataset.k]=t.checked;save()}});
document.addEventListener('click',e=>{if(view!=='editor'||!ed)return;const t=e.target.closest('button');if(!t)return;
if(t.id==='back')back('pieces');
else if(t.dataset.stage)setStage(t.dataset.stage);
else if(t.id==='go')setStage('Menulis');
else if(t.id==='next')setStage(t.dataset.to);
else if(t.id==='tgl'){sideOpen=!sideOpen;render()}
else if(t.id==='hist')openHistory(ed,()=>render());
else if(t.id==='del'){if(confirm('Hapus tulisan ini beserta riwayat versinya?')){const id=ed.id;S.pieces=S.pieces.filter(x=>x!==ed);ed=null;deleteFor(id);save();back('pieces')}}
else if(t.id==='exw'){if(!(ed.draft||'').trim()){alert('Draf masih kosong. Tulis dulu isinya sebelum diekspor.');return}exportWord([ed],slug(ed.title))}});
document.addEventListener("click",e=>{
  if(e.target.id==='exall'){exportAll();return}
  const t=e.target.closest("[data-v],[data-p],[data-c],[data-new]");if(!t)return;
  if(t.dataset.v)navigate(t.dataset.v);
  else if(t.dataset.p)navigate('p/'+t.dataset.p);
  else if(t.dataset.c)openContest(t.dataset.c);
  else if(t.dataset.new==="p")newPiece();
  else openContest();
});
document.addEventListener("change",e=>{if(e.target.id==="flt"){filter=e.target.value;render()}});

export function initViews(){initRouter(handleRoute)}
