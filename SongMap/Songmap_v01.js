
(()=>{
'use strict';
const NOTE_COLORS={C:'#E98788',D:'#E9A66F',E:'#E7D079',F:'#83CFA3',G:'#73C7C5',A:'#85A8EB',B:'#B39AE3'};
const ROOTS=['C','D','E','F','G','A','B'];
const KEY='songmap_v1_2026';
let nextId=1, selectedPartId=null, selectedNoteId=null, zoom=46, fit=false, undoStack=[], redoStack=[], noticeTimer=null;
const el=id=>document.getElementById(id);
const n=(pitch, bars, numerator=4)=>({id:uid(),pitch,beats:bars*numerator});
function uid(){return 'p'+(nextId++).toString(36)+'_'+Date.now().toString(36)}
function sample(){return{version:1,title:'Mi canción · ejemplo editable',bpm:125,numerator:4,denominator:4,sections:[
 {id:uid(),name:'INTRO',detail:'',notes:[n('A',4),n('C#',4)]},
 {id:uid(),name:'PUENTE',detail:'',notes:[n('A',4),n('E',4)]},
 {id:uid(),name:'VERSO 1',detail:'',notes:[n('A',4),n('C#',4),n('A',4),n('E',4)]},
 {id:uid(),name:'ESTRIBILLO',detail:'',notes:[n('E',4),n('G',4),n('A',4),n('C#',4)]},
 {id:uid(),name:'PUENTE',detail:'',notes:[n('A',4),n('E',4)]},
 {id:uid(),name:'VERSO 2',detail:'Variación del verso 1: primer cambio más tarde.',notes:[n('A',6),n('C#',2),n('A',4),n('E',4)]},
 {id:uid(),name:'ESTRIBILLO',detail:'',notes:[n('E',4),n('G',4),n('A',4),n('C#',4)]},
 {id:uid(),name:'OUTRO',detail:'',notes:[n('C#',4),n('A',4)]}
]}}
function fresh(){return{version:1,title:'Nueva canción',bpm:120,numerator:4,denominator:4,sections:[{id:uid(),name:'INTRO',detail:'',notes:[n('A',4)]}]}}
function validState(v){if(!v||!Array.isArray(v.sections)||v.sections.length<1||v.sections.length>250)throw Error('El archivo no contiene una estructura válida.');let numerator=Number(v.numerator),denominator=Number(v.denominator),bpm=Number(v.bpm);if(!Number.isInteger(numerator)||numerator<1||numerator>16||![2,4,8].includes(denominator)||!Number.isFinite(bpm)||bpm<30||bpm>300)throw Error('BPM o métrica no válidos.');let seen=new Set();const sections=v.sections.map(s=>{if(!s||!Array.isArray(s.notes)||!s.notes.length||s.notes.length>150)throw Error('Una parte tiene notas incorrectas.');let sn={id:uid(),name:String(s.name||'PARTE').slice(0,90),detail:String(s.detail||'').slice(0,300),notes:s.notes.map(t=>{let pitch=String(t.pitch||'').toUpperCase(), beats=Number(t.beats);if(!/^[A-G]#?$/.test(pitch)||!Number.isInteger(beats)||beats<1||beats>2000)throw Error('Nota o duración inválidas.');return{id:uid(),pitch,beats}})};return sn});let total=sections.reduce((sum,s)=>sum+sectionBeats(s),0);if(total>25000)throw Error('La canción es demasiado larga.');return{version:1,title:String(v.title||'Sin título').slice(0,100),bpm,numerator,denominator,sections}}
function sectionBeats(s){return s.notes.reduce((v,no)=>v+no.beats,0)}
function songBeats(){return state.sections.reduce((v,s)=>v+sectionBeats(s),0)}
function getSection(){return state.sections.find(s=>s.id===selectedPartId)||state.sections[0]}
function pitchColor(p){return NOTE_COLORS[p.replace('#','')]||'#aaa'}
function readableDuration(beats){const bars=Math.floor(beats/state.numerator),r=beats%state.numerator;return String(bars).padStart(2,'0')+' comp.'+(r?` + ${r} t.`:'')}
function shortDuration(beats){const bars=Math.floor(beats/state.numerator),r=beats%state.numerator;return `${String(bars).padStart(2,'0')}${r?'+'+r+'/'+state.numerator:''}`}
function durationMarkup(beats,classes=''){return `<span class="bar-duration ${classes}" title="${readableDuration(beats)}" aria-label="${readableDuration(beats)}">${shortDuration(beats)}</span>`}
function songLengthSeconds(){return (songBeats()*(4/state.denominator)*60)/state.bpm}
function timeString(seconds){const s=Math.round(seconds);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function load(){try{let data=localStorage.getItem(KEY);if(data)return validState(JSON.parse(data))}catch(e){}return sample()}
let state=load();selectedPartId=state.sections[0].id;
function snapshot(){undoStack.push(JSON.stringify(state));if(undoStack.length>70)undoStack.shift();redoStack=[]}
function mutate(cb){snapshot();cb();save();renderAll()}
function toast(message){const t=el('toast');t.textContent=message;t.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>t.classList.remove('visible'),2400)}
function confirmDialog(title,message,doit){el('dialog-title').textContent=title;el('dialog-text').textContent=message;el('dialog-backdrop').classList.add('open');el('dialog-confirm').onclick=()=>{el('dialog-backdrop').classList.remove('open');doit()};el('dialog-cancel').focus()}
function closeDialog(){el('dialog-backdrop').classList.remove('open')}
el('dialog-cancel').onclick=closeDialog;el('dialog-backdrop').addEventListener('click',e=>{if(e.target===el('dialog-backdrop'))closeDialog()});
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(state));state=JSON.parse(undoStack.pop());ensureSelection();save();renderAll();toast('Cambio deshecho')}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(state));state=JSON.parse(redoStack.pop());ensureSelection();save();renderAll();toast('Cambio rehecho')}
function ensureSelection(){if(!state.sections.find(s=>s.id===selectedPartId))selectedPartId=state.sections[0].id;const part=getSection();if(!part.notes.find(n=>n.id===selectedNoteId))selectedNoteId=null}
function htmlSafe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderTop(){if(document.activeElement!==el('song-title'))el('song-title').value=state.title;if(document.activeElement!==el('song-bpm'))el('song-bpm').value=state.bpm;if(document.activeElement!==el('song-numerator'))el('song-numerator').value=state.numerator;el('song-denominator').value=state.denominator;el('stats').innerHTML=`<div class="stat"><strong>${state.sections.length}</strong><small>partes</small></div><div class="stat"><strong>${shortDuration(songBeats())}</strong><small>compases</small></div><div class="stat"><strong>${timeString(songLengthSeconds())}</strong><small>duración aprox.</small></div><span class="stats-note"><b>CONSEJO</b> <span id="context-tip">Duplica una parte para crear una variación y ajusta sus notas.</span></span>`;el('btn-undo').disabled=!undoStack.length;}
function drawGrid(container,totalBars,px,majorEvery=4){let f=document.createDocumentFragment();for(let b=0;b<=Math.ceil(totalBars);b++){let line=document.createElement('span');line.className='gridline'+(b%majorEvery===0?' major':'');line.style.left=(b*px)+'px';f.appendChild(line)}container.appendChild(f)}
function effectiveZoom(){let b=songBeats()/state.numerator;return fit?Math.max(4,el('scroll-tracks').clientWidth/Math.max(b,1)):zoom}
function renderTimeline(){const totalBeats=songBeats(),bars=totalBeats/state.numerator,px=effectiveZoom(),innerWidth=Math.max(1,bars*px);el('timeline-canvas').style.width=innerWidth+'px';el('timeline-canvas').style.minWidth=innerWidth+'px';el('timeline-canvas').style.setProperty('--barwidth',px+'px');el('zoom-text').textContent=fit?'Auto':zoom+'px';el('zoom').disabled=fit;el('btn-fit').classList.toggle('primary',fit);
let ruler=el('ruler'),st=el('section-track'),nt=el('note-track');ruler.replaceChildren();st.replaceChildren();nt.replaceChildren();drawGrid(st,bars,px);drawGrid(nt,bars,px);
let step=px>=50?1:px>=25?2:px>=15?4:8;let frag=document.createDocumentFragment();for(let b=0;b<Math.ceil(bars);b+=step){let tick=document.createElement('div');tick.className='tick'+(b%4===0?' major':'');tick.style.left=(b*px)+'px';tick.style.width=step*px+'px';tick.textContent=b+1;frag.append(tick)}ruler.appendChild(frag);
let pos=0;state.sections.forEach((section,index)=>{let duration=sectionBeats(section);let start=pos/state.numerator*px;let width=duration/state.numerator*px;let btn=document.createElement('button');btn.className='part-block'+(index%2?' alt':'')+(selectedPartId===section.id?' selected':'');btn.type='button';btn.style.left=start+'px';btn.style.width=Math.max(width,1)+'px';btn.title=`${section.name}: ${readableDuration(duration)}. Compás ${1+pos/state.numerator}`+(section.detail?` · ${section.detail}`:'');btn.setAttribute('aria-label',btn.title);btn.innerHTML=`<span class="part-name">${htmlSafe(section.name)}</span>${durationMarkup(duration,'part-duration')}`;btn.onclick=()=>selectPart(section.id);st.appendChild(btn);if(index){const sep=document.createElement('div');sep.className='part-edge';sep.style.left=start+'px';st.appendChild(sep)}let noteOffset=pos;
section.notes.forEach(note=>{let nwidth=note.beats/state.numerator*px;let ne=document.createElement('button');ne.className='tone-block'+(selectedNoteId===note.id?' selected':'')+(nwidth<32?' too-small':'');ne.type='button';ne.style.left=(noteOffset/state.numerator*px)+'px';ne.style.width=Math.max(nwidth,1)+'px';ne.style.background=pitchColor(note.pitch);ne.title=`${section.name} · ${note.pitch} · ${readableDuration(note.beats)} · desde compás ${1+noteOffset/state.numerator}`;ne.setAttribute('aria-label',ne.title);ne.innerHTML=(nwidth>19?`<span class="pitch">${note.pitch}</span>`:'');ne.onclick=()=>selectPart(section.id,note.id);nt.appendChild(ne);noteOffset+=note.beats});pos+=duration});
}
function renderList(){let html='',offset=0;const totalBars=songBeats()/state.numerator;const unit=Math.max(10,Math.min(30,760/Math.max(totalBars,1)));const map=el('order-map');map.style.width=Math.max(100,totalBars*unit)+'%';map.style.width=Math.max(760,totalBars*unit)+'px';map.replaceChildren();state.sections.forEach((s,i)=>{let total=sectionBeats(s);const block=document.createElement('button');block.type='button';block.className='order-part'+(s.id===selectedPartId?' active':'');block.style.flex=`${total} 0 0`;block.style.flexBasis=(total/state.numerator*unit)+'px';block.style.setProperty('--unit',unit+'px');block.title=`${s.name} · ${readableDuration(total)} · desde compás ${Math.floor(offset/state.numerator)+1}`;block.innerHTML=`<span class="order-part-name">${htmlSafe(s.name)}</span>${durationMarkup(total,'order-part-bars')}<span class="order-part-tones">${s.notes.map(n=>`<i style="flex:${n.beats};background:${pitchColor(n.pitch)}"></i>`).join('')}</span>`;block.onclick=()=>selectPart(s.id);map.appendChild(block);html+=`<button type="button" class="part-item ${s.id===selectedPartId?'active':''}" data-part="${s.id}"><span class="item-index">${String(i+1).padStart(2,'0')}<span style="display:block;opacity:.65">${Math.floor(offset/state.numerator)+1}</span></span><span class="item-label" title="${htmlSafe(s.name)}">${htmlSafe(s.name)}</span>${durationMarkup(total,'item-bars')}<span class="item-notes">${s.notes.map(no=>`<span class="item-note" style="background:${pitchColor(no.pitch)};flex:0 0 ${no.beats/state.numerator*16}px" title="${no.pitch} · ${readableDuration(no.beats)}">${htmlSafe(no.pitch)}</span>`).join('')}</span><span class="item-chevron">›</span></button>`;offset+=total});el('section-list').innerHTML=html;el('section-list').querySelectorAll('[data-part]').forEach(x=>x.addEventListener('click',()=>selectPart(x.dataset.part)));
el('list-desc').textContent='Número pequeño: compás de entrada. Pulsar para editar.'}
function renderEditor(){const s=getSection(),i=state.sections.indexOf(s);el('editor-heading').textContent=s.name;el('editor-summary').innerHTML=`Parte ${i+1} de ${state.sections.length} · ${durationMarkup(sectionBeats(s))}`;const rows=s.notes.map((t,j)=>{let base=t.pitch.replace('#',''),sharp=t.pitch.endsWith('#'),bar=Math.floor(t.beats/state.numerator),rest=t.beats%state.numerator;return `<div class="note-editor-row" data-note="${t.id}"><span class="tone-index">${String(j+1).padStart(2,'0')}</span><div class="pitch-choice" style="border-left:4px solid ${pitchColor(t.pitch)}"><select aria-label="Nota tónica ${j+1}" data-action="pitch" data-note="${t.id}">${ROOTS.map(x=>`<option value="${x}" ${x===base?'selected':''}>${x}</option>`).join('')}</select><button type="button" class="sharp-toggle ${sharp?'active':''}" data-action="sharp" data-note="${t.id}" title="Alternar sostenido #" aria-label="Sostenido de nota ${j+1}">#</button></div><input class="tone-editor-num" type="number" step="1" min="0" max="256" value="${bar}" aria-label="Compases de nota ${j+1}" data-action="bars" data-note="${t.id}"><input class="tone-editor-num" type="number" step="1" min="0" max="${state.numerator-1}" value="${rest}" aria-label="Tiempos adicionales nota ${j+1}" data-action="remainder" data-note="${t.id}"><div class="note-actions"><button type="button" data-action="insert" data-note="${t.id}" title="Añadir una nota después">+</button><button type="button" class="delete" data-action="remove" data-note="${t.id}" title="Eliminar esta nota" ${s.notes.length===1?'disabled':''}>×</button></div></div>`}).join('');
el('editor-body').innerHTML=`<div class="editor-fields"><div class="field"><label for="part-name">Nombre de parte</label><input id="part-name" type="text" maxlength="90" value="${htmlSafe(s.name)}" autocomplete="off"></div><div class="field"><label for="part-bars">Compases totales</label><input id="part-bars" type="number" min="1" max="512" step="1" value="${Math.ceil(sectionBeats(s)/state.numerator)}" title="Cambiar duración: recorta o extiende el final de la parte"></div></div><div class="field" style="margin-top:10px"><label for="part-detail">Notas / indicaciones (opcional)</label><input id="part-detail" type="text" maxlength="300" placeholder="Ej.: verso corto, primera nota 6 compases..." value="${htmlSafe(s.detail)}"></div><p class="mini-hint">Cambios de nota dentro de la parte · <b>${s.notes.length}</b> bloques</p><div class="note-header"><span></span><span>NOTA</span><span>COMPASES</span><span>+ TIEMPOS</span><span></span></div><div id="note-edit-list">${rows}</div><button class="addtone" id="btn-add-tone">+ Añadir cambio de nota (1 compás)</button><div id="part-warning" class="message" style="${sectionBeats(s)%state.numerator?'':'display:none'}">Esta parte termina a mitad de compás (${sectionBeats(s)%state.numerator} tiempos adicionales). Comprueba si es intencionado.</div><div class="editor-actions"><button class="btn small" id="part-prev" ${i===0?'disabled':''}>← Mover</button><button class="btn small" id="part-next" ${i===state.sections.length-1?'disabled':''}>Mover →</button><button class="btn small" id="part-duplicate">Duplicar</button><button class="btn small danger" id="part-delete" ${state.sections.length===1?'disabled':''}>Eliminar</button></div><p class="helper" style="margin-bottom:0">Las duraciones de cada nota determinan la duración total de la parte. “+ tiempos” permite cambios dentro de un compás.</p>`;
el('part-name').onchange=e=>{let name=e.target.value.trim()||'PARTE';mutate(()=>{getSection().name=name})};el('part-detail').onchange=e=>{mutate(()=>{getSection().detail=e.target.value.slice(0,300)})};el('part-bars').onchange=e=>{let target=Math.round(Number(e.target.value));if(!Number.isFinite(target)||target<1||target>512){renderEditor();return}mutate(()=>resizePart(getSection(),target*state.numerator))};
el('note-edit-list').addEventListener('click',e=>{let node=e.target.closest('[data-action]');if(!node)return;let action=node.dataset.action,nid=node.dataset.note;if(action==='sharp'){mutate(()=>{let note=getSection().notes.find(n=>n.id===nid);note.pitch=note.pitch.endsWith('#')?note.pitch.slice(0,-1):note.pitch+'#';selectedNoteId=nid})}else if(action==='insert'){mutate(()=>{let s=getSection(),at=s.notes.findIndex(n=>n.id===nid);let newNote={id:uid(),pitch:s.notes[at].pitch,beats:state.numerator};s.notes.splice(at+1,0,newNote);selectedNoteId=newNote.id})}else if(action==='remove'){if(getSection().notes.length<2)return;mutate(()=>{let s=getSection();s.notes=s.notes.filter(n=>n.id!==nid);selectedNoteId=null})}});
el('note-edit-list').addEventListener('change',e=>{let node=e.target.closest('[data-action]');if(!node)return;let action=node.dataset.action,nid=node.dataset.note;if(!['pitch','bars','remainder'].includes(action))return;let old=getSection().notes.find(n=>n.id===nid);if(!old)return;if(action==='pitch'){mutate(()=>{old.pitch=node.value+(old.pitch.endsWith('#')?'#':'');selectedNoteId=nid});return}let value=Math.round(Number(node.value));if(!Number.isFinite(value)||value<0){renderEditor();return}let bars=Math.floor(old.beats/state.numerator),remaining=old.beats%state.numerator;if(action==='bars')bars=Math.min(value,256);else remaining=Math.min(value,state.numerator-1);let beats=bars*state.numerator+remaining;if(beats<1||beats>2000){toast('Cada cambio necesita al menos un tiempo y como máximo 2000');renderEditor();return}mutate(()=>{old.beats=beats;selectedNoteId=nid})});
el('btn-add-tone').onclick=()=>{mutate(()=>{let s=getSection();const last=s.notes[s.notes.length-1];let neo={id:uid(),pitch:last.pitch,beats:state.numerator};s.notes.push(neo);selectedNoteId=neo.id})};
el('part-prev').onclick=()=>movePart(-1);el('part-next').onclick=()=>movePart(1);el('part-duplicate').onclick=duplicatePart;el('part-delete').onclick=()=>{if(state.sections.length<=1)return;confirmDialog('Eliminar parte',`Se eliminará “${getSection().name}” y sus cambios de tónica.`,()=>{mutate(()=>{let i=state.sections.findIndex(s=>s.id===selectedPartId);state.sections.splice(i,1);selectedPartId=state.sections[Math.max(0,i-1)].id;selectedNoteId=null})})}}
function resizePart(part,targetBeats){let consumed=0;const result=[];for(let note of part.notes){if(consumed>=targetBeats)break;let left=targetBeats-consumed;let length=Math.min(note.beats,left);result.push({...note,beats:length});consumed+=length}if(consumed<targetBeats){result[result.length-1].beats+=targetBeats-consumed}part.notes=result}
function movePart(direction){mutate(()=>{let i=state.sections.findIndex(s=>s.id===selectedPartId);let item=state.sections.splice(i,1)[0];state.sections.splice(i+direction,0,item)})}
function duplicatePart(){mutate(()=>{let i=state.sections.findIndex(s=>s.id===selectedPartId),old=state.sections[i],copy={id:uid(),name:old.name+' (VAR.)',detail:old.detail,notes:old.notes.map(o=>({...o,id:uid()}))};state.sections.splice(i+1,0,copy);selectedPartId=copy.id;selectedNoteId=null});toast('Parte duplicada: ya puedes crear una variación')}
function addPart(){mutate(()=>{let i=state.sections.findIndex(s=>s.id===selectedPartId),s={id:uid(),name:'NUEVA PARTE',detail:'',notes:[n('A',4,state.numerator)]};state.sections.splice(i+1,0,s);selectedPartId=s.id;selectedNoteId=null});el('part-name').focus();el('part-name').select()}
function selectPart(pid,nid=null){selectedPartId=pid;selectedNoteId=nid;renderTimeline();renderList();renderEditor();if(nid){const item=el('editor-body').querySelector(`[data-note="${nid}"]`);if(item&&item.scrollIntoView){ // Only scroll when the selected note editor is outside the viewport.
const r=item.getBoundingClientRect();if(r.bottom>window.innerHeight-50||r.top<0)item.scrollIntoView({behavior:'smooth',block:'nearest'});
}}}
function renderAll(){ensureSelection();renderTop();renderTimeline();renderList();renderEditor();el('print-view').innerHTML=printMarkup()}
function formattedStart(beatOffset){let bar=Math.floor(beatOffset/state.numerator)+1,rem=beatOffset%state.numerator;return `${bar}${rem?' (tiempo '+(rem+1)+')':''}`}
// Composición compartida: PDF claro con timeline y PNG oscuro para móvil.
function exportComposition({dark=false,timeline=false}={}){
  const theme=dark
    ? {bg:'#0d1119',ink:'#f2f5fa',muted:'#a8b5c5',row:'#151b26',alt:'#202a38',line:'#303b4c',badge:'#0d1119',part:'#354154'}
    : {bg:'#ffffff',ink:'#172331',muted:'#536176',row:'#ffffff',alt:'#f5f7fa',line:'#dce2e9',badge:'#e9edf2',part:'#e9edf2'};
  const wrap=(value,limit)=>{
    const lines=[];
    let line='';
    for(const word of String(value).split(/\s+/)){
      if(line && line.length+word.length+1>limit){lines.push(line);line=''}
      for(let at=0;at<word.length;at+=limit){
        const chunk=word.slice(at,at+limit);
        if(at){if(line)lines.push(line);line=chunk}
        else line+=(line?' ':'')+chunk;
      }
    }
    if(line)lines.push(line);
    return lines.length?lines:[''];
  };
  const text=(x,y,value,size=12,fill=theme.ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${htmlSafe(value)}</text>`;
  const rect=(x,y,w,h,fill,rx=4,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
  const unit=16,gap=2,notesX=300;
  const width=Math.max(760,...state.sections.map(s=>notesX+sectionBeats(s)/state.numerator*unit+(s.notes.length-1)*gap+16));
  let y=30, content='';
  for(const line of wrap(state.title,55)){content+=text(0,y,line,25,theme.ink,'font-weight="700"');y+=31}
  content+=text(0,y+3,`${state.bpm} BPM · ${state.numerator}/${state.denominator} · ${shortDuration(songBeats())} compases · ${timeString(songLengthSeconds())} aprox.`,13,theme.muted);
  y+=42;
  if(timeline){
    content+=text(0,y,'LÍNEA DE TIEMPO',14,theme.ink,'font-weight="700"');
    y+=25;
    const bars=songBeats()/state.numerator, px=width/songBeats();
    const step=Math.max(1,Math.ceil(bars/(width/45)));
    for(let bar=0;bar<Math.ceil(bars);bar+=step){
      const x=bar*state.numerator*px;
      content+=text(x+2,y,bar+1,9,theme.muted);
      content+=`<path d="M ${x} ${y+5} v 78" stroke="${theme.line}"/>`;
    }
    let offset=0;
    for(const section of state.sections){
      const x=offset*px,w=sectionBeats(section)*px;
      content+=rect(x,y+7,Math.max(0.1,w-1),43,theme.part,3);
      const labelWidth=Math.max(0.1,w-5);
      const label=section.name;
      const fit=label.length*5.6>labelWidth?`textLength="${labelWidth}" lengthAdjust="spacingAndGlyphs"`:'';
      content+=text(x+2,y+22,label,10,theme.ink,`font-weight="700" ${fit}`);
      const duration=shortDuration(sectionBeats(section));
      content+=text(x+w/2,y+41,duration,Math.max(0.2,Math.min(10,(w-2)/duration.length)),theme.ink,'text-anchor="middle"');
      let noteOffset=offset;
      for(const note of section.notes){
        const nx=noteOffset*px,nw=note.beats*px;
        content+=rect(nx,y+54,Math.max(0.1,nw-0.5),26,pitchColor(note.pitch),2);
        content+=text(nx+nw/2,y+71,note.pitch,Math.max(0.2,Math.min(11,(nw-1)/note.pitch.length)),'#172331','text-anchor="middle" font-weight="700"');
        noteOffset+=note.beats;
      }
      offset+=sectionBeats(section);
    }
    y+=113;
  }
  content+=text(0,y,'ORDEN DE LAS PARTES',14,theme.ink,'font-weight="700"');
  y+=23;
  content+=text(12,y,'# / INICIO',10,theme.muted)+text(65,y,'PARTE',10,theme.muted)+text(247,y,'COMP.',10,theme.muted)+text(notesX,y,'TÓNICAS · COMPASES',10,theme.muted);
  y+=12;
  let offset=0;
  for(const [index,s] of state.sections.entries()){
    const names=wrap(s.name,23),details=s.detail?wrap(s.detail,28):[];
    const minHeight=dark?Math.max(64,Math.min(150,1080/state.sections.length)):58;
    const rowHeight=Math.max(minHeight,18+names.length*15+details.length*12);
    const center=y+rowHeight/2;
    content+=rect(0.5,y,width-1,rowHeight-4,index%2?theme.alt:theme.row,8,theme.line);
    content+=text(12,center-2,String(index+1).padStart(2,'0'),12,theme.muted)+text(12,center+13,formattedStart(offset),9,theme.muted);
    let nameY=center-(names.length*15+details.length*12)/2+11;
    for(const line of names){content+=text(65,nameY,line,12,theme.ink,'font-weight="700"');nameY+=15}
    for(const line of details){content+=text(65,nameY,line,10,theme.muted);nameY+=12}
    const total=shortDuration(sectionBeats(s));
    content+=rect(243,center-11,45,22,theme.badge,5)+text(265.5,center+4,total,Math.min(11,65/total.length),theme.ink,'text-anchor="middle"');
    let x=notesX;
    for(const note of s.notes){
      const w=note.beats/state.numerator*unit,duration=shortDuration(note.beats);
      const badgeWidth=Math.min(Math.max(0.5,w-1),Math.max(24,duration.length*6+8));
      content+=rect(x,center-21,w,42,pitchColor(note.pitch),3);
      content+=text(x+w/2,center-5,note.pitch,Math.max(0.2,Math.min(13,(w-1)/note.pitch.length)),'#172331','text-anchor="middle" font-weight="700"');
      content+=rect(x+(w-badgeWidth)/2,center,badgeWidth,16,theme.badge,3);
      content+=text(x+w/2,center+11,duration,Math.max(0.2,Math.min(10,(badgeWidth-0.5)/duration.length)),theme.ink,'text-anchor="middle"');
      x+=w+gap;
    }
    offset+=sectionBeats(s);
    y+=rowHeight;
  }
  return {width,height:y+12,content,background:theme.bg};
}
function printMarkup(){
  const layout=exportComposition({timeline:true});
  return `<svg xmlns="http://www.w3.org/2000/svg" class="print-song" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="xMidYMin meet" role="img" aria-label="${htmlSafe(state.title)}: timeline y orden de las partes" font-family="Arial, sans-serif"><title>${htmlSafe(state.title)}</title><rect width="100%" height="100%" fill="#fff"/>${layout.content}</svg>`;
}
function pngMarkup(){
  const layout=exportComposition({dark:true});
  const scale=Math.min(972/layout.width,1812/layout.height);
  const x=(1080-layout.width*scale)/2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" font-family="Arial, sans-serif"><rect width="1080" height="1920" fill="${layout.background}"/><g transform="translate(${x},54) scale(${scale})">${layout.content}</g></svg>`;
}
async function createPng(){
  const filename=safeFilename(state.title)+'_orden.png';
  const url=URL.createObjectURL(new Blob([pngMarkup()],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const image=new Image();
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('No se pudo preparar la imagen'));image.src=url});
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
    const context=canvas.getContext('2d');
    if(!context)throw Error('No se pudo crear la imagen');
    context.drawImage(image,0,0);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw Error('No se pudo generar el PNG');
    return new File([blob],filename,{type:'image/png'});
  }finally{URL.revokeObjectURL(url)}
}
const pngExport={file:null,url:null,generation:0,title:''};
function closePng(){
  pngExport.generation++;
  el('png-dialog').classList.remove('open');
  el('png-preview').removeAttribute('src');
  if(pngExport.url)URL.revokeObjectURL(pngExport.url);
  pngExport.file=null;pngExport.url=null;
  el('btn-png').focus();
}
async function openPng(){
  const generation=++pngExport.generation;
  const originTitle=state.title;
  el('png-dialog').classList.add('open');
  el('png-status').textContent='Preparando imagen…';
  el('png-download').disabled=true;el('png-share').disabled=true;
  el('png-close').focus();
  try{
    const file=await createPng();
    if(generation!==pngExport.generation)return;
    pngExport.file=file;pngExport.title=originTitle;pngExport.url=URL.createObjectURL(file);
    el('png-preview').src=pngExport.url;
    let shareable=false;
    try{shareable=Boolean(navigator.share && navigator.canShare && navigator.canShare({files:[file]}))}catch{}
    el('png-download').disabled=false;el('png-share').disabled=!shareable;
    el('png-status').textContent=shareable?'Elige WhatsApp en el menú de compartir de tu dispositivo.':'Descarga el PNG y adjúntalo en WhatsApp o WhatsApp Web.';
  }catch(error){if(generation===pngExport.generation)el('png-status').textContent=error.message+'; vuelve a intentarlo.'}
}
async function sharePng(){
  if(!pngExport.file)return;
  // El archivo ya está listo: share se invoca directamente desde el clic.
  try{await navigator.share({files:[pngExport.file],title:pngExport.title})}
  catch(error){if(error.name!=='AbortError')el('png-status').textContent='No se pudo compartir. Descarga el PNG y adjúntalo en WhatsApp.'}
}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function safeFilename(name){return name.trim().replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'cancion'}
function attach(){el('song-title').onchange=e=>mutate(()=>{state.title=e.target.value.trim()||'Sin título'});el('song-bpm').onchange=e=>{let v=Math.round(Number(e.target.value));if(v>=30&&v<=300)mutate(()=>state.bpm=v);else{renderTop();toast('Introduce un tempo entre 30 y 300 BPM')}};el('song-numerator').onchange=e=>{let v=Math.round(Number(e.target.value));if(v>=1&&v<=16){mutate(()=>{state.numerator=v});toast('La duración de las notas se mantiene en tiempos; revisa los compases')}else renderTop()};el('song-denominator').onchange=e=>mutate(()=>{state.denominator=Number(e.target.value)});
el('zoom').oninput=e=>{zoom=Number(e.target.value);fit=false;renderTimeline()};el('btn-fit').onclick=()=>{fit=!fit;renderTimeline()};window.addEventListener('resize',()=>{if(fit)renderTimeline()});el('btn-undo').onclick=undo;el('btn-add-part').onclick=addPart;el('btn-print').onclick=()=>{el('print-view').innerHTML=printMarkup();window.print()};el('btn-new').onclick=()=>confirmDialog('Crear canción nueva','Se sustituirá la estructura actual. Puedes exportar antes un JSON para recuperarla.',()=>{mutate(()=>{state=fresh();selectedPartId=state.sections[0].id;selectedNoteId=null;fit=false;zoom=46});el('zoom').value=zoom;toast('Canción nueva creada')});
el('btn-export').onclick=()=>{const data=JSON.stringify(state,null,2);downloadBlob(new Blob([data],{type:'application/json;charset=utf-8'}),safeFilename(state.title)+'_mapa.json');toast('Archivo JSON guardado')};el('btn-import').onclick=()=>el('import-file').click();el('import-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{let data=validState(JSON.parse(await file.text()));mutate(()=>{state=data;selectedPartId=state.sections[0].id;selectedNoteId=null});toast('Canción cargada')}catch(err){toast('Error: '+err.message)}e.target.value=''};
el('btn-png').onclick=openPng;
el('png-close').onclick=closePng;
el('png-dialog').onclick=e=>{if(e.target===el('png-dialog'))closePng()};
el('png-download').onclick=()=>{if(pngExport.file)downloadBlob(pngExport.file,pngExport.file.name)};
el('png-share').onclick=sharePng;
el('png-dialog').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const controls=[...el('png-dialog').querySelectorAll('button:not(:disabled)')];
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
document.addEventListener('keydown',e=>{let ctrl=e.ctrlKey||e.metaKey;if(ctrl&&e.key.toLowerCase()==='z'&&!e.altKey){const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA'].includes(tag))return;e.preventDefault();e.shiftKey?redo():undo()}if(e.key==='Escape'){if(el('png-dialog').classList.contains('open'))closePng();else closeDialog()}});}
window.addEventListener('beforeprint',()=>{el('print-view').innerHTML=printMarkup()});
attach();renderAll();
})();
