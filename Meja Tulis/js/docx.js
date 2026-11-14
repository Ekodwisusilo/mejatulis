// Pembuat berkas Word (.docx) tanpa library: zip sederhana + XML.
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0,n=0;
for(const k in files){n++;const nm=enc.encode(k),data=enc.encode(files[k]),c=crc(data);
const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(12,0x21,true);lh.setUint32(14,c,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,nm.length,true);
const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x21,true);ch.setUint32(16,c,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
parts.push(lh,nm,data);cd.push(ch,nm);off+=30+nm.length+data.length}
const size=cd.reduce((s,x)=>s+x.byteLength,0),end=new DataView(new ArrayBuffer(22));
end.setUint32(0,0x06054b50,true);end.setUint16(8,n,true);end.setUint16(10,n,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
return new Blob([...parts,...cd,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
const xe=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const run=t=>`<w:r><w:t xml:space='preserve'>${xe(t)}</w:t></w:r>`;
function paras(p){const lines=(p.draft||'').replace(/\r/g,'').split('\n');
if(p.type==='Puisi'){const out=[];let cur=[];const flush=()=>{if(cur.length){out.push(`<w:p><w:pPr><w:pStyle w:val='Puisi'/></w:pPr>${cur.map((l,i)=>(i?'<w:r><w:br/></w:r>':'')+run(l)).join('')}</w:p>`);cur=[]}};
lines.forEach(l=>{if(l.trim())cur.push(l);else flush()});flush();return out.join('')}
return lines.filter(l=>l.trim()).map(l=>`<w:p>${run(l.trim())}</w:p>`).join('')}
function docxBlob(list){const W="xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'",X="<?xml version='1.0' encoding='UTF-8' standalone='yes'?>";
const body=list.map((p,i)=>`<w:p><w:pPr><w:pStyle w:val='Title'/>${i?'<w:pageBreakBefore/>':''}</w:pPr>${run(p.title||'Tanpa judul')}</w:p>${paras(p)}`).join('');
const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
return zip({
'[Content_Types].xml':X+"<Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'><Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml'/><Default Extension='xml' ContentType='application/xml'/><Override PartName='/word/document.xml' ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'/><Override PartName='/word/styles.xml' ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml'/></Types>",
'_rels/.rels':X+"<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='"+R+"/officeDocument' Target='word/document.xml'/></Relationships>",
'word/_rels/document.xml.rels':X+"<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='"+R+"/styles' Target='styles.xml'/></Relationships>",
'word/styles.xml':X+`<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii='Times New Roman' w:hAnsi='Times New Roman' w:cs='Times New Roman'/><w:sz w:val='24'/><w:lang w:val='id-ID'/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after='120' w:line='360' w:lineRule='auto'/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type='paragraph' w:default='1' w:styleId='Normal'><w:name w:val='Normal'/></w:style><w:style w:type='paragraph' w:styleId='Title'><w:name w:val='Title'/><w:basedOn w:val='Normal'/><w:pPr><w:spacing w:before='0' w:after='360'/><w:jc w:val='center'/></w:pPr><w:rPr><w:b/><w:sz w:val='32'/></w:rPr></w:style><w:style w:type='paragraph' w:customStyle='1' w:styleId='Puisi'><w:name w:val='Puisi'/><w:basedOn w:val='Normal'/><w:pPr><w:spacing w:after='240' w:line='276' w:lineRule='auto'/></w:pPr></w:style></w:styles>`,
'word/document.xml':X+`<w:document ${W}><w:body>${body}<w:sectPr><w:pgSz w:w='11906' w:h='16838'/><w:pgMar w:top='1440' w:right='1440' w:bottom='1440' w:left='1440' w:header='708' w:footer='708' w:gutter='0'/></w:sectPr></w:body></w:document>`})}
export {docxBlob};
