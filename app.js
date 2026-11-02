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
  const cityDetailPage = document.getElementById('page-city-detail');
  const cityDetailContent = document.getElementById('city-categories');
  const overlay = document.getElementById('maps-choice-overlay');

  // Détermine la date actuelle pour le planning
  function getCurrentDateForPlanning() {
    // Heure locale du Japon (fuseau du voyage), quel que soit l'appareil
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
    // Vérifie si la date actuelle est dans le schedule
    const currentScheduleItem = data.schedule?.find(d => d.date === todayStr);
    if (currentScheduleItem) {
      return todayStr;
    }
    // Sinon, retourne la première date du schedule
    return data.schedule?.[0]?.date || selectedDate;
  }

  const planningDay = () => data.schedule?.find(d => d.date === selectedDate) || data.schedule?.[0];
  const planningTheme = () => planningDay()?.cityKey || 'tokyo';
  const setTheme = key => document.body.dataset.theme = key || 'tokyo';
  const restorePlanningTheme = () => {
    if (!currentCity && !cityDetailPage.classList.contains('hidden')) return;
    setTheme(planningTheme());
  };
  const placeByName = name => getPlaceByName(name);

  // Navigation entre les pages
  function go(key, push = true) {
    const target = page(key);

    if (!target) return;
    if (push) history.pushState({page: key, city: null}, '', `#${key}`);
    navLockUntil = Date.now() + 800; // pendant l'animation, l'onglet visé reste affiché
    target.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
    setActiveTab(key);
  }

  // L'onglet du bas suit la page réellement affichée (swipe compris), pas le geste.
  let navLockUntil = 0;
  const setActiveTab = key => {
    const tab = key === 'city-detail' ? 'itinerary' : key;
    nav.forEach(n => n.classList.toggle('active', n.dataset.page === tab));
  };
  if ('IntersectionObserver' in window) {
    const pageObserver = new IntersectionObserver(entries => {
      if (Date.now() < navLockUntil) return;
      const shown = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (shown) setActiveTab(shown.target.dataset.page);
    }, { root: document.getElementById('app-shell'), threshold: 0.6 });
    document.querySelectorAll('.top-page').forEach(p => pageObserver.observe(p));
  }

