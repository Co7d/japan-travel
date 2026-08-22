document.addEventListener("DOMContentLoaded", async () => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  const slug = value => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  const cityJp = {
    tokyo: "東京",
    kawaguchiko: "河口湖",
    kiso: "木曽",
    kyoto: "京都",
    hiroshima: "広島",
    osaka: "大阪"
  };

  const pages = [...document.querySelectorAll(".top-page")];
  const nav = [...document.querySelectorAll(".nav-item")];
  const appShell = document.getElementById("app-shell");
  const citiesIndex = document.getElementById("cities-index-view");
  const cityDetail = document.getElementById("city-detail-view");
  const overlay = document.getElementById("maps-choice-overlay");
  const dayStrip = document.getElementById("day-strip");
  const planningContainer = document.getElementById("planning-container");

  let data;
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`data.json: ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error(error);
    return;
  }

  const schedule = Array.isArray(window.JAPAN_SCHEDULE)
    ? window.JAPAN_SCHEDULE
    : (data.schedule || []);

  const allPlaces = {
    ...(typeof places !== "undefined" ? places : {}),
    ...(typeof PLANNING_PLACES !== "undefined" ? PLANNING_PLACES : {}),
    ...(typeof PLANNING_PLACES_MORE !== "undefined" ? PLANNING_PLACES_MORE : {})
  };

  const state = {
    selectedDate: schedule[0]?.date || null,
    selectedPlanningCity: schedule[0]?.cityKey || "tokyo",
    currentCity: null,
    pendingPlace: null,
    mapChoice: localStorage.getItem("japan2026-map")
  };

  const page = key => document.querySelector(`.top-page[data-page="${key}"]`);
  const themeForPlanning = () => data.cities[state.selectedPlanningCity]?.theme || "tokyo";

  function setTheme(theme) {
    document.body.dataset.theme = theme || "tokyo";
  }

  function restorePlanningTheme() {
    if (!state.currentCity) setTheme(themeForPlanning());
  }

  function findPlace(ref) {
    if (!ref) return null;
    const value = String(ref);
    const key = slug(value);

    return allPlaces[key]
      || Object.values(allPlaces).find(place =>
        place.id === value || place.name === value || slug(place.name) === key
      )
      || null;
  }

  function go(key, push = true) {
    const target = page(key);
    if (!target) return;

    if (key !== "cities") state.currentCity = null;
    if (push) history.pushState({ page: key, city: null }, "", `#${key}`);

    target.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest"
    });

    nav.forEach(item => item.classList.toggle("active", item.dataset.page === key));
    if (key !== "cities") restorePlanningTheme();
  }

  nav.forEach(item => item.addEventListener("click", () => {
    if (item.dataset.page === "cities" && !cityDetail.classList.contains("hidden")) {
      showCities(false);
    }
    go(item.dataset.page);
  }));

  let touchStartX = 0;
  let touchStartY = 0;

  appShell?.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  appShell?.addEventListener("touchend", event => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (touchStartX < 28 && dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      history.back();
    }
  }, { passive: true });

  appShell?.addEventListener("scrollend", () => {
    if (state.currentCity) return;

    const current = pages.reduce((best, candidate) => {
      const bestDistance = Math.abs(best.getBoundingClientRect().left);
      const candidateDistance = Math.abs(candidate.getBoundingClientRect().left);
      return candidateDistance < bestDistance ? candidate : best;
    }, pages[0]);

    if (current?.dataset.page !== "cities") restorePlanningTheme();
  }, { passive: true });

  function categoryFor(place) {
    const name = place.name.toLowerCase();

    if (place.category === "hotel") {
      return ["Hébergements", /ryokan/.test(name) ? "Ryokan" : /guest/.test(name) ? "Guest House" : "Hôtel"];
    }

    if (place.category === "restaurant") {
      return ["Restaurants", /ramen/.test(name) ? "Ramen" : /sushi/.test(name) ? "Sushi" : /matcha|tsujiri|arabica/.test(name) ? "Café / Thé" : /okonomiyaki/.test(name) ? "Okonomiyaki" : "Restaurant"];
    }

    if (place.category === "shopping") {
      return ["Shopping", /camera|yodobashi|nintendo|gigo/.test(name) ? "Culture & Électronique" : /uniqlo|kinji|chicago|mode off/.test(name) ? "Mode" : "Boutique"];
    }

    return ["Lieux", subcategoryFor(place.name, place.category)];
  }

  function subcategoryFor(name, category) {
    const n = name.toLowerCase();
    if (/shrine|jinja|jingu|inari|taisha/.test(n)) return "Sanctuaire";
    if (/temple|dera|-ji|ji$|kōdai|zojo/.test(n)) return "Temple";
    if (/museum|musée/.test(n)) return "Musée";
    if (/park|parc|garden|jardin|forest|forêt|hill|pavilion/.test(n)) return "Jardin / Nature";
    if (/station|gare|ferry|teleph|téléph/.test(n)) return "Transport";
    if (/street|yokocho|district|crossing|ginza|shibuya|shinjuku|akihabara|naramachi|odaiba/.test(n)) return "Quartier / Rue";
    if (/tower|château|castle|building|sky/.test(n)) return "Monument / Vue";
    return category === "nature" ? "Jardin / Nature" : "Visite";
  }

  function areaFor(place, city) {
    const n = place.name.toLowerCase();

    if (city === "tokyo") {
      if (/shibuya|hachiko|tower records|parco|harajuku|takeshita|harry potter|yoyogi/.test(n)) return "Shibuya / Harajuku";
      if (/shinjuku|kabukicho|golden gai|omoide|yodobashi|map camera|metropolitan|batting/.test(n)) return "Shinjuku";
      if (/asakusa|senso|nakamise/.test(n)) return "Asakusa";
      if (/yanaka|nezu|ueno|yamashiroya|edo-tokyo/.test(n)) return "Yanaka / Nezu / Ueno";
      if (/akihabara|gigo/.test(n)) return "Akihabara";
      if (/ginza|uniqlo/.test(n)) return "Ginza";
      if (/oimachi/.test(n)) return "Oimachi";
      if (/teamlab|azabudai|zojo|shiba|tokyo tower/.test(n)) return "Tokyo Tower / Azabudai";
      if (/odaiba|unicorn/.test(n)) return "Odaiba";
      return "Tokyo / Autres";
    }

    if (city === "kyoto") {
      if (/arashiyama|sagano|tenryu|togets|yusai|jōjakk|gio|adashino|otagi/.test(n)) return "Arashiyama";
      if (/kiyomizu|ninen|yasaka|maruyama|sanjūsangen|eikan|gion|ginkaku|philosophie/.test(n)) return "Higashiyama / Gion";
      if (/nara|tōdai|kasuga|yoshiki|naramachi|kōfuku|wakakusa|parc de nara/.test(n)) return "Nara";
      if (/fushimi|tofuku/.test(n)) return "Fushimi";
      if (/nijo|kinkaku|kitano|nishiki|ichihara|gare de kyoto/.test(n)) return "Centre / Nord de Kyoto";
      return "Kyoto / Autres";
    }

    if (city === "hiroshima") {
      return /miyajima|itsukushima|daish|misen|torii|momiji|anago|kaki/.test(n) ? "Miyajima" : "Hiroshima";
    }

    if (city === "osaka") {
      if (/doton|hozenji|namba/.test(n)) return "Namba / Dotonbori";
      if (/shinsekai|tsūten|tsuten/.test(n)) return "Shinsekai";
      if (/umeda/.test(n)) return "Umeda";
      if (/osaka|cupnoodles/.test(n)) return "Osaka Castle / Ikeda";
      return "Osaka / Autres";
    }

    return null;
  }

  function mapUrl(place, provider) {
    const query = encodeURIComponent(place.name);
    const coords = `${place.lat},${place.lng}`;

    if (provider === "apple") {
      return `https://maps.apple.com/?q=${query}&ll=${encodeURIComponent(coords)}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${coords}`)}`;
  }

  function openMap(place) {
    if (!place || place.lat == null || place.lng == null) {
      console.warn("Lieu sans coordonnées :", place);
      return;
    }

    if (!state.mapChoice) {
      state.pendingPlace = place;
      overlay?.classList.add("active");
      overlay?.setAttribute("aria-hidden", "false");
      return;
    }

    window.location.assign(mapUrl(place, state.mapChoice));
  }

  function closeMapChoice() {
    overlay?.classList.remove("active");
    overlay?.setAttribute("aria-hidden", "true");
    state.pendingPlace = null;
  }

  document.getElementById("maps-choice-close")?.addEventListener("click", closeMapChoice);

  overlay?.addEventListener("click", event => {
    if (event.target === overlay) {
      closeMapChoice();
      return;
    }

    const button = event.target.closest(".map-choice");
    if (!button) return;

    state.mapChoice = button.dataset.mapChoice;
    localStorage.setItem("japan2026-map", state.mapChoice);

    const place = state.pendingPlace;
    closeMapChoice();
    if (place) openMap(place);
  });

  function renderItinerary() {
    const target = document.getElementById("timeline-list");
    target.innerHTML = data.itinerary.map(stop => `
      <button class="journey-stop" data-city="${esc(stop.cityKey)}" style="--stop-color:var(--${stop.cityKey})" type="button">
        <span class="journey-rail"></span>
        <span class="journey-date">${esc(stop.dates)}</span>
        <span class="journey-city">${esc(stop.label)}</span>
        <span class="journey-jp">${cityJp[stop.cityKey] || ""}</span>
        <span class="journey-vibe">${esc(data.cities[stop.cityKey]?.vibe || "")}</span>
        <span class="journey-arrow">›</span>
      </button>
    `).join("");

    target.querySelectorAll(".journey-stop").forEach(button => {
      button.addEventListener("click", () => showCity(button.dataset.city));
    });
  }

  function renderTickets() {
    const target = document.getElementById("city-tickets");

    target.innerHTML = Object.entries(data.cities).map(([key, city]) => `
      <button class="city-ticket" data-city="${key}" style="--ticket-city:var(--${key})" type="button">
        <span class="ticket-notch ticket-notch-left"></span>
        <span class="ticket-notch ticket-notch-right"></span>
        <span class="ticket-route">JAPON 2026 · ÉTAPE</span>
        <span class="ticket-city">${esc(city.name)}</span>
        <span class="ticket-jp">${cityJp[key]}</span>
        <span class="ticket-dates">${esc(city.dates)}</span>
        <span class="ticket-mark">›</span>
      </button>
    `).join("");

    target.querySelectorAll(".city-ticket").forEach(button => {
      button.addEventListener("click", () => showCity(button.dataset.city));
    });
  }

  function specialtySection(cityKey) {
    const specialties = data.culinarySpecialties?.[cityKey] || [];
    if (!specialties.length) return "";

    return `
      <section class="city-block">
        <button class="section-toggle" type="button" aria-expanded="true">
          <span>Spécialités culinaires</span>
          <span class="section-toggle-mark">›</span>
        </button>
        <div class="city-section-content">
          <div class="specialty-list">
            ${specialties.map(([name, description]) => `
              <button class="specialty-row" aria-expanded="false" type="button">
                <span>
                  <strong>${esc(name)}</strong>
                  <span class="specialty-description">${esc(description)}</span>
                </span>
                <span class="specialty-arrow">›</span>
              </button>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function showCity(cityKey, push = true) {
    const city = data.cities[cityKey];
    if (!city) return;

    state.currentCity = cityKey;
    setTheme(city.theme);

    document.getElementById("current-city-title").textContent = city.name;
    document.getElementById("current-city-jp").textContent = cityJp[cityKey] || "";
    document.getElementById("current-city-vibe").textContent = city.vibe || "";
    document.getElementById("current-city-dates").textContent = city.dates || "";

    const groups = {};

    Object.values(allPlaces)
      .filter(place => place.city === cityKey)
      .forEach(place => {
        const [group, subcategory] = categoryFor(place);
        const area = areaFor(place, cityKey) || "_root";

        groups[area] ??= {};
        groups[area][group] ??= {};
        groups[area][group][subcategory] ??= [];
        groups[area][group][subcategory].push(place);
      });

    let html = specialtySection(cityKey);

    Object.keys(groups)
      .sort((a, b) => a === "_root" ? -1 : b === "_root" ? 1 : a.localeCompare(b))
      .forEach(area => {
        if (area !== "_root") html += `<div class="area-heading">${esc(area)}</div>`;

        ["Hébergements", "Lieux", "Restaurants", "Shopping"].forEach(group => {
          if (!groups[area][group]) return;

          html += `
            <section class="city-block">
              <button class="section-toggle" type="button" aria-expanded="true">
                <span>${group}</span>
                <span class="section-toggle-mark">›</span>
              </button>
              <div class="city-section-content">
          `;

          Object.keys(groups[area][group]).sort().forEach(subcategory => {
            if (group === "Lieux") html += `<div class="subcategory-label">${esc(subcategory)}</div>`;

            html += `
              <div class="place-list">
                ${groups[area][group][subcategory].map(place => `
                  <button class="place-row" data-place-id="${esc(place.id)}" type="button">
                    <span class="place-row-main">
                      <span class="place-name">${esc(place.name)}</span>
                      <span class="place-subcategory">${esc(subcategory)}</span>
                    </span>
                    <span class="place-indicator">›</span>
                  </button>
                `).join("")}
              </div>
            `;
          });

          html += `</div></section>`;
        });
      });

    document.getElementById("city-categories").innerHTML = html;
    citiesIndex.classList.add("hidden");
    cityDetail.classList.remove("hidden");

    if (push) history.pushState({ page: "cities", city: cityKey }, "", `#cities/${cityKey}`);
    go("cities", false);
  }

  function handleCityInteraction(event) {
    const sectionToggle = event.target.closest(".section-toggle");
    if (sectionToggle) {
      const section = sectionToggle.closest(".city-block");
      const collapsed = section.classList.toggle("collapsed");
      sectionToggle.setAttribute("aria-expanded", String(!collapsed));
      return;
    }

    const specialty = event.target.closest(".specialty-row");
    if (specialty) {
      const open = specialty.classList.toggle("open");
      specialty.setAttribute("aria-expanded", String(open));
      return;
    }

    const placeButton = event.target.closest("[data-place-id]");
    if (placeButton) openMap(findPlace(placeButton.dataset.placeId));
  }

  document.getElementById("city-categories")?.addEventListener("click", handleCityInteraction);
  document.getElementById("city-back")?.addEventListener("click", () => history.back());

  function showCities(push = true) {
    state.currentCity = null;
    cityDetail.classList.add("hidden");
    citiesIndex.classList.remove("hidden");
    restorePlanningTheme();

    if (push) history.pushState({ page: "cities", city: null }, "", "#cities");
    go("cities", false);
  }

  function transportMarkup(item, cityKey) {
    const mode = item.transport?.mode || "Déplacement";
    const duration = item.transport?.duration || "";

    return `
      <div class="schedule-connector" style="--transport-color:var(--${cityKey})">
        <span class="connector-mark" aria-hidden="true">↓</span>
        <span class="connector-mode">${esc(mode)}</span>
        <span class="connector-duration">${esc(duration)}</span>
      </div>
    `;
  }

  function renderPlanning() {
    const day = schedule.find(item => item.date === state.selectedDate);
    if (!day) return;

    state.selectedPlanningCity = day.cityKey;
    restorePlanningTheme();

    const city = data.cities[day.cityKey];

    document.getElementById("planning-head").innerHTML = `
      <div class="planning-location">${esc(city.name)}</div>
      <h2>${new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long" }).format(new Date(`${day.date}T12:00:00`))}</h2>
      <p>${esc(day.title || "")}</p>
    `;

    const slots = ["Matin", "Midi", "Après-midi", "Fin d'après-midi", "Soirée"];

    planningContainer.innerHTML = slots.map(slot => {
      const items = day.items.filter(item => item.slot === slot);
      if (!items.length) return "";

      return `
        <section class="planning-slot">
          <div class="slot-label">${slot}</div>
          <div class="slot-line">
            ${items.map(item => {
              if (item.transport) return transportMarkup(item, day.cityKey);

              const primary = findPlace(item.place);
              const pois = (item.pois || []).map(findPlace).filter(Boolean);

              return `
                <article class="schedule-card" style="--city-color:var(--${day.cityKey})">
                  <button class="schedule-summary" aria-expanded="false" type="button">
                    <span class="schedule-time">${esc(item.time || "")}</span>
                    <span class="schedule-title">${esc(item.label || "")}</span>
                    <span class="schedule-chevron">›</span>
                  </button>
                  <div class="schedule-details">
                    <div class="schedule-detail-text">${item.description ? esc(item.description) : ""}</div>
                    ${pois.length ? `
                      <div class="poi-list">
                        ${pois.map(place => `
                          <button class="poi-link" data-place-id="${esc(place.id)}" type="button">
                            ${esc(place.name)} <span>›</span>
                          </button>
                        `).join("")}
                      </div>
                    ` : ""}
                    ${primary ? `
                      <div class="schedule-map-row">
                        <button class="schedule-map" data-place-id="${esc(primary.id)}" type="button">
                          ${state.mapChoice === "apple" ? "Ouvrir dans Plans" : state.mapChoice === "google" ? "Ouvrir dans Google Maps" : "Ouvrir dans Plans / Maps"}
                        </button>
                      </div>
                    ` : ""}
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  planningContainer?.addEventListener("click", event => {
    const summary = event.target.closest(".schedule-summary");
    if (summary) {
      const card = summary.closest(".schedule-card");
      const open = card.classList.toggle("open");
      summary.setAttribute("aria-expanded", String(open));
      return;
    }

    const placeButton = event.target.closest("[data-place-id]");
    if (placeButton) openMap(findPlace(placeButton.dataset.placeId));
  });

  function renderPlanningDays() {
    dayStrip.innerHTML = schedule.map(day => {
      const date = new Date(`${day.date}T12:00:00`);
      const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date).replace(".", "");

      return `
        <button class="day-choice ${day.date === state.selectedDate ? "active" : ""}" data-date="${day.date}" type="button">
          <span>${esc(weekday)}</span>
          <strong>${date.getDate()}</strong>
        </button>
      `;
    }).join("");
  }

  dayStrip?.addEventListener("click", event => {
    const button = event.target.closest(".day-choice");
    if (!button) return;

    const nextDate = button.dataset.date;
    if (!schedule.some(day => day.date === nextDate)) return;

    state.selectedDate = nextDate;
    state.currentCity = null;

    dayStrip.querySelectorAll(".day-choice").forEach(dayButton => {
      dayButton.classList.toggle("active", dayButton === button);
    });

    renderPlanning();
  });

  function renderLexicon() {
    const target = document.getElementById("lexicon-container");
    const input = document.getElementById("lexicon-search");

    const draw = () => {
      const query = input.value.toLowerCase();
      target.innerHTML = (data.lexicon || [])
        .filter(item => item.join(" ").toLowerCase().includes(query))
        .map(item => `
          <div class="lexicon-row">
            <div>
              <span class="lex-fr">${esc(item[1])}</span>
              <span class="lex-cat">${esc(item[0])}</span>
            </div>
            <span class="lex-jp">${esc(item[2])}</span>
          </div>
        `).join("");
    };

    input.addEventListener("input", draw);
    draw();
  }

  async function initExchange() {
    let rate = data.defaultExchangeRate || 165;
    const info = document.getElementById("rate-info-text");

    try {
      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY");
      const result = await response.json();
      if (result.rates?.JPY) rate = result.rates.JPY;
      info.textContent = `Dernier taux publié · 1 € = ${rate.toFixed(2)} ¥ · ${result.date}`;
    } catch {
      info.textContent = `Taux de secours · 1 € = ${rate.toFixed(2)} ¥`;
    }

    const jpy = document.getElementById("jpy-input");
    const eur = document.getElementById("eur-input");

    jpy.addEventListener("input", () => {
      eur.value = (Number(jpy.value) / rate).toFixed(2);
    });

    eur.addEventListener("input", () => {
      jpy.value = (Number(eur.value) * rate).toFixed(0);
    });
  }

  document.getElementById("map-setting")?.addEventListener("click", () => {
    state.pendingPlace = null;
    overlay?.classList.add("active");
    overlay?.setAttribute("aria-hidden", "false");
  });

  window.addEventListener("popstate", event => {
    if (event.state?.page === "cities" && event.state.city) {
      showCity(event.state.city, false);
    } else if (event.state?.page === "cities") {
      showCities(false);
    } else {
      state.currentCity = null;
      restorePlanningTheme();
    }
  });

  renderItinerary();
  renderTickets();
  renderPlanningDays();
  renderPlanning();
  renderLexicon();
  initExchange();
  restorePlanningTheme();
});
