/* Japan 2026 — application runtime. All geographic data lives in places.js. */
document.addEventListener('DOMContentLoaded', async () => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cityJp = {tokyo:'東京', kawaguchiko:'河口湖', kiso:'木曽', kyoto:'京都', hiroshima:'広島', osaka:'大阪'};
  const data = await fetch('./data.json', {cache:'no-store'}).then(r => r.json());
  const allPlaces = places;
  let selectedDate = data.schedule?.[0]?.date;
  let currentCity = null;
  let mapChoice = localStorage.getItem('japan2026-map');
  let pendingPlace = null;
  const page = k => document.querySelector(`.top-page[data-page="${k}"]`);
  const nav = [...document.querySelectorAll('.nav-item')];
  const citiesIndex = document.getElementById('cities-index-view');
  const cityDetail = document.getElementById('city-detail-view');
  const overlay = document.getElementById('maps-choice-overlay');
  const planningDay = () => data.schedule?.find(d => d.date === selectedDate) || data.schedule?.[0];
  const planningTheme = () => planningDay()?.cityKey || 'tokyo';
  const setTheme = key => document.body.dataset.theme = key || 'tokyo';
  const restorePlanningTheme = () => { if (!currentCity) setTheme(planningTheme()); };
  const placeByName = name => getPlaceByName(name);

  function go(key, push = true) {
    const target = page(key); if (!target) return;
    if (push) history.pushState({page:key, city:null}, '', `#${key}`);
    target.scrollIntoView({behavior:'smooth', inline:'start', block:'nearest'});
    nav.forEach(n => n.classList.toggle('active', n.dataset.page === key));
  }
  nav.forEach(n => n.addEventListener('click', () => {
    const key = n.dataset.page;
    if (key !== 'cities') { currentCity = null; cityDetail.classList.add('hidden'); citiesIndex.classList.remove('hidden'); restorePlanningTheme(); }
    else if (!cityDetail.classList.contains('hidden')) showCities(false);
    go(key);
  }));
  document.getElementById('app-shell').addEventListener('touchstart', e => { window.__sx = e.changedTouches[0].clientX; }, {passive:true});
  document.getElementById('app-shell').addEventListener('touchend', e => { const x=e.changedTouches[0].clientX; if(window.__sx!=null&&x-window.__sx>70&&window.__sx<40)history.back(); window.__sx=null; }, {passive:true});

  function category(place) {
    const n=place.name.toLowerCase();
    if(place.category==='hotel')return['Hébergements',/ryokan/.test(n)?'Ryokan':/guest/.test(n)?'Guest House':'Hôtel'];
    if(place.category==='restaurant')return['Restaurants',/ramen/.test(n)?'Ramen':/sushi/.test(n)?'Sushi':/matcha|tsujiri|arabica/.test(n)?'Café / Thé':/okonomiyaki/.test(n)?'Okonomiyaki':'Restaurant'];
    if(place.category==='shopping')return['Shopping',/camera|yodobashi|nintendo|gigo|pokemon/.test(n)?'Culture & Électronique':/uniqlo|kinji|chicago|mode off/.test(n)?'Mode':'Boutique'];
    return['Lieux',subcategory(place.name,place.category)];
  }
  function subcategory(name,type){const n=name.toLowerCase();if(/shrine|jinja|jingu|inari|taisha/.test(n))return'Sanctuaire';if(/temple|dera|-ji|ji$|kōdai|zojo/.test(n))return'Temple';if(/museum|musée|gallery/.test(n))return'Musée';if(/park|parc|garden|jardin|forest|forêt|hill|pavilion/.test(n))return'Jardin / Nature';if(/station|gare|ferry|teleph|téléph/.test(n))return'Transport';if(/street|yokocho|district|crossing|ginza|shibuya|shinjuku|akihabara|naramachi|odaiba/.test(n))return'Quartier / Rue';if(/tower|château|castle|building|sky/.test(n))return'Monument / Vue';return type==='nature'?'Jardin / Nature':'Visite';}
  function area(place,city){const n=place.name.toLowerCase();if(city==='tokyo'){if(/shibuya|hachiko|tower records|parco|harajuku|takeshita|harry potter|yoyogi/.test(n))return'Shibuya / Harajuku';if(/shinjuku|kabukicho|golden gai|omoide|yodobashi|map camera|metropolitan|batting/.test(n))return'Shinjuku';if(/asakusa|senso|nakamise/.test(n))return'Asakusa';if(/yanaka|nezu|ueno|yamashiroya|edo-tokyo/.test(n))return'Yanaka / Nezu / Ueno';if(/akihabara|gigo|hey arcade/.test(n))return'Akihabara';if(/ginza|uniqlo/.test(n))return'Ginza';if(/oimachi/.test(n))return'Oimachi';if(/teamlab|azabudai|zojo|shiba|tokyo tower/.test(n))return'Tokyo Tower / Azabudai';if(/odaiba|unicorn/.test(n))return'Odaiba';return'Tokyo / Autres';}if(city==='kawaguchiko'||city==='kiso')return null;if(city==='kyoto'){if(/arashiyama|sagano|tenryu|togets|yusai|jōjakk|gio|adashino|otagi/.test(n))return'Arashiyama';if(/kiyomizu|ninen|sannenzaka|yasaka|maruyama|sanjūsangen|eikan|gion|ginkaku|philosophie/.test(n))return'Higashiyama / Gion';if(/nara|tōdai|kasuga|yoshiki|naramachi|kōfuku|wakakusa|parc de nara|isuien|ukimido/.test(n))return'Nara';if(/fushimi|tofuku/.test(n))return'Fushimi';if(/nijo|kinkaku|kitano|nishiki|ichihara|gare de kyoto/.test(n))return'Centre / Nord de Kyoto';return'Kyoto / Autres';}if(city==='hiroshima')return/miyajima|itsukushima|daish|misen|torii|momiji|anago|kaki|ferry/.test(n)?'Miyajima':'Hiroshima';if(city==='osaka'){if(/doton|hozenji|namba/.test(n))return'Namba / Dotonbori';if(/shinsekai|tsūten|tsuten/.test(n))return'Shinsekai';if(/umeda/.test(n))return'Umeda';if(/osaka|cupnoodles|ikeda/.test(n))return'Osaka Castle / Ikeda';return'Osaka / Autres';}return null;}

  function openMap(place){if(!place||place.lat==null||place.lng==null)return;if(!mapChoice){pendingPlace=place;overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');return;}const url=mapChoice==='apple'?`https://maps.apple.com/?q=${encodeURIComponent(place.name)}&ll=${place.lat},${place.lng}`:`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}(${encodeURIComponent(place.name)})`;window.location.href=url;}
  document.getElementById('maps-choice-close')?.addEventListener('click',()=>{overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');pendingPlace=null;});
  document.querySelectorAll('.map-choice').forEach(b=>b.addEventListener('click',()=>{mapChoice=b.dataset.mapChoice;localStorage.setItem('japan2026-map',mapChoice);const p=pendingPlace;overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');pendingPlace=null;if(p)openMap(p);}));
  document.getElementById('map-setting')?.addEventListener('click',()=>{pendingPlace=null;overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');});

  function renderItinerary(){const target=document.getElementById('timeline-list');target.innerHTML=(data.itinerary||[]).map(s=>`<button class="journey-stop" data-city="${esc(s.cityKey)}" type="button"><span class="journey-rail" style="border-color:var(--${s.cityKey})"></span><span class="journey-date">${esc(s.dates)}</span><span class="journey-city" style="color:var(--${s.cityKey})">${esc(s.label)}</span><span class="journey-jp" style="color:var(--${s.cityKey})">${esc(cityJp[s.cityKey]||'')}</span><span class="journey-vibe">${esc(data.cities[s.cityKey]?.vibe||'')}</span><span class="journey-arrow">›</span></button>`).join('');target.querySelectorAll('.journey-stop').forEach(b=>b.addEventListener('click',()=>showCity(b.dataset.city)));}
  function renderTickets(){const target=document.getElementById('city-tickets');target.innerHTML=Object.entries(data.cities).map(([k,c])=>`<button class="city-ticket" data-city="${k}" style="--ticket-city:var(--${k})" type="button"><span class="ticket-notch ticket-notch-left"></span><span class="ticket-notch ticket-notch-right"></span><span class="ticket-route">JAPON 2026 · ÉTAPE</span><span class="ticket-city">${esc(c.name)}</span><span class="ticket-jp">${esc(cityJp[k]||'')}</span><span class="ticket-dates">${esc(c.dates)}</span><span class="ticket-mark">›</span></button>`).join('');target.querySelectorAll('.city-ticket').forEach(b=>b.addEventListener('click',()=>showCity(b.dataset.city)));}
  function specialtyBlock(k){const list=data.culinarySpecialties?.[k]||[];if(!list.length)return'';return`<section class="city-block collapsed"><button class="section-toggle" aria-expanded="false" type="button"><span>Spécialités culinaires</span><span class="section-toggle-mark">›</span></button><div class="city-section-content"><div class="specialty-list">${list.map(([n,d])=>`<button class="specialty-row" aria-expanded="false" type="button"><span><strong>${esc(n)}</strong><span class="specialty-description">${esc(d)}</span></span><span class="specialty-arrow">›</span></button>`).join('')}</div></div></section>`;}
  function showCity(k,push=true){currentCity=k;setTheme(k);const c=data.cities[k];document.getElementById('current-city-title').textContent=c.name;document.getElementById('current-city-jp').textContent=cityJp[k]||'';document.getElementById('current-city-vibe').textContent=c.vibe;document.getElementById('current-city-dates').textContent=c.dates;const groups={};Object.values(allPlaces).forEach(p=>{if(p.city!==k)return;const [g,s]=category(p),a=area(p,k)||'_root';groups[a]??={};groups[a][g]??={};groups[a][g][s]??=[];groups[a][g][s].push(p);});let html=specialtyBlock(k);for(const a of Object.keys(groups).sort((x,y)=>x==='_root'?-1:y==='_root'?1:x.localeCompare(y))){if(a!=='_root')html+=`<div class="area-heading">${esc(a)}</div>`;for(const g of ['Hébergements','Lieux','Restaurants','Shopping']){if(!groups[a][g])continue;html+=`<section class="city-block collapsed"><button class="section-toggle" aria-expanded="false" type="button"><span>${g}</span><span class="section-toggle-mark">›</span></button><div class="city-section-content">`;for(const s of Object.keys(groups[a][g]).sort()){if(g==='Lieux')html+=`<div class="subcategory-label">${esc(s)}</div>`;html+=`<div class="place-list">${groups[a][g][s].map(p=>`<button class="place-row" data-place-id="${esc(p.id)}" type="button"><span class="place-row-main"><span class="place-name">${esc(p.name)}</span><span class="place-subcategory">${esc(s)}</span></span><span class="place-indicator">›</span></button>`).join('')}</div>`;}html+='</div></section>';}}const root=document.getElementById('city-categories');root.innerHTML=html;root.querySelectorAll('.section-toggle').forEach(t=>t.addEventListener('click',()=>{const b=t.closest('.city-block');const open=!b.classList.toggle('collapsed');t.setAttribute('aria-expanded',String(open));}));root.querySelectorAll('.specialty-row').forEach(b=>b.addEventListener('click',()=>{const open=b.classList.toggle('open');b.setAttribute('aria-expanded',String(open));}));root.querySelectorAll('[data-place-id]').forEach(b=>b.addEventListener('click',()=>openMap(allPlaces[b.dataset.placeId])));citiesIndex.classList.add('hidden');cityDetail.classList.remove('hidden');nav.forEach(n=>n.classList.toggle('active',n.dataset.page==='cities'));if(push)history.pushState({page:'cities',city:k},'',`#cities/${k}`);page('cities').scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});}
  function showCities(push=true){currentCity=null;cityDetail.classList.add('hidden');citiesIndex.classList.remove('hidden');restorePlanningTheme();if(push)history.pushState({page:'cities',city:null},'','#cities');go('cities',false);}
  document.getElementById('city-back')?.addEventListener('click',()=>history.back());

  const transportOverrides = {
    '2026-11-16|Arrivée à Haneda (T3)': {type:'train', variants:[{label:'Variante A',route:'Tokyo Monorail → Toei Oedo Line',duration:'51 min',payment:'SUICA'},{label:'Variante B',route:'Tokyo Monorail → JR Yamanote Line',duration:'54 min',payment:'SUICA'}]},
    '2026-11-20|Fuji Excursion': {type:'train',route:'JR Limited Express (ligne Chuo) → Fujikyuko Line',duration:'2 h 01',payment:'SUICA'},
    '2026-11-22|Départ de Kawaguchiko': {type:'car',route:'via Chuo Expressway / Nishinomiya / Nagano',duration:'2 h 14 · 146 km'},
    '2026-11-22|Route vers Nagiso': {type:'car',route:'via Nakasendo / Route 19',duration:'1 h 13 · 61,3 km'},
    '2026-11-23|Nagiso → Nagoya': {type:'car',route:'via Chuo Expressway / Nishinomiya',duration:'1 h 31 · 104 km'},
    '2026-11-23|Nagoya → Kyoto': {type:'shinkansen',route:'Tokaido Shinkansen',duration:'34 min',payment:'SUICA'},
    '2026-11-26|Kyoto → Nara': {type:'train',route:'Nara Line',duration:'1 h 11',payment:'JR PASS'},
    '2026-11-26|Nara → Kyoto': {type:'train',route:'Nara Line',duration:'1 h 02',payment:'JR PASS'},
    '2026-11-28|Kyoto → Hiroshima': {type:'shinkansen',route:'Tokaido Shinkansen',duration:'1 h 36',payment:'JR PASS'},
    '2026-11-28|Hiroshima → Miyajimaguchi': {type:'train',route:'San-yo Line',duration:'27 min',payment:'JR PASS'},
    '2026-11-28|Ferry vers Miyajima': {type:'ferry',route:'Ferry JR Miyajimaguchi ↔ Miyajima',duration:'13 min',payment:'JR PASS'},
    '2026-11-29|Miyajima → Miyajimaguchi': {type:'ferry',route:'Ferry JR Miyajimaguchi ↔ Miyajima',duration:'13 min',payment:'JR PASS'},
    '2026-11-29|Miyajimaguchi → Osaka': {type:'shinkansen',route:'San-yo Line → Sanyo Shinkansen',duration:'2 h',payment:'JR PASS'},
    '2026-11-30|Osaka → Universal Studios Japan': {type:'train',route:'Osaka Loop Line → JR Yumesaki Line',duration:'24 min',payment:'JR PASS'},
    '2026-11-30|Retour depuis USJ': {type:'train',route:'JR Yumesaki Line → Osaka Loop Line',duration:'19 min',payment:'JR PASS'},
    '2026-12-02|Check-out de l’hôtel': {type:'shinkansen',route:'Tokaido Shinkansen',duration:'2 h 19',payment:'SUICA'},
    '2026-12-02|Shinagawa → Ōimachi': {type:'train',route:'Keihin-Tōhoku Line, Shinagawa → Ōimachi',duration:'4 min',payment:'SUICA'},
    '2026-12-05|Départ pour Haneda': {type:'bus',route:'Haneda Airport Limousine Bus',duration:'55 min',payment:'SUICA'}
  };
  const paymentColors = {SUICA:'#D4A017','JR PASS':'#7C3AED'};
  const transportColors = {train:'#2563EB',shinkansen:'#1D4ED8',car:'#C85A32',bus:'#D97706',ferry:'#059669'};
  function transportRow(t,k,override){
    const type=override?.type||(()=>{const m=String(t?.mode||'').toLowerCase();if(m.includes('shinkansen'))return'shinkansen';if(m.includes('voiture')||m.includes('car'))return'car';if(m.includes('bus'))return'bus';if(m.includes('ferry'))return'ferry';return'train';})();
    const route=override?.route||String(t?.mode||'').replace(/\s*·\s*(suica|pass\s*jr)\s*/ig,'').trim();
    const duration=override?.duration||t?.duration||'';
    const payment=override?.payment||(/jr\s*pass/i.test(String(t?.mode||''))?'JR PASS':/suica/i.test(String(t?.mode||''))?'SUICA':'');
    const color=transportColors[type]||'var(--theme-main)';
    const paymentColor=paymentColors[payment]||'';
    return `<div class="schedule-connector transport-${type}" style="--transport-color:${color}"><span class="connector-line"></span><span class="connector-symbol" aria-hidden="true"></span><span class="connector-mode">${esc(route)}</span><span class="connector-duration">${esc(duration)}</span>${payment?`<span class="connector-payment" style="color:${paymentColor}">${esc(payment)}</span>`:''}</div>`;
  }
  function transportMarker(t,k,date,label){
    if(!t&&!transportOverrides[`${date}|${label}`])return'';
    const override=transportOverrides[`${date}|${label}`];
    if(override?.variants)return override.variants.map(v=>transportRow(null,k,{type:'train',route:`${v.label} · ${v.route}`,duration:v.duration,payment:v.payment})).join('');
    return transportRow(t,k,override);
  }
  function renderPlanning(){const d=planningDay();if(!d)return;currentCity=null;setTheme(d.cityKey);const c=data.cities[d.cityKey];document.getElementById('planning-head').innerHTML=`<div class="planning-location">${esc(c.name)}</div><h2>${new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long'}).format(new Date(`${d.date}T12:00:00`))}</h2><p>${esc(d.title||'')}</p>`;document.getElementById('day-strip').querySelectorAll('.day-choice').forEach(b=>b.classList.toggle('active',b.dataset.date===selectedDate));const slots=['Matin','Midi','Après-midi',"Fin d'après-midi",'Soirée'];document.getElementById('planning-container').innerHTML=slots.map(slot=>{const items=(d.items||[]).filter(x=>x.slot===slot);if(!items.length)return'';return`<section class="planning-slot"><div class="slot-label">${slot}</div><div class="slot-line">${items.map(x=>{const p=placeByName(x.place),pois=(x.pois||[]).filter(n=>n!=='Map Camera').map(placeByName).filter(Boolean),mapPlaces=[p,...pois].filter(Boolean).filter((q,i,a)=>a.findIndex(z=>z.id===q.id)===i);return`<article class="schedule-card" style="--city-color:var(--${d.cityKey})"><button class="schedule-summary${x.time?'':' no-time'}" aria-expanded="false" type="button">${x.time?`<span class="schedule-time">${esc(x.time)}</span>`:''}<span class="schedule-title">${esc(x.label||'')}</span><span class="schedule-chevron">›</span></button><div class="schedule-details"><div class="schedule-detail-text">${x.description?esc(String(x.description).replace(/\s*Map Camera\.?/gi,'').replace(/\s{2,}/g,' ').trim()):''}</div>${mapPlaces.length?`<div class="poi-list">${mapPlaces.map(q=>`<button class="poi-link" data-place-id="${esc(q.id)}" type="button">${esc(q.name)} <span>›</span></button>`).join('')}</div>`:''}</div></article>${transportMarker(x.transport,d.cityKey,d.date,x.label)}`}).join('')}</div></section>`}).join('');document.querySelectorAll('.schedule-summary').forEach(b=>b.addEventListener('click',()=>{const card=b.closest('.schedule-card');const open=card.classList.toggle('open');b.setAttribute('aria-expanded',String(open));}));document.querySelectorAll('#planning-container [data-place-id]').forEach(b=>b.addEventListener('click',()=>openMap(allPlaces[b.dataset.placeId])));}
  function renderDayStrip(){const strip=document.getElementById('day-strip');strip.innerHTML=(data.schedule||[]).map(d=>`<button class="day-choice ${d.date===selectedDate?'active':''}" data-date="${d.date}" type="button"><span>${new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(new Date(`${d.date}T12:00:00`)).replace('.','')}</span><strong>${new Date(`${d.date}T12:00:00`).getDate()}</strong></button>`).join('');strip.querySelectorAll('.day-choice').forEach(b=>b.addEventListener('click',()=>{selectedDate=b.dataset.date;currentCity=null;renderDayStrip();renderPlanning();}));}
  function renderLexicon(){const target=document.getElementById('lexicon-container'),input=document.getElementById('lexicon-search');const lexicon=window.JAPAN_LEXICON||data.lexicon||[];const draw=()=>{const q=input.value.toLowerCase();target.innerHTML=lexicon.filter(x=>x.join(' ').toLowerCase().includes(q)).map(x=>`<div class="lexicon-row"><div><span class="lex-fr">${esc(x[1])}</span><span class="lex-cat">${esc(x[0])}</span></div><span class="lex-jp">${esc(x[2])}${x[3]?`<small class="lex-romaji">${esc(x[3])}</small>`:''}</span></div>`).join('');};input.oninput=draw;draw();}
  async function exchange(){let rate=data.defaultExchangeRate||165;const info=document.getElementById('rate-info-text');try{const r=await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY');const x=await r.json();if(x.rates?.JPY)rate=x.rates.JPY;info.textContent=`Dernier taux publié · 1 € = ${rate.toFixed(2)} ¥ · ${x.date}`;}catch{info.textContent=`Taux de secours · 1 € = ${rate.toFixed(2)} ¥`;}const j=document.getElementById('jpy-input'),e=document.getElementById('eur-input');j.oninput=()=>{e.value=(Number(j.value)/rate).toFixed(2)};e.oninput=()=>{j.value=(Number(e.value)*rate).toFixed(0)}}
  window.addEventListener('popstate',e=>{if(e.state?.page==='cities'&&e.state.city)showCity(e.state.city,false);else if(e.state?.page==='cities')showCities(false);else{currentCity=null;cityDetail.classList.add('hidden');citiesIndex.classList.remove('hidden');restorePlanningTheme();}});
  renderItinerary();renderTickets();renderDayStrip();renderPlanning();renderLexicon();exchange();restorePlanningTheme();
});
