document.addEventListener("DOMContentLoaded", async () => {
    let appData = null;
    let currentCityKey = "tokyo";
    let exchangeRate = 165.0;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.error);
    try { const response = await fetch("./data.json"); appData = await response.json(); exchangeRate = appData.defaultExchangeRate || 165.0; }
    catch (e) { console.error("Erreur de chargement des données JSON", e); return; }

    const swipeContainer=document.getElementById("swipe-container"), dots=document.querySelectorAll("#dots-container .dot"), pages=Array.from(document.querySelectorAll(".tab-page"));
    const navigateToTab=i=>pages[i]?.scrollIntoView({behavior:"smooth",inline:"start",block:"nearest"});
    const escapeHtml=str=>String(str??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
    swipeContainer.addEventListener("scroll",()=>{const i=Math.round(swipeContainer.scrollLeft/window.innerWidth);dots.forEach((d,n)=>d.classList.toggle("active",n===i));});
    dots.forEach(d=>d.addEventListener("click",()=>navigateToTab(Number(d.dataset.index))));

    const categoryMeta={
        hotel:{title:"🏨 Hébergement",order:1}, activity:{title:"⛩️ Visites & Activités",order:2}, restaurant:{title:"🍜 Restaurants",order:3}, shopping:{title:"🛍️ Shopping",order:4}, museum:{title:"🏛️ Musées",order:5}, nature:{title:"🌿 Parcs & Nature",order:6}, transport:{title:"🚉 Transports",order:7}
    };

    function mapUrl(place){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.lat},${place.lng}`)}`;}
    function renderPlaceList(items){
        if(!items.length) return `<div class="detail-row"><span class="place-desc">Aucun lieu enregistré.</span></div>`;
        return items.map(p=>`<div class="detail-row"><div class="detail-left"><span class="place-name">${escapeHtml(p.name)}</span></div><a href="${mapUrl(p)}" target="_blank" rel="noopener" class="chevron" aria-label="Ouvrir ${escapeHtml(p.name)} dans Maps">📍</a></div>`).join("");
    }
    function renderCityDetails(cityKey){
        currentCityKey=cityKey; const city=appData.cities[cityKey]; if(!city)return;
        document.body.dataset.theme=city.theme||"tokyo";
        document.getElementById("current-city-title").textContent=city.name;
        document.getElementById("current-city-vibe").textContent=city.vibe;
        document.getElementById("current-city-dates").textContent=city.dates;
        document.querySelectorAll("#city-pills .pill").forEach(p=>p.classList.toggle("active",p.dataset.city===cityKey));
        const grouped=Object.values(places).filter(p=>p.city===cityKey).reduce((acc,p)=>(acc[p.category]??=[]).push(p)&&acc,{});
        const categories=Object.keys(grouped).sort((a,b)=>(categoryMeta[a]?.order??99)-(categoryMeta[b]?.order??99));
        document.getElementById("city-categories").innerHTML=categories.map(cat=>`<h3 class="section-title">${categoryMeta[cat]?.title||escapeHtml(cat)}</h3><div class="card details-card">${renderPlaceList(grouped[cat])}</div>`).join("");
    }
    function renderCityPills(){
        const c=document.getElementById("city-pills"); c.innerHTML=Object.entries(appData.cities).map(([key,city])=>`<button class="pill ${key===currentCityKey?'active':''}" data-city="${key}">${escapeHtml(city.name)}</button>`).join("");
        c.querySelectorAll(".pill").forEach(p=>p.addEventListener("click",()=>renderCityDetails(p.dataset.city)));
    }
    function renderTimeline(){
        const c=document.getElementById("timeline-list");
        c.innerHTML=(appData.itinerary||[]).map(step=>{const city=appData.cities[step.cityKey];return `<div class="timeline-item" data-city="${escapeHtml(step.cityKey)}"><div class="timeline-left"><span class="timeline-icon">${escapeHtml(city.icon)}</span><div class="timeline-info"><span class="city-title">${escapeHtml(step.label)}</span><span class="city-dates">${escapeHtml(step.dates)}</span></div></div><span class="vibe-badge">${escapeHtml(city.vibe.split("/")[0])}</span></div>`}).join("");
        c.querySelectorAll(".timeline-item").forEach(i=>i.addEventListener("click",()=>{renderCityDetails(i.dataset.city);navigateToTab(3);}));
    }
    function getTokyoDateString(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
    function renderTodaySchedule(){
        const s=(appData.schedule||[]).find(x=>x.date===getTokyoDateString()), c=document.getElementById("today-schedule-container"),t=document.getElementById("today-title"),sub=document.getElementById("today-subtitle");
        if(!s){t.textContent="Aucune activité prévue";sub.textContent="Profitez de votre journée libre !";c.innerHTML=`<div class="card"><p class="place-desc">Aucun événement programmé à la date du jour.</p></div>`;return;}
        t.textContent=s.title;sub.textContent=appData.cities[s.cityKey]?.name||"";
        c.innerHTML=`<div class="card details-card">${s.items.map(i=>`<div class="detail-row"><div class="detail-left"><span class="place-name">${escapeHtml(i.label)}</span><span class="place-desc">${escapeHtml(i.time)}</span></div></div>`).join("")}</div>`;
    }

    const jpy=document.getElementById("jpy-input"),eur=document.getElementById("eur-input"),rateInfo=document.getElementById("rate-info-text");
    async function setupExchangeRate(){
        let cached=localStorage.getItem("japan_rate_cache"),date=null;if(cached)try{const p=JSON.parse(cached);exchangeRate=p.rate;date=new Date(p.timestamp)}catch{}
        if(navigator.onLine)try{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),3000),res=await fetch("https://open.er-api.com/v6/latest/EUR",{signal:ctl.signal});clearTimeout(timer);if(res.ok){const d=await res.json();if(d?.rates?.JPY){exchangeRate=d.rates.JPY;date=new Date();localStorage.setItem("japan_rate_cache",JSON.stringify({rate:exchangeRate,timestamp:date.toISOString()}));}}}catch{}
        rateInfo.textContent=date?`Taux direct (${date.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})} à ${date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"])}) : 1 € = ${exchangeRate.toFixed(2)} ¥`:`Taux par défaut : 1 € = ${exchangeRate.toFixed(2)} ¥`;
    }
    jpy.addEventListener("input",()=>{const v=parseFloat(jpy.value);eur.value=Number.isNaN(v)?"":(v/exchangeRate).toFixed(2)});
    eur.addEventListener("input",()=>{const v=parseFloat(eur.value);jpy.value=Number.isNaN(v)?"":Math.round(v*exchangeRate)});
    const lexicon=document.getElementById("lexicon-container"),search=document.getElementById("lexicon-search");
    function renderLexicon(filter=""){const f=filter.toLowerCase();lexicon.innerHTML=(appData.lexicon||[]).filter(x=>x.fr.toLowerCase().includes(f)||x.jp.toLowerCase().includes(f)).map(x=>`<div class="lexicon-item"><span class="lex-fr">${escapeHtml(x.fr)} (${escapeHtml(x.cat)})</span><span class="lex-jp">${escapeHtml(x.jp)}</span></div>`).join("");}
    search.addEventListener("input",e=>renderLexicon(e.target.value));
    renderCityPills();renderTodaySchedule();renderTimeline();renderCityDetails("tokyo");renderLexicon();await setupExchangeRate();navigateToTab(2);
});
