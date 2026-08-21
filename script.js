document.addEventListener("DOMContentLoaded", async () => {
    let appData = null;
    let selectedDate = null;
    let selectedCityDetail = null;
    let pendingMapPlace = null;
    let exchangeRate = 165;

    const pages = [...document.querySelectorAll(".top-page")];
    const navItems = [...document.querySelectorAll(".nav-item")];
    const citiesIndex = document.getElementById("cities-index-view");
    const cityDetail = document.getElementById("city-detail-view");
    const cityBack = document.getElementById("city-back");
    const cityTickets = document.getElementById("city-tickets");
    const cityCategories = document.getElementById("city-categories");
    const choiceOverlay = document.getElementById("maps-choice-overlay");
    const mapPreferenceLabel = document.getElementById("map-preference-label");

    const cityJp = {
        tokyo: "東京",
        kawaguchiko: "河口湖",
        kiso: "木曽",
        kyoto: "京都",
        hiroshima: "広島",
        osaka: "大阪"
    };

    const esc = value => String(value ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
    const placesList = () => Object.values(window.places || {});
    const normalize = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    try {
        const response = await fetch("./data.json", { cache: "no-store" });
        appData = await response.json();
        exchangeRate = appData.defaultExchangeRate || 165;
    } catch (error) {
        console.error(error);
        return;
    }

    function cityTheme(key) {
        return appData.cities?.[key]?.theme || "tokyo";
    }

    function currentPlanningCity() {
        return (appData.schedule || []).find(item => item.date === selectedDate)?.cityKey || "tokyo";
    }

    function applyGlobalTheme() {
        const activePage = pages.find(page => Math.abs(page.getBoundingClientRect().left) < window.innerWidth * 0.55);
        const pageKey = activePage?.dataset.page;
        let theme = "tokyo";
        if (pageKey === "cities" && selectedCityDetail) theme = selectedCityDetail;
        else if (pageKey === "planning") theme = currentPlanningCity();
        else theme = currentPlanningCity();
        document.body.dataset.theme = cityTheme(theme);
        document.documentElement.style.setProperty("--theme-city", theme);
    }

    function goToPage(key, push = true) {
        const page = document.querySelector(`[data-page="${key}"].top-page`);
        if (!page) return;
        if (push) history.pushState({ page: key, city: null }, "", `#${key}`);
        page.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        navItems.forEach(item => item.classList.toggle("active", item.dataset.page === key));
        setTimeout(applyGlobalTheme, 30);
    }

    function updateNavFromScroll() {
        const current = pages.reduce((best, page) => {
            const distance = Math.abs(page.getBoundingClientRect().left);
            return distance < best.distance ? { page, distance } : best;
        }, { page: pages[0], distance: Infinity }).page;
        navItems.forEach(item => item.classList.toggle("active", item.dataset.page === current.dataset.page));
        applyGlobalTheme();
    }

    const shell = document.getElementById("app-shell");
    shell.addEventListener("scroll", updateNavFromScroll, { passive: true });

    navItems.forEach(item => item.addEventListener("click", () => {
        if (item.dataset.page === "cities" && !cityDetail.classList.contains("hidden")) showCitiesIndex(false);
        goToPage(item.dataset.page);
    }));

    const cityPage = document.getElementById("page-cities");
    let touchStartX = 0, touchStartY = 0;
    [cityPage, document.getElementById("page-itinerary")].forEach(page => {
        page.addEventListener("touchstart", e => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });
        page.addEventListener("touchend", e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (touchStartX < 28 && dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.25) history.back();
        }, { passive: true });
    });

    function categoryFor(place) {
        if (place.category === "hotel") return { group: "Hébergements", sub: hotelSubcategory(place.name) };
        if (place.category === "restaurant") return { group: "Restaurants", sub: restaurantSubcategory(place.name) };
        if (place.category === "shopping") return { group: "Shopping", sub: shoppingSubcategory(place.name) };
        return { group: "Lieux", sub: placeSubcategory(place.name, place.category) };
    }
    function hotelSubcategory(name) {
        const n = normalize(name);
        if (n.includes("ryokan")) return "Ryokan";
        if (n.includes("guest house") || n.includes("guesthouse") || n.includes("hanaya")) return "Guest House";
        return "Hôtel";
    }
    function restaurantSubcategory(name) {
        const n = normalize(name);
        if (n.includes("ramen")) return "Ramen";
        if (n.includes("sushi")) return "Sushi";
        if (n.includes("coffee") || n.includes("arabica") || n.includes("cafe") || n.includes("matcha") || n.includes("tsujiri") || n.includes("tokichi")) return "Café / Thé";
        if (n.includes("okonomiyaki")) return "Okonomiyaki";
        if (n.includes("anago")) return "Spécialité locale";
        return "Restaurant";
    }
    function shoppingSubcategory(name) {
        const n = normalize(name);
        if (n.includes("camera") || n.includes("electronics") || n.includes("gigo") || n.includes("nintendo") || n.includes("gundam")) return "Culture & Électronique";
        if (n.includes("clothing") || n.includes("uniqlo") || n.includes("chicago") || n.includes("mode off") || n.includes("kinji") || n.includes("liberty walk")) return "Mode";
        if (n.includes("market") || n.includes("don quijote") || n.includes("nakamise") || n.includes("nishiki")) return "Marché / Commerce";
        return "Boutique";
    }
    function placeSubcategory(name, category) {
        const n = normalize(name);
        if (n.includes("shrine") || n.includes("jinja") || n.includes("jingu") || n.includes("inari") || n.includes("taisha")) return "Sanctuaire";
        if (n.includes("temple") || n.includes("dera") || n.includes(" ji") || n.includes("tofuku") || n.includes("toji") || n.includes("kodai")) return "Temple";
        if (n.includes("museum") || n.includes("musee") || n.includes("tower") || n.includes("tour") || n.includes("castle") || n.includes("chateau") || n.includes("building")) return "Culture & Monument";
        if (n.includes("park") || n.includes("parc") || n.includes("garden") || n.includes("jardin") || n.includes("forest") || n.includes("foret") || n.includes("hill") || n.includes("pavilion")) return "Nature";
        if (n.includes("station") || n.includes("gare") || n.includes("telepherique")) return "Transport";
        if (n.includes("street") || n.includes("alley") || n.includes("district") || n.includes("shibuya") || n.includes("shinjuku") || n.includes("dotonbori") || n.includes("naramachi")) return "Quartier & Rue";
        return category === "nature" ? "Nature" : category === "museum" ? "Musée" : category === "transport" ? "Transport" : "Visite";
    }

    function findPlaceByName(name) {
        const target = normalize(name);
        return placesList().find(place => normalize(place.name) === target) || placesList().find(place => target && (normalize(place.name).includes(target) || target.includes(normalize(place.name))));
    }

    function renderCity(key) {
        const c = appData.cities[key];
        if (!c) return;
        selectedCityDetail = key;
        document.body.dataset.theme = cityTheme(key);
        document.getElementById("current-city-title").textContent = c.name;
        document.getElementById("current-city-jp").textContent = cityJp[key] || "";
        document.getElementById("current-city-vibe").textContent = c.vibe || "";
        document.getElementById("current-city-dates").textContent = c.dates || "";

        const groups = { "Hébergements": [], "Lieux": [], "Restaurants": [], "Shopping": [] };
        placesList().filter(p => p.city === key).forEach(place => {
            const meta = categoryFor(place);
            groups[meta.group].push({ ...place, subcategory: meta.sub });
        });
        const order = ["Hébergements", "Lieux", "Restaurants", "Shopping"];
        cityCategories.innerHTML = order.filter(group => groups[group].length).map(group => {
            const rows = groups[group].map(place => `<button class="place-row" type="button" data-place-id="${esc(place.id || place.name)}"><span class="place-row-main"><span class="place-name">${esc(place.name)}</span><span class="place-subcategory">${esc(place.subcategory)}</span></span><span class="place-indicator" aria-hidden="true">›</span></button>`).join("");
            return `<section class="place-section"><div class="section-kicker">${esc(group)}</div><div class="place-list">${rows}</div></section>`;
        }).join("");
        cityCategories.querySelectorAll(".place-row").forEach(row => row.addEventListener("click", () => {
            const place = placesList().find(p => (p.id || p.name) === row.dataset.placeId);
            if (place) openMap(place);
        }));
    }

    function showCity(key, push = true) {
        if (!appData.cities[key]) return;
        renderCity(key);
        citiesIndex.classList.add("hidden");
        cityDetail.classList.remove("hidden");
        if (push) history.pushState({ page: "cities", city: key }, "", `#cities/${key}`);
        goToPage("cities", false);
        document.body.dataset.theme = cityTheme(key);
    }
    function showCitiesIndex(push = true) {
        selectedCityDetail = null;
        cityDetail.classList.add("hidden");
        citiesIndex.classList.remove("hidden");
        if (push) history.pushState({ page: "cities", city: null }, "", "#cities");
        goToPage("cities", false);
        applyGlobalTheme();
    }

    function renderCityTickets() {
        cityTickets.innerHTML = Object.keys(appData.cities).map(key => {
            const c = appData.cities[key];
            return `<button class="city-ticket city-ticket-${esc(key)}" data-city="${esc(key)}" type="button"><span class="ticket-notch ticket-notch-left"></span><span class="ticket-notch ticket-notch-right"></span><span class="ticket-route">JAPON 2026 · ÉTAPE</span><span class="ticket-city">${esc(c.name)}</span><span class="ticket-jp">${esc(cityJp[key] || "")}</span><span class="ticket-dates">${esc(c.dates || "")}</span><span class="ticket-mark">›</span></button>`;
        }).join("");
        cityTickets.querySelectorAll(".city-ticket").forEach(ticket => ticket.addEventListener("click", () => showCity(ticket.dataset.city)));
    }
    cityBack.addEventListener("click", () => history.back());
    window.addEventListener("popstate", event => {
        const state = event.state;
        if (state?.page === "cities" && state.city) showCity(state.city, false);
        else if (state?.page === "cities") showCitiesIndex(false);
        else {
            selectedCityDetail = null;
            applyGlobalTheme();
        }
    });

    function timeline() {
        const container = document.getElementById("timeline-list");
        container.innerHTML = (appData.itinerary || []).map(step => `<button class="journey-stop" data-city="${esc(step.cityKey)}" type="button"><span class="journey-rail"></span><span class="journey-date">${esc(step.dates)}</span><span class="journey-city">${esc(step.label)}</span><span class="journey-jp">${esc(cityJp[step.cityKey] || "")}</span><span class="journey-vibe">${esc(appData.cities[step.cityKey]?.vibe || "")}</span><span class="journey-arrow">›</span></button>`).join("");
        container.querySelectorAll(".journey-stop").forEach(item => item.addEventListener("click", () => showCity(item.dataset.city)));
    }

    function formatDate(date) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`)).replace(".", ""); }
    function renderPlanning(date) {
        selectedDate = date;
        const schedule = (appData.schedule || []).find(item => item.date === date);
        const head = document.getElementById("planning-head");
        const container = document.getElementById("planning-container");
        const cityData = schedule ? appData.cities[schedule.cityKey] : null;
        head.innerHTML = `<div class="planning-location">${esc(cityData?.name || "Japon 2026")}</div><h2>${esc(formatDate(date))}</h2><p>${esc(schedule?.title || "Aucune journée renseignée")}</p>`;
        container.innerHTML = schedule ? `<div class="schedule-line">${schedule.items.map(item => renderScheduleItem(item)).join("")}</div>` : `<div class="empty-day">Aucun événement prévu.</div>`;
        if (cityData) document.body.dataset.theme = cityTheme(schedule.cityKey); else applyGlobalTheme();
        container.querySelectorAll(".schedule-place-link").forEach(el => el.addEventListener("click", () => {
            const place = placesList().find(p => (p.id || p.name) === el.dataset.placeId);
            if (place) openMap(place);
        }));
    }
    function renderScheduleItem(item) {
        if (item.type === "transport") return `<div class="schedule-transport"><span class="transport-line"></span><span class="transport-mode">${esc(item.mode || "Transport")}</span><span class="transport-duration">${esc(item.duration || "")}</span></div>`;
        const place = item.placeId ? placesList().find(p => (p.id || p.name) === item.placeId) : findPlaceByName(item.placeName || item.label);
        const label = item.label || place?.name || "";
        const sub = place ? categoryFor(place).sub : "";
        return `<div class="schedule-event ${place ? "schedule-place-link" : ""}" ${place ? `data-place-id="${esc(place.id || place.name)}"` : ""}><div class="schedule-time">${esc(item.time || "")}</div><div class="schedule-event-body"><strong>${esc(label)}</strong>${sub ? `<span>${esc(sub)}</span>` : ""}</div>${place ? `<span class="schedule-arrow">›</span>` : ""}</div>`;
    }
    function setupPlanning() {
        const dates = [...new Set((appData.schedule || []).map(item => item.date))].sort();
        const strip = document.getElementById("day-strip");
        strip.innerHTML = dates.map(date => `<button class="day-choice" type="button" data-date="${date}"><span>${new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(`${date}T12:00:00`)).replace(".", "")}</span><strong>${new Date(`${date}T12:00:00`).getDate()}</strong></button>`).join("");
        selectedDate = appData.scheduleDefaultDate || dates[0];
        strip.querySelectorAll(".day-choice").forEach(button => button.addEventListener("click", () => { selectedDate = button.dataset.date; strip.querySelectorAll(".day-choice").forEach(x => x.classList.toggle("active", x === button)); renderPlanning(selectedDate); applyGlobalTheme(); }));
        strip.querySelector(`[data-date="${selectedDate}"]`)?.classList.add("active");
        renderPlanning(selectedDate);
    }

    function mapUrl(place, provider) {
        const query = encodeURIComponent(`${place.name} ${place.lat},${place.lng}`);
        if (provider === "apple") return `https://maps.apple.com/?ll=${encodeURIComponent(`${place.lat},${place.lng}`)}&q=${encodeURIComponent(place.name)}`;
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    function openMap(place) {
        const saved = localStorage.getItem("preferred_map_provider");
        if (saved) { window.open(mapUrl(place, saved), "_blank", "noopener"); return; }
        pendingMapPlace = place;
        choiceOverlay.classList.add("active");
        choiceOverlay.setAttribute("aria-hidden", "false");
    }
    function closeMapChoice() { choiceOverlay.classList.remove("active"); choiceOverlay.setAttribute("aria-hidden", "true"); pendingMapPlace = null; }
    function setMapPreference(provider, openPending = false) {
        localStorage.setItem("preferred_map_provider", provider);
        if (mapPreferenceLabel) mapPreferenceLabel.textContent = provider === "apple" ? "Apple Plans" : "Google Maps";
        if (openPending && pendingMapPlace) window.open(mapUrl(pendingMapPlace, provider), "_blank", "noopener");
        closeMapChoice();
    }
    document.querySelectorAll(".map-choice").forEach(button => button.addEventListener("click", () => setMapPreference(button.dataset.mapChoice, true)));
    document.getElementById("maps-choice-close").addEventListener("click", closeMapChoice);
    choiceOverlay.addEventListener("click", e => { if (e.target === choiceOverlay) closeMapChoice(); });
    document.querySelectorAll("[data-set-map]").forEach(button => button.addEventListener("click", () => setMapPreference(button.dataset.setMap)));
    function refreshMapPreference() { const p = localStorage.getItem("preferred_map_provider"); if (mapPreferenceLabel) mapPreferenceLabel.textContent = p === "apple" ? "Apple Plans" : p === "google" ? "Google Maps" : "Choisir"; }

    const jpy = document.getElementById("jpy-input");
    const eur = document.getElementById("eur-input");
    const rateInfo = document.getElementById("rate-info-text");
    jpy.addEventListener("input", () => { const v = parseFloat(jpy.value); eur.value = Number.isNaN(v) ? "" : (v / exchangeRate).toFixed(2); });
    eur.addEventListener("input", () => { const v = parseFloat(eur.value); jpy.value = Number.isNaN(v) ? "" : Math.round(v * exchangeRate); });
    async function rate() {
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem("japan_rate_cache")); } catch {}
        if (cached?.rate) exchangeRate = cached.rate;
        if (navigator.onLine) {
            try {
                const response = await fetch("https://api.frankfurter.dev/v2/rate/EUR/JPY", { cache: "no-store" });
                if (response.ok) {
                    const data = await response.json();
                    if (data?.rate) { exchangeRate = Number(data.rate); cached = { rate: exchangeRate, date: data.date }; localStorage.setItem("japan_rate_cache", JSON.stringify(cached)); }
                }
            } catch {}
        }
        rateInfo.textContent = cached?.date ? `Dernier taux publié · 1 € = ${exchangeRate.toFixed(2)} ¥ · ${cached.date}` : `Taux de secours · 1 € = ${exchangeRate.toFixed(2)} ¥`;
        jpy.dispatchEvent(new Event("input"));
    }

    const lexicon = document.getElementById("lexicon-container");
    const lexiconSearch = document.getElementById("lexicon-search");
    function renderLexicon(filter = "") {
        const f = normalize(filter);
        lexicon.innerHTML = (appData.lexicon || []).filter(item => normalize(item.fr).includes(f) || normalize(item.jp).includes(f)).map(item => `<div class="lexicon-row"><div><span class="lex-fr">${esc(item.fr)}</span><span class="lex-cat">${esc(item.cat)}</span></div><span class="lex-jp">${esc(item.jp)}</span></div>`).join("");
    }
    lexiconSearch.addEventListener("input", e => renderLexicon(e.target.value));

    renderCityTickets();
    timeline();
    setupPlanning();
    renderLexicon();
    refreshMapPreference();
    await rate();

    const hash = location.hash.replace("#", "");
    if (hash.startsWith("cities/")) showCity(hash.split("/")[1], false);
    else if (hash && document.querySelector(`[data-page="${hash}"].top-page`)) goToPage(hash, false);
    else goToPage("itinerary", false);
    applyGlobalTheme();
});