// Navigation depuis la barre du bas
nav.forEach(n => n.addEventListener('click', () => {
  const key = n.dataset.page;

  // Quitter le détail de la ville
  currentCity = null;
  cityDetailPage.classList.add('hidden');

  // Réafficher toutes les pages principales
  document.querySelectorAll('.top-page:not(#page-city-detail)')
    .forEach(p => p.classList.remove('hidden'));

  // Restaurer le thème du planning
  restorePlanningTheme();

  // Naviguer vers l'onglet sélectionné
  go(key);
}));

  // Gestion du swipe pour revenir en arrière
  document.getElementById('app-shell').addEventListener('touchstart', e => {
    window.__sx = e.changedTouches[0].clientX;
  }, {passive: true});

  document.getElementById('app-shell').addEventListener('touchend', e => {
    const x = e.changedTouches[0].clientX;
    if (window.__sx != null && x - window.__sx > 70 && window.__sx < 40) {
      history.back();
    }
    window.__sx = null;
  }, {passive: true});

  // Catégorisation des lieux
  function category(place) {
    const n = place.name.toLowerCase();
    if (place.category === 'hotel') return ['Hébergements', /ryokan/.test(n) ? 'Ryokan' : /guest/.test(n) ? 'Guest House' : 'Hôtel'];
    if (place.category === 'restaurant') return ['Restaurants', /ramen/.test(n) ? 'Ramen' : /sushi/.test(n) ? 'Sushi' : /matcha|tsujiri|arabica/.test(n) ? 'Café / Thé' : /okonomiyaki/.test(n) ? 'Okonomiyaki' : 'Restaurant'];
    if (place.category === 'shopping') return ['Shopping', /camera|yodobashi|nintendo|gigo|pokemon/.test(n) ? 'Culture & Électronique' : /uniqlo|kinji|chicago|mode off/.test(n) ? 'Mode' : 'Boutique'];
    return ['Lieux', subcategory(place.name, place.category)];
  }

  function subcategory(name, type) {
    const n = name.toLowerCase();
    if (/shrine|jinja|jingu|inari|taisha/.test(n)) return 'Sanctuaire';
    if (/temple|dera|-ji|ji$|kōdai|zojo/.test(n)) return 'Temple';
    if (/museum|musée|gallery/.test(n)) return 'Musée';
    if (/park|parc|garden|jardin|forest|forêt|hill|pavilion/.test(n)) return 'Jardin / Nature';
    if (/station|gare|ferry|teleph|téléph/.test(n)) return 'Transport';
    if (/street|yokocho|district|crossing|ginza|shibuya|shinjuku|akihabara|naramachi|odaiba/.test(n)) return 'Quartier / Rue';
    if (/tower|château|castle|building|sky/.test(n)) return 'Monument / Vue';
    return type === 'nature' ? 'Jardin / Nature' : 'Visite';
  }

  function area(place, city) {
    const n = place.name.toLowerCase();
    if (city === 'tokyo') {
      if (/shibuya|hachiko|tower records|parco|harajuku|takeshita|harry potter|yoyogi/.test(n)) return 'Shibuya / Harajuku';
      if (/shinjuku|kabukicho|golden gai|omoide|yodobashi|map camera|metropolitan|batting/.test(n)) return 'Shinjuku';
      if (/asakusa|senso|nakamise/.test(n)) return 'Asakusa';
      if (/yanaka|nezu|ueno|yamashiroya|edo-tokyo/.test(n)) return 'Yanaka / Nezu / Ueno';
      if (/akihabara|gigo|hey arcade/.test(n)) return 'Akihabara';
      if (/ginza|uniqlo/.test(n)) return 'Ginza';
      if (/oimachi/.test(n)) return 'Oimachi';
      if (/teamlab|azabudai|zojo|shiba|tokyo tower/.test(n)) return 'Tokyo Tower / Azabudai';
      if (/odaiba|unicorn/.test(n)) return 'Odaiba';
      return 'Tokyo / Autres';
    }
    if (city === 'kawaguchiko' || city === 'kiso') return null;
    if (city === 'kyoto') {
      if (/arashiyama|sagano|tenryu|togets|yusai|jōjakk|gio|adashino|otagi/.test(n)) return 'Arashiyama';
      if (/kiyomizu|ninen|sannenzaka|yasaka|maruyama|sanjūsangen|eikan|gion|ginkaku|philosophie/.test(n)) return 'Higashiyama / Gion';
      if (/nara|tōdai|kasuga|yoshiki|naramachi|kōfuku|wakakusa|parc de nara|isuien|ukimido/.test(n)) return 'Nara';
      if (/fushimi|tofuku/.test(n)) return 'Fushimi';
      if (/nijo|kinkaku|kitano|nishiki|ichihara|gare de kyoto/.test(n)) return 'Centre / Nord de Kyoto';
      return 'Kyoto / Autres';
    }
    if (city === 'hiroshima') return /miyajima|itsukushima|daish|misen|torii|momiji|anago|kaki|ferry/.test(n) ? 'Miyajima' : 'Hiroshima';
    if (city === 'osaka') {
      if (/doton|hozenji|namba/.test(n)) return 'Namba / Dotonbori';
      if (/shinsekai|tsūten|tsuten/.test(n)) return 'Shinsekai';
      if (/umeda/.test(n)) return 'Umeda';
      if (/osaka|cupnoodles|ikeda/.test(n)) return 'Osaka Castle / Ikeda';
      return 'Osaka / Autres';
    }
    return null;
  }

  // Ouverture des maps
  function openMap(place) {
    if (!place || place.lat == null || place.lng == null) return;
    if (!mapChoice) {
      pendingPlace = place;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      return;
    }
    const url = mapChoice === 'apple'
      ? `https://maps.apple.com/?q=${encodeURIComponent(place.name)}&ll=${place.lat},${place.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    window.location.href = url;
  }

  // Gestion du choix des maps
  document.getElementById('maps-choice-close')?.addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    pendingPlace = null;
  });

  document.querySelectorAll('.map-choice').forEach(b => b.addEventListener('click', () => {
    mapChoice = b.dataset.mapChoice;
    localStorage.setItem('japan2026-map', mapChoice);
    const p = pendingPlace;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    pendingPlace = null;
    if (p) openMap(p);
  }));

  document.getElementById('map-setting')?.addEventListener('click', () => {
    pendingPlace = null;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  });

  // Affichage de l'itinéraire
  function renderItinerary() {
    const target = document.getElementById('timeline-list');
    const mois = x => (x || '').toLowerCase() + '.';
    target.innerHTML = (data.itinerary || []).map(s => {
      // "16 Nov — 20 Nov • 4 nuits"
      const [, d1, m1, d2, m2, nights] = s.dates.match(/(\d+)\s+(\S+)\s+—\s+(\d+)\s+(\S+)\s+•\s+(.+)/) || [];
      const k = esc(s.cityKey);
      return `<button class="journey-stop" data-city="${k}" type="button" style="--city:var(--${k});--city-dark:var(--${k}-dark)">
        <span class="journey-rail"></span>
        <span class="journey-stamp"><b>${esc(d1)}</b><i>${esc(mois(m1))}</i><u></u><em>${esc(d2)} ${esc(mois(m2))}</em></span>
        <span class="journey-body">
          <span class="journey-city">${esc(s.label)}</span>
          <span class="journey-jp">${esc(cityJp[s.cityKey] || '')}</span>
          <span class="journey-vibe">${esc(data.cities[s.cityKey]?.vibe || '')} · ${esc(nights)}</span>
        </span>
        <span class="journey-arrow">›</span>
      </button>`;
    }).join('');
    target.querySelectorAll('.journey-stop').forEach(b => b.addEventListener('click', () => showCity(b.dataset.city)));
  }

  // Bloc des spécialités culinaires
  function specialtyBlock(k) {
    const list = data.culinarySpecialties?.[k] || [];
    if (!list.length) return '';
    return `<section class="city-block collapsed">
      <button class="section-toggle" aria-expanded="false" type="button">
        <span>Spécialités culinaires</span>
        <span class="section-toggle-mark">›</span>
      </button>
      <div class="city-section-content">
        <div class="specialty-list">
          ${list.map(([n, d]) =>
            `<button class="specialty-row" aria-expanded="false" type="button">
              <span><strong>${esc(n)}</strong><span class="specialty-description">${esc(d)}</span></span>
              <span class="specialty-arrow">›</span>
            </button>`
          ).join('')}
        </div>
      </div>
    </section>`;
  }

  // Affichage du détail d'une ville
  function showCity(k, push = true) {
    currentCity = k;
    setTheme(k);
    const c = data.cities[k];
    document.getElementById('current-city-title').textContent = c.name;
    document.getElementById('current-city-jp').textContent = cityJp[k] || '';
    document.getElementById('current-city-dates').textContent = c.dates;

    const groups = {};
    Object.values(allPlaces).forEach(p => {
      if (p.city !== k) return;
    
  const [g, s] = category(p), a = area(p, k) || '_root';
      groups[a] ??= {};
      groups[a][g] ??= {};
      groups[a][g][s] ??= [];
      groups[a][g][s].push(p);
    });

    let html = specialtyBlock(k);
    for (const a of Object.keys(groups).sort((x, y) => x === '_root' ? -1 : y === '_root' ? 1 : x.localeCompare(y))) {
      if (a !== '_root') html += `<div class="area-heading">${esc(a)}</div>`;
      for (const g of ['Hébergements', 'Lieux', 'Restaurants', 'Shopping']) {
        if (!groups[a][g]) continue;
        html += `<section class="city-block collapsed">
          <button class="section-toggle" aria-expanded="false" type="button">
            <span>${g}</span>
            <span class="section-toggle-mark">›</span>
          </button>
          <div class="city-section-content">`;
        for (const s of Object.keys(groups[a][g]).sort()) {
          if (g === 'Lieux') html += `<div class="subcategory-label">${esc(s)}</div>`;
          html += `<div class="place-list">
            ${groups[a][g][s].map(p =>
              `<button class="place-row" data-place-id="${esc(p.id)}" type="button">
                <span class="place-row-main">
                  <span class="place-name">${esc(p.name)}</span>
                  <span class="place-subcategory">${esc(s)}</span>
                </span>
                <span class="place-indicator">›</span>
              </button>`
            ).join('')}
          </div>`;
        }
        html += '</div></section>';
      }
    }
    cityDetailContent.innerHTML = html;
    cityDetailContent.querySelectorAll('.section-toggle').forEach(t => t.addEventListener('click', () => {
      const b = t.closest('.city-block');
      const open = !b.classList.toggle('collapsed');
      t.setAttribute('aria-expanded', String(open));
    }));
    cityDetailContent.querySelectorAll('.specialty-row').forEach(b => b.addEventListener('click', () => {
      const open = b.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
    }));
    cityDetailContent.querySelectorAll('[data-place-id]').forEach(b => b.addEventListener('click', () => openMap(allPlaces[b.dataset.placeId])));

    // Afficher la page de détail et masquer les autres
    cityDetailPage.classList.remove('hidden');
    document.querySelectorAll('.top-page:not(#page-city-detail)').forEach(p => p.classList.add('hidden'));
    setActiveTab('itinerary');

    if (push) history.pushState({ page: 'city-detail', city: k }, '', `#city-detail/${k}`);
  }

  // Retour à l'itinéraire
  function showItinerary(push = true) {
    currentCity = null;
    cityDetailPage.classList.add('hidden');
    document.querySelectorAll('.top-page:not(#page-city-detail)').forEach(p => p.classList.remove('hidden'));
    restorePlanningTheme();
    if (push) history.pushState({ page: 'itinerary', city: null }, '', '#itinerary');
  }

  document.getElementById('city-back')?.addEventListener('click', () => showItinerary(false));


  // ── Tickets de transport : papier à poinçons ──
  // Couleurs (mode, paiement) dans style.css (.transport-*, .pay-*).
  const transportKanji = { train: '電車', shinkansen: '新幹線', bus: 'バス', car: '車', ferry: '船', walk: '歩' };
  const payClass = { 'SUICA': 'pay-suica', 'JR PASS': 'pay-jrpass', 'ESPÈCES': 'pay-especes' };

  // Ticket : kanji du mode, itinéraire (couleur du mode), durée, note éventuelle, paiement à droite.
  function transportRow(t) {
    if (!t) return '';
    const kanji = transportKanji[t.type] || '';
    return `<div class="ticket transport-${esc(t.type || 'train')}">
      ${kanji ? `<span class="tk-mode">${kanji}</span>` : ''}
      <span class="tk-main">
        <span class="tk-route">${t.variant ? `<span class="var">${esc(t.variant)} · </span>` : ''}${esc(t.route || '')}</span>
        ${t.duration ? `<span class="tk-dur">${esc(t.duration)}</span>` : ''}
        ${t.note ? `<span class="tk-note">${esc(t.note)}</span>` : ''}
      </span>
      ${t.payment ? `<span class="tk-pay"><span class="pay ${payClass[t.payment] || ''}">${esc(t.payment)}</span></span>` : ''}
    </div>`;
  }

  function transportMarker(t) {
    if (!t) return '';
    if (t.variants) return t.variants.map(v =>
      transportRow({ type: t.type || 'train', variant: v.label, route: v.route, duration: v.duration, payment: v.payment })
    ).join('');
    return transportRow(t);
  }

  // Affichage du planning
  function renderPlanning() {
    const d = planningDay();
    if (!d) return;
    setTheme(d.cityKey);
    const c = data.cities[d.cityKey];
    document.getElementById('planning-head').innerHTML = `
      <div class="planning-title-row">
        <h2>${esc(c.name)}</h2>
        <span class="planning-kana">${esc(cityJp[d.cityKey] || '')}</span>
      </div>
      <p class="planning-subtitle">${esc(d.title || '')}</p>`;
    document.getElementById('day-strip').querySelectorAll('.day-choice').forEach(b =>
      b.classList.toggle('active', b.dataset.date === selectedDate)
    );

    document.getElementById('planning-container').innerHTML = flowHTML(d);

    document.querySelectorAll('#planning-container [data-place-id]').forEach(b =>
      b.addEventListener('click', e => {
        e.stopPropagation();
        openMap(allPlaces[b.dataset.placeId]);
      })
    );
  }

  // Journée en flux chronologique (time / fixed / place / spots)
  function flowHTML(d) {
    return (d.items || []).map(x => {
      // Trajet "pur" (transit: true) : uniquement le ticket enrichi, pas de carte doublon
      if (x.transit && x.transport) {
        const tApprox = /^~/.test(x.time || '');
        return `<div class="flow-step transit-step">
          ${x.time ? `<div class="flow-time${tApprox ? '' : ' exact'}">${esc(x.time)}</div>` : '<div class="flow-time"></div>'}
          ${transportRow({ ...x.transport, note: x.description })}
        </div>`;
      }
      const p = placeByName(x.place);
      const pois = (x.pois || []).map(placeByName).filter(Boolean);
      const mapPlaces = [p, ...pois].filter(Boolean).filter((q, i, a) => a.findIndex(z => z.id === q.id) === i);
      const approx = /^~/.test(x.time || '');
      const timeTxt = String(x.time || '').trim();
      const hasCard = Boolean(x.place && p);
      const quartier = x.spots ? ' quartier' : '';
      const poisHtml = mapPlaces.length
        ? `<span class="poi-list">${(hasCard ? mapPlaces.slice(1) : mapPlaces).map(q =>
            `<button class="poi-link" data-place-id="${esc(q.id)}" type="button">${esc(q.name)} <span>›</span></button>`
          ).join('')}</span>`
        : '';
      const attrs = hasCard
        ? ` class="flow-card clickable${quartier}" data-place-id="${esc(p.id)}" role="button" tabindex="0"`
        : ` class="flow-card no-place${quartier}"`;
      const spotsHtml = (x.spots || []).map(s => {
        const sp = placeByName(s);
        const sAttrs = sp
          ? ` class="flow-card clickable spot-card" data-place-id="${esc(sp.id)}" role="button" tabindex="0"`
          : ' class="flow-card no-place spot-card"';
        return `<div class="flow-step spot">
          <div${sAttrs}>
            <span class="flow-label">${esc(s)}</span>
            ${sp ? '<span class="flow-open" aria-hidden="true">↗</span>' : ''}
          </div>
        </div>`;
      }).join('');
      // Le ticket de transport s'affiche AVANT la carte : "on prend le transport avant de s'y rendre"
      return `${transportMarker(x.transport)}
      <div class="flow-step${x.fixed ? ' fixed' : ''}">
        ${timeTxt ? `<div class="flow-time${approx ? '' : ' exact'}">${esc(timeTxt)}</div>` : '<div class="flow-time"></div>'}
        <div${attrs}>
          ${x.fixed ? `<span class="flow-fixed">Réservé</span>` : ''}
          <span class="flow-label">${esc(x.label || '')}</span>
          ${hasCard ? '<span class="flow-open" aria-hidden="true">↗</span>' : ''}
          ${x.description ? `<span class="flow-desc">${esc(x.description)}</span>` : ''}
          ${poisHtml}
        </div>
      </div>
      ${spotsHtml}`;
    }).join('');
  }

  // Bandeau des jours
  function renderDayStrip() {
    const strip = document.getElementById('day-strip');
    strip.innerHTML = (data.schedule || []).map(d =>
      `<button class="day-choice ${d.date === selectedDate ? 'active' : ''}" data-date="${d.date}" type="button">
        <span>${new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${d.date}T12:00:00`)).replace('.', '')}</span>
        <strong>${new Date(`${d.date}T12:00:00`).getDate()}</strong>
      </button>`
    ).join('');
    strip.querySelectorAll('.day-choice').forEach(b => b.addEventListener('click', () => {
      selectedDate = b.dataset.date;
      renderDayStrip();
      renderPlanning();
    }));
  }

  // Lexique
  function renderLexicon() {
    const target = document.getElementById('lexicon-container'),
          input = document.getElementById('lexicon-search');
    const lexicon = window.JAPAN_LEXICON || data.lexicon || [];
    const draw = () => {
      const q = input.value.toLowerCase();
      target.innerHTML = lexicon.filter(x => x.join(' ').toLowerCase().includes(q)).map(x =>
        `<div class="lexicon-row">
          <div>
            <span class="lex-fr">${esc(x[1])}</span>
            <span class="lex-cat">${esc(x[0])}</span>
          </div>
          <span class="lex-jp">${esc(x[2])}${x[3] ? `<small class="lex-romaji">${esc(x[3])}</small>` : ''}</span>
        </div>`
      ).join('');
    };
    input.oninput = draw;
    draw();
  }

  // Gestion de l'historique
  window.addEventListener('popstate', e => {
    if (!e.state) {
      currentCity = null;
      cityDetailPage.classList.add('hidden');
      document.querySelectorAll('.top-page:not(#page-city-detail)').forEach(p => p.classList.remove('hidden'));
      restorePlanningTheme();
      return;
    }
    if (e.state.page === 'city-detail') {
      showCity(e.state.city, false);
    } else if (e.state.page === 'itinerary') {
      showItinerary(false);
    } else {
      currentCity = null;
      cityDetailPage.classList.add('hidden')
;
      document.querySelectorAll('.top-page:not(#page-city-detail)').forEach(p => p.classList.remove('hidden'));
      restorePlanningTheme();
      go(e.state.page, false);
    }
  });

  // Initialisation : sélection du jour actuel si possible
  selectedDate = getCurrentDateForPlanning();

  // Rendu initial
  renderItinerary();
  renderDayStrip();
  renderPlanning();
  renderLexicon();
  restorePlanningTheme();
});
