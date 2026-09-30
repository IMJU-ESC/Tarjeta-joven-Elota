(function () {
  'use strict';
  const KEY = 'tarjeta-joven-demo:v1';
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const seed = window.TJ_DEMO;
  const day = seed.day;
  const icons = {
    card:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M7 14h4M15 14h2"/>',
    store:'<path d="m3 9 2-5h14l2 5M4 10v10h16V10M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-7h6v7"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    settings:'<path d="m9 3-.8 3-2.7 1-2.8-.7-1 3L4 11v3l-2.3 1.7 1 3 2.8-.7 2.7 1 .8 3h4l.8-3 2.7-1 2.8.7 1-3L18 14v-3l2.3-1.7-1-3-2.8.7-2.7-1L13 3z"/><circle cx="11" cy="13" r="3"/>',
    reset:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',
    qr:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h3v3h3v3h-6M12 3v6M3 12h6M12 12h3M12 18v3M21 12v3"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a5 5 0 0 0-4-5"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 6v3M15 12v1M15 16v2"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V3h8v4M3 13h18M10 13v3h4v-3"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="2.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-5"/>',
    search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    chart:'<path d="M3 3v18h18M7 16v-5M12 16V7M17 16V3"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M3 16v5h18v-5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/>',
    trophy:'<path d="M8 3h8v8a4 4 0 0 1-8 0zM8 5H3v3a5 5 0 0 0 5 5M16 5h5v3a5 5 0 0 1-5 5M12 15v5M8 21h8"/>',
    history:'<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l4 2"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
    link:'<path d="m9 15 6-6M7 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M17 7l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
    file:'<path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h6"/>',
    coffee:'<path d="M3 9h13v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM16 9h2a3 3 0 0 1 0 6h-2M6 3v3M10 2v4M14 3v3"/>',
    sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM3 3h3M4.5 1.5v3"/>',
    edit:'<path d="m16 3 5 5-13 13H3v-5zM13 6l5 5"/>',
    trash:'<path d="M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7M14 10v7"/>',
    home:'<path d="m3 10 9-7 9 7v11H3zM9 21v-8h6v8"/>',
    palette:'<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4 2 2 0 0 1 1-4h2a3 3 0 0 0 3-3c0-4-4-7-9-7"/><circle cx="7" cy="10" r=".6"/><circle cx="10" cy="6" r=".6"/><circle cx="15" cy="6" r=".6"/>'
  };
  const ico = name => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(icons[name] || icons.card)+'</svg>';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => String(name || 'TJ').trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const dateText = value => { const d = new Date(value.length===10?value+'T12:00:00':value); return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}); };
  const shortDate = value => { const d = new Date(value); return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('es-MX',{day:'numeric',month:'short'}); };
  const age = birth => { const d = new Date(birth+'T12:00:00'), now = new Date(); let n = now.getFullYear()-d.getFullYear(); if(now.getMonth()<d.getMonth() || (now.getMonth()===d.getMonth() && now.getDate()<d.getDate())) n--; return n; };
  const id = prefix => prefix+'-'+(window.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2,9));
  let toastTimer, cameraStream, cameraFrame, scannerPromise;
  let state = loadState();
  const ui = {yTab:'beneficios',bTab:'validar',aTab:'resumen',couponSearch:'',category:'Todos',jobSearch:'',directorySearch:'',adminSearch:'',directoryMode:'lista',mapBusiness:1,validatedYouth:null,selectedCoupon:'',scannerError:'',lastValidation:null,reportFrom:'',reportTo:''};
  applyQueryBrand();

  function validState(s) {
    return s?.version===1 && s.brand && ['youths','businesses','coupons','jobs','visits','applications','announcements','audit','readAnnouncements','explored'].every(k=>Array.isArray(s[k])) && s.youths.length>0 && s.businesses.length>0;
  }
  function loadState() {
    try {const s=JSON.parse(localStorage.getItem(KEY)||'null');if(validState(s)) {s.brand=cleanBrand(s.brand);return s;}}
    catch {}
    return seed.createState();
  }
  function cleanBrand(b) {
    const result={...seed.defaultBrand};
    for(const field of ['municipio','program','institute']) if(typeof b[field]==='string' && b[field].trim()) result[field]=b[field].trim().slice(0,90);
    for(const field of ['primary','accent']) if(/^#[a-f\d]{6}$/i.test(b[field]||'')) result[field]=b[field];
    for(const field of ['governmentLogo','instituteLogo']) if(typeof b[field]==='string' && /^data:image\/(png|jpeg|webp);base64,/.test(b[field]) && b[field].length<160000) result[field]=b[field];
    return result;
  }
  function applyQueryBrand() {
    const params=new URLSearchParams(location.search), b={...state.brand};
    for(const [query,field] of [['municipio','municipio'],['programa','program'],['instituto','institute'],['color','primary'],['acento','accent']]) if(params.has(query)) b[field]=params.get(query);
    state.brand=cleanBrand(b);
  }
  function persist() {
    try {localStorage.setItem(KEY,JSON.stringify(state));return true;}
    catch {toast('Los cambios funcionan en esta sesión, pero el navegador no pudo guardarlos.');return false;}
  }
  function log(text) {state.audit.unshift({id:id('log'),date:new Date().toISOString(),text});state.audit=state.audit.slice(0,80);}
  function toast(message) {const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4600);}
  function youth() {return state.youths.find(y=>y.id===Number(state.currentYouth)) || state.youths[0];}
  function business() {return state.businesses.find(b=>b.id===Number(state.currentBusiness)) || state.businesses[0];}
  function businessFor(c) {return state.businesses.find(b=>b.id===Number(c.businessId));}
  function visitsFor(y) {return state.visits.filter(v=>v.youthId===y.id);}
  function levelFor(y) {const count=visitsFor(y).length;return count>=6?'Oro':count>=3?'Plata':'Clásica';}
  function rank(level) {return {'Clásica':1,'Plata':2,'Oro':3}[level] || 1;}
  function couponIssue(c,y,checkBusiness=true) {
    if(!y || y.status!=='Activa') return 'La tarjeta no está activa.';
    if(age(y.birth)<12 || age(y.birth)>29) return 'La tarjeta está fuera del rango de edad.';
    if(c.status!=='Activa') return 'Este beneficio está pausado.';
    if(checkBusiness && businessFor(c)?.status!=='Activo') return 'El negocio no está activo.';
    if(c.end<day()) return 'La vigencia de este beneficio terminó.';
    const weekday = new Date().getDay();
    if(c.days==='Lunes a viernes' && (weekday===0 || weekday===6)) return 'Válido de lunes a viernes.';
    if(c.days==='Lunes a sábado' && weekday===0) return 'Válido de lunes a sábado.';
    if(rank(levelFor(y))<rank(c.level)) return 'Disponible al llegar al nivel '+c.level+'.';
    if(c.unique && state.visits.some(v=>v.youthId===y.id && v.couponId===c.id)) return 'Ya utilizaste este beneficio de uso único.';
    return '';
  }
  function route() {
    let r=(location.hash.slice(1) || location.pathname || '/').split('?')[0].replace(/\/$/,'') || '/';
    if(r.endsWith('index.html')) r='/';
    if(r==='/panel-imju-elota') r='/panel';
    return r;
  }
  function navigate(path) {
    closeModal();
    if(route()===path) {render();window.scrollTo(0,0);}
    else location.hash=path;
  }
  function contrast(color) {
    const rgb=color.match(/[a-f\d]{2}/gi)?.map(x=>parseInt(x,16)/255) || [0,0,0];
    const v=rgb.map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
    return (v[0]*.2126+v[1]*.7152+v[2]*.0722)>.179?'#172226':'#ffffff';
  }
  function applyBrand() {
    const b=state.brand;
    for(const [key,value] of Object.entries({'--brand':b.primary,'--accent':b.accent,'--brand-ink':contrast(b.primary),'--accent-ink':contrast(b.accent)})) document.documentElement.style.setProperty(key,value);
    document.title=b.program+' · '+b.municipio+' · Demo';
    document.querySelector('meta[name="theme-color"]').content=b.primary;
  }
  function button(action,label,icon='',style='primary',extra='') {return `<button type="button" class="button ${style}" data-action="${esc(action)}" ${extra}>${icon?ico(icon):''}${esc(label)}</button>`;}
  function link(path,label,icon='',style='primary') {return `<a class="button ${style}" href="#${path}">${icon?ico(icon):''}${esc(label)}</a>`;}
  function empty(title,description,icon='ticket') {return `<div class="empty">${ico(icon)}<h3>${esc(title)}</h3><p class="small">${esc(description)}</p></div>`;}
  function statusBadge(s) {const c=['Activa','Activo','Aprobada'].includes(s)?'green':s==='Pendiente'?'yellow':s==='Suspendida' || s==='Rechazada'?'red':'outline';return `<span class="badge ${c}">${esc(s)}</span>`;}
  function avatar(y,classes='') {return `<span class="avatar ${classes}">${y.photo?`<img src="${esc(y.photo)}" alt="Foto de perfil de ejemplo">` : esc(initials(y.name))}</span>`;}
  function businessMark(b) {return `<span class="business-mark">${b?.logo?`<img src="${esc(b.logo)}" alt="">`:esc(b?.initials || initials(b?.name))}</span>`;}
  function qr(y) {
    try {const q=window.qrcode(0,'M');q.addData(y.code);q.make();return q.createSvgTag({cellSize:4,margin:4,scalable:true});}
    catch {return '<span>QR no disponible</span>';}
  }
  function card(y,preview=false) {
    const b=state.brand;
    return `<div class="identity-card ${preview?'preview':''}">
      <div class="card-top"><div class="card-wordmark">${esc(b.program)}<span>${esc(b.municipio)}</span></div>${b.instituteLogo?`<img class="card-institute-logo" src="${esc(b.instituteLogo)}" alt="${esc(b.institute)}">`:'<div class="card-symbol" aria-hidden="true">TJ.</div>'}</div>
      <div class="card-member">${avatar(y)}<div><small>Una ciudad de posibilidades</small><strong>${esc(y.name)}</strong><p>${age(y.birth)} años · ${esc(y.locality)}</p></div></div>
      <div class="card-bottom"><div><div class="level-label">${ico('sparkle')} Nivel ${esc(levelFor(y))}</div><p class="card-code spacer-sm">${esc(y.code)}</p></div><button type="button" class="qr-block" data-action="qr" data-id="${y.id}" aria-label="Ampliar QR de ${esc(y.name)}">${qr(y)}</button></div><span class="demo-watermark">DEMOSTRACIÓN</span>
    </div>`;
  }
  function header(r) {
    const b=state.brand, role=r==='/portal-negocios'?'Negocios':'Jóvenes';
    const unread=state.announcements.filter(a=>(a.audience==='Todos'||a.audience===role)&&!state.readAnnouncements.includes(role+':'+a.id)).length;
    const links=[['/tarjeta','Mi tarjeta','card'],['/directorio','Aliados','pin'],['/portal-negocios','Negocio','store'],['/panel','Administración','grid']];
    return `<div class="demo-strip"><div class="demo-label"><strong>DEMO INTERACTIVA</strong><span>Datos de ejemplo</span></div><div class="strip-actions"><button data-action="brand">${ico('palette')} Personalizar</button><button data-action="reset">${ico('reset')} Reiniciar</button></div></div>
    <header class="header"><div class="header-inner"><a class="brand" href="#/" aria-label="Inicio de la demo"><span class="brand-icon">${b.instituteLogo?`<img src="${esc(b.instituteLogo)}" alt="">`:'TJ.'}</span><div class="brand-text"><strong>${esc(b.program)}</strong><span>${esc(b.municipio)}</span></div></a>
    <nav class="topnav" aria-label="Experiencias de la demo">${links.map(([path,label,icon])=>`<a class="navlink ${r===path?'active':''}" href="#${path}" ${r===path?'aria-current="page"':''}>${ico(icon)}${label}</a>`).join('')}</nav>
    <div class="header-tools">${b.governmentLogo?`<img class="gov-logo" src="${esc(b.governmentLogo)}" alt="Logo del Ayuntamiento">`:''}<button class="icon-button" data-action="notices" aria-label="Avisos${unread?', '+unread+' sin leer':''}">${ico('bell')}${unread?`<span class="notif-count">${unread}</span>`:''}</button></div></div></header>`;
  }
  function footer() {return `<footer class="footer"><span>${esc(state.brand.institute)} · ${esc(state.brand.municipio)}</span><div class="row"><span>Demostración · Sin trámites reales</span><button class="text-button" data-action="about">Cómo funciona la demo</button></div></footer>`;}
  function pageTop(kicker,title,description='',controls='') {return `<div class="page-top"><div><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1>${description?`<p class="muted">${esc(description)}</p>`:''}</div>${controls?`<div class="page-top-controls">${controls}</div>`:''}</div>`;}
  function home() {
    return `<main id="main" class="wrap landing view-enter"><div class="landing-grid"><section><div class="eyebrow">${ico('sparkle')} Una tarjeta. Más oportunidades.</div><h1>Así se vive la<br><em>${esc(state.brand.program)}.</em></h1><p class="landing-lead">Acerca los beneficios, el comercio local y las oportunidades a los jóvenes de ${esc(state.brand.municipio)}. Pruébalo desde cada lado.</p><div class="row" style="flex-wrap:wrap">${link('/tarjeta','Probar mi tarjeta','card','dark')}${button('brand','Ver con tu marca','palette','secondary')}</div><p class="demo-step">${ico('shield')} Acceso libre · Sin crear cuentas · Datos de ejemplo</p></section><div class="card-stage">${card(youth(),true)}<div class="stage-caption">${ico('ticket')}<div><strong>Una visita que se convierte en un beneficio.</strong><p>Muestra tu QR, valida y sigue descubriendo.</p></div></div></div></div>
    <div class="experience-grid">
      <article class="experience"><div class="experience-icon">${ico('card')}</div><h2>Vívelo como joven</h2><p>Tu tarjeta digital, beneficios cerca de ti, vacantes y un nivel que crece con cada visita.</p>${link('/tarjeta','Entrar como joven','user','secondary')}</article>
      <article class="experience"><div class="experience-icon">${ico('store')}</div><h2>Conecta como negocio</h2><p>Valida tarjetas, publica promociones y descubre quién aprovecha tus beneficios.</p>${link('/portal-negocios','Entrar como negocio','store','secondary')}</article>
      <article class="experience"><div class="experience-icon">${ico('grid')}</div><h2>Gestiona tu municipio</h2><p>Aprueba solicitudes, administra aliados y observa los resultados del programa.</p>${link('/panel','Entrar a administración','grid','secondary')}</article>
    </div><div class="landing-bottom"><p>¿Quieres ver el recorrido desde el inicio? Solicita una tarjeta de prueba y apruébala desde administración.</p>${link('/login','Simular registro','plus','secondary')}</div></main>`;
  }
  function profileSelect(kind) {
    const list=kind==='youth'?state.youths:state.businesses;
    const current=kind==='youth'?state.currentYouth:state.currentBusiness;
    return `<label class="sr-only" for="profile-select">Perfil de prueba</label><select id="profile-select" class="profile-select" data-select="${kind}">${list.map(p=>`<option value="${p.id}" ${Number(current)===p.id?'selected':''}>${esc(p.name)}${['Activa','Activo'].includes(p.status)?'':' · '+esc(p.status)}</option>`).join('')}</select>`;
  }
  function tabs(active,items,group) {return `<nav class="tabs" aria-label="Secciones">${items.map(([key,label,icon])=>`<button class="tab ${active===key?'active':''}" data-action="tab" data-group="${group}" data-tab="${key}" ${active===key?'aria-current="page"':''}>${ico(icon)}${label}</button>`).join('')}</nav>`;}
  function youthPage() {
    const y=youth(), n=visitsFor(y).length, next=n>=6?6:n>=3?6:3, currentLevel=levelFor(y), target=n>=3?'Oro':'Plata';
    let main='';
    if(y.status!=='Activa') return `<main id="main" class="wrap">${pageTop('Experiencia joven','Tu tarjeta de prueba', '',profileSelect('youth'))}<div class="panel form-shell"><div class="success-hero">${ico('card')}<h3>${y.status==='Pendiente'?'Tu solicitud está en revisión':y.status==='Suspendida'?'Tarjeta suspendida':'Solicitud no aprobada'}</h3><p>${y.status==='Pendiente'?'Ahora puedes ir a administración y aprobar la solicitud para ver tu tarjeta activa.':'Cambia el estado desde administración o elige otro perfil de prueba.'}</p>${link('/panel','Ver solicitudes','grid','primary')}</div></div></main>`;
    if(ui.yTab==='beneficios') main=youthCoupons();
    else if(ui.yTab==='empleos') main=youthJobs();
    else if(ui.yTab==='directorio') main=directoryList();
    else main=youthHistory(y);
    return `<main id="main" class="wrap view-enter">${pageTop('Experiencia joven','Hola, '+y.name.split(' ')[0]+'.','Tu próximo beneficio está aquí.',profileSelect('youth'))}<div class="youth-layout"><aside class="youth-sidebar"><div class="card-holder">${card(y)}<div class="card-actions">${button('qr','Mi QR','qr','dark',`data-id="${y.id}"`)}${button('youth-profile','Perfil','user','secondary')}</div></div><div class="panel progress-panel"><div class="row spread"><strong class="small">Tu siguiente nivel</strong><span class="badge brand">${esc(currentLevel)}</span></div><div class="progress-track" role="progressbar" aria-label="Visitas hacia el nivel Oro" aria-valuenow="${Math.min(n,6)}" aria-valuemin="0" aria-valuemax="6"><span style="width:${Math.min(n/6*100,100)}%"></span></div><div class="level-stops"><span>Clásica</span><span>Plata · 3</span><span>Oro · 6</span></div><p class="small muted spacer-sm">${n>=6?'Llegaste al nivel Oro. Sigue explorando tus beneficios.':`Te faltan ${next-n} visita${next-n===1?'':'s'} para llegar a ${target}.`}</p><div class="mini-stat">${ico('pin')}<div><strong>${n}</strong><p>Visitas registradas</p></div></div><div class="divider"></div><button class="text-button" data-action="missions">${ico('trophy')} Misiones y logros</button></div><p class="note">Tu perfil y tus pruebas se conservan en este navegador. Puedes reiniciar cuando quieras.</p></aside><section class="youth-main">${tabs(ui.yTab,[['beneficios','Beneficios','ticket'],['empleos','Empleos','briefcase'],['directorio','Aliados','pin'],['historial','Historial','history']],'y')}${main}</section></div><p class="print-note">Tarjeta de demostración. No es una credencial municipal válida.</p></main>`;
  }
  function filterBar(searchId,searchValue,placeholder,category=false) {
    return `<div class="filterbar"><label class="search">${ico('search')}<span class="sr-only">${esc(placeholder)}</span><input id="${searchId}" class="field-control" data-search="${searchId}" value="${esc(searchValue)}" placeholder="${esc(placeholder)}" maxlength="80"></label>${category?`<label><span class="sr-only">Categoría</span><select class="field-control" data-select="category">${['Todos','Alimentos','Salud','Deporte','Educación','Entretenimiento','Servicios'].map(v=>`<option ${ui.category===v?'selected':''}>${v}</option>`).join('')}</select></label>`:''}</div>`;
  }
  function couponCard(c) {
    const b=businessFor(c), issue=couponIssue(c,youth()), locked=rank(levelFor(youth()))<rank(c.level);
    if(!b) return '';
    return `<article class="coupon"><div class="coupon-art" style="--coupon-bg:${esc(b.color)}35"><div class="coupon-business">${businessMark(b)} ${esc(b.name)}</div><div class="coupon-value">${esc(c.benefit)}</div>${ico(c.category==='Alimentos'?'coffee':c.category==='Salud'?'eye':c.category==='Deporte'?'trophy':c.category==='Educación'?'file':'ticket')}</div><div class="coupon-body"><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="coupon-meta"><span class="badge outline">${esc(c.category)}</span><span class="badge ${locked?'yellow':'brand'}">Nivel ${esc(c.level)}</span>${c.unique?'<span class="badge outline">Uso único</span>':''}</div><div class="coupon-foot"><small>Vigencia: ${dateText(c.end)}</small>${button('coupon',locked?'Ver beneficio':issue?'Ver condiciones':'Usar cupón','',locked?'secondary small':'primary small',`data-id="${esc(c.id)}"`)}</div></div></article>`;
  }
  function youthCoupons() {
    const list=state.coupons.filter(c=>c.status==='Activa'&&businessFor(c)?.status==='Activo'&&(ui.category==='Todos'||c.category===ui.category)&&[c.title,c.description,businessFor(c)?.name,c.category].join(' ').toLowerCase().includes(ui.couponSearch.toLowerCase()));
    return `${filterBar('couponSearch',ui.couponSearch,'Buscar un beneficio o negocio',true)}<div class="coupon-grid">${list.length?list.map(couponCard).join(''):empty('No hay beneficios con esa búsqueda','Prueba otra categoría o publica una promoción desde el negocio.')}</div>`;
  }
  function youthJobs() {
    const list=state.jobs.filter(j=>j.status==='Activa'&&businessFor(j)?.status==='Activo'&&[j.title,j.description,businessFor(j)?.name].join(' ').toLowerCase().includes(ui.jobSearch.toLowerCase()));
    return `${filterBar('jobSearch',ui.jobSearch,'Buscar una oportunidad')}<p class="note spacer-sm" style="margin-bottom:18px">Las vacantes y los sueldos son ejemplos. Puedes simular el envío de interés sin contactar a una empresa.</p><div class="stack">${list.length?list.map(j=>{const b=businessFor(j),applied=state.applications.some(a=>a.jobId===j.id&&a.youthId===youth().id);return `<article class="list-card" style="--card-color:${esc(b.color)}35">${businessMark(b)}<div class="list-content"><span class="small muted">${esc(b.name)}</span><h3>${esc(j.title)}</h3><div class="row"><span class="badge brand">${esc(j.salary)}</span><span class="badge outline">${esc(j.type)}</span></div><p>${esc(j.description)}</p><div class="list-actions">${button('job',applied?'Interés enviado':'Ver vacante','briefcase',applied?'secondary small':'primary small',`data-id="${esc(j.id)}"`)}</div></div></article>`;}).join(''):empty('Todavía no hay vacantes aquí','Prueba otra búsqueda o crea una vacante en el portal de negocios.','briefcase')}</div>`;
  }
  function youthHistory(y) {
    const list=visitsFor(y).slice().sort((a,b)=>b.date.localeCompare(a.date));
    return `<div class="panel"><div class="panel-top"><div><h2>Tu recorrido</h2><p class="small muted">Cada visita validada cuenta para tu nivel.</p></div><span class="badge brand">${list.length} visitas</span></div>${list.length?list.map(v=>`<div class="timeline-row"><div class="timeline-date">${shortDate(v.date)}</div><div class="timeline-content"><h3>${esc(state.businesses.find(b=>b.id===v.businessId)?.name || 'Negocio')}</h3><p>${esc(v.couponTitle)}</p></div><span class="badge green" style="margin-left:auto">Validada</span></div>`).join(''):empty('Aquí empieza tu recorrido','Prueba un cupón y valida tu tarjeta en el portal de negocios.','history')}</div>`;
  }
  function directoryList() {
    const list=state.businesses.filter(b=>b.status==='Activo'&&[b.name,b.category,b.address].join(' ').toLowerCase().includes(ui.directorySearch.toLowerCase()));
    const controls=`<div class="row"><button class="button ${ui.directoryMode==='lista'?'dark':'secondary'} small" data-action="directory-mode" data-mode="lista">Lista</button><button class="button ${ui.directoryMode==='mapa'?'dark':'secondary'} small" data-action="directory-mode" data-mode="mapa">${ico('pin')} Mapa</button></div>`;
    return `${filterBar('directorySearch',ui.directorySearch,'Buscar un aliado')}<div class="row spread" style="margin-bottom:18px"><span class="small muted">${list.length} negocios aliados de ejemplo</span>${controls}</div>${ui.directoryMode==='mapa'?`<div class="map-layout"><div class="demo-map"><div class="map-grid"></div><div class="map-water"></div><span class="map-center">CENTRO</span>${list.map(b=>`<button class="map-pin ${ui.mapBusiness===b.id?'selected':''}" style="left:${b.mapX}%;top:${b.mapY}%" data-action="map-pin" data-id="${b.id}" aria-label="Ver ${esc(b.name)}">${esc(b.initials)}</button>`).join('')}<div class="map-caption">Mapa ilustrativo. Ubicaciones y direcciones ficticias.</div></div><div>${list.length?businessCard(list.find(b=>b.id===ui.mapBusiness)||list[0]):empty('Sin coincidencias','Prueba otra búsqueda.','pin')}</div></div>`:`<div class="grid-2">${list.length?list.map(businessCard).join(''):empty('Sin coincidencias','Prueba otro nombre o categoría.','store')}</div>`}`;
  }
  function businessCard(b) {
    const count=state.coupons.filter(c=>c.businessId===b.id&&c.status==='Activa'&&c.end>=day()).length;
    return `<article class="business-card" style="--card-color:${esc(b.color)}35"><div class="row">${businessMark(b)}<div><h3>${esc(b.name)}</h3><span class="small muted">${esc(b.category)}</span></div></div><p>${ico('pin')} ${esc(b.address)}</p><p>${ico('clock')} ${esc(b.schedule)}</p><p class="small">${count} beneficio${count===1?'':'s'} disponible${count===1?'':'s'}</p>${button('business-detail','Conocer negocio','store','secondary',`data-id="${b.id}"`)}</article>`;
  }
  function directoryPage() {return `<main id="main" class="wrap view-enter">${pageTop('Comunidad aliada','Descubre lo que hay cerca.','Un directorio que conecta a los jóvenes con el comercio local.',link('/login-negocio','Registrar negocio','plus','secondary'))}${directoryList()}</main>`;}
  function statCard(label,value,note,icon) {return `<div class="stat-card"><div class="stat-label">${esc(label)}${ico(icon)}</div><strong>${value}</strong><small>${esc(note)}</small></div>`;}
  function pendingCount() {return state.youths.filter(y=>y.status==='Pendiente').length+state.businesses.filter(b=>b.status==='Pendiente').length;}
  function sideNav(active,items,group) {return `<aside class="sidenav" aria-label="Secciones del panel">${items.map(([key,label,icon])=>`<button data-action="tab" data-group="${group}" data-tab="${key}" class="${active===key?'active':''}" ${active===key?'aria-current="page"':''}>${ico(icon)}${label}${key==='solicitudes'&&pendingCount()?`<span class="nav-count">${pendingCount()}</span>`:''}</button>`).join('')}<div class="side-note">Estás explorando un perfil de prueba. Todas las acciones se guardan en este navegador.</div></aside>`;}
  function businessPage() {
    const b=business();
    const top=pageTop('Portal de negocios',b.name,'Haz que cada visita cuente.',profileSelect('business')+button('business-profile','Editar perfil','edit','secondary small'));
    if(b.status!=='Activo') return `<main id="main" class="wrap">${top}<div class="panel form-shell">${empty('Negocio '+b.status.toLowerCase(),'Puedes revisar esta solicitud en administración o elegir otro negocio de prueba.','store')}${link('/panel','Ver administración','grid','primary')}</div></main>`;
    let content='';
    if(ui.bTab==='validar') content=scannerPage(b);
    else if(ui.bTab==='promociones') content=businessPromotions(b);
    else if(ui.bTab==='empleos') content=businessJobs(b);
    else content=businessStats(b);
    return `<main id="main" class="wrap view-enter">${top}<div class="dashboard">${sideNav(ui.bTab,[['validar','Validar tarjeta','qr'],['promociones','Mis promociones','ticket'],['empleos','Mis vacantes','briefcase'],['resultados','Mis resultados','chart']],'b')}<section>${content}</section></div></main>`;
  }
  function scannerPage(b) {
    const y=state.youths.find(y=>y.id===ui.validatedYouth);
    const options=state.coupons.filter(c=>c.businessId===b.id&&c.status==='Activa'&&c.end>=day());
    const issue=y&&ui.selectedCoupon?couponIssue(state.coupons.find(c=>c.id===ui.selectedCoupon)||{status:'Pausada'},y):'';
    let result=empty('Lista para la siguiente visita','Valida un QR o usa el perfil de prueba para ver la tarjeta.','card');
    if(ui.lastValidation) result=`<div class="scan-result"><div class="scan-valid">${ico('check')} Visita registrada</div><h3>${esc(ui.lastValidation.name)}</h3><p class="small muted spacer-sm">${esc(ui.lastValidation.title)}</p><p class="small spacer-sm">Ahora tiene ${ui.lastValidation.visits} visitas y nivel ${esc(ui.lastValidation.level)}.</p><div class="row spacer">${button('scan-new','Validar otra tarjeta','qr','primary')}${link('/tarjeta','Ver su tarjeta','card','secondary')}</div></div>`;
    else if(ui.scannerError) result=`<div class="scan-invalid">${ico('shield')} <strong>No se pudo validar</strong><p class="spacer-sm">${esc(ui.scannerError)}</p></div>`;
    else if(y) result=`<div class="scan-result"><div class="scan-valid">${ico('shield')} Tarjeta activa</div><div class="row">${avatar(y,'dark')}<div><h3>${esc(y.name)}</h3><span class="small muted">${esc(y.code)} · ${age(y.birth)} años</span></div></div><div class="row"><span class="badge brand">Nivel ${esc(levelFor(y))}</span><span class="badge outline">${visitsFor(y).length} visitas</span></div><div class="divider"></div><label class="field">Beneficio a aplicar<select class="field-control" data-select="redemption"><option value="">Registrar visita sin cupón</option>${options.map(c=>`<option value="${esc(c.id)}" ${ui.selectedCoupon===c.id?'selected':''}>${esc(c.benefit+' · '+c.title)}</option>`).join('')}</select></label>${issue?`<p class="inline-feedback error">${esc(issue)}</p>`:'<p class="inline-feedback">Confirma el beneficio antes de registrar la visita.</p>'}<div class="spacer">${button('redeem','Registrar visita','check','primary full',issue?'disabled':'')}</div></div>`;
    return `<div class="panel-top"><div><h2>Una tarjeta. Una visita.</h2><p class="small muted">Valida al joven y elige el beneficio que utilizará.</p></div><span class="badge green">${ico('qr')} QR listo</span></div><div class="scanner-grid"><div class="panel"><div class="scan-area">${ico('qr')}<h3>Escanear tarjeta</h3><p>Usa la cámara o prueba el QR de ${esc(youth().name.split(' ')[0])}.</p><div class="row" style="flex-wrap:wrap;justify-content:center">${button('camera','Abrir cámara','camera','secondary small')}${button('simulate-scan','Probar QR','qr','primary small')}</div></div><div class="divider"></div><form id="scan-form"><label class="field">Código de la tarjeta<input class="field-control" name="code" placeholder="DEMO-0001" autocomplete="off" maxlength="120" required></label><div class="spacer-sm">${'<button type="submit" class="button dark full">'+ico('check')+'Validar código</button>'}</div></form><p class="note spacer">Los códigos de ejemplo están disponibles en todos los dispositivos. Los registros nuevos solo existen en el navegador donde se crearon.</p></div><div>${result}</div></div><div class="banner spacer-lg"><div><h3>Prueba el recorrido completo</h3><p>Crea un beneficio, úsalo desde una tarjeta y mira el resultado aquí.</p></div><button class="button accent" data-action="tab" data-group="b" data-tab="resultados">${ico('chart')} Ver resultados</button></div>`;
  }
  function businessPromotions(b) {
    const list=state.coupons.filter(c=>c.businessId===b.id);
    return `<div class="panel-top"><div><h2>Tus beneficios</h2><p class="small muted">Publica una promoción y aparecerá en la tarjeta del joven.</p></div>${button('promotion-form','Crear promoción','plus','primary')}</div><div class="stack">${list.length?list.map(c=>`<article class="panel"><div class="row spread" style="align-items:flex-start"><div><span class="badge brand">${esc(c.benefit)}</span><h3 class="spacer-sm">${esc(c.title)}</h3></div>${statusBadge(c.status)}</div><p class="small muted spacer-sm">${esc(c.description)}</p><div class="row spacer-sm" style="flex-wrap:wrap"><span class="badge outline">Hasta ${dateText(c.end)}</span><span class="badge outline">Nivel ${esc(c.level)}</span><span class="badge outline">${c.unique?'Uso único':'Reutilizable'}</span><span class="badge outline">${state.visits.filter(v=>v.couponId===c.id).length} usos</span></div><div class="list-actions">${button('promotion-form','Editar','edit','secondary small',`data-id="${esc(c.id)}"`)}${button('promotion-toggle',c.status==='Activa'?'Pausar':'Activar','', 'secondary small',`data-id="${esc(c.id)}"`)}${button('promotion-delete','Eliminar','trash','danger small',`data-id="${esc(c.id)}"`)}</div></article>`).join(''):empty('Publica tu primer beneficio','Los jóvenes podrán verlo en su tarjeta al instante.','ticket')}</div>`;
  }
  function businessJobs(b) {
    const list=state.jobs.filter(j=>j.businessId===b.id);
    return `<div class="panel-top"><div><h2>Oportunidades en tu negocio</h2><p class="small muted">Prueba cómo publicarías y recibirías interesados.</p></div>${button('job-form','Crear vacante','plus','primary')}</div><div class="stack">${list.length?list.map(j=>`<article class="panel"><div class="row spread"><h3>${esc(j.title)}</h3>${statusBadge(j.status)}</div><div class="row spacer-sm" style="flex-wrap:wrap"><span class="badge brand">${esc(j.salary)}</span><span class="badge outline">${esc(j.type)}</span></div><p class="small muted spacer-sm">${esc(j.description)}</p><div class="list-actions">${button('applicants',state.applications.filter(a=>a.jobId===j.id).length+' interesados','users','primary small',`data-id="${esc(j.id)}"`)}${button('job-form','Editar','edit','secondary small',`data-id="${esc(j.id)}"`)}${button('job-toggle',j.status==='Activa'?'Pausar':'Activar','','secondary small',`data-id="${esc(j.id)}"`)}${button('job-delete','Eliminar','trash','danger small',`data-id="${esc(j.id)}"`)}</div></article>`).join(''):empty('Abre una oportunidad','Crea una vacante y pruébala desde la experiencia joven.','briefcase')}</div>`;
  }
  function visitsTable(list) {
    return list.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Joven</th><th>Beneficio</th><th>Negocio</th><th>Fecha</th></tr></thead><tbody>${list.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=>`<tr><td><strong class="cell-title">${esc(state.youths.find(y=>y.id===v.youthId)?.name || 'Perfil retirado')}</strong><span class="cell-sub">Visita de prueba</span></td><td>${esc(v.couponTitle)}</td><td>${esc(state.businesses.find(b=>b.id===v.businessId)?.name || 'Negocio')}</td><td style="white-space:nowrap">${dateText(v.date)}</td></tr>`).join('')}</tbody></table></div>`:empty('Todavía no hay visitas','Las validaciones que registres aparecerán aquí.','history');
  }
  function activityChart(list) {
    const labels=[];
    for(let n=-6;n<=0;n++) {const d=day(n);labels.push({date:d,count:list.filter(v=>v.date.startsWith(d)).length,label:new Date(d+'T12:00:00').toLocaleDateString('es-MX',{weekday:'short'}).replace('.','')});}
    const max=Math.max(1,...labels.map(d=>d.count));
    return `<div class="chart" role="img" aria-label="Visitas de los últimos siete días: ${esc(labels.map(d=>d.label+' '+d.count).join(', '))}">${labels.map(d=>`<div class="chart-col"><span class="chart-value">${d.count}</span><span class="chart-bar" style="height:${Math.max(3,d.count/max*110)}px"></span><span class="chart-day">${esc(d.label)}</span></div>`).join('')}</div>`;
  }
  function businessStats(b) {
    const list=state.visits.filter(v=>v.businessId===b.id);
    return `<div class="panel-top"><div><h2>Tus resultados</h2><p class="small muted">Actividad de prueba de ${esc(b.name)}.</p></div>${button('export','Exportar visitas','download','secondary', 'data-type="business-visits"')}</div><div class="grid-3">${statCard('Visitas registradas',list.length,'Total de la demostración','qr')}${statCard('Jóvenes atendidos',new Set(list.map(v=>v.youthId)).size,'Perfiles diferentes','users')}${statCard('Beneficios activos',state.coupons.filter(c=>c.businessId===b.id&&c.status==='Activa'&&c.end>=day()).length,'Promociones vigentes','ticket')}</div><div class="panel spacer"><div class="panel-top"><h2>Visitas en los últimos 7 días</h2><span class="badge outline">Datos de prueba</span></div>${activityChart(list)}</div><div class="panel spacer"><div class="panel-top"><h2>Historial de visitas</h2></div>${visitsTable(list)}</div>`;
  }
  function adminPage() {
    let content='';
    if(ui.aTab==='resumen') content=adminOverview();
    else if(ui.aTab==='solicitudes') content=adminRequests();
    else if(ui.aTab==='jovenes') content=adminYouths();
    else if(ui.aTab==='negocios') content=adminBusinesses();
    else if(ui.aTab==='contenido') content=adminContent();
    else if(ui.aTab==='avisos') content=adminNotices();
    else if(ui.aTab==='reportes') content=adminReports();
    else content=brandPanel();
    return `<main id="main" class="wrap view-enter">${pageTop('Panel municipal','Tu programa, en un solo lugar.','Administración de '+state.brand.municipio,button('admin-tour','Recorrido de prueba','eye','secondary'))}<div class="dashboard">${sideNav(ui.aTab,[['resumen','Resumen','grid'],['solicitudes','Solicitudes','file'],['jovenes','Jóvenes','users'],['negocios','Negocios','store'],['contenido','Beneficios y empleos','ticket'],['avisos','Avisos','bell'],['reportes','Reportes','chart'],['marca','Identidad municipal','palette']],'a')}<section>${content}</section></div></main>`;
  }
  function adminOverview() {
    const activeYouths=state.youths.filter(y=>y.status==='Activa').length,activeBusinesses=state.businesses.filter(b=>b.status==='Activo').length;
    const topBusinesses=state.businesses.map(b=>({...b,total:state.visits.filter(v=>v.businessId===b.id).length})).sort((a,b)=>b.total-a.total).slice(0,4);
    const max=Math.max(1,...topBusinesses.map(b=>b.total));
    return `<div class="grid-4">${statCard('Tarjetas activas',activeYouths,state.youths.length+' perfiles registrados','card')}${statCard('Negocios aliados',activeBusinesses,'En el directorio de la demo','store')}${statCard('Visitas validadas',state.visits.length,'Con QR o código de tarjeta','qr')}${statCard('Por revisar',pendingCount(),'Solicitudes de jóvenes y negocios','file')}</div><div class="overview-grid"><div class="panel"><div class="panel-top"><div><h2>Un programa que se mueve</h2><p class="small muted">Visitas durante los últimos 7 días</p></div></div>${activityChart(state.visits)}</div><div class="panel"><div class="panel-top"><h2>Aliados con más visitas</h2></div>${topBusinesses.map((b,n)=>`<div class="rank-row"><span class="rank-number">0${n+1}</span><div class="rank-data"><div class="row spread"><strong>${esc(b.name)}</strong><span>${b.total} visitas</span></div><div class="rank-line"><span style="width:${b.total/max*100}%"></span></div></div></div>`).join('')}</div></div><div class="banner spacer"><div><h3>${pendingCount()?pendingCount()+' solicitudes esperan tu revisión.':'Todas las solicitudes están al día.'}</h3><p>Aprueba una solicitud de prueba y mira cómo se activa su tarjeta o negocio.</p></div><button class="button accent" data-action="tab" data-group="a" data-tab="solicitudes">${ico('file')} Revisar solicitudes</button></div><div class="panel spacer"><div class="panel-top"><h2>Actividad reciente</h2></div>${state.audit.slice(0,5).map(v=>`<div class="timeline-row"><div class="timeline-date">${shortDate(v.date)}</div><div class="timeline-content"><p style="margin:0;color:var(--ink)">${esc(v.text)}</p></div></div>`).join('')}</div>`;
  }
  function adminRequests() {
    const ys=state.youths.filter(y=>y.status==='Pendiente'),bs=state.businesses.filter(b=>b.status==='Pendiente');
    const request=(p,kind)=>`<article class="request-card">${kind==='youth'?avatar(p,'dark'):`<span class="avatar dark">${esc(p.initials)}</span>`}<div class="request-details"><div class="row" style="flex-wrap:wrap"><h3>${esc(p.name)}</h3><span class="badge yellow">Pendiente</span></div><p>${kind==='youth'?`${age(p.birth)} años · ${esc(p.locality)} · ${esc(p.occupation)}`:`${esc(p.category)} · ${esc(p.address)}`}</p><p>${esc(p.email)}</p></div><div class="request-actions">${button('request-detail','Revisar','eye','secondary small',`data-kind="${kind}" data-id="${p.id}"`)}${button('approve','Aprobar','check','primary small',`data-kind="${kind}" data-id="${p.id}"`)}${button('reject','Rechazar','','danger small',`data-kind="${kind}" data-id="${p.id}"`)}</div></article>`;
    return `<div class="panel-top"><div><h2>Revisión de solicitudes</h2><p class="small muted">Simula la validación y el alta del programa.</p></div><span class="badge brand">${ys.length+bs.length} pendientes</span></div><h3 class="spacer">Jóvenes</h3>${ys.length?ys.map(y=>request(y,'youth')).join(''):empty('No hay solicitudes pendientes','Puedes crear otra desde el registro joven.','users')}<h3 class="spacer">Negocios</h3>${bs.length?bs.map(b=>request(b,'business')).join(''):empty('Todos los aliados están revisados','Puedes solicitar un alta desde el registro de negocios.','store')}`;
  }
  function adminYouths() {
    const list=state.youths.filter(y=>[y.name,y.email,y.locality,y.code,y.status].join(' ').toLowerCase().includes(ui.adminSearch.toLowerCase()));
    return `<div class="panel-top"><div><h2>Jóvenes del programa</h2><p class="small muted">Administra perfiles, tarjetas y estados.</p></div><div class="row">${button('export','CSV','download','secondary small','data-type="youths"')}${button('youth-form','Agregar joven','plus','primary small')}</div></div>${filterBar('adminSearch',ui.adminSearch,'Buscar un joven, código o localidad')}<div class="panel">${list.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Joven</th><th>Localidad</th><th>Tarjeta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${list.map(y=>`<tr><td><strong class="cell-title">${esc(y.name)}</strong><span class="cell-sub">${age(y.birth)} años · ${esc(y.occupation)}</span></td><td>${esc(y.locality)}</td><td><span class="cell-title">${esc(y.code)}</span><span class="cell-sub">${levelFor(y)} · ${visitsFor(y).length} visitas</span></td><td>${statusBadge(y.status)}</td><td><div class="inline-actions">${button('youth-form','Editar','edit','secondary small',`data-id="${y.id}"`)}${y.status==='Pendiente'?button('approve','Aprobar','check','primary small',`data-kind="youth" data-id="${y.id}"`):button('youth-toggle',y.status==='Activa'?'Suspender':'Activar','','secondary small',`data-id="${y.id}"`)}</div></td></tr>`).join('')}</tbody></table></div>`:empty('Sin coincidencias','Cambia la búsqueda.','users')}</div>`;
  }
  function adminBusinesses() {
    const list=state.businesses.filter(b=>[b.name,b.category,b.address,b.status].join(' ').toLowerCase().includes(ui.adminSearch.toLowerCase()));
    return `<div class="panel-top"><div><h2>Comunidad de negocios</h2><p class="small muted">Los aliados activos aparecen en el directorio.</p></div>${button('business-form','Agregar negocio','plus','primary')}</div>${filterBar('adminSearch',ui.adminSearch,'Buscar un negocio o categoría')}<div class="panel">${list.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Negocio</th><th>Categoría</th><th>Visitas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${list.map(b=>`<tr><td><strong class="cell-title">${esc(b.name)}</strong><span class="cell-sub">${esc(b.address)}</span></td><td>${esc(b.category)}</td><td>${state.visits.filter(v=>v.businessId===b.id).length}</td><td>${statusBadge(b.status)}</td><td><div class="inline-actions">${button('business-form','Editar','edit','secondary small',`data-id="${b.id}"`)}${b.status==='Pendiente'?button('approve','Aprobar','check','primary small',`data-kind="business" data-id="${b.id}"`):button('business-toggle',b.status==='Activo'?'Suspender':'Activar','','secondary small',`data-id="${b.id}"`)}</div></td></tr>`).join('')}</tbody></table></div>`:empty('Sin coincidencias','Prueba otra búsqueda.','store')}</div>`;
  }
  function adminContent() {
    return `<div class="panel-top"><div><h2>Beneficios y oportunidades</h2><p class="small muted">Controla qué publicaciones se muestran en las tarjetas.</p></div></div><div class="panel"><div class="panel-top"><h2>Promociones</h2><span class="badge outline">${state.coupons.length} publicaciones</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Beneficio</th><th>Negocio</th><th>Vigencia</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${state.coupons.map(c=>`<tr><td><strong class="cell-title">${esc(c.benefit)}</strong><span class="cell-sub">${esc(c.title)}</span></td><td>${esc(businessFor(c)?.name)}</td><td style="white-space:nowrap">${dateText(c.end)}</td><td>${statusBadge(c.status)}</td><td>${button('promotion-toggle',c.status==='Activa'?'Pausar':'Activar','','secondary small',`data-id="${esc(c.id)}"`)}</td></tr>`).join('')}</tbody></table></div></div><div class="panel spacer"><div class="panel-top"><h2>Vacantes</h2><span class="badge outline">${state.jobs.length} publicaciones</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Vacante</th><th>Negocio</th><th>Interesados</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${state.jobs.map(j=>`<tr><td><strong class="cell-title">${esc(j.title)}</strong><span class="cell-sub">${esc(j.salary)}</span></td><td>${esc(businessFor(j)?.name)}</td><td>${state.applications.filter(a=>a.jobId===j.id).length}</td><td>${statusBadge(j.status)}</td><td>${button('job-toggle',j.status==='Activa'?'Pausar':'Activar','','secondary small',`data-id="${esc(j.id)}"`)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function adminNotices() {
    return `<div class="panel-top"><div><h2>Avisos del instituto</h2><p class="small muted">Aparecerán en el centro de notificaciones.</p></div>${button('notice-form','Publicar aviso','plus','primary')}</div><div class="stack">${state.announcements.length?state.announcements.slice().reverse().map(a=>`<article class="panel"><div class="row spread"><span class="badge brand">${esc(a.audience)}</span><span class="small muted">${dateText(a.date)}</span></div><h3 class="spacer-sm">${esc(a.title)}</h3><p class="small muted spacer-sm">${esc(a.message)}</p><div class="spacer">${button('notice-delete','Eliminar aviso','trash','danger small',`data-id="${esc(a.id)}"`)}</div></article>`).join(''):empty('Sin avisos publicados','Crea el primer aviso para tus jóvenes y aliados.','bell')}</div>`;
  }
  function reportVisits() {return state.visits.filter(v=>(!ui.reportFrom||v.date.slice(0,10)>=ui.reportFrom)&&(!ui.reportTo||v.date.slice(0,10)<=ui.reportTo));}
  function adminReports() {
    const list=reportVisits(), unique=new Set(list.map(v=>v.youthId)).size;
    return `<div class="panel-top"><div><h2>Resultados del programa</h2><p class="small muted">Los reportes reflejan las acciones de esta demostración.</p></div>${button('export','Exportar CSV','download','primary','data-type="visits"')}</div><div class="panel"><div class="form-grid"><label class="field">Desde<input type="date" class="field-control" data-select="reportFrom" value="${esc(ui.reportFrom)}" ${ui.reportTo?`max="${ui.reportTo}"`:''}></label><label class="field">Hasta<input type="date" class="field-control" data-select="reportTo" value="${esc(ui.reportTo)}" ${ui.reportFrom?`min="${ui.reportFrom}"`:''}></label></div></div><div class="grid-3 spacer">${statCard('Visitas del periodo',list.length,'Validaciones registradas','qr')}${statCard('Jóvenes participantes',unique,'Perfiles únicos atendidos','users')}${statCard('Aliados participantes',new Set(list.map(v=>v.businessId)).size,'Negocios con visitas','store')}</div><div class="panel spacer"><div class="panel-top"><h2>Detalle de validaciones</h2><span class="badge outline">${list.length} registros</span></div>${visitsTable(list)}</div>`;
  }
  function brandForm() {
    const b=state.brand;
    return `<form id="brand-form"><div class="form-grid"><label class="field wide">Municipio<input class="field-control" name="municipio" value="${esc(b.municipio)}" maxlength="65" required></label><label class="field wide">Nombre del programa<input class="field-control" name="program" value="${esc(b.program)}" maxlength="65" required></label><label class="field wide">Nombre del instituto<input class="field-control" name="institute" value="${esc(b.institute)}" maxlength="90" required></label><label class="field">Color principal<input class="field-control" type="color" name="primary" value="${b.primary}"></label><label class="field">Color de acento<input class="field-control" type="color" name="accent" value="${b.accent}"></label><div class="field wide"><span>Paletas de ejemplo</span><div class="color-presets">${[['#6640df','#d6f461','Violeta y lima'],['#702032','#f3dcbb','Guinda institucional'],['#dd631c','#ffdf7a','Naranja'],['#125e88','#8ee7df','Azul'],['#24694e','#d8f178','Verde']].map(([primary,accent,label])=>`<button type="button" class="color-preset ${b.primary===primary?'selected':''}" style="--preset:${primary}" data-action="palette" data-color="${primary}" data-accent="${accent}" aria-label="${label}" title="${label}"></button>`).join('')}</div></div><div class="field"><span>Logo del Ayuntamiento</span><div class="logo-upload">${b.governmentLogo?`<img src="${esc(b.governmentLogo)}" alt="Logo del Ayuntamiento">`:'<div class="logo-placeholder">'+ico('home')+'</div>'}<input type="file" aria-label="Subir logo del Ayuntamiento" data-upload="governmentLogo" accept="image/png,image/jpeg,image/webp"><div class="spacer-sm">${button('logo-clear','Quitar','','ghost small','data-logo="governmentLogo"')}</div></div></div><div class="field"><span>Logo del instituto</span><div class="logo-upload">${b.instituteLogo?`<img src="${esc(b.instituteLogo)}" alt="Logo del instituto">`:'<div class="logo-placeholder">'+ico('users')+'</div>'}<input type="file" aria-label="Subir logo del instituto" data-upload="instituteLogo" accept="image/png,image/jpeg,image/webp"><div class="spacer-sm">${button('logo-clear','Quitar','','ghost small','data-logo="instituteLogo"')}</div></div></div><p class="note wide" style="grid-column:1/-1">Los logos se guardan en este navegador. El enlace compartido lleva el nombre y los colores; exporta la personalización para conservar también los logos.</p></div><div class="form-actions"><button type="submit" class="button primary">${ico('check')} Aplicar identidad</button></div></form>`;
  }
  function brandPanel() {
    return `<div class="panel-top"><div><h2>Una demo con su propia identidad</h2><p class="small muted">Adapta la presentación al municipio que la está conociendo.</p></div></div><div class="brand-layout"><div class="panel">${brandForm()}</div><div class="brand-preview"><span class="eyebrow muted">Vista previa</span>${card(youth())}<div class="stack spacer">${button('share-brand','Copiar enlace con nombre y colores','link','secondary')}${button('export-brand','Exportar personalización','download','secondary')}<label class="button secondary" style="cursor:pointer">${ico('file')} Importar personalización<input class="sr-only" type="file" data-upload="brandImport" accept="application/json,.json"></label></div><p class="note spacer">Para mostrar los mismos logos a todos los visitantes, incorpora la personalización exportada en <strong>demo-data.js</strong> y publica la demo de ese municipio.</p></div></div>`;
  }
  function inputField(name,label,type='text',value='',extra='',wide=false) {return `<div class="field ${wide?'wide':''}"><label for="field-${name}">${esc(label)}</label><input id="field-${name}" class="field-control" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;}
  function selectField(name,label,values,current,wide=false) {return `<div class="field ${wide?'wide':''}"><label for="field-${name}">${esc(label)}</label><select id="field-${name}" class="field-control" name="${name}">${values.map(v=>`<option ${v===current?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`;}
  function textareaField(name,label,value,extra='',wide=true) {return `<div class="field ${wide?'wide':''}"><label for="field-${name}">${esc(label)}</label><textarea id="field-${name}" class="field-control" name="${name}" ${extra}>${esc(value||'')}</textarea></div>`;}
  function youthForm(y=null,registration=false) {
    const birth=y?.birth || '', photo=y?.photo || '';
    ui.pendingPhoto=photo;
    return `<form id="youth-form" data-id="${y?.id||''}" data-registration="${registration}"><div class="form-grid">${inputField('name','Nombre completo','text',y?.name || '', 'placeholder="Nombre de ejemplo" minlength="3" maxlength="75" required',true)}${inputField('birth','Fecha de nacimiento','date',birth,`max="${day()}" required`)}${inputField('locality','Localidad o colonia','text',y?.locality || 'Centro','maxlength="65" required')}${inputField('email','Correo de ejemplo','email',y?.email || '', 'placeholder="nombre@example.test" maxlength="100" required',true)}${selectField('gender','Género',['Mujer','Hombre','No binario','Prefiero no decirlo'],y?.gender || 'Prefiero no decirlo')}${selectField('occupation','Ocupación',['Estudiante','Empleado','Emprendedor','Buscando empleo','Otra'],y?.occupation || 'Estudiante')}<label class="field wide">Foto de perfil (opcional)<input type="file" class="field-control" data-upload="youthPhoto" accept="image/png,image/jpeg,image/webp"><small>Usa una foto de ejemplo. Se conserva únicamente en este navegador.</small><span id="photo-preview">${photo?`<img class="photo-preview" src="${esc(photo)}" alt="Foto de perfil de ejemplo">`:''}</span></label>${registration?'<label class="check-field field wide"><input type="checkbox" name="demoDocument" required><span>Usaré datos de ejemplo. Simular un documento válido para la revisión municipal.</span></label>':''}<p class="note" style="grid-column:1/-1">La demostración acepta edades de 12 a 29 años. No se envían datos, documentos ni correos a un servidor.</p></div><p id="form-feedback" class="inline-feedback" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">${ico(registration?'file':'check')}${registration?'Enviar solicitud de prueba':'Guardar perfil'}</button></div></form>`;
  }
  function businessForm(b=null,registration=false) {
    ui.pendingBusinessLogo=b?.logo || '';
    return `<form id="business-form" data-id="${b?.id||''}" data-registration="${registration}"><div class="form-grid">${inputField('name','Nombre del negocio','text',b?.name || '','placeholder="Negocio de ejemplo" minlength="3" maxlength="75" required',true)}${selectField('category','Giro',['Alimentos','Salud','Deporte','Educación','Entretenimiento','Servicios'],b?.category || 'Alimentos')}${inputField('schedule','Horario','text',b?.schedule || 'Lun a sáb · 9:00 a 18:00','maxlength="85" required')}${inputField('address','Dirección de ejemplo','text',b?.address || '','placeholder="Calle de ejemplo 10, Centro" maxlength="100" required',true)}${inputField('email','Correo de ejemplo','email',b?.email || '','placeholder="negocio@example.test" maxlength="100" required',true)}${textareaField('description','Acerca del negocio',b?.description || '','maxlength="250" required')}<label class="field wide">Logo (opcional)<input type="file" class="field-control" data-upload="businessLogo" accept="image/png,image/jpeg,image/webp"><span id="photo-preview">${b?.logo?`<img class="photo-preview" src="${esc(b.logo)}" alt="Logo de ejemplo">`:''}</span></label>${registration?'<label class="check-field field wide"><input type="checkbox" required><span>Usaré información de un negocio de ejemplo para esta demostración.</span></label>':''}</div><p id="form-feedback" class="inline-feedback" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">${ico(registration?'file':'check')}${registration?'Solicitar alta de prueba':'Guardar negocio'}</button></div></form>`;
  }
  function registrationPage(kind) {
    const young=kind==='youth';
    return `<main id="main" class="wrap view-enter"><div class="form-shell">${pageTop(young?'Registro joven':'Registro de negocio',young?'Todo empieza con tu tarjeta.':'Hazte parte de la comunidad.','Prueba el registro con datos de ejemplo.')}<div class="panel"><div class="row spread" style="margin-bottom:22px"><h2>${young?'Solicitud de tarjeta':'Solicitud de negocio'}</h2>${link(young?'/tarjeta':'/portal-negocios','Entrar al perfil demo','', 'secondary small')}</div>${young?youthForm(null,true):businessForm(null,true)}</div><div class="note spacer">Después del registro, revisa la solicitud en administración y apruébala para activar el perfil.</div></div></main>`;
  }
  function showModal(title,description,body,wide=false) {
    stopCamera();
    modal.className=wide?'wide-dialog':'';
    modal.innerHTML=`<div class="modal-inner"><div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div><button class="icon-button" data-action="close" aria-label="Cerrar">${ico('close')}</button></div><div class="modal-content">${body}</div></div>`;
    if(!modal.open) modal.showModal();
    const focus=modal.querySelector('input:not([type=file]):not([type=color]),select,button');
    focus?.focus();
  }
  function closeModal() {if(modal.open) modal.close();stopCamera();}
  function showBrand() {showModal('Tu municipio. Tu identidad.','Cambia los datos y mira cómo se siente la tarjeta con tu marca.',`<div class="brand-layout"><div>${brandForm()}</div><div class="brand-preview"><span class="eyebrow muted">Vista previa</span>${card(youth())}<div class="stack spacer">${button('share-brand','Copiar enlace con nombre y colores','link','secondary small')}${button('export-brand','Exportar personalización','download','secondary small')}</div></div></div>`,true);}
  function showCoupon(c) {
    const b=businessFor(c),issue=couponIssue(c,youth());
    showModal(c.title,b.name+' · '+c.category,`<div class="benefit-big">${esc(c.benefit)}</div><p>${esc(c.description)}</p><div class="business-detail-grid"><div class="detail-item"><strong>${ico('clock')} Vigencia</strong>Hasta ${dateText(c.end)}<br>${esc(c.days)}</div><div class="detail-item"><strong>${ico('pin')} Dónde usarlo</strong>${esc(b.name)}<br>${esc(b.address)}</div><div class="detail-item"><strong>Horario del negocio</strong>${esc(b.schedule)}</div><div class="detail-item"><strong>Tu tarjeta</strong>Nivel ${esc(c.level)}${c.unique?' · Un solo uso':' · Reutilizable'}</div></div><p class="note spacer">${esc(c.conditions)}</p><ol class="how-list"><li><span>1</span><div>Visita ${esc(b.name)} dentro de la vigencia y el horario.</div></li><li><span>2</span><div>Muestra tu tarjeta y pide este beneficio antes de pagar.</div></li><li><span>3</span><div>El negocio valida tu QR y registra el beneficio utilizado.</div></li></ol>${issue?`<p class="inline-feedback error">${esc(issue)}</p>`:'<p class="note brand-note">En esta demo puedes probar también la validación desde el lado del negocio.</p>'}<div class="form-actions">${button('business-detail','Ver ubicación','pin','secondary',`data-id="${b.id}"`)}${button('qr','Mostrar mi QR','qr','dark',`data-id="${youth().id}"`)}${button('try-coupon','Probar validación','check','primary',`data-id="${esc(c.id)}" ${issue?'disabled':''}`)}</div>`);
  }
  function showBusinessDetail(b) {
    const coupons=state.coupons.filter(c=>c.businessId===b.id&&c.status==='Activa');
    showModal(b.name,b.category+' · Negocio aliado de ejemplo',`<p>${esc(b.description)}</p><div class="business-detail-grid"><div class="detail-item"><strong>${ico('pin')} Dirección</strong>${esc(b.address)}</div><div class="detail-item"><strong>${ico('clock')} Horario</strong>${esc(b.schedule)}</div></div><div class="demo-map map-small"><div class="map-grid"></div><div class="map-water"></div><span class="map-pin" style="left:45%;top:43%">${esc(b.initials)}</span><div class="map-caption">Ubicación ilustrativa. En el sistema contratado se mostraría la ubicación real del negocio.</div></div><h3 class="spacer">Beneficios del negocio</h3><div class="stack spacer-sm">${coupons.length?coupons.map(c=>`<button class="button secondary" data-action="coupon" data-id="${esc(c.id)}" style="justify-content:space-between;text-align:left"><span>${esc(c.title)}</span><span class="badge brand">${esc(c.benefit)}</span></button>`).join(''):empty('Por ahora no hay beneficios','Aquí aparecerán sus promociones publicadas.')}</div>`);
  }
  function showQR(y) {
    showModal('Tu QR, listo para mostrar.',state.brand.program+' · '+state.brand.municipio,`<div class="modal-qr">${qr(y)}<strong>${esc(y.code)}</strong><p class="small muted">${esc(y.name)} · Nivel ${esc(levelFor(y))}</p></div><p class="note spacer">El negocio valida este código en su portal. Esta tarjeta es de demostración y no acredita una inscripción municipal real.</p><div class="form-actions">${button('download-qr','Descargar QR','download','secondary',`data-id="${y.id}"`)}${button('print-card','Imprimir tarjeta','card','secondary',`data-id="${y.id}"`)}${button('try-qr','Probar en negocio','qr','primary',`data-id="${y.id}"`)}</div>`);
  }
  function showJob(j) {
    const b=businessFor(j),applied=state.applications.some(a=>a.jobId===j.id&&a.youthId===youth().id);
    showModal(j.title,b.name+' · Vacante de ejemplo',`<div class="row" style="flex-wrap:wrap"><span class="badge brand">${esc(j.salary)}</span><span class="badge outline">${esc(j.type)}</span></div><p class="spacer">${esc(j.description)}</p><div class="business-detail-grid"><div class="detail-item"><strong>Ubicación</strong>${esc(b.address)}</div><div class="detail-item"><strong>Negocio</strong>${esc(b.name)}</div></div><p class="note spacer">El interés se registra solo en la demo. No envía correos, mensajes ni una postulación real.</p><div class="form-actions">${button('apply-job',applied?'Interés enviado':'Enviar interés de prueba','mail','primary',`data-id="${esc(j.id)}" ${applied?'disabled':''}`)}</div>`);
  }
  function showApplicants(j) {
    const list=state.applications.filter(a=>a.jobId===j.id);
    showModal('Personas interesadas',j.title,`${list.length?list.map(a=>{const y=state.youths.find(y=>y.id===a.youthId);return `<div class="list-card">${avatar(y,'dark')}<div class="list-content"><h3>${esc(y.name)}</h3><p>${esc(y.email)}<br>${age(y.birth)} años · ${esc(y.occupation)}</p><span class="badge outline spacer-sm">${dateText(a.date)}</span></div></div>`;}).join(''):empty('Aún no hay interesados','Envía interés desde una tarjeta de prueba para verlo aquí.','users')}<p class="note spacer">No se ha enviado una postulación a una empresa real.</p>`);
  }
  function showPromotionForm(c=null) {
    showModal(c?'Editar beneficio':'Una buena razón para visitarte.',business().name,`<form id="promotion-form" data-id="${esc(c?.id||'')}"><div class="form-grid">${inputField('title','Nombre de la promoción','text',c?.title || '','placeholder="Ej. Una pausa con beneficio" maxlength="75" minlength="3" required',true)}${inputField('benefit','Beneficio visible','text',c?.benefit || '','placeholder="Ej. 15% OFF o 2 × 1" maxlength="24" required')}${inputField('end','Vigencia','date',c?.end || day(30),`min="${day()}" required`)}${textareaField('description','Descripción',c?.description || '','maxlength="300" required')}${selectField('category','Categoría',['Alimentos','Salud','Deporte','Educación','Entretenimiento','Servicios'],c?.category || business().category)}${selectField('level','Nivel requerido',['Clásica','Plata','Oro'],c?.level || 'Clásica')}${selectField('days','Días válidos',['Todos los días','Lunes a viernes','Lunes a sábado'],c?.days || 'Todos los días',true)}${textareaField('conditions','Condiciones',c?.conditions || 'Presentar tarjeta antes de pagar. No acumulable con otras promociones.','maxlength="300" required')}<label class="check-field field wide"><input type="checkbox" name="unique" ${c?.unique?'checked':''}><span>Solo una vez por tarjeta</span></label></div><div class="form-actions"><button type="submit" class="button primary">${ico('check')}${c?'Guardar cambios':'Publicar beneficio'}</button></div></form>`);
  }
  function showJobForm(j=null) {
    showModal(j?'Editar vacante':'Una oportunidad para alguien.',business().name,`<form id="job-form" data-id="${esc(j?.id||'')}"><div class="form-grid">${inputField('title','Nombre de la vacante','text',j?.title || '','maxlength="80" minlength="3" required',true)}${inputField('salary','Sueldo de ejemplo','text',j?.salary || '','placeholder="Ej. $9,000 mensuales" maxlength="65" required')}${selectField('type','Modalidad',['Medio tiempo','Tiempo completo','Por proyecto','Prácticas'],j?.type || 'Medio tiempo')}${textareaField('description','Descripción y requisitos',j?.description || '','maxlength="500" required')}</div><div class="form-actions"><button type="submit" class="button primary">${ico('check')}${j?'Guardar cambios':'Publicar vacante'}</button></div></form>`);
  }
  function showNoticeForm() {
    showModal('Un aviso para tu comunidad.','Define a quién se mostrará esta comunicación.',`<form id="notice-form"><div class="form-grid">${inputField('title','Título','text','','maxlength="100" required',true)}${textareaField('message','Mensaje','','maxlength="700" required')}${selectField('audience','Dirigido a',['Todos','Jóvenes','Negocios'],'Todos',true)}</div><div class="form-actions"><button type="submit" class="button primary">${ico('bell')} Publicar aviso</button></div></form>`);
  }
  function showNotices() {
    const role=route()==='/portal-negocios'?'Negocios':'Jóvenes';
    const list=state.announcements.filter(a=>a.audience==='Todos'||a.audience===role).slice().reverse();
    list.forEach(a=>{const key=role+':'+a.id;if(!state.readAnnouncements.includes(key))state.readAnnouncements.push(key);});
    persist();render();
    showModal('Avisos de tu instituto.','Actividades, convocatorias y novedades.',list.length?list.map(a=>`<article class="alert-item"><div class="row spread"><span class="badge brand">${esc(a.audience)}</span><small>${dateText(a.date)}</small></div><h3 class="spacer-sm">${esc(a.title)}</h3><p>${esc(a.message)}</p></article>`).join(''):empty('Estás al día','Aquí aparecerán los avisos que publique el instituto.','bell'));
  }
  function showMissions() {
    const y=youth(),visits=visitsFor(y);
    const missions=[
      ['Tu primera visita','Utiliza un beneficio y valida tu tarjeta.',visits.length>0],
      ['Conoce a tus aliados','Explora el directorio de negocios.',state.explored.includes(y.id)],
      ['Una nueva oportunidad','Envía interés en una vacante de prueba.',state.applications.some(a=>a.youthId===y.id)],
      ['Amplía tu recorrido','Visita dos negocios diferentes.',new Set(visits.map(v=>v.businessId)).size>=2],
      ['Da el salto a Plata','Acumula tres visitas validadas.',visits.length>=3]
    ];
    showModal('Cada paso cuenta.','Los logros se completan al realizar las acciones de la demo.',`<div class="row spread"><span class="big-number">${missions.filter(m=>m[2]).length}<span class="muted" style="font-size:1.5rem"> / ${missions.length}</span></span><span class="badge brand">Nivel ${levelFor(y)}</span></div>${missions.map(([title,text,done])=>`<div class="mission-row"><span class="mission-check ${done?'complete':''}">${ico(done?'check':'trophy')}</span><div><h3>${title}</h3><p>${text}</p></div>${done?'<span class="badge green">Logrado</span>':''}</div>`).join('')}`);
  }
  function showRequest(p,kind) {
    showModal('Revisar solicitud',kind==='youth'?'Solicitud de tarjeta de prueba':'Solicitud de negocio de prueba',`<h3>${esc(p.name)}</h3><div class="business-detail-grid"><div class="detail-item"><strong>Correo</strong>${esc(p.email)}</div><div class="detail-item"><strong>${kind==='youth'?'Edad y localidad':'Giro'}</strong>${kind==='youth'?age(p.birth)+' años · '+esc(p.locality):esc(p.category)}</div></div>${kind==='youth'?`<div class="panel spacer" style="background:var(--canvas)"><span class="eyebrow muted">Documento de ejemplo</span><div class="row spacer-sm">${avatar(p,'dark')}<div><strong>${esc(p.name)}</strong><p class="small muted">${esc(p.code)} · Identidad simulada</p></div></div><div class="divider"></div><p class="small muted">La revisión funciona como demostración. No se ha cargado un documento personal real.</p></div>`:`<p class="small muted spacer">${esc(p.description)}</p><p class="small muted">${esc(p.address)} · ${esc(p.schedule)}</p>`}<div class="form-actions">${button('reject','Rechazar','','danger',`data-kind="${kind}" data-id="${p.id}"`)}${button('approve','Aprobar solicitud','check','primary',`data-kind="${kind}" data-id="${p.id}"`)}</div>`);
  }
  function showDemoEmail(p,kind) {
    showModal('Correo de aprobación','Vista previa · No se envía ningún correo',`<div class="panel" style="background:var(--canvas)"><p class="small muted">Para: ${esc(p.email)}</p><h3 class="spacer">¡Bienvenido a ${esc(state.brand.program)}!</h3><p class="spacer">Hola, ${esc(p.name.split(' ')[0])}. Tu solicitud fue aprobada por ${esc(state.brand.institute)}.</p><p class="spacer-sm">${kind==='youth'?'Tu tarjeta digital está activa. Ingresa al portal y muestra tu QR en los negocios aliados.':'Tu negocio está activo. Ingresa al portal para publicar beneficios y validar tarjetas.'}</p>${kind==='youth'?`<p class="note spacer">Código de tarjeta: <strong>${esc(p.code)}</strong></p>`:''}<div class="spacer">${button(kind==='youth'?'open-youth':'open-business',kind==='youth'?'Ver tarjeta de prueba':'Ver negocio de prueba','', 'primary',`data-id="${p.id}"`)}</div><p class="small muted spacer">${esc(state.brand.institute)} · ${esc(state.brand.municipio)}</p></div>`);
  }
  function approve(p,kind) {
    if(!p||p.status!=='Pendiente') {toast('La solicitud ya fue revisada.');return;}
    p.status=kind==='youth'?'Activa':'Activo';log('Solicitud aprobada: '+p.name+'. '+(kind==='youth'?'Tarjeta activada.':'Negocio activado.'));
    persist();render();
    showModal('Solicitud aprobada.','El perfil ya está activo en esta demostración.',`<div class="success-hero">${ico('check')}<h3>${esc(p.name)}</h3><p>${kind==='youth'?'La tarjeta y su QR están listos para probarse.':'El negocio puede publicar beneficios y validar tarjetas.'}</p><div class="form-actions" style="justify-content:center">${button(kind==='youth'?'open-youth':'open-business',kind==='youth'?'Ver tarjeta':'Ver negocio','', 'primary',`data-id="${p.id}"`)}${button('demo-email','Ver correo de ejemplo','mail','secondary',`data-kind="${kind}" data-id="${p.id}"`)}</div></div>`);
  }
  function showAbout() {
    showModal('Una experiencia para presentar.','Prueba los recorridos del sistema con libertad.',`<div class="stack"><p>Esta demo reproduce el recorrido de jóvenes, negocios y administración con datos ficticios.</p><p>Las solicitudes, promociones, vacantes, avisos y validaciones se guardan en este navegador. La información de una prueba no se sincroniza con otros dispositivos.</p><p>No usa Firebase ni envía correos, documentos, postulaciones o mensajes reales. La cámara, los QR y las exportaciones sí funcionan.</p><p>Personaliza el nombre, los colores y los logos para mostrar el programa a otro municipio. Puedes reiniciar todos los datos de prueba.</p></div><div class="form-actions">${button('close','Seguir explorando','', 'primary')}</div>`);
  }
  function render() {
    const focused=document.activeElement, focusId=focused?.id, position=focused?.selectionStart;
    applyBrand();
    const r=route();
    let content;
    if(r==='/') content=home();
    else if(r==='/tarjeta') content=youthPage();
    else if(r==='/portal-negocios') content=businessPage();
    else if(r==='/panel') content=adminPage();
    else if(r==='/directorio') content=directoryPage();
    else if(r==='/login') content=registrationPage('youth');
    else if(r==='/login-negocio') content=registrationPage('business');
    else content=`<main id="main" class="wrap">${empty('Esa vista no está en la demo','Vuelve al inicio para elegir una experiencia.','card')}${link('/','Volver al inicio','home','primary')}</main>`;
    app.innerHTML=header(r)+content+footer();
    if(focusId) {const target=document.getElementById(focusId);if(target&&!modal.open){target.focus({preventScroll:true});if(position!==null&&typeof position==='number'&&target.type!=='date')try{target.setSelectionRange(position,position);}catch {}}}
  }
  function entity(kind,key) {return (kind==='youth'?state.youths:state.businesses).find(p=>p.id===Number(key));}
  function feedback(message) {const f=document.getElementById('form-feedback');if(f){f.textContent=message;f.className='inline-feedback error';}else toast(message);}
  function formData(form) {return Object.fromEntries(new FormData(form).entries());}
  function readBrandForm() {const f=document.getElementById('brand-form');return f?cleanBrand({...state.brand,...formData(f)}):{...state.brand};}
  function rerenderBrand() {render();if(modal.open)showBrand();}
  function validateCode(value) {
    const code=String(value||'').trim().toUpperCase(),y=state.youths.find(y=>y.code.toUpperCase()===code);
    ui.lastValidation=null;ui.scannerError='';ui.validatedYouth=null;
    if(!y) ui.scannerError='Este código no pertenece a un perfil de esta demo. Prueba DEMO-0001. Los perfiles nuevos solo existen en el navegador donde se crearon.';
    else if(y.status!=='Activa') ui.scannerError='La tarjeta de '+y.name+' está '+y.status.toLowerCase()+'. Revisa el estado en administración.';
    else if(age(y.birth)<12 || age(y.birth)>29) ui.scannerError='Esta tarjeta está fuera del rango de edad permitido.';
    else {ui.validatedYouth=y.id;if(ui.selectedCoupon&&state.coupons.find(c=>c.id===ui.selectedCoupon)?.businessId!==business().id)ui.selectedCoupon='';}
    render();
    return Boolean(ui.validatedYouth);
  }
  function redeem() {
    const y=state.youths.find(y=>y.id===ui.validatedYouth),b=business(),c=state.coupons.find(c=>c.id===ui.selectedCoupon);
    if(!y||y.status!=='Activa'||b.status!=='Activo'){toast('Valida una tarjeta y un negocio activos antes de continuar.');return;}
    if(ui.selectedCoupon&&(!c||c.businessId!==b.id)){toast('Selecciona un beneficio de este negocio.');return;}
    const issue=c?couponIssue(c,y):'';
    if(issue){toast(issue);render();return;}
    const recent=state.visits.find(v=>v.youthId===y.id&&v.businessId===b.id&&Date.now()-new Date(v.date).getTime()<8000 && Date.now()>=new Date(v.date).getTime());
    if(recent){toast('Esta visita acaba de registrarse. Espera unos segundos antes de repetirla.');return;}
    const previous=levelFor(y),title=c?c.title:'Validación de tarjeta';
    state.visits.push({id:id('v'),youthId:y.id,businessId:b.id,couponId:c?.id||'',couponTitle:title,date:new Date().toISOString()});
    state.currentYouth=y.id;
    ui.lastValidation={name:y.name,title,visits:visitsFor(y).length,level:levelFor(y)};
    ui.validatedYouth=null;ui.selectedCoupon='';
    log('Visita validada: '+y.name+' en '+b.name+'. '+title+'.');persist();render();
    toast(previous===levelFor(y)?'Visita registrada. El historial y los reportes ya se actualizaron.':'Visita registrada. '+y.name.split(' ')[0]+' llegó al nivel '+levelFor(y)+'.');
  }
  function downloadFile(name,content,mime) {const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
  function csvCell(value) {let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
  function exportCSV(type) {
    let rows;
    if(type==='youths') rows=[['Nombre','Edad','Localidad','Ocupación','Código','Estado','Nivel','Visitas'],...state.youths.map(y=>[y.name,age(y.birth),y.locality,y.occupation,y.code,y.status,levelFor(y),visitsFor(y).length])];
    else {const list=type==='business-visits'?state.visits.filter(v=>v.businessId===business().id):reportVisits();rows=[['Fecha','Joven','Código','Negocio','Beneficio','Tipo'],...list.map(v=>{const y=state.youths.find(y=>y.id===v.youthId);return [v.date,y?.name,y?.code,state.businesses.find(b=>b.id===v.businessId)?.name,v.couponTitle,'Demostración'];})];}
    downloadFile('Tarjeta-Joven-Demo-'+type+'-'+day()+'.csv','\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    toast('Reporte de prueba descargado. Puedes abrirlo en Excel.');
  }
  function exportBrand() {
    state.brand=readBrandForm();persist();applyBrand();
    downloadFile('Personalizacion-Tarjeta-Joven.json',JSON.stringify({type:'tarjeta-joven-demo-brand',schemaVersion:1,brand:state.brand},null,2),'application/json;charset=utf-8');
    toast('Personalización descargada con los nombres, colores y logos.');
  }
  async function shareBrand() {
    state.brand=readBrandForm();persist();applyBrand();
    if(location.protocol==='file:'){toast('Publica o abre la demo en línea para compartir un enlace. Puedes exportar tu personalización.');return;}
    const url=new URL(location.pathname,location.origin);
    const b=state.brand;
    for(const [key,value] of [['municipio',b.municipio],['programa',b.program],['instituto',b.institute],['color',b.primary],['acento',b.accent]])url.searchParams.set(key,value);
    url.hash='/';
    try {await navigator.clipboard.writeText(url.href);toast('Enlace copiado con el nombre y los colores del municipio.');}
    catch {showModal('Enlace para presentar','Incluye el nombre y los colores. Los logos se guardan en este navegador.',`<label class="field">Enlace<input class="field-control" value="${esc(url.href)}" readonly id="share-link"></label><p class="note spacer">Selecciona el enlace y cópialo para compartirlo.</p>`);document.getElementById('share-link').select();}
  }
  async function imageData(file) {
    if(!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Usa una imagen PNG, JPG o WebP.');
    if(file.size>2*1024*1024) throw new Error('La imagen debe pesar menos de 2 MB.');
    const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));reader.readAsDataURL(file);});
    const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('La imagen no se pudo abrir.'));image.src=source;});
    const ratio=Math.min(1,256/image.width,256/image.height),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png');
  }
  async function handleUpload(input) {
    const file=input.files[0],field=input.dataset.upload;if(!file)return;
    input.disabled=true;
    const form=input.closest('form'),submit=form?.querySelector('[type=submit]');
    if(submit)submit.disabled=true;
    try {
      if(field==='brandImport') {
        if(file.size>500000)throw new Error('El archivo de personalización es demasiado grande.');
        const parsed=JSON.parse(await file.text());
        if(parsed?.type!=='tarjeta-joven-demo-brand'||parsed.schemaVersion!==1||!parsed.brand)throw new Error('Elige un archivo de personalización exportado desde esta demo.');
        state.brand=cleanBrand(parsed.brand);log('Personalización importada para '+state.brand.municipio+'.');persist();render();toast('Personalización importada.');
      } else {
        const data=await imageData(file);
        if(!document.contains(input))return;
        if(field==='governmentLogo'||field==='instituteLogo'){state.brand={...readBrandForm(),[field]:data};persist();rerenderBrand();toast('Logo aplicado a la demostración.');}
        else {if(field==='youthPhoto')ui.pendingPhoto=data;else ui.pendingBusinessLogo=data;document.getElementById('photo-preview').innerHTML=`<img class="photo-preview" src="${esc(data)}" alt="Imagen de ejemplo cargada">`;}
      }
    } catch(error) {toast(error.message || 'No se pudo cargar el archivo.');}
    finally {if(document.contains(input))input.disabled=false;if(submit&&document.contains(submit))submit.disabled=false;}
  }
  function confirmDelete(kind,key) {
    showModal('Eliminar esta publicación.','La publicación dejará de aparecer en la demo.',`<p>El historial de las visitas ya registradas se conservará.</p><div class="form-actions">${button('close','Cancelar','','secondary')}${button('delete-confirm','Eliminar','trash','danger',`data-kind="${kind}" data-id="${esc(key)}"`)}</div>`);
  }
  async function submitForm(form) {
    const data=formData(form);
    if(form.id==='scan-form'){ui.selectedCoupon='';validateCode(data.code);return;}
    if(form.id==='brand-form') {state.brand=cleanBrand({...state.brand,...data});log('Identidad aplicada: '+state.brand.municipio+'.');persist();closeModal();render();toast('La identidad se aplicó a toda la demo.');return;}
    if(form.id==='youth-form') {
      const years=age(data.birth);
      if(!Number.isFinite(years)||years<12||years>29){feedback('La edad para esta demostración debe ser de 12 a 29 años.');return;}
      const existing=state.youths.find(y=>y.id===Number(form.dataset.id)),registration=form.dataset.registration==='true',email=data.email.trim().toLowerCase();
      if(state.youths.some(y=>y.id!==existing?.id&&y.email.toLowerCase()===email)){feedback('Ese correo ya tiene un perfil de prueba. Usa otro correo de ejemplo.');return;}
      const nextId=Math.max(...state.youths.map(y=>y.id))+1;
      const values={name:data.name.trim(),birth:data.birth,locality:data.locality.trim(),email,gender:data.gender,occupation:data.occupation,photo:ui.pendingPhoto || ''};
      let y;
      if(existing){Object.assign(existing,values);y=existing;log('Perfil de joven actualizado: '+y.name+'.');}
      else {y={...values,id:nextId,code:'DEMO-'+String(nextId).padStart(4,'0'),status:registration?'Pendiente':'Activa',requested:day()};state.youths.push(y);state.currentYouth=y.id;log((registration?'Solicitud de tarjeta recibida: ':'Joven registrado desde el panel: ')+y.name+'.');}
      persist();closeModal();render();
      if(registration) {showModal('Solicitud de prueba recibida.','El siguiente paso es la revisión municipal.',`<div class="success-hero">${ico('file')}<h3>${esc(y.name)}</h3><p>Tu solicitud aparece como pendiente en administración. Apruébala para activar la tarjeta y el QR.</p>${button('go-requests','Revisar en administración','grid','primary')}</div>`);}
      else toast(existing?'Perfil actualizado.':'Joven registrado. Su tarjeta de prueba ya está activa.');
      return;
    }
    if(form.id==='business-form') {
      const existing=state.businesses.find(b=>b.id===Number(form.dataset.id)),registration=form.dataset.registration==='true',email=data.email.trim().toLowerCase();
      if(state.businesses.some(b=>b.id!==existing?.id&&b.email.toLowerCase()===email)){feedback('Ese correo ya tiene un negocio de prueba. Usa otro correo de ejemplo.');return;}
      const nextId=Math.max(...state.businesses.map(b=>b.id))+1;
      const values={name:data.name.trim(),category:data.category,schedule:data.schedule.trim(),address:data.address.trim(),email,description:data.description.trim(),initials:initials(data.name),logo:ui.pendingBusinessLogo || ''};
      if(existing){Object.assign(existing,values);log('Perfil de negocio actualizado: '+existing.name+'.');}
      else {state.businesses.push({...values,id:nextId,status:registration?'Pendiente':'Activo',color:'#8abfa1',phone:'Contacto de ejemplo',mapX:20+(nextId%5)*12,mapY:25+(nextId%3)*20});state.currentBusiness=nextId;log((registration?'Solicitud de negocio recibida: ':'Negocio registrado desde el panel: ')+values.name+'.');}
      persist();closeModal();render();
      if(registration)showModal('Tu negocio está en revisión.','Solicitud de alta de prueba',`<div class="success-hero">${ico('store')}<h3>${esc(values.name)}</h3><p>Revisa y aprueba la solicitud desde administración para publicar beneficios.</p>${button('go-requests','Revisar en administración','grid','primary')}</div>`);
      else toast('Perfil de negocio guardado.');
      return;
    }
    if(form.id==='promotion-form') {
      const current=state.coupons.find(c=>c.id===form.dataset.id),b=business();
      if(b.status!=='Activo'||(current&&current.businessId!==b.id)){toast('Elige un negocio activo para publicar.');return;}
      if(data.end<day()){feedback('Elige una vigencia a partir de hoy.');return;}
      const values={title:data.title.trim(),benefit:data.benefit.trim(),end:data.end,description:data.description.trim(),category:data.category,level:data.level,days:data.days,conditions:data.conditions.trim(),unique:Boolean(data.unique)};
      if(current)Object.assign(current,values);else state.coupons.push({...values,id:id('p'),businessId:b.id,status:'Activa'});
      log('Beneficio '+(current?'actualizado':'publicado')+' por '+b.name+': '+values.title+'.');persist();closeModal();render();toast('Beneficio disponible en la experiencia joven.');return;
    }
    if(form.id==='job-form') {
      const current=state.jobs.find(j=>j.id===form.dataset.id),b=business();
      if(b.status!=='Activo'||(current&&current.businessId!==b.id)){toast('Elige un negocio activo para publicar.');return;}
      const values={title:data.title.trim(),salary:data.salary.trim(),type:data.type,description:data.description.trim()};
      if(current)Object.assign(current,values);else state.jobs.push({...values,id:id('e'),businessId:b.id,status:'Activa'});
      log('Vacante '+(current?'actualizada':'publicada')+': '+values.title+'.');persist();closeModal();render();toast('Vacante publicada en las tarjetas de prueba.');return;
    }
    if(form.id==='notice-form') {
      state.announcements.push({id:id('a'),title:data.title.trim(),message:data.message.trim(),audience:data.audience,date:day()});log('Aviso publicado: '+data.title.trim()+'.');persist();closeModal();render();toast('Aviso publicado para '+data.audience.toLowerCase()+'.');return;
    }
    if(form.id==='reject-form') {
      const p=entity(form.dataset.kind,form.dataset.id);if(!p||p.status!=='Pendiente'){toast('La solicitud ya fue revisada.');return;}
      p.status='Rechazada';p.rejectionReason=data.reason.trim();log('Solicitud rechazada en la demo: '+p.name+'.');persist();closeModal();render();toast('Solicitud marcada como rechazada.');return;
    }
  }
  let cameraSession=0;
  function stopCamera() {cameraSession++;if(cameraFrame)cancelAnimationFrame(cameraFrame);cameraFrame=null;if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}}
  function loadScanner() {
    if(window.jsQR)return Promise.resolve();
    if(!scannerPromise)scannerPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('vendor/jsqr.js',document.querySelector('script[src$="app.js"]').src).href;s.onload=()=>resolve();s.onerror=()=>{scannerPromise=null;reject(new Error('No se pudo abrir el lector de QR. Usa el código manual.'));};document.head.append(s);});
    return scannerPromise;
  }
  async function startCamera() {
    showModal('Enfoca el QR de la tarjeta.','La cámara procesa la imagen en este dispositivo.',`<video id="scanner-video" class="modal-video" autoplay playsinline muted aria-label="Vista de cámara para leer un QR"></video><p id="camera-hint" class="camera-hint" role="status">Abriendo cámara…</p><div class="form-actions">${button('close','Cerrar cámara','','secondary')}</div>`);
    const token=cameraSession;
    try {
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador no permite abrir la cámara aquí. Usa el código manual o el botón Probar QR.');
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(token!==cameraSession||!modal.open){stream.getTracks().forEach(t=>t.stop());return;}
      cameraStream=stream;
      await loadScanner();
      if(token!==cameraSession||!modal.open)return;
      const video=document.getElementById('scanner-video');video.srcObject=stream;await video.play();
      document.getElementById('camera-hint').textContent='Acerca el QR y mantenlo dentro de la cámara.';
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d',{willReadFrequently:true});
      let lastFrame=0;
      function scan(now) {
        if(token!==cameraSession||!modal.open)return;
        if(video.readyState>=2&&now-lastFrame>160) {
          lastFrame=now;
          const scale=Math.min(1,640/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
          if(canvas.width&&canvas.height){context.drawImage(video,0,0,canvas.width,canvas.height);const pixels=context.getImageData(0,0,canvas.width,canvas.height);const code=window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'dontInvert'});if(code){closeModal();ui.selectedCoupon='';validateCode(code.data);toast(ui.validatedYouth?'QR leído. Tarjeta validada.':'QR leído. Revisa el resultado de la validación.');return;}}
        }
        cameraFrame=requestAnimationFrame(scan);
      }
      cameraFrame=requestAnimationFrame(scan);
    } catch(error) {
      stopCamera();
      const hint=document.getElementById('camera-hint');
      if(hint)hint.textContent=error.name==='NotAllowedError'?'No se concedió acceso a la cámara. Puedes validar el código manualmente.':error.name==='NotFoundError'?'No hay una cámara disponible. Puedes usar el código manual o Probar QR.':error.message;
    }
  }
  async function action(el) {
    const key=el.dataset.action,pid=el.dataset.id,kind=el.dataset.kind;
    if(key==='close'){closeModal();return;}
    if(key==='tab') {
      const group=el.dataset.group,tab=el.dataset.tab;
      if(group==='y'){ui.yTab=tab;if(tab==='directorio'&&!state.explored.includes(youth().id)){state.explored.push(youth().id);persist();}}
      else if(group==='b')ui.bTab=tab;
      else if(group==='a'){ui.aTab=tab;ui.adminSearch='';}
      render();return;
    }
    if(key==='brand'){showBrand();return;}
    if(key==='palette') {state.brand={...readBrandForm(),primary:el.dataset.color,accent:el.dataset.accent};persist();rerenderBrand();return;}
    if(key==='logo-clear'){state.brand={...readBrandForm(),[el.dataset.logo]:''};persist();rerenderBrand();return;}
    if(key==='share-brand'){await shareBrand();return;}
    if(key==='export-brand'){exportBrand();return;}
    if(key==='reset') {showModal('Empezar otra demostración.','Se reemplazarán las pruebas de este navegador con los datos iniciales.',`<label class="check-field"><input id="keep-brand" type="checkbox" checked><span>Conservar municipio, colores y logos.</span></label><div class="form-actions">${button('close','Cancelar','','secondary')}${button('reset-confirm','Reiniciar datos de prueba','reset','primary')}</div>`);return;}
    if(key==='reset-confirm'){const b={...state.brand},keep=document.getElementById('keep-brand').checked;state=seed.createState();if(keep)state.brand=b;ui.validatedYouth=null;ui.selectedCoupon='';ui.scannerError='';ui.lastValidation=null;ui.adminSearch='';ui.couponSearch='';ui.jobSearch='';ui.directorySearch='';ui.category='Todos';persist();closeModal();render();toast('La demostración volvió a sus datos iniciales.');return;}
    if(key==='about'){showAbout();return;}
    if(key==='notices'){showNotices();return;}
    if(key==='missions'){showMissions();return;}
    if(key==='qr'){const y=entity('youth',pid||state.currentYouth);if(y)showQR(y);return;}
    if(key==='coupon'){const c=state.coupons.find(c=>c.id===pid);if(c&&businessFor(c))showCoupon(c);return;}
    if(key==='business-detail'){const b=entity('business',pid);if(b)showBusinessDetail(b);return;}
    if(key==='directory-mode'){ui.directoryMode=el.dataset.mode;render();return;}
    if(key==='map-pin'){ui.mapBusiness=Number(pid);render();return;}
    if(key==='job'){const j=state.jobs.find(j=>j.id===pid);if(j)showJob(j);return;}
    if(key==='apply-job'){
      const j=state.jobs.find(j=>j.id===pid),y=youth();
      if(!j||j.status!=='Activa'||businessFor(j)?.status!=='Activo'||y.status!=='Activa'){toast('Elige una vacante y una tarjeta activas.');return;}
      if(state.applications.some(a=>a.jobId===j.id&&a.youthId===y.id))return;
      state.applications.push({id:id('application'),jobId:j.id,youthId:y.id,date:new Date().toISOString()});log('Interés de prueba: '+y.name+' en '+j.title+'.');persist();render();showJob(j);toast('Interés de prueba registrado. Puedes verlo en el portal del negocio.');return;
    }
    if(key==='applicants'){const j=state.jobs.find(j=>j.id===pid);if(j)showApplicants(j);return;}
    if(key==='try-coupon'){
      const c=state.coupons.find(c=>c.id===pid),y=youth();if(!c)return;
      const issue=couponIssue(c,y);if(issue){toast(issue);return;}
      state.currentBusiness=c.businessId;ui.bTab='validar';ui.validatedYouth=y.id;ui.selectedCoupon=c.id;ui.scannerError='';ui.lastValidation=null;persist();navigate('/portal-negocios');return;
    }
    if(key==='try-qr'){const y=entity('youth',pid);state.currentYouth=y.id;ui.bTab='validar';ui.selectedCoupon='';ui.lastValidation=null;persist();validateCode(y.code);navigate('/portal-negocios');return;}
    if(key==='download-qr'){const y=entity('youth',pid);downloadFile(y.code+'-QR.svg',qr(y),'image/svg+xml;charset=utf-8');return;}
    if(key==='print-card'){state.currentYouth=Number(pid);persist();navigate('/tarjeta');setTimeout(()=>window.print(),160);return;}
    if(key==='youth-profile'){const y=youth();showModal('Tu perfil de prueba.','Datos que acompañan tu tarjeta digital.',`<div class="row">${avatar(y,'dark')}<div><h3>${esc(y.name)}</h3><p class="small muted">${esc(y.email)}</p></div></div><div class="business-detail-grid"><div class="detail-item"><strong>Edad</strong>${age(y.birth)} años</div><div class="detail-item"><strong>Localidad</strong>${esc(y.locality)}</div><div class="detail-item"><strong>Ocupación</strong>${esc(y.occupation)}</div><div class="detail-item"><strong>Estado</strong>${statusBadge(y.status)}</div></div><div class="form-actions">${button('youth-form','Editar perfil','edit','primary',`data-id="${y.id}"`)}</div>`);return;}
    if(key==='youth-form'){const y=pid?entity('youth',pid):null;showModal(y?'Editar perfil joven':'Registrar joven desde el panel','Usa datos de ejemplo para esta demostración.',youthForm(y));return;}
    if(key==='business-form'||key==='business-profile'){const b=key==='business-profile'?business():pid?entity('business',pid):null;showModal(b?'Editar perfil de negocio':'Registrar negocio desde el panel','Sus datos aparecerán en el directorio.',businessForm(b));return;}
    if(key==='promotion-form'){showPromotionForm(state.coupons.find(c=>c.id===pid)||null);return;}
    if(key==='job-form'){showJobForm(state.jobs.find(j=>j.id===pid)||null);return;}
    if(key==='promotion-toggle'||key==='job-toggle'){const list=key==='promotion-toggle'?state.coupons:state.jobs,p=list.find(p=>p.id===pid);if(!p)return;p.status=p.status==='Activa'?'Pausada':'Activa';log('Publicación '+p.status.toLowerCase()+': '+p.title+'.');persist();render();toast('Publicación '+p.status.toLowerCase()+'.');return;}
    if(key==='promotion-delete'||key==='job-delete'||key==='notice-delete'){confirmDelete(key==='promotion-delete'?'coupons':key==='job-delete'?'jobs':'announcements',pid);return;}
    if(key==='delete-confirm'){if(!['coupons','jobs','announcements'].includes(kind))return;state[kind]=state[kind].filter(p=>p.id!==pid);log('Publicación eliminada en la demostración.');persist();closeModal();render();toast('Publicación eliminada.');return;}
    if(key==='notice-form'){showNoticeForm();return;}
    if(key==='simulate-scan'){ui.selectedCoupon='';validateCode(youth().code);return;}
    if(key==='scan-new'){ui.lastValidation=null;ui.validatedYouth=null;ui.scannerError='';ui.selectedCoupon='';render();return;}
    if(key==='redeem'){redeem();return;}
    if(key==='camera'){await startCamera();return;}
    if(key==='export'){exportCSV(el.dataset.type);return;}
    if(key==='approve'){approve(entity(kind,pid),kind);return;}
    if(key==='reject'){const p=entity(kind,pid);if(!p||p.status!=='Pendiente'){toast('La solicitud ya fue revisada.');return;}showModal('Rechazar solicitud','Se marcará como rechazada en esta demo.',`<form id="reject-form" data-kind="${kind}" data-id="${pid}">${textareaField('reason','Motivo de ejemplo','','maxlength="200" required')}<div class="form-actions">${button('close','Cancelar','','secondary')}<button type="submit" class="button danger">Rechazar solicitud</button></div></form>`);return;}
    if(key==='request-detail'){const p=entity(kind,pid);if(p)showRequest(p,kind);return;}
    if(key==='demo-email'){const p=entity(kind,pid);if(p)showDemoEmail(p,kind);return;}
    if(key==='open-youth'){state.currentYouth=Number(pid);persist();navigate('/tarjeta');return;}
    if(key==='open-business'){state.currentBusiness=Number(pid);persist();navigate('/portal-negocios');return;}
    if(key==='go-requests'){ui.aTab='solicitudes';navigate('/panel');return;}
    if(key==='youth-toggle'||key==='business-toggle'){const young=key==='youth-toggle',p=entity(young?'youth':'business',pid);if(!p)return;const active=young?'Activa':'Activo';p.status=p.status===active?'Suspendida':active;log('Estado actualizado: '+p.name+' · '+p.status+'.');persist();render();toast('Estado actualizado.');return;}
    if(key==='admin-tour'){showModal('Del registro al beneficio.','Un recorrido para mostrar al municipio.',`<ol class="how-list"><li><span>1</span><div>Registra un joven de prueba y aprueba su solicitud. Verás su tarjeta con un QR único.</div></li><li><span>2</span><div>Entra al portal de un negocio y publica un beneficio. Aparecerá en la tarjeta del joven.</div></li><li><span>3</span><div>Prueba un cupón, valida la visita y observa cómo cambian el historial, el nivel y los reportes.</div></li></ol><div class="form-actions">${link('/login','Probar registro','plus','primary')}${button('go-requests','Revisar solicitudes','file','secondary')}</div>`);return;}
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('.skip-link')){event.preventDefault();const main=document.getElementById('main');if(main){main.tabIndex=-1;main.focus();}return;}
    const el=event.target.closest('[data-action]');
    if(el&&!el.disabled){event.preventDefault();Promise.resolve(action(el)).catch(error=>{console.error(error);toast('No se pudo completar esta acción. Intenta de nuevo.');});}
    else if(event.target.closest('a[href^="#/"]'))closeModal();
  });
  document.addEventListener('submit',event=>{if(event.target.matches('form')){event.preventDefault();submitForm(event.target).catch(error=>{console.error(error);feedback('No se pudo guardar. Intenta de nuevo.');});}});
  document.addEventListener('input',event=>{
    const input=event.target;
    if(input.dataset.search){ui[input.dataset.search]=input.value;render();}
    if(input.form?.id==='brand-form'&&['primary','accent'].includes(input.name)){
      const b=readBrandForm();const preview=modal.open?modal.querySelector('.brand-preview'):app.querySelector('.brand-preview');
      if(preview){preview.style.setProperty('--brand',b.primary);preview.style.setProperty('--accent',b.accent);preview.style.setProperty('--brand-ink',contrast(b.primary));preview.style.setProperty('--accent-ink',contrast(b.accent));}
    }
  });
  document.addEventListener('change',event=>{
    const el=event.target,key=el.dataset.select;
    if(el.dataset.upload){handleUpload(el);return;}
    if(key==='youth'){state.currentYouth=Number(el.value);ui.validatedYouth=null;ui.lastValidation=null;persist();render();}
    else if(key==='business'){state.currentBusiness=Number(el.value);ui.validatedYouth=null;ui.selectedCoupon='';ui.lastValidation=null;ui.scannerError='';persist();render();}
    else if(key==='category'){ui.category=el.value;render();}
    else if(key==='redemption'){ui.selectedCoupon=el.value;render();}
    else if(key==='reportFrom'||key==='reportTo'){ui[key]=el.value;render();}
  });
  modal.addEventListener('close',stopCamera);
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  window.addEventListener('hashchange',()=>{closeModal();if(route()==='/directorio'&&!state.explored.includes(youth().id)){state.explored.push(youth().id);persist();}render();window.scrollTo(0,0);});
  window.addEventListener('storage',event=>{if(event.key===KEY){state=loadState();render();}});
  window.addEventListener('pagehide',stopCamera);
  persist();
  render();
})();
